from core.base_repository import BaseRepository
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

class SessionModel(BaseRepository):
    """
    Modelo OOP de Sesiones Activas en MongoDB.
    Colección 'ActiveSessions' en la base de datos EasyPay_Auth.
    Permite el seguimiento de dispositivos, rotación de refresh tokens,
    detección de geolocalización aproximada e invalidación/revocación de sesiones.
    """
    db_name = "EasyPay_Auth"
    collection_name = "ActiveSessions"

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index([("user_id", 1)])
                await self.collection.create_index([("token_jti", 1)], unique=True, sparse=True)
                await self.collection.create_index([("last_active", -1)])
                await self.collection.create_index([("expires_at", 1)], expireAfterSeconds=0)  # TTL Index automático
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [SessionModel] Índice advertencia: {e}")

    async def create_session(
        self,
        user_id: str,
        token_jti: str,
        ip_address: str,
        user_agent: str,
        device_info: Dict[str, Any],
        expires_at: datetime
    ) -> str:
        """Registra una nueva sesión activa en MongoDB"""
        await self._ensure_indexes()
        session_doc = {
            "user_id": str(user_id),
            "token_jti": token_jti,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "device": device_info.get("device", "Navegador Web"),
            "device_type": device_info.get("device_type", "desktop"),
            "os": device_info.get("os", "Desconocido"),
            "browser": device_info.get("browser", "Desconocido"),
            "location": device_info.get("location", "México"),
            "is_revoked": False,
            "created_at": datetime.now(timezone.utc),
            "last_active": datetime.now(timezone.utc),
            "expires_at": expires_at
        }
        res = await self.collection.insert_one(session_doc)
        return str(res.inserted_id)

    async def get_active_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtiene las sesiones activas no revocadas de un usuario"""
        await self._ensure_indexes()
        cursor = self.collection.find({
            "user_id": str(user_id),
            "is_revoked": False
        }).sort("last_active", -1)
        
        sessions = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            sessions.append(doc)
        return sessions

    async def get_session_by_jti(self, token_jti: str) -> Optional[Dict[str, Any]]:
        """Busca una sesión por el identificador del token (jti)"""
        await self._ensure_indexes()
        return await self.collection.find_one({"token_jti": token_jti, "is_revoked": False})

    async def update_activity(self, token_jti: str, ip_address: Optional[str] = None):
        """Actualiza la fecha de última actividad de una sesión"""
        update_data: Dict[str, Any] = {"last_active": datetime.now(timezone.utc)}
        if ip_address:
            update_data["ip_address"] = ip_address
        await self.collection.update_one({"token_jti": token_jti}, {"$set": update_data})

    async def revoke_session(self, session_id: str, user_id: str) -> bool:
        """Revoca e invalida una sesión específica del usuario"""
        try:
            query: Dict[str, Any] = {"user_id": str(user_id)}
            if ObjectId.is_valid(session_id):
                query["_id"] = ObjectId(session_id)
            else:
                query["token_jti"] = session_id

            res = await self.collection.update_one(query, {"$set": {"is_revoked": True}})
            return res.modified_count > 0 or res.matched_count > 0
        except Exception:
            return False

    async def revoke_all_except(self, user_id: str, current_jti: Optional[str] = None) -> int:
        """Revoca todas las demás sesiones remotas excepto la actual"""
        query: Dict[str, Any] = {"user_id": str(user_id), "is_revoked": False}
        if current_jti:
            query["token_jti"] = {"$ne": current_jti}
        
        res = await self.collection.update_many(query, {"$set": {"is_revoked": True}})
        return res.modified_count

