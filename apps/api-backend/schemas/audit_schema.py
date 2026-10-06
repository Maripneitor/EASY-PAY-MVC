from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogEntry(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str = Field(..., description="Acción realizada (ej. LOGIN_SUCCESS, ROLE_UPDATED)")
    resource: str = Field(default="system", description="Área o recurso afectado")
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AuditLogFilter(BaseModel):
    user_email: Optional[str] = None
    action: Optional[str] = None
    resource: Optional[str] = None
    limit: int = 50
    skip: int = 0
