import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}"
payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
response = requests.post(url, json=payload)
print("gemini-1.5-pro status:", response.status_code)
if response.status_code != 200:
    print(response.json())
