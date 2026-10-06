import os
import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Intentar cargar .env desde el directorio actual y desde la raíz del proyecto
load_dotenv() # Carga .env local si existe
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env")) # Carga .env de la raíz
load_dotenv(os.path.join(os.path.dirname(__file__), "../../env.template"))

# Check multiple possible env var names for robustness (Atlas vs Local)
MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"

if "mongodb+srv" not in MONGO_URL:
    logger.warning("⚠️ ALERTA: No se detectó una conexión a MongoDB Atlas (Nube). Usando conexión local o fallback.")
else:
    logger.info("✅ Conexión a MongoDB Atlas detectada.")

class DatabaseConnector:
    def __init__(self):
        use_mock = os.getenv("USE_MOCK_DB", "").lower() in ("true", "1", "yes") or MONGO_URL.lower() == "mock"
        if use_mock:
            try:
                import mongomock_motor
                logger.info("🧪 [DatabaseConnector] Inicializando cliente de base de datos en memoria (Mock DB).")
                self.client = mongomock_motor.AsyncMongoMockClient()
                return
            except Exception as mock_err:
                logger.warning(f"No se pudo cargar mongomock_motor: {mock_err}")

        try:
            logger.info(f"Conectando a MongoDB en: {MONGO_URL.split('@')[-1] if '@' in MONGO_URL else MONGO_URL}")
            client_kwargs = {
                "serverSelectionTimeoutMS": 5000,
                "connectTimeoutMS": 5000,
                "retryWrites": True
            }
            if "mongodb+srv" in MONGO_URL or "ssl=true" in MONGO_URL.lower():
                client_kwargs["tlsCAFile"] = certifi.where()

            self.client = AsyncIOMotorClient(
                MONGO_URL,
                **client_kwargs
            )
        except Exception as e:
            logger.error(f"❌ Error crítico al inicializar el cliente de MongoDB: {str(e)}")
            self.client = None

    def get_db(self, db_name: str = "EasyPay"):
        if self.client is None:
            logger.warning("Intentando acceder a DB con cliente no inicializado")
            return None
        return self.client[db_name]

# Singleton instance
db_instance = DatabaseConnector()