from core.base_repository import BaseRepository
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

class UserModel(BaseRepository):
    """
    Modelo OOP de Usuario.
    Hereda de BaseRepository y encapsula el acceso a la colección 'Users' de MongoDB.
    Incorpora mitigación de fuerza bruta con seguimiento de intentos fallidos y bloqueo temporal.
    """
    db_name = "EasyPay_Auth"
    collection_name = "Users"

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index("email", unique=True, sparse=True)
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [UserModel] Índice de email ya existe o advertencia: {e}")

    async def save_user(self, user_dict: Dict[str, Any]) -> str:
        """Inserta un nuevo usuario y retorna su ID como string"""
        await self._ensure_indexes()
        if "roles" not in user_dict or not user_dict["roles"]:
            user_dict["roles"] = ["Usuario Regular"]
        if "failed_login_attempts" not in user_dict:
            user_dict["failed_login_attempts"] = 0
        if "locked_until" not in user_dict:
            user_dict["locked_until"] = None
        result = await self.collection.insert_one(user_dict)
        return str(result.inserted_id)

    async def find_by_identifier(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Busca un usuario por email o nombre (case-insensitive para email)"""
        user = await self.collection.find_one({
            "$or": [
                {"email": {"$regex": f"^{identifier}$", "$options": "i"}},
                {"nombre": identifier}
            ]
        })
        return user

    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.find_by_id(user_id)

    async def search_users(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Búsqueda de autocompletado por nombre o email"""
        cursor = self.collection.find({
            "$or": [
                {"nombre": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}}
            ]
        }, {"password_hash": 0}).limit(limit)
        users = await cursor.to_list(length=limit)
        for u in users:
            u["id"] = str(u["_id"])
            del u["_id"]
        return users

    async def get_all_users(self, limit: int = 200, skip: int = 0) -> List[Dict[str, Any]]:
        """Obtiene la lista completa de usuarios para el panel de administración"""
        cursor = self.collection.find({}, {"password_hash": 0}).sort("fecha_registro", -1).skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)
        for u in users:
            u["id"] = str(u["_id"])
            del u["_id"]
            if "roles" not in u:
                u["roles"] = ["Usuario Regular"]
        return users

    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Actualiza campos del perfil de usuario"""
        return await self.update_by_id(user_id, update_data)

    async def update_roles(self, user_id: str, roles: List[str]) -> bool:
        """Asigna o actualiza los roles de un usuario"""
        return await self.update_by_id(user_id, {"roles": roles})

    # --- Mitigación de Fuerza Bruta / Bloqueo ---
    async def increment_failed_attempts(self, user_id: str) -> int:
        """Incrementa el contador de intentos fallidos de login"""
        if not self.is_valid_id(user_id):
            return 0
        result = await self.collection.find_one_and_update(
            {"_id": self.to_object_id(user_id)},
            {"$inc": {"failed_login_attempts": 1}},
            return_document=True
        )
        return result.get("failed_login_attempts", 1) if result else 1

    async def lock_account(self, user_id: str, lockout_minutes: int = 15) -> datetime:
        """Bloquea temporalmente una cuenta por exceso de intentos fallidos"""
        locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_minutes)
        await self.update_by_id(user_id, {
            "locked_until": locked_until
        })
        return locked_until

    async def reset_failed_attempts(self, user_id: str) -> None:
        """Restablece el contador de intentos fallidos y quita el bloqueo"""
        await self.update_by_id(user_id, {
            "failed_login_attempts": 0,
            "locked_until": None
        })

    # --- 2FA y Verificación OTP ---
    async def save_otp_code(self, user_id: str, code: str, expires_at) -> None:
        await self.update_by_id(user_id, {
            "two_factor.otp_code": code,
            "two_factor.otp_expires": expires_at
        })

    async def get_otp_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = await self.find_by_id(user_id)
        if user and "two_factor" in user:
            return user["two_factor"]
        return None

    async def enable_2fa(self, user_id: str) -> bool:
        return await self.update_by_id(user_id, {
            "is_verified": True,
            "two_factor.otp_code": None,
            "two_factor.otp_expires": None
        })

    # --- Tarjetas y Métodos de Pago ---
    async def get_cards(self, user_id: str) -> List[Dict[str, Any]]:
        user = await self.find_by_id(user_id)
        if user and "cards" in user:
            return user["cards"]
        return []

    async def add_card(self, user_id: str, card_data: Dict[str, Any]) -> bool:
        if not self.is_valid_id(user_id):
            return False
        cards = await self.get_cards(user_id)
        if len(cards) == 0:
            card_data["is_default"] = True
        result = await self.collection.update_one(
            {"_id": self.to_object_id(user_id)},
            {"$push": {"cards": card_data}}
        )
        return result.modified_count > 0

    async def remove_card(self, user_id: str, card_id: str) -> bool:
        if not self.is_valid_id(user_id):
            return False
        result = await self.collection.update_one(
            {"_id": self.to_object_id(user_id)},
            {"$pull": {"cards": {"id": card_id}}}
        )
        return result.modified_count > 0

    async def set_default_card(self, user_id: str, card_id: str) -> bool:
        if not self.is_valid_id(user_id):
            return False
        await self.collection.update_one(
            {"_id": self.to_object_id(user_id)},
            {"$set": {"cards.$[].is_default": False}}
        )
        result = await self.collection.update_one(
            {"_id": self.to_object_id(user_id), "cards.id": card_id},
            {"$set": {"cards.$.is_default": True}}
        )
        return result.modified_count > 0

    async def delete_user_by_email(self, email: str) -> bool:
        result = await self.collection.delete_one({"email": email})
        return result.deleted_count > 0
