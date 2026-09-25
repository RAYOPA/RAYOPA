import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/flowpilot.db")

try:
    if DATABASE_URL.startswith("sqlite"):
        from sqlalchemy.pool import StaticPool
        pool_kwargs = {"poolclass": StaticPool} if ":memory:" in DATABASE_URL else {}
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, **pool_kwargs)
    else:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            pass
except Exception:
    os.makedirs("./data", exist_ok=True)
    engine = create_engine("sqlite:///./data/flowpilot.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
