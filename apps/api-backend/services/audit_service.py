from models.audit_model import AuditModel
from typing import Optional, Dict, Any, List

class AuditService:
    """
    Servicio OOP de Auditoría e Inmutabilidad.
    Abstrae el registro de eventos y auditoría del sistema para cumplir
    con el principio de inmutabilidad y trazabilidad completa.
    """
    def __init__(self):
        self._model = AuditModel()

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
        """Registra un evento de auditoría de forma inmutable"""
        return await self._model.log_event(
            action=action,
            resource=resource,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata,
            user_email=user_email,
            details=details
        )

    async def log_access(
        self,
        action: str,
        user_email: Optional[str] = None,
        user_id: Optional[str] = None,
        resource: str = "auth",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Alias para compatibilidad con llamadas existentes"""
        return await self.log_event(
            action=action,
            resource=resource,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata if metadata is not None else details,
            user_email=user_email,
            details=details
        )

    async def count_audit_logs(
        self,
        user_email: Optional[str] = None,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None
    ) -> int:
        """Cuenta total de registros para paginación"""
        return await self._model.count_logs(
            user_email=user_email,
            user_id=user_id,
            action=action,
            resource=resource
        )

    async def get_audit_trail(
        self,
        user_email: Optional[str] = None,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Devuelve los registros paginados del log de auditoría"""
        return await self._model.get_logs(
            user_email=user_email,
            user_id=user_id,
            action=action,
            resource=resource,
            limit=limit,
            skip=skip
        )
