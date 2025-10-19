"""
Integrated Toyota financing plan selector pipeline.

This module bundles data simulation, label generation, model training,
and inference utilities into a single file so it can be embedded easily
inside a Next.js project. It also exposes a small Flask API for
orchestrating the workflow and serving recommendations.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import random
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.utils import shuffle as sk_shuffle
import tensorflow as tf
from tensorflow import keras

try:
    from flask import Flask, abort, jsonify, request, send_file

    HAVE_FLASK = True
except ModuleNotFoundError:  # pragma: no cover - optional dependency for CLI usage
    Flask = None  # type: ignore
    abort = jsonify = request = send_file = None  # type: ignore
    HAVE_FLASK = False

try:
    from joblib import dump as joblib_dump, load as joblib_load
except ImportError:  # pragma: no cover - fallback for environments without joblib
    import pickle

    def joblib_dump(obj: Any, path: Path) -> None:
        with open(path, "wb") as fh:
            pickle.dump(obj, fh)

    def joblib_load(path: Path) -> Any:
        with open(path, "rb") as fh:
            return pickle.load(fh)


os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

# Reproducibility hooks
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)
try:
    tf.config.experimental.enable_op_determinism()
except Exception:  # pragma: no cover - optional depending on TF build
    pass


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static_data"
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

MODEL_FILENAME = "plan_selector_keras.keras"
SCALER_FILENAME = "scaler.pkl"
LABEL_ENCODER_FILENAME = "label_encoder.pkl"

MODEL_PATH = MODELS_DIR / MODEL_FILENAME
SCALER_PATH = MODELS_DIR / SCALER_FILENAME
LABEL_ENCODER_PATH = MODELS_DIR / LABEL_ENCODER_FILENAME

# Training/inference feature vector limited strictly to enriched paystub fields
# from generated_data/payroll_data_enriched.json. This intentionally excludes
# vehicle/debt fields; simulation uses explicit inputs or sensible defaults.
FEATURES: List[str] = [
    "gross_monthly_income",
    "net_monthly_income",
    "effective_tax_rate",
    "deduction_rate",
    "income_stability_index",
    "periods_per_month",
]

DEFAULT_NUMERIC_VALUES: Dict[str, float] = {
    # Enriched paystub fields
    "gross_monthly_income": 4500.0,
    "net_monthly_income": 3200.0,
    "effective_tax_rate": 0.24,
    "deduction_rate": 0.04,
    "income_stability_index": 0.85,
    "periods_per_month": 2.165,
    # Simulation-only context defaults (used when not provided by caller)
    "monthly_obligations": 900.0,
    "vehicle_price": 30000.0,
    "down_payment": 5000.0,
    "miles_per_year": 12000.0,
    "cash_reserves": 2500.0,
    "unexpected_expense_rate": 0.08,
    "unexpected_expense_impact": 750.0,
    "income_shock_reserve_ratio": 0.2,
}

FALLBACK_CONTEXT: Dict[str, Any] = {
    "sales_tax_by_state": {"TX": 0.0625, "CA": 0.085, "FL": 0.06, "NY": 0.08875},
    "fees": {"doc": 200.0, "ttl": 350.0},
}

# Sample fallback plans used if the JSON catalog is missing plan entries.
FALLBACK_PLANS: List[Dict[str, Any]] = [
    {"plan_id": "36m_2.9", "type": "retail_installment", "term_months": 36, "apr": 0.029, "eligible_credit_bands": ["A", "B"]},
    {"plan_id": "48m_4.9", "type": "retail_installment", "term_months": 48, "apr": 0.049, "eligible_credit_bands": ["A", "B", "C"]},
    {"plan_id": "60m_5.9", "type": "retail_installment", "term_months": 60, "apr": 0.059, "eligible_credit_bands": ["A", "B", "C"]},
    {"plan_id": "72m_6.9", "type": "retail_installment", "term_months": 72, "apr": 0.069, "eligible_credit_bands": ["B", "C"]},
    {"plan_id": "36m_lease", "type": "closed_end_lease", "term_months": 36, "apr": 0.029, "eligible_credit_bands": ["A", "B"]},
    {"plan_id": "48m_balloon", "type": "balloon_preferred_option", "term_months": 48, "apr": 0.049, "eligible_credit_bands": ["A", "B"]},
]

SIMULATION_MIN_MONTHS = 84  # Encourage long-term horizon beyond shorter loans.
SIMULATION_EXTRA_MONTHS = 12  # Continue past term to measure post-plan recovery runway.
SIMULATION_RUNS = 250
SIMULATION_INCOME_VOLATILITY_FLOOR = 0.015
SIMULATION_EXPENSE_VOLATILITY = 0.06
SIMULATION_SHOCK_STD = 0.35


def load_json(path: Path, default: Optional[Any] = None) -> Any:
    """Load JSON data from disk with minimal error handling."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        if default is not None:
            return default
        raise


