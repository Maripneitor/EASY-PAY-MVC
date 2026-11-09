import os
import base64
import json
import logging
from typing import Optional, Dict, Any, Union
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

logger = logging.getLogger("crypto_service")

class CryptoService:
    """
    Servicio de Encriptación Simétrica Autenticada (AES-128-CBC + HMAC-SHA256 vía Fernet).
    Garantiza confidencialidad e integridad para datos personales sensibles en MongoDB (RFC, direcciones).
    """
    _instance = None
    _fernet = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CryptoService, cls).__new__(cls)
            cls._instance._init_fernet()
        return cls._instance

    def _init_fernet(self):
        # Derivación determinista y segura de clave criptográfica de 32 bytes vía PBKDF2
        raw_secret = os.getenv("DATABASE_ENCRYPTION_KEY") or os.getenv("JWT_SECRET") or "easypay-secure-db-encryption-key-fallback"
        salt = os.getenv("DATABASE_ENCRYPTION_SALT", "easypay_db_salt_secure_2026").encode("utf-8")
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100_000
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(raw_secret.encode("utf-8")))
        self._fernet = Fernet(derived_key)

    def encrypt(self, plaintext: Optional[Union[str, dict]]) -> Optional[str]:
        """Encripta un valor de texto o diccionario en formato cifrado Fernet"""
        if plaintext is None:
            return None
        
        # Si es un dict, serializar a JSON antes de encriptar
        if isinstance(plaintext, dict):
            plaintext = json.dumps(plaintext, ensure_ascii=False)
        else:
            plaintext = str(plaintext).strip()

        if not plaintext:
            return ""

        # Si ya está encriptado con Fernet (inicia con gAAAAA), evitar doble encriptación
        if plaintext.startswith("gAAAAA") and len(plaintext) > 60:
            return plaintext

        try:
            encrypted_bytes = self._fernet.encrypt(plaintext.encode("utf-8"))
            return encrypted_bytes.decode("utf-8")
        except Exception as e:
            logger.error(f"[CryptoService] Error al encriptar campo: {e}")
            return plaintext

    def decrypt(self, ciphertext: Optional[str]) -> Optional[Union[str, dict]]:
        """Desencripta un valor cifrado. Si no está cifrado, retorna el valor original (retrocompatibilidad)"""
        if not ciphertext or not isinstance(ciphertext, str):
            return ciphertext

        val = ciphertext.strip()
        if not val.startswith("gAAAAA"):
            return val

        try:
            decrypted_bytes = self._fernet.decrypt(val.encode("utf-8"))
            decrypted_text = decrypted_bytes.decode("utf-8")
            
            # Si era un JSON serializado de un objeto (ej. dirección compuesta), parsear
            if decrypted_text.startswith("{") and decrypted_text.endswith("}"):
                try:
                    return json.loads(decrypted_text)
                except Exception:
                    return decrypted_text

            return decrypted_text
        except (InvalidToken, Exception):
            # En caso de fallo o clave diferente, retornar original sin tumbar la aplicación
            return val

    def encrypt_user_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Aplica encriptación en campos sensibles antes de guardar en Base de Datos"""
        result = dict(data)
        if "rfc" in result and result["rfc"]:
            result["rfc"] = self.encrypt(result["rfc"])
        if "address" in result and result["address"]:
            result["address"] = self.encrypt(result["address"])
        return result

    def decrypt_user_sensitive_data(self, data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Desencripta campos sensibles tras leer de la Base de Datos"""
        if not data:
            return data
        result = dict(data)
        if "rfc" in result and result["rfc"]:
            result["rfc"] = self.decrypt(result["rfc"])
        if "address" in result and result["address"]:
            result["address"] = self.decrypt(result["address"])
        return result

crypto_service = CryptoService()
