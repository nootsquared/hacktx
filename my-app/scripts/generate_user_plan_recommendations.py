#!/usr/bin/env python3
"""
Batch inference utility for Toyota financing plan recommendations.

Reads paystub-style user profiles from static_data/users_paystub.json,
uses the trained plan selector model to score top plans, aligns them
with catalog metadata, and writes the results to
generated_data/users_recommended_plans.json.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List

from plan_selector_service import MODEL_PATH, recommend, load_plan_catalog

BASE_DIR = Path(__file__).resolve().parent
USERS_SOURCE = BASE_DIR / "static_data" / "users_paystub.json"
OUTPUT_PATH = BASE_DIR / "generated_data" / "users_recommended_plans.json"


def _load_json_rows(path: Path) -> List[Dict[str, Any]]:
    data = json.loads(path.read_text())
    if not isinstance(data, list) or not data:
        raise ValueError(f"{path} must contain a non-empty JSON array of user objects.")
    return data


def _build_plan_lookup(plans: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    lookup: Dict[str, Dict[str, Any]] = {}
    for plan in plans:
        plan_id = plan.get("plan_id")
        if isinstance(plan_id, str):
            lookup[plan_id] = plan
    return lookup


def main() -> None:
    if not MODEL_PATH.exists():
        raise SystemExit(
            f"Model artifacts missing at {MODEL_PATH}. "
            "Run `python plan_selector_service.py train` first."
        )

    if not USERS_SOURCE.exists():
        raise SystemExit(f"Input JSON not found: {USERS_SOURCE}")

    users = _load_json_rows(USERS_SOURCE)
    plan_lookup = _build_plan_lookup(load_plan_catalog())

    results: List[Dict[str, Any]] = []
    for idx, user in enumerate(users):
        top_predictions = recommend(user, k=3)
        enriched: List[Dict[str, Any]] = []
        for prediction in top_predictions:
            plan_id = prediction.get("plan_id")
            plan_meta = plan_lookup.get(plan_id, {})
            enriched.append(
                {
                    "plan_id": plan_id,
                    "probability": prediction.get("prob"),
                    "plan": plan_meta,
                }
            )
        results.append(
            {
                "user_index": idx,
                "input_features": user,
                "recommendations": enriched,
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "source": str(USERS_SOURCE.resolve()),
                "model": str(MODEL_PATH.resolve()),
                "results": results,
            },
            indent=2,
        )
        + "\n"
    )

    print(f"Wrote recommendations for {len(results)} user(s) to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
