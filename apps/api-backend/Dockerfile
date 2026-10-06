FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema si fueran necesarias
RUN apt-get update && apt-get install -y gcc

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# El código se monta por volumen en el docker-compose, 
# así que no necesitamos copiarlo aquí para desarrollo.
