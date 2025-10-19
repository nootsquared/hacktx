from fastapi import FastAPI, UploadFile, File
from google import genai
from dotenv import load_dotenv

import os

from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

api_key = os.getenv("GENAI_API_KEY")
if not api_key:
    raise RuntimeError("❌ GENAI_API_KEY is not set. Add it to your .env or export it before running.")

client = genai.Client(api_key=api_key)



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    # Read PDF bytes
    pdf_bytes = await file.read()

    # Define a prompt to extract relevant fields
    prompt = """
    Extract the following fields from this document:
    - Employee Name
    - Employer Name
    - Gross Income
    - Tax Withheld
    - Deductions
    Return as JSON.
    """

    # Send PDF to Gemini
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            genai.types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
            prompt
        ]
    )

    print("Parsed Data from Gemini:", response.text)

    # The model returns text, ideally JSON-formatted
    return {"parsed_data": response.text}
