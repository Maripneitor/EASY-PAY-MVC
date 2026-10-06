import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "super_secure_jwt_secret_key_easypay_unach_2026_mvc")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))  # 15 minutos (tiempo corto según seguridad)
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))      # 7 días

class AuthService:
    """
    Servicio OOP de Autenticación, Criptografía y Gestión de Tokens.
    - Hashing de contraseñas con bcrypt (salt seguro).
    - Access tokens de corta duración (15-30 min) con claims de rol y permisos.
    - Refresh tokens para renovación transparente de sesión.
    """
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_expire_days = REFRESH_TOKEN_EXPIRE_DAYS

    def hash_password(self, plain_password: str) -> str:
        """Genera un salt robusto y hashea la contraseña usando bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica una contraseña en texto plano contra su hash bcrypt"""
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    def create_access_token(
        self,
        user_id: str,
        email: str,
        nombre: str,
        roles: Optional[List[str]] = None,
        permissions: Optional[List[str]] = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Genera un Access Token JWT de corta duración firmado con roles y permisos"""
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=self.access_expire_minutes))
        payload = {
            "sub": user_id,
            "email": email,
            "nombre": nombre,
            "roles": roles or ["Usuario Regular"],
            "permissions": permissions or [],
            "token_type": "access",
            "iat": datetime.now(timezone.utc),
            "exp": expire
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(
        self,
        user_id: str,
        email: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Genera un Refresh Token JWT de mayor duración para renovar credenciales"""
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=self.refresh_expire_days))
        payload = {
            "sub": user_id,
            "email": email,
            "token_type": "refresh",
            "iat": datetime.now(timezone.utc),
            "exp": expire
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decodifica y valida cualquier token JWT comprobando firma y expiración"""
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

    def decode_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Valida que el token sea de tipo 'access'"""
        claims = self.decode_token(token)
        if claims and claims.get("token_type", "access") == "access":
            return claims
        return None

    def decode_refresh_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Valida que el token sea de tipo 'refresh'"""
        claims = self.decode_token(token)
        if claims and claims.get("token_type") == "refresh":
            return claims
        return None
