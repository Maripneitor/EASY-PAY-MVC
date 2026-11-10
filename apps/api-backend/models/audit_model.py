from core.base_repository import BaseRepository
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

class AuditModel(BaseRepository):
    """
    Modelo OOP de Auditoría e Historial de Accesos Inmutable.
    Almacena en la colección 'audit_logs' todos los eventos de autenticación,
    cambios de roles, accesos y operaciones sensibles del sistema.
    Aplica el principio de inmutabilidad estricta bloqueando cualquier
    intento de actualización o eliminación en la base de datos.

    Esquema audit_logs:
    - id: str
    - user_id: Optional[str]
    - action: str
    - resource: str
    - ip_address: str
    - user_agent: str
    - metadata: Dict[str, Any]
    - created_at: datetime
    """
    db_name = "EasyPay_Auth"
    collection_name = "audit_logs"

    async def _ensure_indexes(self):
        if not self._indexes_created:
            try:
                await self.collection.create_index([("created_at", -1)])
                await self.collection.create_index([("timestamp", -1)])
                await self.collection.create_index([("user_id", 1)])
                await self.collection.create_index([("user_email", 1)])
                await self.collection.create_index([("action", 1)])
                await self.collection.create_index([("resource", 1)])
                self._indexes_created = True
            except Exception as e:
                pass

    async def log_event(
        self,
        action: str,
        resource: str = "system",
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        user_email: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Crea una nueva entrada inmutable en la colección audit_logs.
        Cumple estrictamente con el esquema:
        (id, user_id, action, resource, ip_address, user_agent, metadata, created_at).
        """
        await self._ensure_indexes()
        now_dt = datetime.now(timezone.utc)
        meta = metadata if metadata is not None else (details or {})

        entry = {
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "ip_address": ip_address or "127.0.0.1",
            "user_agent": user_agent or "Unknown",
            "metadata": meta,
            "created_at": now_dt,
            # Aliases para compatibilidad con módulos existentes:
            "user_email": user_email,
            "details": meta,
            "timestamp": now_dt
        }
        result = await self.collection.insert_one(entry)
        return str(result.inserted_id)

    # ── Blindaje Estricto de Inmutabilidad ─────────────────────────────────────
    # Los registros de auditoría no pueden ser alterados ni suprimidos por ninguna vía.
    async def delete_by_id(self, id_str: str) -> bool:
        """Los registros de auditoría son estrictamente inmutables: no se permite eliminación individual"""
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden eliminarse.")

    async def delete_many(self, filter_query: Dict[str, Any]) -> int:
        """Los registros de auditoría son estrictamente inmutables: no se permite eliminación masiva"""
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden eliminarse.")

    async def delete_one(self, filter_query: Dict[str, Any]) -> bool:
        """Los registros de auditoría son estrictamente inmutables: no se permite eliminación"""
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden eliminarse.")

    async def update_by_id(self, id_str: str, update_data: Dict[str, Any]) -> bool:
        """Los registros de auditoría son estrictamente inmutables: no se permite modificación individual"""
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden modificarse.")

    async def update_many(self, filter_query: Dict[str, Any], update_data: Dict[str, Any]) -> int:
        """Los registros de auditoría son estrictamente inmutables: no se permite modificación masiva"""
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden modificarse.")

    async def update_one(self, filter_query: Dict[str, Any], update_data: Dict[str, Any]) -> bool:
        """Los registros de auditoría son estrictamente inmutables: no se permite modificación"""
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden modificarse.")

    async def replace_one(self, filter_query: Dict[str, Any], replacement: Dict[str, Any]) -> bool:
        """Los registros de auditoría son estrictamente inmutables: no se permite reemplazo"""
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden modificarse.")

    async def find_one_and_update(self, *args, **kwargs):
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden modificarse.")

    async def find_one_and_delete(self, *args, **kwargs):
        raise PermissionError("Operación denegada: Los registros de audit_logs son estrictamente inmutables y no pueden eliminarse.")

    # ── Consultas y Paginación ────────────────────────────────────────────────
    def _build_filter(
        self,
        user_email: Optional[str] = None,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None
    ) -> Dict[str, Any]:
        filter_query: Dict[str, Any] = {}
        if user_email:
            filter_query["user_email"] = {"$regex": user_email, "$options": "i"}
        if user_id:
            filter_query["user_id"] = user_id
        if action:
            filter_query["action"] = action
        if resource:
            filter_query["resource"] = resource
        return filter_query

    async def count_logs(
        self,
        user_email: Optional[str] = None,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None
    ) -> int:
        """Cuenta el total de registros de auditoría que coinciden con los filtros para paginación"""
        await self._ensure_indexes()
        filter_query = self._build_filter(user_email=user_email, user_id=user_id, action=action, resource=resource)
        return await self.collection.count_documents(filter_query)

    async def get_logs(
        self,
        user_email: Optional[str] = None,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Consulta los registros de auditoría de forma paginada y ordenados del más reciente al más antiguo"""
        await self._ensure_indexes()
        filter_query = self._build_filter(user_email=user_email, user_id=user_id, action=action, resource=resource)

        cursor = self.collection.find(filter_query).sort([("created_at", -1), ("timestamp", -1)]).skip(skip).limit(limit)
        logs = await cursor.to_list(length=limit)
        for log in logs:
            log["id"] = str(log["_id"])
            del log["_id"]
            # Garantizar que todos los campos requeridos estén presentes
            if "metadata" not in log:
                log["metadata"] = log.get("details", {})
            if "details" not in log:
                log["details"] = log.get("metadata", {})
            if "created_at" not in log:
                log["created_at"] = log.get("timestamp", datetime.now(timezone.utc))
            if "timestamp" not in log:
                log["timestamp"] = log.get("created_at", datetime.now(timezone.utc))
        return logs
