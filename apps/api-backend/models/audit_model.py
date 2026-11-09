from core.base_repository import BaseRepository
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

class AuditModel(BaseRepository):
    """
    Modelo OOP de Auditoría e Historial de Accesos Inmutable.
    Registra en la colección 'AuditLogs' todos los eventos de autenticación,
    cambios de roles, accesos y operaciones críticas.
    Garantiza inmutabilidad estricta bloqueando cualquier intento de actualización o eliminación.
    """
    db_name = "EasyPay_Auth"
    collection_name = "AuditLogs"

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index([("timestamp", -1)])
                await self.collection.create_index([("user_email", 1)])
                await self.collection.create_index([("action", 1)])
                await self.collection.create_index([("resource", 1)])
                self._indexes_created = True
            except Exception as e:
                print(f"⚠️ [AuditModel] Índice ya existe: {e}")

    async def log_event(
        self,
        action: str,
        resource: str = "system",
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Crea una nueva entrada inmutable en el log de auditoría del sistema"""
        await self._ensure_indexes()
        entry = {
            "action": action,
            "resource": resource,
            "user_id": user_id,
            "user_email": user_email,
            "details": details or {},
            "ip_address": ip_address or "127.0.0.1",
            "user_agent": user_agent or "Unknown",
            "timestamp": datetime.now(timezone.utc)
        }
        result = await self.collection.insert_one(entry)
        return str(result.inserted_id)

    # ── Blindaje de Inmutabilidad ──────────────────────────────────────────────
    async def delete_by_id(self, id_str: str) -> bool:
        """Los registros de auditoría son inmutables: no se permite eliminación individual"""
        raise PermissionError("Operación denegada: Los registros de auditoría son estrictamente inmutables y no pueden eliminarse.")

    async def delete_many(self, filter_query: Dict[str, Any]) -> int:
        """Los registros de auditoría son inmutables: no se permite eliminación masiva"""
        raise PermissionError("Operación denegada: Los registros de auditoría son estrictamente inmutables y no pueden eliminarse.")

    async def update_by_id(self, id_str: str, update_data: Dict[str, Any]) -> bool:
        """Los registros de auditoría son inmutables: no se permite modificación"""
        raise PermissionError("Operación denegada: Los registros de auditoría son estrictamente inmutables y no pueden modificarse.")

    async def update_many(self, filter_query: Dict[str, Any], update_data: Dict[str, Any]) -> int:
        """Los registros de auditoría son inmutables: no se permite modificación masiva"""
        raise PermissionError("Operación denegada: Los registros de auditoría son estrictamente inmutables y no pueden modificarse.")

    async def get_logs(
        self,
        user_email: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Consulta los registros de auditoría con filtros opcionales ordenados del más reciente al más antiguo"""
        filter_query = {}
        if user_email:
            filter_query["user_email"] = {"$regex": user_email, "$options": "i"}
        if action:
            filter_query["action"] = action
        if resource:
            filter_query["resource"] = resource

        cursor = self.collection.find(filter_query).sort("timestamp", -1).skip(skip).limit(limit)
        logs = await cursor.to_list(length=limit)
        for log in logs:
            log["id"] = str(log["_id"])
            del log["_id"]
        return logs
