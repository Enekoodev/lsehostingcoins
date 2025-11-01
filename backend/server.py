from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'lse-hosting-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    nombre: str
    apellidos: str
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    apellidos: str
    email: EmailStr
    username: str
    credits: int = 0
    role: str = "user"  # user or admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_credit_earn: Optional[datetime] = None

class CreditHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: int
    reason: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "global_settings"
    credit_amount: int = 2
    credit_interval: int = 300  # seconds
    anti_adblock_enabled: bool = True

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: int  # en créditos
    stock: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    product_name: str
    credits_spent: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminCreditAction(BaseModel):
    user_id: str
    amount: int
    reason: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: int
    stock: int

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requieren permisos de administrador")
    return current_user

# Initialize database
@app.on_event("startup")
async def startup_db():
    # Create default settings
    settings_exist = await db.settings.find_one({"id": "global_settings"})
    if not settings_exist:
        settings = Settings()
        doc = settings.model_dump()
        await db.settings.insert_one(doc)
    
    # Create super admin user
    admin_exist = await db.users.find_one({"username": "admin"})
    if not admin_exist:
        admin = User(
            nombre="Admin",
            apellidos="LSE Hosting",
            email="admin@lsehosting.com",
            username="admin",
            credits=999999,
            role="admin"
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['password'] = hash_password("admin123")
        await db.users.insert_one(doc)
        logger.info("Super admin creado - username: admin, password: admin123")

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if username or email already exists
    existing_user = await db.users.find_one(
        {"$or": [{"username": user_data.username}, {"email": user_data.email}]}
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Usuario o email ya existe")
    
    # Create new user
    user = User(
        nombre=user_data.nombre,
        apellidos=user_data.apellidos,
        email=user_data.email,
        username=user_data.username
    )
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(doc)
    
    # Create token
    token = create_access_token({"user_id": user.id, "username": user.username})
    
    return {
        "message": "Usuario registrado exitosamente",
        "token": token,
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "apellidos": user.apellidos,
            "email": user.email,
            "username": user.username,
            "credits": user.credits,
            "role": user.role
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_access_token({"user_id": user['id'], "username": user['username']})
    
    return {
        "message": "Login exitoso",
        "token": token,
        "user": {
            "id": user['id'],
            "nombre": user['nombre'],
            "apellidos": user['apellidos'],
            "email": user['email'],
            "username": user['username'],
            "credits": user['credits'],
            "role": user['role']
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user['id'],
        "nombre": current_user['nombre'],
        "apellidos": current_user['apellidos'],
        "email": current_user['email'],
        "username": current_user['username'],
        "credits": current_user['credits'],
        "role": current_user['role']
    }

# User Routes
@api_router.get("/user/credits")
async def get_user_credits(current_user: dict = Depends(get_current_user)):
    return {"credits": current_user['credits']}

@api_router.post("/user/earn-credits")
async def earn_credits(current_user: dict = Depends(get_current_user)):
    # Get settings
    settings = await db.settings.find_one({"id": "global_settings"}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=500, detail="Configuración no encontrada")
    
    credit_amount = settings['credit_amount']
    credit_interval = settings['credit_interval']
    
    # Check if user can earn credits
    last_earn = current_user.get('last_credit_earn')
    if last_earn:
        if isinstance(last_earn, str):
            last_earn = datetime.fromisoformat(last_earn)
        time_diff = (datetime.now(timezone.utc) - last_earn).total_seconds()
        if time_diff < credit_interval:
            remaining = int(credit_interval - time_diff)
            return {
                "success": False,
                "message": f"Debes esperar {remaining} segundos más",
                "remaining_seconds": remaining
            }
    
    # Update user credits
    new_credits = current_user['credits'] + credit_amount
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {
            "credits": new_credits,
            "last_credit_earn": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Add to credit history
    history = CreditHistory(
        user_id=current_user['id'],
        amount=credit_amount,
        reason="Ganado automáticamente"
    )
    doc = history.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.credit_history.insert_one(doc)
    
    return {
        "success": True,
        "message": f"¡Ganaste {credit_amount} créditos!",
        "credits": new_credits,
        "next_earn_in": credit_interval
    }

@api_router.get("/user/credit-history")
async def get_credit_history(current_user: dict = Depends(get_current_user)):
    history = await db.credit_history.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    for item in history:
        if isinstance(item['timestamp'], str):
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
    
    return history

# Shop Routes
@api_router.get("/shop/products")
async def get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/shop/purchase/{product_id}")
async def purchase_product(product_id: str, current_user: dict = Depends(get_current_user)):
    # Get product
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if product['stock'] <= 0:
        raise HTTPException(status_code=400, detail="Producto agotado")
    
    if current_user['credits'] < product['price']:
        raise HTTPException(status_code=400, detail="Créditos insuficientes")
    
    # Process purchase
    new_credits = current_user['credits'] - product['price']
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"credits": new_credits}}
    )
    
    # Update product stock
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"stock": product['stock'] - 1}}
    )
    
    # Create order
    order = Order(
        user_id=current_user['id'],
        product_id=product_id,
        product_name=product['name'],
        credits_spent=product['price']
    )
    doc = order.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.orders.insert_one(doc)
    
    # Add to credit history
    history = CreditHistory(
        user_id=current_user['id'],
        amount=-product['price'],
        reason=f"Compra: {product['name']}"
    )
    hdoc = history.model_dump()
    hdoc['timestamp'] = hdoc['timestamp'].isoformat()
    await db.credit_history.insert_one(hdoc)
    
    return {
        "success": True,
        "message": f"¡Compra exitosa de {product['name']}!",
        "remaining_credits": new_credits,
        "order_id": order.id
    }

# Admin Routes
@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.post("/admin/add-credits")
async def admin_add_credits(action: AdminCreditAction, admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_credits = user['credits'] + action.amount
    await db.users.update_one(
        {"id": action.user_id},
        {"$set": {"credits": new_credits}}
    )
    
    # Add to credit history
    history = CreditHistory(
        user_id=action.user_id,
        amount=action.amount,
        reason=f"Añadido por admin: {action.reason}"
    )
    doc = history.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.credit_history.insert_one(doc)
    
    return {"success": True, "message": f"Se añadieron {action.amount} créditos", "new_credits": new_credits}

@api_router.post("/admin/remove-credits")
async def admin_remove_credits(action: AdminCreditAction, admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": action.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_credits = max(0, user['credits'] - action.amount)
    await db.users.update_one(
        {"id": action.user_id},
        {"$set": {"credits": new_credits}}
    )
    
    # Add to credit history
    history = CreditHistory(
        user_id=action.user_id,
        amount=-action.amount,
        reason=f"Removido por admin: {action.reason}"
    )
    doc = history.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.credit_history.insert_one(doc)
    
    return {"success": True, "message": f"Se removieron {action.amount} créditos", "new_credits": new_credits}

@api_router.get("/admin/settings")
async def get_settings(admin: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({"id": "global_settings"}, {"_id": 0})
    return settings

@api_router.put("/admin/settings")
async def update_settings(settings_update: dict, admin: dict = Depends(get_admin_user)):
    await db.settings.update_one(
        {"id": "global_settings"},
        {"$set": settings_update}
    )
    return {"success": True, "message": "Configuración actualizada"}

@api_router.get("/admin/products")
async def get_admin_products(admin: dict = Depends(get_admin_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/admin/products")
async def create_product(product_data: ProductCreate, admin: dict = Depends(get_admin_user)):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return {"success": True, "message": "Producto creado", "product": product}

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product_data: dict, admin: dict = Depends(get_admin_user)):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto actualizado"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto eliminado"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
