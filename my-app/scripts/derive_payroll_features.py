#!/usr/bin/env python3
"""
Load generated payroll data and enrich each record with derived monthly metrics.

Example:
    python scripts/derive_payroll_features.py
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List

PERIODS_PER_MONTH = {
    "weekly": 4.33,
    "biweekly": 2.165,
    "semimonthly": 2.0,
    "monthly": 1.0,
}

INCOME_STABILITY_INDEX = {
    "monthly": 1.0,
    "semimonthly": 0.95,
    "biweekly": 0.9,
    "weekly": 0.85,
}


def parse_args() -> argparse.Namespace:
    default_input = Path(__file__).resolve().parent / "generated_data" / "payroll_data.json"
    parser = argparse.ArgumentParser(
        description="Derive additional payroll metrics from generated payroll data."
    )
    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        default=default_input,
        help=f"Input JSON file (default: {default_input})",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Destination JSON file. Defaults to <input_dir>/payroll_data_enriched.json",
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="Write minimal JSON without indentation.",
    )
    return parser.parse_args()


def load_records(path: Path) -> List[Dict[str, Any]]:
    with path.expanduser().open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    if not isinstance(data, list):
        raise ValueError("Input JSON must be an array of payroll records.")
    return data  # type: ignore[return-value]


def compute_derived(record: Dict[str, Any]) -> Dict[str, Any]:
    frequency = record.get("pay_frequency")
    if frequency not in PERIODS_PER_MONTH:
        raise ValueError(f"Unknown pay_frequency: {frequency!r}")

    periods_per_month = PERIODS_PER_MONTH[frequency]
    gross_per_period = float(record.get("gross_pay_per_period", 0.0))
    net_per_period = float(record.get("net_pay_per_period", 0.0))
    taxes_per_period = float(record.get("total_taxes_withheld_per_period", 0.0))
    deductions_per_period = float(record.get("total_deductions_per_period", 0.0))

    gross_monthly_income = round(gross_per_period * periods_per_month, 2)
    net_monthly_income = round(net_per_period * periods_per_month, 2)

    effective_tax_rate = 0.0
    deduction_rate = 0.0
    if gross_per_period > 0:
        effective_tax_rate = round(taxes_per_period / gross_per_period, 4)
        deduction_rate = round(deductions_per_period / gross_per_period, 4)

    income_stability_index = INCOME_STABILITY_INDEX[frequency]

    derived = {
        "periods_per_month": periods_per_month,
        "gross_monthly_income": gross_monthly_income,
        "net_monthly_income": net_monthly_income,
        "effective_tax_rate": effective_tax_rate,
        "deduction_rate": deduction_rate,
        "income_stability_index": income_stability_index,
    }
    return {**record, **derived}


def enrich_records(records: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [compute_derived(record) for record in records]


def resolve_output_path(input_path: Path, output_arg: Path | None) -> Path:
    if output_arg:
        return output_arg.expanduser()
    input_path = input_path.expanduser()
    if input_path.is_dir():
        return input_path / "payroll_data_enriched.json"
    return input_path.with_name("payroll_data_enriched.json")


def write_records(records: List[Dict[str, Any]], path: Path, compact: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    indent = None if compact else 2
    with path.open("w", encoding="utf-8") as fp:
        json.dump(records, fp, indent=indent)


def main() -> None:
    args = parse_args()
    records = load_records(args.input)
    enriched = enrich_records(records)
    output_path = resolve_output_path(args.input, args.output)
    write_records(enriched, output_path, args.compact)
    print(f"Wrote {len(enriched)} enriched records to {output_path}")


if __name__ == "__main__":
    main()
