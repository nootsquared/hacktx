from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import json
import os
import re

import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model

from google import genai

load_dotenv()

# --- GenAI client setup ----------------------------------------------------
api_key = os.getenv("GENAI_API_KEY")
if not api_key:
    raise RuntimeError(
        "❌ GENAI_API_KEY is not set. Add it to your .env or export it before running."
    )

client = genai.Client(api_key=api_key)

# --- FastAPI app -----------------------------------------------------------
app = FastAPI()

# CORS middleware (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load ML artifacts once -----------------------------------------------
model = load_model("models/plan_predictor.keras")
encoder = joblib.load("models/pay_freq_encoder.joblib")
scaler = joblib.load("models/numeric_scaler.joblib")
label_encoder = joblib.load("models/plan_label_encoder.joblib")


# --- Endpoint --------------------------------------------------------------
@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    """
    Accept a PDF upload, send it to Gemini to extract payroll fields,
    convert to model input format, and return the top-3 predicted plans.
    """
    # Read PDF bytes
    pdf_bytes = await file.read()

    # Prompt to extract relevant fields (returns JSON)
    prompt = """
    Extract the following fields from this document:
    - Pay Frequency
    - Gross Pay Per Period
    - Total Taxes Withheld Per Period
    - Total Deductions Per Period
    - Net Pay Per Period
    - Credit Score

    Return each field as the correct type in JSON format and remove any non-numeric characters like '$'.
    Example output format:
    {
      "pay_frequency": "biweekly",
      "gross_pay_per_period": 2404.37,
      "total_taxes_withheld_per_period": 615.68,
      "total_deductions_per_period": 116.78,
      "net_pay_per_period": 1671.91,
      "credit_score": 720
    }
    """

    # Send PDF + prompt to Gemini
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[genai.types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"), prompt],
    )

    # Gemini raw text (log for debugging)
    print("Parsed Data from Gemini:", response.text)

    # Extract first JSON object found in the response text
    match = re.search(r"\{.*\}", response.text, re.DOTALL)
    if not match:
        return {"error": "No JSON found in Gemini output."}

    try:
        parsed_json = json.loads(match.group())
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON inside Gemini output."}

    # Build DataFrame in the model's expected format
    sample_df = pd.DataFrame(
        [
            {
                "pay_frequency": parsed_json["pay_frequency"],
                "gross_pay_per_period": float(parsed_json["gross_pay_per_period"]),
                "total_taxes_withheld_per_period": float(parsed_json["total_taxes_withheld_per_period"]),
                "total_deductions_per_period": float(parsed_json["total_deductions_per_period"]),
                "net_pay_per_period": float(parsed_json["net_pay_per_period"]),
                "credit_score": float(parsed_json["credit_score"]),
            }
        ]
    )

    # Preprocess: encode categorical and scale numeric features
    pay_freq_enc = encoder.transform(sample_df[["pay_frequency"]])
    numeric_scaled = scaler.transform(
        sample_df[
            [
                "gross_pay_per_period",
                "total_taxes_withheld_per_period",
                "total_deductions_per_period",
                "net_pay_per_period",
                "credit_score",
            ]
        ]
    )

    X_sample = np.hstack([pay_freq_enc, numeric_scaled])

    # Predict probabilities and take top 3 classes
    pred_probs = model.predict(X_sample)[0]  # shape: (n_classes,)
    top3_idx = np.argsort(pred_probs)[-3:][::-1]

    top3_plans = [
        {"plan": label_encoder.inverse_transform([i])[0], "probability": float(pred_probs[i])}
        for i in top3_idx
    ]

    print("Top 3 Financial Plans For You:", top3_plans)

    # Return parsed data + top 3 plans
    return {"parsed_data": parsed_json, "top_3_predictions": top3_plans}
