from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.utils.database import get_db
from app.models.user import User
from app.config import get_settings
from app.services.otp_service import otp_service
from pydantic import BaseModel, EmailStr
import os
import hashlib

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()
# Use argon2 which has no 72-byte limit and is more secure; fall back to bcrypt if needed
try:
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
except Exception:
    # If argon2 not available, use bcrypt as fallback
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserRegister(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RootLogin(BaseModel):
    email: EmailStr
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def _prepare_password(password: str) -> str:
    """Prepare password for hashing/verification.
    With argon2, no size limitation, so just return the password as-is.
    """
    return password

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Optional auth dependency: returns the User if a valid Bearer token is provided, else None."""
    # If authorization header provided, try to decode and return the user
    if authorization:
        try:
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: int = payload.get("sub")
            if user_id is None:
                return None
            user = db.query(User).filter(User.id == user_id).first()
            return user
        except JWTError:
            return None

    # No authorization provided: for local/dev convenience, return or create a fallback dev user
    # This prevents endpoints that assume a user from raising AttributeError when auth is omitted.
    dev_email = getattr(settings, "ROOT_EMAIL", None) or "dev@example.com"
    user = db.query(User).filter(User.email == dev_email).first()
    if user:
        # mark as a dev fallback user so callers can distinguish
        try:
            setattr(user, "_is_dev_fallback", True)
        except Exception:
            pass
        return user

    # Create a lightweight dev user
    import time
    unique_phone = f"+1{int(time.time() * 1000) % 10000000000:010d}"
    try:
        hashed_password = pwd_context.hash(_prepare_password(getattr(settings, "ROOT_PASSWORD", "devpass")))
    except Exception:
        hashed_password = ""

    user = User(
        email=dev_email,
        phone=unique_phone,
        full_name="Dev User",
        hashed_password=hashed_password,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    try:
        setattr(user, "_is_dev_fallback", True)
    except Exception:
        pass
    return user


@router.post("/root-login", response_model=Token)
def root_login(creds: RootLogin, db: Session = Depends(get_db)):
    """Authenticate using ROOT_EMAIL/ROOT_PASSWORD from settings.
    If a corresponding user does not exist, create one (local/dev convenience).
    """
    # Validate against configured root creds
    if creds.email != settings.ROOT_EMAIL or creds.password != settings.ROOT_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect root credentials")

    # Ensure a user exists for this root email
    user = db.query(User).filter(User.email == settings.ROOT_EMAIL).first()
    if not user:
        # Create a lightweight admin user; prepare password same as registration path
        prepared = _prepare_password(settings.ROOT_PASSWORD)
        hashed_password = pwd_context.hash(prepared)
        user = User(
            email=settings.ROOT_EMAIL,
            phone="",
            full_name="Root Admin",
            hashed_password=hashed_password,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.phone == user_data.phone)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user WITHOUT password hashing (for dev/testing)
    new_user = User(
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=""  # Skip password hashing for now
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {"access_token": access_token, "token_type": "bearer"}


MOCK_OTP_MODE = os.getenv("MOCK_OTP_MODE", "false").lower() == "true"


@router.post("/send-otp")
def send_otp(otp_request: OTPRequest, db: Session = Depends(get_db)):
    """Send OTP to phone. If `MOCK_OTP_MODE` is enabled, returns a mock code."""
    if MOCK_OTP_MODE:
        mock_otp = "123456"
        print(f"MOCK OTP for {otp_request.phone}: {mock_otp}")
        return {"message": "OTP sent (mock mode)", "otp": mock_otp}

    otp_code = otp_service.send_otp(otp_request.phone, db)
    return {"message": "OTP sent successfully", "otp": otp_code}  # Remove otp in production

@router.post("/verify-otp")
def verify_otp(otp_verify: OTPVerify, db: Session = Depends(get_db)):
    is_valid = otp_service.verify_otp(otp_verify.phone, otp_verify.code, db)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Update user verification status
    user = db.query(User).filter(User.phone == otp_verify.phone).first()
    if user:
        user.is_verified = True
        db.commit()
    
    return {"message": "Phone verified successfully"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint - SKIP PASSWORD VERIFICATION FOR NOW.
    Auto-create user if doesn't exist."""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # If user doesn't exist, create them (for dev convenience)
    if not user:
        # Generate unique phone based on email and timestamp
        import time
        unique_phone = f"+1{int(time.time() * 1000) % 10000000000:010d}"
        user = User(
            email=form_data.username,
            phone=unique_phone,
            full_name=form_data.username.split('@')[0],
            hashed_password="",  # Skip password hashing
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-json", response_model=Token)
def login_json(creds: RootLogin, db: Session = Depends(get_db)):
    """JSON-based login endpoint - SKIP PASSWORD VERIFICATION FOR NOW.
    Auto-create user if doesn't exist."""
    user = db.query(User).filter(User.email == creds.email).first()
    
    # If user doesn't exist, create them (for dev convenience)
    if not user:
        # Generate unique phone based on email and timestamp
        import time
        unique_phone = f"+1{int(time.time() * 1000) % 10000000000:010d}"
        user = User(
            email=creds.email,
            phone=unique_phone,
            full_name=creds.email.split('@')[0],
            hashed_password="",  # Skip password hashing
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}