#!/usr/bin/env python3
"""
Payroll data generator for producing realistic training samples.

Example:
    python scripts/generate_payroll_data.py --count 500
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Dict, List

# Configuration for each pay frequency.
FREQUENCY_CONFIG: Dict[str, Dict[str, float]] = {
    "weekly": {
        "periods_per_year": 52,
        "median_salary": 42000,
        "std_dev": 7500,
        "min_salary": 26000,
        "max_salary": 65000,
    },
    "biweekly": {
        "periods_per_year": 26,
        "median_salary": 56000,
        "std_dev": 9000,
        "min_salary": 30000,
        "max_salary": 90000,
    },
    "semimonthly": {
        "periods_per_year": 24,
        "median_salary": 68000,
        "std_dev": 12000,
        "min_salary": 36000,
        "max_salary": 115000,
    },
    "monthly": {
        "periods_per_year": 12,
        "median_salary": 84000,
        "std_dev": 15000,
        "min_salary": 45000,
        "max_salary": 160000,
    },
}

# Higher weight for the most common payroll cadences.
FREQUENCY_WEIGHTS: Dict[str, float] = {
    "weekly": 0.32,
    "biweekly": 0.36,
    "semimonthly": 0.18,
    "monthly": 0.14,
}

# Bound the share of each paycheck that can be withheld so net pay stays positive.
MAX_WITHHOLDING_RATIO = 0.45


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate synthetic payroll data with realistic relationships"
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=1000,
        help="Number of payroll entries to generate (default: 1000)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Optional output file path. Defaults to scripts/generated_data/payroll_data.json.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "generated_data",
        help="Directory for generated files when --output is not provided.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        help="Optional random seed for reproducible datasets.",
    )
    return parser.parse_args()


def choose_frequency() -> str:
    frequencies = list(FREQUENCY_CONFIG.keys())
    weights = [FREQUENCY_WEIGHTS[freq] for freq in frequencies]
    return random.choices(frequencies, weights=weights, k=1)[0]


def sample_annual_salary(pay_frequency: str) -> float:
    cfg = FREQUENCY_CONFIG[pay_frequency]
    salary = random.gauss(cfg["median_salary"], cfg["std_dev"])
    # Retry a few times to land within the configured range.
    for _ in range(4):
        if cfg["min_salary"] <= salary <= cfg["max_salary"]:
            break
        salary = random.gauss(cfg["median_salary"], cfg["std_dev"])
    # Clamp to enforce the business rules.
    salary = max(cfg["min_salary"], min(cfg["max_salary"], salary))
    return salary


def estimate_tax_rate(annual_salary: float) -> float:
    # Basic progressive brackets for federal-style withholding.
    brackets = [
        (0, 0.06),
        (20000, 0.10),
        (45000, 0.14),
        (85000, 0.18),
        (140000, 0.22),
        (200000, 0.26),
    ]
    base_rate = brackets[-1][1]
    for threshold, rate in brackets:
        if annual_salary >= threshold:
            base_rate = rate
        else:
            break
    # Add payroll (FICA) component and light state/local tax variation.
    fica_component = 0.0765
    state_component = random.uniform(0.025, 0.055)
    variability = random.uniform(-0.01, 0.01)
    return max(0.08, base_rate + fica_component + state_component + variability)


def estimate_deduction_rate(annual_salary: float) -> float:
    if annual_salary < 40000:
        return random.uniform(0.01, 0.035)
    if annual_salary < 70000:
        return random.uniform(0.025, 0.06)
    if annual_salary < 100000:
        return random.uniform(0.035, 0.075)
    return random.uniform(0.045, 0.10)


def compute_period_amounts(
    gross_per_period: float, tax_rate: float, deduction_rate: float
) -> Dict[str, float]:
    gross_per_period = round(gross_per_period, 2)
    # Ensure total withholding stays within the configured cap.
    combined_rate = tax_rate + deduction_rate
    if combined_rate > MAX_WITHHOLDING_RATIO:
        deduction_rate = max(0.0, MAX_WITHHOLDING_RATIO - tax_rate)
    taxes = round(gross_per_period * tax_rate, 2)
    deductions = round(gross_per_period * deduction_rate, 2)
    net = round(gross_per_period - taxes - deductions, 2)

    # Correct rounding drift to keep amounts consistent.
    drift = round(gross_per_period - (taxes + deductions + net), 2)
    if drift != 0:
        net = round(net + drift, 2)

    # Guard against non-positive net pay by trimming deductions.
    if net <= 0:
        net_floor = round(gross_per_period * (1 - MAX_WITHHOLDING_RATIO), 2)
        net = max(net_floor, round(gross_per_period - taxes, 2))
        deductions = round(gross_per_period - taxes - net, 2)
        deductions = max(0.0, deductions)
        net = round(gross_per_period - taxes - deductions, 2)

    return {
        "gross_pay_per_period": gross_per_period,
        "total_taxes_withheld_per_period": round(taxes, 2),
        "total_deductions_per_period": round(deductions, 2),
        "net_pay_per_period": round(net, 2),
    }


def build_record() -> Dict[str, float]:
    pay_frequency = choose_frequency()
    cfg = FREQUENCY_CONFIG[pay_frequency]
    annual_salary = sample_annual_salary(pay_frequency)
    gross_per_period = annual_salary / cfg["periods_per_year"]

    tax_rate = estimate_tax_rate(annual_salary)
    deduction_rate = estimate_deduction_rate(annual_salary)
    amounts = compute_period_amounts(gross_per_period, tax_rate, deduction_rate)

    return {
        "pay_frequency": pay_frequency,
        **amounts,
    }


def generate_data(count: int) -> List[Dict[str, float]]:
    return [build_record() for _ in range(count)]


def resolve_output_path(output: Path | None, output_dir: Path) -> Path:
    if output:
        path = output.expanduser()
        if path.is_dir():
            return path / "payroll_data.json"
        return path
    output_dir = output_dir.expanduser()
    return output_dir / "payroll_data.json"


def main() -> None:
    args = parse_args()
    if args.count <= 0:
        raise SystemExit("Count must be a positive integer.")
    if args.seed is not None:
        random.seed(args.seed)

    output_path = resolve_output_path(args.output, args.output_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    data = generate_data(args.count)
    with output_path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, indent=2)

    print(f"Wrote {len(data)} records to {output_path}")


if __name__ == "__main__":
    main()
