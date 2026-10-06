from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# --- Modelos de Grupo ---
class Group(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    admin_id: str
    integrantes: List[str] = []
    codigo_invitacion: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"  # active, settling, liquidated
    selected_bank_accounts: List[dict] = []

class GroupCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    admin_id: str
    items: Optional[List[dict]] = None

class GroupJoin(BaseModel):
    codigo: str
    user_id: str

class MemberOut(BaseModel):
    id: str
    nombre: str

class GroupDetailOut(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str] = None
    admin_id: str
    codigo_invitacion: str
    integrantes: List[MemberOut]
    fecha_creacion: datetime
    status: str
    selected_bank_accounts: List[dict] = []

# --- Modelos de Item / Gasto ---
class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    nombre: str
    precio: float
    cantidad: int = 1
    comprador_id: str
    participantes_ids: List[str]
    categoria: str
    impuesto_porcentaje: Optional[float] = 0.0
    propina_porcentaje: Optional[float] = 0.0
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)

class ItemCreate(BaseModel):
    group_id: str
    nombre: str
    precio: float
    cantidad: int = 1
    comprador_id: str
    participantes_ids: List[str]
    categoria: str
    impuesto_porcentaje: Optional[float] = 0.0
    propina_porcentaje: Optional[float] = 0.0

class ItemUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    cantidad: Optional[int] = None
    comprador_id: Optional[str] = None
    participantes_ids: Optional[List[str]] = None
    categoria: Optional[str] = None
    impuesto_porcentaje: Optional[float] = None
    propina_porcentaje: Optional[float] = None

# --- Modelos de Settlement / Finiquito ---
class Settlement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    payer_id: str
    receiver_id: str
    amount: float
    status: str = "pending"  # pending, approved, rejected
    proof_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SettlementCreate(BaseModel):
    group_id: str
    payer_id: str
    receiver_id: str
    amount: float
    proof_url: Optional[str] = None
