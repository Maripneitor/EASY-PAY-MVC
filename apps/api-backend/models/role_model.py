from core.base_repository import BaseRepository
from datetime import datetime
from typing import Optional, List, Dict, Any, Set

DEFAULT_ROLES = [
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

class RoleModel(BaseRepository):
    """
    Modelo OOP de Roles y Permisos.
    Gestiona la persistencia dinámica de roles en la colección 'Roles'.
    """
    db_name = "EasyPay_Auth"
    collection_name = "Roles"

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index("name", unique=True)
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [RoleModel] Índice de name ya existe: {e}")

    async def seed_default_roles(self):
        """Inicializa los 3 roles predeterminados si aún no existen"""
        await self._ensure_indexes()
        for default_role in DEFAULT_ROLES:
            existing = await self.collection.find_one({"name": default_role["name"]})
            if not existing:
                doc = {
                    **default_role,
                    "created_at": datetime.utcnow()
                }
                await self.collection.insert_one(doc)
                print(f"✅ [RoleModel] Rol predeterminado creado: {default_role['name']}")

    async def get_all_roles(self) -> List[Dict[str, Any]]:
        """Devuelve todos los roles configurados en el sistema"""
        cursor = self.collection.find({})
        roles = await cursor.to_list(length=100)
        for r in roles:
            r["id"] = str(r["_id"])
            del r["_id"]
        return roles

    async def find_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        role = await self.collection.find_one({"name": name})
        if role:
            role["id"] = str(role["_id"])
            del role["_id"]
        return role

    async def create_role(self, role_data: Dict[str, Any]) -> str:
        await self._ensure_indexes()
        doc = {
            "name": role_data["name"],
            "description": role_data.get("description", ""),
            "permissions": role_data.get("permissions", []),
            "is_system": False,
            "created_at": datetime.utcnow()
        }
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def update_role(self, role_id: str, update_data: Dict[str, Any]) -> bool:
        if not self.is_valid_id(role_id):
            return False
        clean_update = {k: v for k, v in update_data.items() if v is not None}
        return await self.update_by_id(role_id, clean_update)

    async def get_permissions_for_roles(self, role_names: List[str]) -> Set[str]:
        """Calcula el conjunto unificado de permisos para una lista de roles asignados"""
        if not role_names:
            return set()
        
        # Soporte para alias comunes
        normalized = []
        for r in role_names:
            if r.lower() in ["admin", "administrador"]:
                normalized.append("Administrador")
            elif r.lower() in ["editor"]:
                normalized.append("Editor")
            elif r.lower() in ["user", "usuario", "usuario regular", "regular"]:
                normalized.append("Usuario Regular")
            else:
                normalized.append(r)

        roles_cursor = self.collection.find({"name": {"$in": normalized}})
        roles_list = await roles_cursor.to_list(length=50)
        
        permissions: Set[str] = set()
        for r in roles_list:
            permissions.update(r.get("permissions", []))
            
        return permissions
