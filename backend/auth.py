from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
import os
import uuid

# Secret key for JWT - in production, use environment variable
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "alabama-pawn-storage-super-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User roles
class UserRole:
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    STAFF = "staff"
    USER = "user"

# Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = UserRole.USER
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = UserRole.USER

class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(UserBase):
    id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserResponse] = None
    requires_two_factor: bool = False
    challenge_id: Optional[str] = None
    email: Optional[EmailStr] = None
    message: Optional[str] = None
    trusted_device_token: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    trusted_device_token: Optional[str] = None

# Password utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        if user_id is None:
            return None
        return TokenData(user_id=user_id, email=email, role=role)
    except JWTError:
        return None

# Permission checking
def has_permission(user_role: str, required_roles: list) -> bool:
    """Check if user has required role. Super admin has all permissions."""
    if user_role == UserRole.SUPER_ADMIN:
        return True
    return user_role in required_roles

def is_super_admin(user_role: str) -> bool:
    return user_role == UserRole.SUPER_ADMIN

def is_admin_or_above(user_role: str) -> bool:
    return user_role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]
