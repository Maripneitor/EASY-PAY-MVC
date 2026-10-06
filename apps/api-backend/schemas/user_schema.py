from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class TwoFactorConfig(BaseModel):
    enabled: bool = False
    otp_code: Optional[str] = None
    otp_expires: Optional[datetime] = None

class BankAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    beneficiario: str
    clabe: str = Field(..., min_length=18, max_length=18)
    entidad_financiera: str
    is_default: bool = False

class User(BaseModel):
    nombre: str
    email: EmailStr
    password_hash: str
    roles: List[str] = ["Usuario Regular"]
    two_factor: TwoFactorConfig = Field(default_factory=TwoFactorConfig)
    bank_accounts: List[BankAccount] = Field(default_factory=list)
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    address: Optional[str] = None
    financial_profile: Optional[dict] = None
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)
    is_verified: bool = False

class UserCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    identifier: str
    password: str

class PasswordChange(BaseModel):
    new_password: str = Field(..., min_length=8, description="La nueva contraseña (mínimo 8 caracteres)")
    confirm_password: str = Field(..., description="Confirmación de la nueva contraseña")

    def validate_matching(self):
        if self.new_password != self.confirm_password:
            raise ValueError("La nueva contraseña y la confirmación no coinciden")
        return True

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    address: Optional[str] = None
    bank_accounts: Optional[List[BankAccount]] = None
    financial_profile: Optional[dict] = None
    verification_code: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr
