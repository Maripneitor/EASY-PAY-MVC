"""
==============================================================================
EASY-PAY: Sistema Automatizado de Respaldos de Base de Datos cada 24 Horas
==============================================================================
Cumple con la directiva de Seguridad en Cómputo:
- Respaldo completo de todas las colecciones de MongoDB cada 24 horas.
- Almacenamiento seguro en localidad externa (USB, Disco extraíble o ruta configurada).
- Generación de sumas de verificación criptográfica (SHA-256) para garantizar integridad.
- Rotación automática de respaldos antiguos (retención de 30 días).
- Registro inmutable en auditoría.
==============================================================================
"""

import os
import sys
import json
import time
import zipfile
import hashlib
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from bson import ObjectId, json_util
from dotenv import load_dotenv

# Cargar variables de entorno
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env")
load_dotenv(root_dir / "apps" / "api-backend" / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("BackupService")

MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"

# Ruta para almacenamiento externo (USB, disco extraíble o carpeta designada)
EXTERNAL_BACKUP_PATH = os.getenv("EXTERNAL_BACKUP_DIR") or str(root_dir / "backups" / "external_storage")

DATABASES_TO_BACKUP = [
    "EasyPay_Auth",
    "EasyPay_Groups",
    "EasyPay_Stats",
    "EasyPay_OCR",
    "EasyPay_Notifications",
    "EasyPay_Wallet",
    "easypay"
]

def calculate_sha256(filepath: Path) -> str:
    """Calcula el hash SHA-256 de un archivo para verificar integridad criptográfica"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def clean_old_backups(target_dir: Path, days_retention: int = 30):
    """Elimina respaldos más antiguos que el período de retención especificado"""
    cutoff = datetime.now() - timedelta(days=days_retention)
    for file in target_dir.glob("easypay_backup_*.zip"):
        try:
            mtime = datetime.fromtimestamp(file.stat().st_mtime)
            if mtime < cutoff:
                file.unlink()
                # Eliminar también el archivo .sha256 asociado si existe
                sha_file = file.with_suffix(".zip.sha256")
                if sha_file.exists():
                    sha_file.unlink()
                logger.info(f"🗑️ [Backup] Respaldo antiguo purgado: {file.name}")
        except Exception as e:
            logger.warning(f"⚠️ Error limpiando {file.name}: {e}")

async def run_backup(destination_folder: Optional[str] = None) -> Dict[str, Any]:
    """
    Ejecuta un respaldo completo de la base de datos MongoDB.
    Genera un archivo comprimido .zip sellado con hash SHA-256.
    """
    import certifi
    from motor.motor_asyncio import AsyncIOMotorClient

    dest_path = Path(destination_folder or EXTERNAL_BACKUP_PATH)
    dest_path.mkdir(parents=True, exist_ok=True)

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"easypay_backup_{timestamp_str}.zip"
    zip_filepath = dest_path / zip_filename

    temp_dir = dest_path / f"temp_{timestamp_str}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    client_kwargs = {
        "serverSelectionTimeoutMS": 10000,
        "connectTimeoutMS": 10000,
        "retryWrites": True
    }
    if "mongodb+srv" in MONGO_URL or "ssl=true" in MONGO_URL.lower():
        client_kwargs["tlsCAFile"] = certifi.where()

    client = AsyncIOMotorClient(MONGO_URL, **client_kwargs)
    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "databases": {},
        "total_documents": 0,
        "version": "2.0.0"
    }

    logger.info(f"📦 [Backup] Iniciando respaldo en: {zip_filepath}")

    try:
        total_docs = 0
        existing_dbs = await client.list_database_names()

        for db_name in DATABASES_TO_BACKUP:
            if db_name not in existing_dbs:
                continue

            db = client[db_name]
            collections = await db.list_collection_names()
            db_dir = temp_dir / db_name
            db_dir.mkdir(parents=True, exist_ok=True)

            manifest["databases"][db_name] = {}

            for col_name in collections:
                col = db[col_name]
                docs = []
                async for doc in col.find():
                    docs.append(doc)

                doc_count = len(docs)
                total_docs += doc_count
                manifest["databases"][db_name][col_name] = doc_count

                col_file = db_dir / f"{col_name}.json"
                with open(col_file, "w", encoding="utf-8") as f:
                    f.write(json_util.dumps(docs, indent=2, ensure_ascii=False))

        manifest["total_documents"] = total_docs

        # Guardar manifiesto de respaldo
        with open(temp_dir / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        # Comprimir directorio temporal a ZIP
        with zipfile.ZipFile(zip_filepath, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file in temp_dir.rglob("*"):
                if file.is_file():
                    arcname = file.relative_to(temp_dir)
                    zipf.write(file, arcname)

        # Generar suma criptográfica SHA-256
        sha256_checksum = calculate_sha256(zip_filepath)
        sha_filepath = dest_path / f"{zip_filename}.sha256"
        with open(sha_filepath, "w", encoding="utf-8") as f:
            f.write(f"{sha256_checksum} *{zip_filename}\n")

        size_bytes = zip_filepath.stat().st_size
        logger.info(f"✅ [Backup] Respaldo completado exitosamente: {zip_filename} ({size_bytes} bytes)")
        logger.info(f"🔒 [Backup] SHA-256 Checksum: {sha256_checksum}")

        # Limpiar directorio temporal
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

        # Limpiar respaldos con más de 30 días
        clean_old_backups(dest_path)

        # Intentar registrar en auditoría
        try:
            audit_db = client["EasyPay_Auth"]
            audit_col = audit_db["audit_logs"]
            await audit_col.insert_one({
                "action": "DATABASE_BACKUP_COMPLETED",
                "resource": "database",
                "user_email": "system@easypay.com",
                "details": {
                    "filename": zip_filename,
                    "sha256": sha256_checksum,
                    "size_bytes": size_bytes,
                    "total_documents": total_docs,
                    "destination": str(dest_path)
                },
                "created_at": datetime.now(timezone.utc)
            })
        except Exception as audit_err:
            logger.warning(f"⚠️ No se pudo registrar auditoría de respaldo: {audit_err}")

        return {
            "status": "success",
            "filename": zip_filename,
            "filepath": str(zip_filepath),
            "size_bytes": size_bytes,
            "sha256": sha256_checksum,
            "total_documents": total_docs,
            "timestamp": manifest["created_at"]
        }

    except Exception as e:
        logger.error(f"❌ [Backup] Error crítico durante el respaldo: {e}", exc_info=True)
        return {
            "status": "error",
            "message": str(e)
        }
    finally:
        client.close()

def run_backup_daemon(interval_seconds: int = 86400):
    """
    Bucle daemon que ejecuta el respaldo automáticamente cada 24 horas (86,400 segundos).
    """
    logger.info(f"⏱️ [Daemon] Servicio de respaldo cada 24h iniciado. Próximo respaldo en {interval_seconds}s...")
    while True:
        try:
            logger.info("🚀 [Daemon] Ejecutando ciclo de respaldo programado cada 24h...")
            asyncio.run(run_backup())
        except Exception as e:
            logger.error(f"❌ [Daemon] Fallo en ciclo de respaldo: {e}")
        
        logger.info(f"💤 [Daemon] Durmiendo durante 24 horas hasta el siguiente ciclo...")
        time.sleep(interval_seconds)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Easy-Pay Backup Utility (Seguridad en Cómputo)")
    parser.add_argument("--now", action="store_true", help="Ejecutar respaldo inmediato")
    parser.add_argument("--daemon", action="store_true", help="Iniciar servicio recurrente cada 24 horas")
    parser.add_argument("--interval", type=int, default=86400, help="Intervalo en segundos para el daemon (default: 86400 = 24h)")
    parser.add_argument("--dest", type=str, default=None, help="Ruta de destino externa (USB o disco)")

    args = parser.parse_args()

    if args.daemon:
        run_backup_daemon(args.interval)
    else:
        # Por defecto corre un respaldo ahora
        res = asyncio.run(run_backup(args.dest))
        print(json.dumps(res, indent=2))

