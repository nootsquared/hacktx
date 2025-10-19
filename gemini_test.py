from google import genai
import os

client = genai.Client(api_key=os.environ.get("GENAI_API_KEY"))

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words",
)

print(response.text)
