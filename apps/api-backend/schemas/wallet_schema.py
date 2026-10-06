from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class BankCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    alias: str = ""
    beneficiario: str
    clabe: str = Field(..., min_length=18, max_length=18)
    banco: str
    is_default: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BankCardCreate(BaseModel):
    alias: Optional[str] = ""
    beneficiario: str
    clabe: str = Field(..., min_length=18, max_length=18)
    banco: str
    is_default: bool = False
