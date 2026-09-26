import os
import jwt
import bcrypt
import uuid
import secrets
import requests
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .database import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-for-production-please")
ALGORITHM = "HS256"
try:
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
except:
    JWT_EXPIRE_MINUTES = 1440

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

router = APIRouter(prefix="/api/auth", tags=["auth"])

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    email: str | None = None
    email_verified: bool = False

class ExchangeRequest(BaseModel):
    code: str

class SignupRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        id=str(uuid.uuid4()),
        username=payload.email,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role="viewer",  # safe default
        email_verified=False
    )
    db.add(user)
    db.commit()
    return {"status": "created", "id": user.id}

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        email=current_user.email,
        email_verified=current_user.email_verified
    )

@router.post("/logout")
def logout():
    return {"status": "logged_out"}

# In-memory code store for exchanging Google OAuth code
# (In production, use Redis/DB for state/code)
OAUTH_STATES = {}
OAUTH_CODES = {}

@router.get("/google")
def google_auth(request: Request):
    state = secrets.token_urlsafe(16)
    OAUTH_STATES[state] = True
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"state={state}"
    )
    response = RedirectResponse(url=auth_url)
    response.set_cookie(key="flowpilot_oauth_state", value=state, httponly=True)
    return response

@router.get("/google/callback")
def google_callback(code: str = None, state: str = None, request: Request = None):
    saved_state = request.cookies.get("flowpilot_oauth_state") if request else state
    if not saved_state or saved_state != state or state not in OAUTH_STATES:
        response = RedirectResponse(url=f"{FRONTEND_URL}/login?error=invalid_state")
        response.headers["location"] = f"{FRONTEND_URL}/login?error=invalid_state"
        return response
    
    del OAUTH_STATES[state]
    
    if not code:
        response = RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed")
        response.headers["location"] = f"{FRONTEND_URL}/login?error=google_auth_failed"
        return response
    
    # Exchange Google code for Google token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    try:
        r = requests.post(token_url, data=data)
        r.raise_for_status()
        tokens = r.json()
        token = tokens.get("id_token")
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
    except Exception as e:
        response = RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed")
        response.headers["location"] = f"{FRONTEND_URL}/login?error=google_auth_failed"
        return response

    email_verified = idinfo.get("email_verified", False)
    if not email_verified:
        response = RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed")
        response.headers["location"] = f"{FRONTEND_URL}/login?error=google_auth_failed"
        return response

    # Store idinfo for exchange endpoint
    internal_code = secrets.token_urlsafe(16)
    OAUTH_CODES[internal_code] = idinfo
    
    response = RedirectResponse(url=f"{FRONTEND_URL}/login?oauth_code={internal_code}", status_code=303)
    response.headers["location"] = f"{FRONTEND_URL}/login?oauth_code={internal_code}"
    return response

@router.post("/google/exchange")
def google_exchange(payload: ExchangeRequest, db: Session = Depends(get_db)):
    internal_code = payload.code
    if internal_code not in OAUTH_CODES:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid code")
    
    idinfo = OAUTH_CODES.pop(internal_code)
    
    email = idinfo.get("email").lower()
    google_id = idinfo.get("sub")
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        if not user.google_id:
            user.google_id = google_id
            db.commit()
    else:
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            username=email,
            email=email,
            google_id=google_id,
            email_verified=True,
            role="viewer",
            password_hash=""
        )
        db.add(user)
        db.commit()
    
    access_token_expires = timedelta(minutes=JWT_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "email": user.email
        }
    }
