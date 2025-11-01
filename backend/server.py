from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import json
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'lse-hosting-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Data files
DATA_DIR = ROOT_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

USERS_FILE = DATA_DIR / 'users.json'
CONFIG_FILE = DATA_DIR / 'config.json'
NOTIFICATIONS_FILE = DATA_DIR / 'notifications.json'

# Initialize data files
if not USERS_FILE.exists():
    # Create default admin user
    default_users = {
        "admin": {
            "id": str(uuid.uuid4()),
            "nombre": "Administrador",
            "usuario": "admin",
            "email": "admin@lsehosting.com",
            "password": pwd_context.hash("admin123"),
            "credits": 1000,
            "is_admin": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    }
    USERS_FILE.write_text(json.dumps(default_users, indent=2))

if not CONFIG_FILE.exists():
    default_config = {
        "credits_per_interval": 1,
        "interval_seconds": 60
    }
    CONFIG_FILE.write_text(json.dumps(default_config, indent=2))

if not NOTIFICATIONS_FILE.exists():
    NOTIFICATIONS_FILE.write_text(json.dumps({}, indent=2))

# Helper functions
def load_users():
    return json.loads(USERS_FILE.read_text())

def save_users(users):
    USERS_FILE.write_text(json.dumps(users, indent=2))

def load_config():
    return json.loads(CONFIG_FILE.read_text())

def save_config(config):
    CONFIG_FILE.write_text(json.dumps(config, indent=2))

def load_notifications():
    return json.loads(NOTIFICATIONS_FILE.read_text())

def save_notifications(notifications):
    NOTIFICATIONS_FILE.write_text(json.dumps(notifications, indent=2))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    usuario = payload.get("sub")
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    users = load_users()
    if usuario not in users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return users[usuario]

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Models
class RegisterRequest(BaseModel):
    nombre: str
    usuario: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    usuario: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    nombre: str
    usuario: str
    email: str
    credits: int
    is_admin: bool
    created_at: str

class UpdateCreditsRequest(BaseModel):
    usuario: str
    credits: int
    reason: str

class UpdateConfigRequest(BaseModel):
    credits_per_interval: int
    interval_seconds: int

class ClaimCreditsRequest(BaseModel):
    intervals: int

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Auth endpoints
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: RegisterRequest):
    users = load_users()
    
    # Check if user already exists
    if data.usuario in users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    for user in users.values():
        if user["email"] == data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "nombre": data.nombre,
        "usuario": data.usuario,
        "email": data.email,
        "password": get_password_hash(data.password),
        "credits": 0,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    users[data.usuario] = new_user
    save_users(users)
    
    # Create token
    access_token = create_access_token(data={"sub": data.usuario})
    
    # Remove password from response
    user_response = {k: v for k, v in new_user.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    users = load_users()
    
    if data.usuario not in users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    user = users[data.usuario]
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create token
    access_token = create_access_token(data={"sub": data.usuario})
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password"}

# User endpoints
@api_router.post("/credits/claim")
async def claim_credits(data: ClaimCreditsRequest, current_user: dict = Depends(get_current_user)):
    config = load_config()
    credits_to_add = data.intervals * config["credits_per_interval"]
    
    users = load_users()
    users[current_user["usuario"]]["credits"] += credits_to_add
    save_users(users)
    
    return {
        "success": True,
        "credits_added": credits_to_add,
        "total_credits": users[current_user["usuario"]]["credits"]
    }

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = load_notifications()
    user_notifications = notifications.get(current_user["usuario"], [])
    return user_notifications

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    notifications = load_notifications()
    user_notifications = notifications.get(current_user["usuario"], [])
    notifications[current_user["usuario"]] = [n for n in user_notifications if n["id"] != notification_id]
    save_notifications(notifications)
    return {"success": True}

@api_router.get("/config")
async def get_config():
    return load_config()

# Admin endpoints
@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = load_users()
    return [{k: v for k, v in user.items() if k != "password"} for user in users.values()]

@api_router.post("/admin/credits/add")
async def add_credits(data: UpdateCreditsRequest, admin: dict = Depends(get_admin_user)):
    users = load_users()
    
    if data.usuario not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    users[data.usuario]["credits"] += data.credits
    save_users(users)
    
    # Add notification
    notifications = load_notifications()
    if data.usuario not in notifications:
        notifications[data.usuario] = []
    
    notifications[data.usuario].append({
        "id": str(uuid.uuid4()),
        "type": "credit_added",
        "amount": data.credits,
        "reason": data.reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    save_notifications(notifications)
    
    return {
        "success": True,
        "new_balance": users[data.usuario]["credits"]
    }

@api_router.post("/admin/credits/remove")
async def remove_credits(data: UpdateCreditsRequest, admin: dict = Depends(get_admin_user)):
    users = load_users()
    
    if data.usuario not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    users[data.usuario]["credits"] = max(0, users[data.usuario]["credits"] - data.credits)
    save_users(users)
    
    # Add notification
    notifications = load_notifications()
    if data.usuario not in notifications:
        notifications[data.usuario] = []
    
    notifications[data.usuario].append({
        "id": str(uuid.uuid4()),
        "type": "credit_removed",
        "amount": data.credits,
        "reason": data.reason,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    save_notifications(notifications)
    
    return {
        "success": True,
        "new_balance": users[data.usuario]["credits"]
    }

@api_router.post("/admin/config")
async def update_config(data: UpdateConfigRequest, admin: dict = Depends(get_admin_user)):
    config = {
        "credits_per_interval": data.credits_per_interval,
        "interval_seconds": data.interval_seconds
    }
    save_config(config)
    return {"success": True, "config": config}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)