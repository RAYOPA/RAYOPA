import dotenv
dotenv.load_dotenv()
import os
from google import genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

client = genai.Client()
models = [m.name.replace("models/", "") for m in client.models.list()]
print(f"Testing {len(models)} models...")
success = []
for m in models:
    try:
        llm = ChatGoogleGenerativeAI(model=m, temperature=0, max_retries=0)
        print(f"Trying {m}...")
        resp = llm.invoke([HumanMessage(content="Hello")])
        print(f"SUCCESS: {m}")
        success.append(m)
        break
    except Exception as e:
        print(f"FAILED {m}: {e}")
        pass
print(f"Working models: {success}")
