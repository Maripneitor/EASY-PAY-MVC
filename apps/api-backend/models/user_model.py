import os
import re
from core.base_repository import BaseRepository
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from services.crypto_service import crypto_service

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
        """Inserta un nuevo usuario con encriptación de campos sensibles y retorna su ID como string"""
        await self._ensure_indexes()
        if "roles" not in user_dict or not user_dict["roles"]:
            user_dict["roles"] = ["Usuario Regular"]
        if "failed_login_attempts" not in user_dict:
            user_dict["failed_login_attempts"] = 0
        if "locked_until" not in user_dict:
            user_dict["locked_until"] = None
        
        # Encriptación de datos sensibles (RFC, direcciones)
        encrypted_dict = crypto_service.encrypt_user_sensitive_data(user_dict)
        result = await self.collection.insert_one(encrypted_dict)
        return str(result.inserted_id)

    async def find_by_identifier(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Busca un usuario por email o nombre con mitigación contra NoSQL regex injection"""
        safe_identifier = re.escape(identifier.strip())
        user = await self.collection.find_one({
            "$or": [
                {"email": {"$regex": f"^{safe_identifier}$", "$options": "i"}},
                {"nombre": identifier.strip()}
            ]
        })
        return crypto_service.decrypt_user_sensitive_data(user)

    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        safe_email = re.escape(email.strip())
        user = await self.collection.find_one({"email": {"$regex": f"^{safe_email}$", "$options": "i"}})
        return crypto_service.decrypt_user_sensitive_data(user)

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = await self.find_by_id(user_id)
        return crypto_service.decrypt_user_sensitive_data(user)

    async def search_users(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Búsqueda de autocompletado por nombre o email sanitizada contra inyecciones regex"""
        safe_query = re.escape(query.strip())
        cursor = self.collection.find({
            "$or": [
                {"nombre": {"$regex": safe_query, "$options": "i"}},
                {"email": {"$regex": safe_query, "$options": "i"}}
            ]
        }, {"password_hash": 0}).limit(limit)
        users = await cursor.to_list(length=limit)
        for u in users:
            u["id"] = str(u["_id"])
            del u["_id"]
            u = crypto_service.decrypt_user_sensitive_data(u)
        return users

    async def get_all_users(self, limit: int = 200, skip: int = 0) -> List[Dict[str, Any]]:
        """Obtiene la lista completa de usuarios para el panel de administración desencriptando datos legibles"""
        cursor = self.collection.find({}, {"password_hash": 0}).sort("fecha_registro", -1).skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)
        decrypted_users = []
        for u in users:
            u["id"] = str(u["_id"])
            del u["_id"]
            if "roles" not in u:
                u["roles"] = ["Usuario Regular"]
            decrypted_users.append(crypto_service.decrypt_user_sensitive_data(u))
        return decrypted_users

    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Actualiza campos del perfil de usuario asegurando que el superadministrador no pierda Administrador y encriptando campos sensibles"""
        if not self.is_valid_id(user_id):
            return False
        superadmin_email = (os.getenv("SUPERADMIN_EMAIL") or "mariomoguel05@gmail.com").strip().lower()
        if "roles" in update_data:
            user = await self.get_user_by_id(user_id)
            if user and (user.get("email") or "").strip().lower() == superadmin_email:
                if "Administrador" not in update_data["roles"]:
                    update_data["roles"] = list(update_data["roles"]) + ["Administrador"]
        
        # Encriptar campos sensibles al actualizar
        encrypted_update = crypto_service.encrypt_user_sensitive_data(update_data)
        return await self.update_by_id(user_id, encrypted_update)

    async def update_roles(self, user_id: str, roles: List[str]) -> bool:
        """Asigna o actualiza los roles de un usuario e incrementa la versión de roles con blindaje inmutable para superadmin"""
        if not self.is_valid_id(user_id):
            return False

        # Blindaje inmutable a nivel de Base de Datos para el Superadministrador
        superadmin_email = (os.getenv("SUPERADMIN_EMAIL") or "mariomoguel05@gmail.com").strip().lower()
        user = await self.get_user_by_id(user_id)
        if user and (user.get("email") or "").strip().lower() == superadmin_email:
            if "Administrador" not in roles:
                roles = list(roles) + ["Administrador"]

        result = await self.collection.update_one(
            {"_id": self.to_object_id(user_id)},
            {
                "$set": {
                    "roles": roles,
                    "roles_updated_at": datetime.now(timezone.utc)
                },
                "$inc": {"role_version": 1}
            }
        )
        return result.modified_count > 0 or result.matched_count > 0

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
