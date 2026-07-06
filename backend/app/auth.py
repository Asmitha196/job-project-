from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
import bcrypt

# Passlib bcrypt version check compatibility fix for bcrypt >= 4.0.0
if not hasattr(bcrypt, "__about__"):
    class About:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = About()

# Passlib internally executes a check with a password > 72 bytes, which raises
# ValueError in bcrypt >= 4.0.0. We monkeypatch hashpw to safely truncate inputs.
_original_hashpw = bcrypt.hashpw

def _safe_hashpw(password: Any, salt: Any) -> Any:
    if isinstance(password, bytes) and len(password) > 72:
        password = password[:72]
    elif isinstance(password, str) and len(password) > 72:
        password = password[:72]
    return _original_hashpw(password, salt)

bcrypt.hashpw = _safe_hashpw

from passlib.context import CryptContext

from backend.app.config import settings

# Passlib CryptContext configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import json

def verify_password(plain_password: Any, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    Extracts the actual password string if plain_password is passed as a dict, object, or JSON payload.
    """
    # Extract plain password string from complex objects
    if hasattr(plain_password, "password") and isinstance(plain_password.password, str):
        plain_password = plain_password.password
    elif isinstance(plain_password, dict):
        if "password" in plain_password:
            plain_password = plain_password["password"]
    elif isinstance(plain_password, str):
        stripped = plain_password.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            try:
                data = json.loads(stripped)
                if isinstance(data, dict) and "password" in data:
                    plain_password = data["password"]
            except Exception:
                pass
                
    if not isinstance(plain_password, str):
        plain_password = str(plain_password)
        
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: Any) -> str:
    """
    Generate a bcrypt hash of a plain text password.
    Extracts the actual password string if password is passed as a dict, object, or JSON payload.
    """
    # Extract plain password string from complex objects
    if hasattr(password, "password") and isinstance(password.password, str):
        password = password.password
    elif isinstance(password, dict):
        if "password" in password:
            password = password["password"]
    elif isinstance(password, str):
        stripped = password.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            try:
                data = json.loads(stripped)
                if isinstance(data, dict) and "password" in data:
                    password = data["password"]
            except Exception:
                pass
                
    if not isinstance(password, str):
        password = str(password)
        
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a JSON Web Token (JWT) access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Store token expiration as a UTC timestamp
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token. Returns the payload dict if valid, otherwise None.
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