def save_json(path: Path, payload: Any) -> None:
    """Persist JSON data with deterministic formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, sort_keys=True)


def load_context() -> Dict[str, Any]:
    """Load context (tax + fees) with fallback defaults."""
    path = STATIC_DIR / "context.json"
    context = load_json(path, default=None)
    if context is None:
        return FALLBACK_CONTEXT
    return context


def _generate_catalog_from_plan_types(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    plan_types = raw.get("plan_types", [])
    generated: List[Dict[str, Any]] = []
    counter = 1
    for plan_type in plan_types:
        apr_map = plan_type.get("apr_range_by_credit_band") or {}
        term_options: Iterable[int] = plan_type.get("typical_terms_months") or []
        if not apr_map or not term_options:
            continue
        eligible_bands = list(apr_map.keys())
        for term in term_options:
            apr_values: List[float] = []
            for rng in apr_map.values():
                if isinstance(rng, list) and len(rng) == 2:
                    apr_values.append(sum(rng) / 2.0)
            if not apr_values:
                continue
            apr = float(np.mean(apr_values))
            plan_id = f"{term}m_{plan_type.get('type', 'plan')}_{counter}"
            generated.append(
                {
                    "plan_id": plan_id,
                    "type": plan_type.get("type", "retail_installment"),
                    "term_months": int(term),
                    "apr": round(apr, 5),
                    "eligible_credit_bands": eligible_bands,
                }
            )
            counter += 1
    if not generated:
        return FALLBACK_PLANS
    return generated


def load_plan_catalog() -> List[Dict[str, Any]]:
    """Load plan catalog, normalising schema differences if necessary."""
    raw = load_json(STATIC_DIR / "financing_plans.json", default=None)
    if raw is None:
        return FALLBACK_PLANS
    if isinstance(raw, list):
        return [plan for plan in raw if "plan_id" in plan]
    # Allow schemas where plan list is nested under a key.
    if isinstance(raw, dict):
        if "plans" in raw and isinstance(raw["plans"], list):
            plans = [plan for plan in raw["plans"] if "plan_id" in plan]
            if plans:
                return plans
        # Derive plans from plan_types if direct list missing.
        return _generate_catalog_from_plan_types(raw)
    return FALLBACK_PLANS


def _infer_credit_band(user: Dict[str, Any]) -> str:
    income = float(user.get("net_monthly_income", DEFAULT_NUMERIC_VALUES["net_monthly_income"]))
    if income >= 5000:
        return "A"
    if income >= 3500:
        return "B"
    return "C"


def _augment_user(user: Dict[str, Any], idx: int) -> Dict[str, Any]:
    """Deprecated: No synthetic augmentation for training; pass-through only.

    We keep the helper for backward compatibility but stop injecting
    synthetic obligations/vehicle fields. Simulation will rely on
    provided values or DEFAULT_NUMERIC_VALUES.
    """
    return dict(user)


def load_training_profiles() -> List[Dict[str, Any]]:
    """Load training rows strictly from enriched paystub JSON (no fallback).

    This enforces that training only uses fields present in
    generated_data/payroll_data_enriched.json.
    """
    enriched_path = BASE_DIR / "generated_data" / "payroll_data_enriched.json"
    enriched = load_json(enriched_path, default=[])
    if not isinstance(enriched, list) or not enriched:
        raise ValueError(
            "No training data found. Provide generated_data/payroll_data_enriched.json"
        )
    return [dict(row) for row in enriched]


def load_inference_user() -> Dict[str, Any]:
    """Return a single user row for inference demos from enriched paystub data."""
    enriched_path = BASE_DIR / "generated_data" / "payroll_data_enriched.json"
    users = load_json(enriched_path, default=[])
    if isinstance(users, list) and users:
        return users[0]
    raise ValueError("No user profile available for inference in enriched data.")


def amortized_payment(principal: float, apr: float, n_months: int) -> float:
    monthly_rate = apr / 12.0
    if n_months <= 0:
        raise ValueError("term must be positive")
    if monthly_rate == 0:
        return principal / n_months
    denominator = 1 - math.pow(1 + monthly_rate, -n_months)
    if denominator == 0:
        return principal / n_months
    return principal * monthly_rate / denominator


def price_with_tax_and_fees(price: float, sales_tax_rate: float, fees_total: float) -> float:
    return price * (1 + sales_tax_rate) + fees_total


def resale_value(msrp: float, exit_months: int, miles_per_year: float) -> float:
    months = max(exit_months, 0)
    remaining = float(msrp)
    depreciation_schedule = [
        (12, 0.12),
        (12, 0.08),
        (12, 0.07),
    ]

    elapsed = 0
    for period_months, rate in depreciation_schedule:
        if elapsed >= months:
            break
        apply_months = min(period_months, months - elapsed)
        monthly_rate = rate / period_months
        for _ in range(apply_months):
            remaining *= (1 - monthly_rate)
        elapsed += apply_months

    if elapsed < months:
        monthly_rate = 0.05 / 12.0
        extra_months = months - elapsed
        for _ in range(extra_months):
            remaining *= (1 - monthly_rate)

    extra_miles = max(0.0, float(miles_per_year) - 12000.0)
    mileage_penalty = (extra_miles / 5000.0) * 0.01
    remaining *= max(0.0, 1 - mileage_penalty)
    return max(0.2 * msrp, remaining)


def _total_fees(context: Dict[str, Any]) -> float:
    fees = context.get("fees", {})
    return float(sum(float(val) for val in fees.values()))


def _filter_plans_for_user(plans: List[Dict[str, Any]], user: Dict[str, Any]) -> List[Dict[str, Any]]:
    credit_band = user.get("credit_band")
    filtered = []
    for plan in plans:
        eligible = plan.get("eligible_credit_bands")
        if eligible and credit_band and credit_band not in eligible:
            continue
        if plan.get("type") not in {"retail_installment", "closed_end_lease", "balloon_preferred_option"}:
            continue
        if "term_months" not in plan or "apr" not in plan:
            continue
        filtered.append(plan)
    return filtered


def _simulation_seed(user: Dict[str, Any], plan: Dict[str, Any]) -> int:
    """Derive a deterministic seed for cash-flow simulations."""
    canonical = {
        "plan_id": plan.get("plan_id", ""),
        "term": int(plan.get("term_months", 0)),
        "net_income": float(user.get("net_monthly_income", DEFAULT_NUMERIC_VALUES["net_monthly_income"])),
        "obligations": float(user.get("monthly_obligations", DEFAULT_NUMERIC_VALUES["monthly_obligations"])),
        "stability": float(user.get("income_stability_index", DEFAULT_NUMERIC_VALUES["income_stability_index"])),
    }
    payload = json.dumps(canonical, sort_keys=True).encode("utf-8")
    digest = hashlib.sha256(payload).digest()
    return int.from_bytes(digest[:4], "big")


def simulate_long_term_cash_flow(
    user: Dict[str, Any],
    plan: Dict[str, Any],
    monthly_payment: float,
    context: Dict[str, Any],
    runs: int = SIMULATION_RUNS,
) -> Dict[str, float]:
    """Run Monte Carlo cash-flow simulations to estimate payment risk and buffers."""
    rng = np.random.default_rng(_simulation_seed(user, plan))
    base_income = float(user.get("net_monthly_income", DEFAULT_NUMERIC_VALUES["net_monthly_income"]))
    obligations = float(user.get("monthly_obligations", DEFAULT_NUMERIC_VALUES["monthly_obligations"]))
    stability = float(user.get("income_stability_index", DEFAULT_NUMERIC_VALUES["income_stability_index"]))
    reserves = float(user.get("cash_reserves", DEFAULT_NUMERIC_VALUES["cash_reserves"]))
    shock_rate = float(user.get("unexpected_expense_rate", DEFAULT_NUMERIC_VALUES["unexpected_expense_rate"]))
    shock_base = float(user.get("unexpected_expense_impact", DEFAULT_NUMERIC_VALUES["unexpected_expense_impact"]))
    reserve_ratio = float(user.get("income_shock_reserve_ratio", DEFAULT_NUMERIC_VALUES["income_shock_reserve_ratio"]))
    fees_total = _total_fees(context)
    shock_base = max(shock_base, fees_total * 0.25, monthly_payment * 0.5)
    income_volatility = max(SIMULATION_INCOME_VOLATILITY_FLOOR, (1.0 - stability) * 0.3)
    expense_volatility = SIMULATION_EXPENSE_VOLATILITY + (1.0 - stability) * 0.05
    buffer_threshold = max(0.0, base_income * reserve_ratio)

    term = max(int(plan.get("term_months", 36)), 1)
    exit_month = int(user.get("exit_month", term))
    horizon = max(term, exit_month, SIMULATION_MIN_MONTHS) + SIMULATION_EXTRA_MONTHS
    runs = max(runs, 25)

    missed_runs = 0
    months_to_default: List[int] = []
    final_reserves: List[float] = []
    worst_reserves: List[float] = []
    buffer_ratios: List[float] = []

    for _ in range(runs):
        cash = reserves
        worst = cash
        months_below_buffer = 0
        missed = False
        default_month = horizon

        for month in range(horizon):
            income = base_income * max(0.0, 1.0 + rng.normal(0.0, income_volatility))
            expenses = obligations * max(0.0, 1.0 + rng.normal(0.0, expense_volatility))
            shock = 0.0
            if rng.random() < shock_rate:
                shock = max(0.0, shock_base * (1.0 + rng.normal(0.0, SIMULATION_SHOCK_STD)))

            payment_due = monthly_payment if month < term else 0.0
            cash += income - expenses - shock - payment_due
            worst = min(worst, cash)
            if cash < buffer_threshold:
                months_below_buffer += 1
            if cash < 0.0:
                missed = True
                default_month = month + 1
                cash = min(cash, -payment_due)
                break

        if missed:
            missed_runs += 1
        months_to_default.append(default_month)
        final_reserves.append(cash)
        worst_reserves.append(worst)
        buffer_ratios.append(months_below_buffer / float(horizon))

    missed_prob = missed_runs / float(runs)
    avg_final = float(np.mean(final_reserves)) if final_reserves else 0.0
    p5_final = float(np.percentile(final_reserves, 5)) if final_reserves else 0.0
    worst_case = float(np.min(worst_reserves)) if worst_reserves else 0.0
    buffer_rate = float(np.mean(buffer_ratios)) if buffer_ratios else 1.0
    expected_default_month = float(np.mean(months_to_default)) if months_to_default else float(horizon)

    return {
        "missed_payment_probability": float(round(missed_prob, 4)),
        "avg_final_reserve": float(round(avg_final, 2)),
        "p5_final_reserve": float(round(p5_final, 2)),
        "worst_case_reserve": float(round(worst_case, 2)),
        "buffer_violation_rate": float(round(buffer_rate, 4)),
        "expected_months_to_default": float(round(expected_default_month, 1)),
        "analysis_months": float(horizon),
    }


def score_plan(user: Dict[str, Any], plan: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    vehicle_price = float(user.get("vehicle_price", DEFAULT_NUMERIC_VALUES["vehicle_price"]))
    down_payment = float(user.get("down_payment", DEFAULT_NUMERIC_VALUES["down_payment"]))
    sales_tax = float(context.get("sales_tax_by_state", {}).get(user.get("region_state", "TX"), 0.0))
    total_fees = _total_fees(context)
    all_in_price = price_with_tax_and_fees(vehicle_price, sales_tax, total_fees)
    principal = max(all_in_price - down_payment, 0.0)

    term = int(plan.get("term_months", 36))
    apr = float(plan.get("apr", 0.0))
    monthly_payment = amortized_payment(principal, apr, term)

    net_income = float(user.get("net_monthly_income", DEFAULT_NUMERIC_VALUES["net_monthly_income"]))
    obligations = float(user.get("monthly_obligations", DEFAULT_NUMERIC_VALUES["monthly_obligations"]))
    if net_income <= 0:
        dti = float("inf")
    else:
        dti = (obligations + monthly_payment) / net_income

    exit_month = int(user.get("exit_month", term))
    active_months = min(term, max(exit_month, 0))
    total_paid = monthly_payment * active_months + down_payment
    residual = resale_value(
        vehicle_price,
        exit_month,
        float(user.get("miles_per_year", DEFAULT_NUMERIC_VALUES["miles_per_year"])),
    )
    effective_cost = max(total_paid - residual, 0.0)

    dti_norm = min(max(dti / 0.40, 0.0), 2.0)
    eff_norm = min(max(effective_cost / 30000.0, 0.0), 1.5)

    simulation = simulate_long_term_cash_flow(user, plan, monthly_payment, context)
    missed_prob = float(simulation["missed_payment_probability"])
    buffer_rate = float(simulation["buffer_violation_rate"])
    p5_reserve = float(simulation["p5_final_reserve"])

    if monthly_payment > 0:
        resilience_score = min(max(p5_reserve / (monthly_payment * 3.0), 0.0), 2.0) / 2.0
    else:
        resilience_score = 1.0
    safety_score = max(0.0, 1.0 - min(1.0, missed_prob * 1.3))
    stability_score = max(0.0, 1.0 - min(1.0, buffer_rate))
    protective_score = max(0.0, min(1.0, 0.6 * safety_score + 0.25 * stability_score + 0.15 * resilience_score))

    if not math.isfinite(dti):
        dti_component = 0.0
    else:
        dti_component = max(0.0, 1.0 - min(dti_norm, 1.5))
    cost_component = max(0.0, 1.0 - eff_norm)
    final_score = max(
        0.0,
        min(1.0, 0.6 * protective_score + 0.25 * dti_component + 0.15 * cost_component),
    )

    return {
        "plan_id": plan["plan_id"],
        "monthly_payment": float(round(monthly_payment, 2)),
        "effective_cost": float(round(effective_cost, 2)),
        "dti": float(round(dti, 4)) if math.isfinite(dti) else float("inf"),
        "safety_score": float(round(protective_score, 4)),
        "missed_payment_probability": float(simulation["missed_payment_probability"]),
        "buffer_violation_rate": float(simulation["buffer_violation_rate"]),
        "p5_final_reserve": float(simulation["p5_final_reserve"]),
        "avg_final_reserve": float(simulation["avg_final_reserve"]),
        "worst_case_reserve": float(simulation["worst_case_reserve"]),
        "expected_months_to_default": float(simulation["expected_months_to_default"]),
        "analysis_months": float(simulation["analysis_months"]),
        "score": float(round(final_score, 4)),
    }


def _rank_scored(scored: List[Dict[str, Any]], tradeoff: str) -> List[Dict[str, Any]]:
    """Rank scored plans by a tradeoff strategy.

    tradeoff:
      - 'balanced': use blended score (higher is better)
      - 'lowest_monthly': prioritize lowest monthly payment
      - 'lowest_cost': prioritize lowest effective long-term cost
      - 'lowest_risk': prioritize lowest missed-payment probability
    """
    if not scored:
        return []
    if tradeoff == "lowest_monthly":
        return sorted(scored, key=lambda x: (x["monthly_payment"], x["effective_cost"]))
    if tradeoff == "lowest_cost":
        return sorted(scored, key=lambda x: (x["effective_cost"], x["monthly_payment"]))
    if tradeoff == "lowest_risk":
        return sorted(
            scored,
            key=lambda x: (
                x.get("missed_payment_probability", 1.0),
                -x.get("safety_score", 0.0),
                x.get("monthly_payment", float("inf")),
            ),
        )
    # balanced (default): highest blended score
    return sorted(scored, key=lambda x: x["score"], reverse=True)


def make_labels() -> List[Dict[str, Any]]:
    users = load_training_profiles()
    context = load_context()
    plans = load_plan_catalog()
    labeled_users: List[Dict[str, Any]] = []

    for user in users:
        eligible_plans = _filter_plans_for_user(plans, user)
        scored = []
        for plan in eligible_plans:
            try:
                scored_plan = score_plan(user, plan, context)
                scored.append(scored_plan)
            except Exception:
                continue
        if not scored:
            continue
        scored.sort(key=lambda item: item["score"], reverse=True)
        top3 = scored[:3]
        labeled_user = dict(user)
        labeled_user["best_plan_id"] = top3[0]["plan_id"]
        labeled_user["top3_plan_ids"] = [item["plan_id"] for item in top3]
        labeled_users.append(labeled_user)

    save_json(DATA_DIR / "labeled_users.json", labeled_users)
    return labeled_users


def _load_labeled_users() -> List[Dict[str, Any]]:
    path = DATA_DIR / "labeled_users.json"
    return load_json(path, default=[])


def _ensure_directories() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    MODELS_DIR.mkdir(exist_ok=True)


def _prepare_dataset(rows: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, StandardScaler, LabelEncoder]:
    if not rows:
        raise ValueError("No labeled users found. Run make_labels first.")

    X: List[List[float]] = []
    y: List[str] = []
    for row in rows:
        features = []
        for feature in FEATURES:
            value = row.get(feature, DEFAULT_NUMERIC_VALUES[feature])
            try:
                features.append(float(value))
            except (TypeError, ValueError):
                features.append(float(DEFAULT_NUMERIC_VALUES[feature]))
        X.append(features)
        y.append(str(row["best_plan_id"]))

    X_array = np.asarray(X, dtype=np.float32)
    y_array = np.asarray(y)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_array)

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y_array)

    return X_scaled, y_encoded, scaler, label_encoder


def _build_model(input_dim: int, num_classes: int) -> keras.Model:
    model = keras.Sequential(
        [
            keras.layers.Input(shape=(input_dim,)),
            keras.layers.Dense(64, activation="relu"),
            keras.layers.Dense(64, activation="relu"),
            keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
        run_eagerly=False,
    )
    return model


def train_model(test_size: float = 0.2) -> Dict[str, Any]:
    _ensure_directories()
    rows = _load_labeled_users()
    if not rows:
        rows = make_labels()

    rows = sk_shuffle(rows, random_state=SEED)

    X_scaled, y_encoded, scaler, label_encoder = _prepare_dataset(rows)
    class_counts = np.bincount(y_encoded)
    stratify_target: Optional[np.ndarray]
    if len(class_counts) == 0:
        raise ValueError("No classes available for training.")
    min_class = int(class_counts.min())
    expected_val_counts = class_counts * test_size
    if min_class < 2 or np.any(expected_val_counts < 1.0):
        stratify_target = None
    else:
        stratify_target = y_encoded

    if stratify_target is None:
        print(
            "Warning: skipped stratified split due to low counts per class; consider adding more labeled data.",
            file=sys.stderr,
        )

    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled,
        y_encoded,
        test_size=test_size,
        random_state=SEED,
        stratify=stratify_target,
    )

    model = _build_model(X_train.shape[1], len(label_encoder.classes_))
    early_stop = keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        patience=5,
        restore_best_weights=True,
    )

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=50,
        batch_size=32,
        callbacks=[early_stop],
        verbose=0,
    )

    loss, acc = model.evaluate(X_val, y_val, verbose=0)

    _ensure_directories()
    model.save(MODEL_PATH, save_format="keras")
    joblib_dump(scaler, SCALER_PATH)
    joblib_dump(label_encoder, LABEL_ENCODER_PATH)

    return {
        "epochs_trained": len(history.history.get("loss", [])),
        "validation_loss": float(loss),
        "validation_accuracy": float(acc),
        "num_samples": int(len(rows)),
        "num_classes": int(len(label_encoder.classes_)),
        "model_path": str(MODEL_PATH),
    }


def _load_artifacts() -> Tuple[keras.Model, StandardScaler, LabelEncoder]:
    if not MODEL_PATH.exists() or not SCALER_PATH.exists() or not LABEL_ENCODER_PATH.exists():
        raise FileNotFoundError("Model artifacts missing. Train the model first.")

    model = keras.models.load_model(MODEL_PATH)
    scaler = joblib_load(SCALER_PATH)
    label_encoder = joblib_load(LABEL_ENCODER_PATH)
    return model, scaler, label_encoder


def _vectorise_user(user: Dict[str, Any], scaler: StandardScaler) -> np.ndarray:
    features: List[float] = []
    for feature in FEATURES:
        value = user.get(feature, DEFAULT_NUMERIC_VALUES[feature])
        try:
            features.append(float(value))
        except (TypeError, ValueError):
            features.append(float(DEFAULT_NUMERIC_VALUES[feature]))
    array = np.asarray([features], dtype=np.float32)
    return scaler.transform(array)


def recommend(user: Dict[str, Any], k: int = 3) -> List[Dict[str, Any]]:
    """Legacy ML-based top-k recommendations (kept for compatibility)."""
    model, scaler, label_encoder = _load_artifacts()
    feature_vector = _vectorise_user(user, scaler)
    probabilities = model.predict(feature_vector, verbose=0)[0]
    top_indices = np.argsort(probabilities)[::-1][:k]
    results: List[Dict[str, Any]] = []
    for idx in top_indices:
        plan_id = label_encoder.inverse_transform([idx])[0]
        results.append({"plan_id": plan_id, "prob": float(round(probabilities[idx], 4))})
    return results


def recommend_simulation_only(user: Dict[str, Any], k: int = 3, tradeoff: str = "balanced") -> Dict[str, Any]:
    """Rank all eligible plans by simulation without using the ML model.

    tradeoff options:
      - 'balanced': blended score using DTI, cost, and safety
      - 'lowest_monthly': prioritize lowest monthly payment
      - 'lowest_cost': prioritize lowest long-term effective cost
      - 'lowest_risk': prioritize safest cash-flow outcome
    """
    context = load_context()
    plans = load_plan_catalog()
    eligible_plans = _filter_plans_for_user(plans, user)
    scored: List[Dict[str, Any]] = []
    for plan in eligible_plans:
        try:
            scored.append(score_plan(user, plan, context))
        except Exception:
            continue
    ranked = _rank_scored(scored, tradeoff)
    if not ranked:
        raise ValueError("No eligible plans to recommend.")
    top = ranked[:k]
    return {"top_1": top[0], "alternatives": top[1:]}


def recommend_scenarios(user: Dict[str, Any], k: int = 3) -> Dict[str, Any]:
    """Return recommendations for multiple tradeoffs for user transparency."""
    return {
        "balanced": recommend_simulation_only(user, k=k, tradeoff="balanced"),
        "lowest_monthly": recommend_simulation_only(user, k=k, tradeoff="lowest_monthly"),
        "lowest_cost": recommend_simulation_only(user, k=k, tradeoff="lowest_cost"),
        "lowest_risk": recommend_simulation_only(user, k=k, tradeoff="lowest_risk"),
    }


def run_inference_example() -> Dict[str, Any]:
    sample_user = load_inference_user()
    return recommend_scenarios(sample_user, k=3)


if HAVE_FLASK:
    app = Flask(__name__)

    @app.route("/health", methods=["GET"])
    def health() -> Any:
        return jsonify({"status": "ok"})

    @app.route("/label", methods=["POST"])
    def label_endpoint() -> Any:
        labeled = make_labels()
        return jsonify({"rows": len(labeled), "output": str((DATA_DIR / 'labeled_users.json').resolve())})

    @app.route("/train", methods=["POST"])
    def train_endpoint() -> Any:
        # Optional auto-label toggle via query parameter
        auto_label = request.args.get("auto_label", "true").lower() != "false"
        if auto_label:
            make_labels()
        metrics = train_model()
        return jsonify(metrics)

    @app.route("/recommend", methods=["POST"])
    def recommend_endpoint() -> Any:
        payload = request.get_json(force=True, silent=True)
        if not payload:
            abort(400, description="Request body must be JSON.")
        user = payload.get("user", payload)
        if not isinstance(user, dict):
            abort(400, description="User payload must be an object.")
        k = int(payload.get("k", 3))
        tradeoff = str(payload.get("tradeoff", "balanced"))
        scenarios = bool(payload.get("scenarios", True))
        if scenarios:
            result = recommend_scenarios(user, k=max(1, k))
        else:
            result = recommend_simulation_only(user, k=max(1, k), tradeoff=tradeoff)
        return jsonify(result)

    @app.route("/model/weights", methods=["GET"])
    def weights_endpoint() -> Any:
        if not MODEL_PATH.exists():
            abort(404, description="Model weights not found. Train the model first.")
        return send_file(MODEL_PATH, as_attachment=True)

    @app.route("/models", methods=["GET"])
    def models_endpoint() -> Any:
        artifacts = {
            "model": str(MODEL_PATH.resolve()),
            "scaler": str(SCALER_PATH.resolve()),
            "label_encoder": str(LABEL_ENCODER_PATH.resolve()),
        }
        existing = {key: path for key, path in artifacts.items() if Path(path).exists()}
        return jsonify(existing)
else:
    app = None


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Toyota plan selector pipeline")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("label", help="Generate plan labels for users")
    train_parser = subparsers.add_parser("train", help="Train the Keras classifier")
    train_parser.add_argument("--test-size", type=float, default=0.2)

    infer_parser = subparsers.add_parser("infer", help="Run simulation-only inference for the first enriched user")
    infer_parser.add_argument("--k", type=int, default=3)
    infer_parser.add_argument("--tradeoff", choices=["balanced", "lowest_monthly", "lowest_cost"], default="balanced")
    infer_parser.add_argument("--scenarios", action="store_true", help="Show multiple tradeoff scenarios")

    serve_parser = subparsers.add_parser("serve", help="Start the Flask service")
    serve_parser.add_argument("--host", default="127.0.0.1")
    serve_parser.add_argument("--port", type=int, default=5000)

    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> None:
    args = parse_args(argv)
    if args.command == "label":
        labeled = make_labels()
        print(f"Wrote {len(labeled)} labeled user rows to {DATA_DIR / 'labeled_users.json'}")
    elif args.command == "train":
        make_labels()
        metrics = train_model(test_size=args.test_size)
        print(json.dumps(metrics, indent=2))
    elif args.command == "infer":
        user = load_inference_user()
        if args.scenarios:
            result = recommend_scenarios(user, k=max(1, args.k))
        else:
            result = recommend_simulation_only(user, k=max(1, args.k), tradeoff=args.tradeoff)
        print(json.dumps(result, indent=2))
    elif args.command == "serve":
        if not HAVE_FLASK:
            raise SystemExit("Flask is not installed. Install it with `pip install flask` to use the API server.")
        app.run(host=args.host, port=args.port, debug=False)
    else:  # pragma: no cover - defensive fallback
        raise ValueError(f"Unknown command {args.command}")


if __name__ == "__main__":
    main(sys.argv[1:])
