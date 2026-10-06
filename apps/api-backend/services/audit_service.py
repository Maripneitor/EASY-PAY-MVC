from models.audit_model import AuditModel
from typing import Optional, Dict, Any, List

class AuditService:
    """
    Servicio OOP de Auditoría.
    Abstrae el registro de eventos y auditoría del sistema.
    """
    def __init__(self):
        self._model = AuditModel()

    async def log_access(
        self,
        action: str,
        user_email: Optional[str] = None,
        user_id: Optional[str] = None,
        resource: str = "auth",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Registra un evento de acceso o auditoría"""
        return await self._model.log_event(
            action=action,
            resource=resource,
            user_id=user_id,
            user_email=user_email,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )

    async def get_audit_trail(
        self,
        user_email: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        return await self._model.get_logs(
            user_email=user_email,
            action=action,
            resource=resource,
            limit=limit,
            skip=skip
        )
