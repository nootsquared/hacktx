from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from dotenv import load_dotenv
import os


load_dotenv()

api_key = os.getenv("GENAI_API_KEY")
if not api_key:
    raise RuntimeError("❌ GENAI_API_KEY is not set. Add it to your .env or export it before running.")

client = genai.Client(api_key=api_key)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Simple health check
@app.get("/health")
async def health():
    return {"status": "ok"}


# Map filename extensions to mime types for cases where the browser doesn't send content_type
EXT_TO_MIME = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    # Read file bytes
    file_bytes = await file.read()

    # Prefer client-provided content type, else infer from extension
    mime_type = file.content_type or EXT_TO_MIME.get(os.path.splitext(file.filename)[1].lower(), "application/octet-stream")

    # Define a prompt to extract relevant fields (works for common pay/tax docs)
    prompt = (
        "Extract the following fields from this document and return STRICT JSON with stable keys: "
        "employeeName, employerName, grossIncome, taxWithheld, deductions, period, notes. "
        "If a field is missing, use null. Do not add explanations."
    )

    # Send to Gemini
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            genai.types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            prompt,
        ],
    )

    parsed_text = (response.text or "").strip()
    print(f"Parsed Data from Gemini ({file.filename}, {mime_type}):\n{parsed_text}\n")

    return {
        "filename": file.filename,
        "mime_type": mime_type,
        "parsed_data": parsed_text,
    }
