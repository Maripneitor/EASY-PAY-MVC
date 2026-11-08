from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class InvitationCreate(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico del usuario a invitar")

class InvitationResponse(BaseModel):
    id: str
    group_id: str
    group_name: Optional[str] = None
    invited_email: str
    invited_by_user_id: str
    invited_by_name: Optional[str] = None
    status: str = "PENDING"  # PENDING, ACCEPTED, REJECTED, EXPIRED
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

