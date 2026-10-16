import os
import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"

ROLE_MAPPING = {
    "admin": "Administrador",
    "administrator": "Administrador",
    "administrador": "Administrador",
    "moderator": "Editor",
    "editor": "Editor",
    "member": "Usuario Regular",
    "user": "Usuario Regular",
    "usuario regular": "Usuario Regular",
    "usuario_regular": "Usuario Regular"
}

VALID_ROLES = ["Administrador", "Editor", "Usuario Regular"]

DEFAULT_ROLES_DEF = [
    {
        "name": "Administrador",
        "description": "Tiene acceso completo a todas las funcionalidades del sistema.",
        "permissions": [
            "groups:read", "groups:write", "groups:delete",
            "expenses:read", "expenses:write", "expenses:delete",
            "wallets:read", "wallets:write", "wallets:delete",
            "users:read", "users:write", "users:delete",
            "roles:read", "roles:write", "roles:delete",
            "audit:read"
        ],
        "is_system": True
    },
    {
        "name": "Editor",
        "description": "Puede crear, editar y eliminar contenidos, pero no puede gestionar usuarios ni roles.",
        "permissions": [
            "groups:read", "groups:write", "groups:delete",
            "expenses:read", "expenses:write", "expenses:delete",
            "wallets:read", "wallets:write", "wallets:delete",
            "audit:read"
        ],
        "is_system": True
    },
    {
        "name": "Usuario Regular",
        "description": "Solo puede ver y consumir contenido.",
        "permissions": [
            "groups:read",
            "expenses:read",
            "wallets:read"
        ],
        "is_system": True
    }
]

async def unify_roles():
    client_kwargs = {
        "serverSelectionTimeoutMS": 5000,
        "connectTimeoutMS": 5000,
        "retryWrites": True
    }
    if "mongodb+srv" in MONGO_URL or "ssl=true" in MONGO_URL.lower():
        client_kwargs["tlsCAFile"] = certifi.where()

    client = AsyncIOMotorClient(MONGO_URL, **client_kwargs)
    db = client["EasyPay_Auth"]
    roles_col = db["Roles"]
    users_col = db["Users"]

    print("[1] Roles actuales en BD:")
    async for r in roles_col.find():
        print(f"  - {r.get('name')}")

    # 1. Limpiar colección Roles: Dejar UNICAMENTE Administrador, Editor, Usuario Regular
    # Eliminar roles en inglés u obsoletos
    del_res = await roles_col.delete_many({"name": {"$nin": VALID_ROLES}})
    print(f"[OK] Roles obsoletos eliminados de la colección Roles: {del_res.deleted_count}")

    # Asegurar que existan los 3 roles con su definición completa
    for r_def in DEFAULT_ROLES_DEF:
        await roles_col.update_one(
            {"name": r_def["name"]},
            {"$set": r_def},
            upsert=True
        )
    print("[OK] Colección Roles normalizada a los 3 roles en español.")

    # 2. Normalizar roles de todos los usuarios en la colección Users
    print("\n[2] Normalizando roles de usuarios...")
    updated_count = 0
    async for u in users_col.find():
        curr_roles = u.get("roles", [])
        if isinstance(curr_roles, str):
            curr_roles = [curr_roles]
        
        # Mapear cada rol
        new_roles = []
        for r in curr_roles:
            r_clean = str(r).strip().lower()
            mapped = ROLE_MAPPING.get(r_clean, "Usuario Regular")
            if mapped not in new_roles:
                new_roles.append(mapped)
        
        if not new_roles:
            new_roles = ["Usuario Regular"]

        # Si el usuario tenía "role" singular
        new_role_singular = new_roles[0]

        await users_col.update_one(
            {"_id": u["_id"]},
            {"$set": {"roles": new_roles, "role": new_role_singular}}
        )
        updated_count += 1

    print(f"[OK] {updated_count} usuarios actualizados con roles unificados.")

    print("\n[3] Roles finales en BD:")
    async for r in roles_col.find():
        print(f"  - {r.get('name')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(unify_roles())
