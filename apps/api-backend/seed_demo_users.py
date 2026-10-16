import os
import asyncio
from datetime import datetime, timezone
import bcrypt
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"

def hash_pw(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

DEMO_USERS = [
    {
        "nombre": "Administrador EasyPay",
        "email": "admin@easypay.com",
        "password": "Admin1234!",
        "roles": ["Administrador"],
        "role": "Administrador"
    },
    {
        "nombre": "Editor EasyPay",
        "email": "editor@easypay.com",
        "password": "Editor1234!",
        "roles": ["Editor"],
        "role": "Editor"
    },
    {
        "nombre": "Usuario Demo",
        "email": "usuario@easypay.com",
        "password": "User1234!",
        "roles": ["Usuario Regular"],
        "role": "Usuario Regular"
    },
    {
        "nombre": "Mario Moguel",
        "email": "mariomoguel05@gmail.com",
        "password": "Admin1234!",
        "roles": ["Administrador"],
        "role": "Administrador"
    }
]

async def seed_users():
    client_kwargs = {
        "serverSelectionTimeoutMS": 5000,
        "connectTimeoutMS": 5000,
        "retryWrites": True
    }
    if "mongodb+srv" in MONGO_URL or "ssl=true" in MONGO_URL.lower():
        client_kwargs["tlsCAFile"] = certifi.where()

    client = AsyncIOMotorClient(MONGO_URL, **client_kwargs)
    db = client["EasyPay_Auth"]
    users_col = db["Users"]

    print(f"[Database] Conectando a {db.name}...")

    for user_info in DEMO_USERS:
        email = user_info["email"].lower()
        password_hash = hash_pw(user_info["password"])

        user_doc = {
            "nombre": user_info["nombre"],
            "email": email,
            "password_hash": password_hash,
            "roles": user_info["roles"],
            "role": user_info["role"],
            "is_verified": True,
            "two_factor": {
                "enabled": False,
                "otp_code": None,
                "otp_expires": None
            },
            "bank_accounts": [],
            "failed_login_attempts": 0,
            "locked_until": None,
            "fecha_registro": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        # Upsert user by email
        result = await users_col.update_one(
            {"email": email},
            {"$set": user_doc},
            upsert=True
        )

        if result.upserted_id:
            print(f"[OK] Usuario CREADO: {email} | Rol: {user_info['roles']} | Password: {user_info['password']}")
        else:
            print(f"[OK] Usuario ACTUALIZADO: {email} | Rol: {user_info['roles']} | Password: {user_info['password']}")

    client.close()
    print("[SUCCESS] Proceso de perfiles completado exitosamente.")

if __name__ == "__main__":
    asyncio.run(seed_users())
