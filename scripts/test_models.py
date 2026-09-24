import dotenv
dotenv.load_dotenv()
from langchain_google_genai import ChatGoogleGenerativeAI
models=["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3-flash-preview", "gemini-3.1-flash-lite"]
for m in models:
    try:
        llm = ChatGoogleGenerativeAI(model=m, temperature=0)
        print(m, llm.invoke("hi").content)
    except Exception as e:
        print(m, "Failed", e)
