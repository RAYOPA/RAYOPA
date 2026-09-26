"""Google OAuth tests use mocked token exchange and identity verification."""
import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["GOOGLE_CLIENT_ID"] = "test-client.apps.googleusercontent.com"
os.environ["GOOGLE_CLIENT_SECRET"] = "test-secret"
os.environ["GOOGLE_REDIRECT_URI"] = "http://127.0.0.1:8000/api/auth/google/callback"

# Starlette versions in the project environment pass `app=` to httpx.Client;
# newer httpx removed that unused constructor parameter.
import inspect
import httpx
if "app" not in inspect.signature(httpx.Client.__init__).parameters:
    _httpx_init = httpx.Client.__init__
    def _compatible_httpx_init(self, *args, app=None, **kwargs):
        return _httpx_init(self, *args, **kwargs)
    httpx.Client.__init__ = _compatible_httpx_init

import pytest
from fastapi.testclient import TestClient
from backend import auth
from backend.main import app
from backend.database import Base, engine, SessionLocal
from backend.models import User

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db(monkeypatch):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/api/auth/google/callback")
    yield
    Base.metadata.drop_all(bind=engine)

def mock_google(monkeypatch, identity):
    class TokenResponse:
        def raise_for_status(self): pass
        def json(self): return {"id_token": "mock-id-token"}
    monkeypatch.setattr("requests.post", lambda *args, **kwargs: TokenResponse())
    monkeypatch.setattr(auth.id_token, "verify_oauth2_token", lambda *args, **kwargs: identity)

def do_callback():
    start = client.get("/api/auth/google", follow_redirects=False)
    state = start.cookies["flowpilot_oauth_state"]
    return client.get("/api/auth/google/callback", params={"code": "mock-code", "state": state}, follow_redirects=False)

def test_google_creates_verified_viewer_and_issues_flowpilot_jwt(monkeypatch):
    mock_google(monkeypatch, {"iss": "https://accounts.google.com", "aud": "test-client.apps.googleusercontent.com",
                              "sub": "google-123", "email": "New@Example.com", "email_verified": True, "exp": 9999999999})
    callback = do_callback()
    assert callback.status_code == 303
    code = callback.headers["location"].split("oauth_code=")[1]
    exchanged = client.post("/api/auth/google/exchange", json={"code": code})
    assert exchanged.status_code == 200
    data = exchanged.json()
    assert data["user"]["email"] == "new@example.com"
    assert data["user"]["role"] == "viewer"
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"}).json()["role"] == "viewer"
    assert client.post("/api/auth/google/exchange", json={"code": code}).status_code == 401

def test_existing_email_keeps_role_and_attaches_google_identity(monkeypatch):
    db = SessionLocal()
    db.add(User(id="existing", username="existing@example.com", email="existing@example.com", role="operator", password_hash="legacy-hash"))
    db.commit(); db.close()
    mock_google(monkeypatch, {"iss": "accounts.google.com", "sub": "google-existing", "email": "existing@example.com", "email_verified": True})
    callback = do_callback()
    code = callback.headers["location"].split("oauth_code=")[1]
    response = client.post("/api/auth/google/exchange", json={"code": code})
    assert response.json()["user"]["role"] == "operator"
    db = SessionLocal()
    assert db.query(User).filter(User.email == "existing@example.com").count() == 1
    db.close()

def test_invalid_state_and_invalid_or_unverified_identity(monkeypatch):
    start = client.get("/api/auth/google", follow_redirects=False)
    invalid = client.get("/api/auth/google/callback", params={"code": "x", "state": "wrong"}, follow_redirects=False)
    assert "invalid_state" in invalid.headers["location"]
    mock_google(monkeypatch, {"iss": "accounts.google.com", "sub": "bad", "email": "bad@example.com", "email_verified": False})
    failed = do_callback()
    assert "google_auth_failed" in failed.headers["location"]
    monkeypatch.setattr(auth.id_token, "verify_oauth2_token", lambda *args, **kwargs: (_ for _ in ()).throw(ValueError("audience")))
    assert "google_auth_failed" in do_callback().headers["location"]

def test_new_account_viewer_is_forbidden_from_operator_action(monkeypatch):
    mock_google(monkeypatch, {"iss": "accounts.google.com", "sub": "google-viewer", "email": "viewer@example.com", "email_verified": True})
    code = do_callback().headers["location"].split("oauth_code=")[1]
    token = client.post("/api/auth/google/exchange", json={"code": code}).json()["access_token"]
    assert client.post("/api/workflows/missing/approve", headers={"Authorization": f"Bearer {token}"}, json={}).status_code == 403

def test_logout_endpoint_and_unauthenticated_api():
    assert client.post("/api/auth/logout").json()["status"] == "logged_out"
    assert client.get("/api/auth/me").status_code == 401

def test_frontend_sources_do_not_contain_server_oauth_secret():
    from pathlib import Path
    frontend = Path("src").read_text(encoding="utf-8") if Path("src").is_file() else "".join(
        path.read_text(encoding="utf-8") for path in Path("src").rglob("*.ts*")
    )
    assert "GOOGLE_CLIENT_SECRET" not in frontend
