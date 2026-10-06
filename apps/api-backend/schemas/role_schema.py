from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Definición de recursos y acciones disponibles en el sistema
AVAILABLE_RESOURCES = [
    {"id": "groups", "name": "Grupos de Gasto"},
    {"id": "expenses", "name": "Gastos y Pagos"},
    {"id": "wallets", "name": "Billeteras / Tarjetas"},
    {"id": "users", "name": "Gestión de Usuarios"},
    {"id": "roles", "name": "Roles y Permisos"},
    {"id": "audit", "name": "Auditoría del Sistema"}
]

AVAILABLE_ACTIONS = [
    {"id": "read", "name": "Lectura (Visualizar)"},
    {"id": "write", "name": "Escritura (Crear / Modificar)"},
    {"id": "delete", "name": "Eliminación (Borrar)"}
]

class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Nombre del rol")
    description: Optional[str] = Field(None, max_length=200, description="Descripción del rol")
    permissions: List[str] = Field(default_factory=list, description="Lista de permisos ej: ['groups:read', 'groups:write']")

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class RoleResponse(RoleBase):
    id: str
    is_system: bool = False
    created_at: Optional[datetime] = None

class UserRoleUpdate(BaseModel):
    roles: List[str] = Field(..., min_items=1, description="Lista de nombres de rol a asignar al usuario")
