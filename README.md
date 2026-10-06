# 💸 EASY-PAY: Ecosistema de Gestión de Gastos Compartidos

¡Bienvenido a **EASY-PAY**! Esta es una plataforma integral diseñada para facilitar el registro y la liquidación de gastos entre amigos y grupos.

---

## 🚀 0. Ejecución Rápida (Cleanup & Run)
Si ya tienes el proyecto y quieres asegurar una ejecución limpia, usa el comando unificado:

```bash
# Limpia, instala y levanta todo (Backend, Web y Mobile)
npm run nuke && npm run dev
```

---

## 🛠️ 1. Requisitos Previos
- **Node.js:** Versión 20 (Usa `nvm use` si tienes `.nvmrc` activo).
- **Docker & Docker Compose:** Para servicios de backend y bases de datos.

---

## 📦 2. Instalación por Primera Vez (Quick Start)
Sigue estos pasos para tener el proyecto funcional en menos de 5 minutos:

1.  **Clonar el proyecto:**
    ```bash
    git clone https://github.com/tu-usuario/easy-pay.git
    cd Easy-Pay
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install --legacy-peer-deps
    ```

---

## 💻 3. Cómo Correr el Proyecto

Para tener el control total en tres terminales separadas, ejecuta estos comandos desde la **carpeta raíz** del proyecto (`Easy-Pay`):

### 1. Terminal BACKEND (Docker)
Este comando levantará todos los microservicios en segundo plano.
```powershell
npm run dev:backend
# o alternativamente: docker-compose up unified-api
```

### 2. Terminal WEB (Vite)
Este comando iniciará el servidor de desarrollo para la aplicación web en el puerto 5173.
```powershell
npm run dev:web
```

### 3. Terminal MOBILE (Expo)
Este comando iniciará el Metro Bundler para la aplicación móvil con la configuración de red local (LAN).
```powershell
npm run dev:mobile
```

---

**Tip Pro:** Si prefieres ver todo en una sola terminal combinada (usando `concurrently`), puedes simplemente ejecutar:
```powershell
npm run dev
```

Pero si prefieres debuguear por separado, la opción de las 3 terminales anteriores es la mejor.

También existe una Opción Automática (Recomendada para Windows):
Este script detecta tu IP, configura los archivos `.env` y abre todas las terminales por ti:
```powershell
./dev.ps1
```

---

## 🗺️ 4. Estructura de Navegación

El ecosistema Easy-Pay sigue los Estándares de Calidad 2026, lo que implica una interfaz limpia y paridad entre Web y Mobile. La navegación principal es:

- **Inicio (Dashboard):** Resumen financiero, métricas clave y acceso rápido a grupos activos.
- **Mis Grupos:** Centro de gestión para crear, unirse y liquidar grupos compartidos.
- **Estadísticas (Gráficas):** Reportes financieros y gráficos del flujo de gastos.
- **Configuración (Perfil):** Gestión de cuentas bancarias (hasta 3), ajustes de seguridad e **Historial de Movimientos**.

*Nota: La antigua sección independiente de "Mis Pagos" ha sido removida y consolidada en las métricas y el historial para una UX más fluida.*

---

## 🛠️ 5. Mantenimiento y Troubleshooting

### ☢️ Reset Total (Senior DX)
Si el entorno se corrompe o las dependencias fallan, usa el comando "Nuke". Este comando limpia Docker, borra `node_modules`, limpia caché y reinstala todo de cero:
```bash
npm run nuke
```

## 🚀 Guía de Inicio y Flujo de Trabajo para el Equipo

Para garantizar que todos trabajemos bajo el mismo entorno y evitar los clásicos conflictos de dependencias (como errores con `package-lock.json` o módulos faltantes), utilizaremos Docker Compose como nuestra fuente de la verdad.

Sigue estos pasos cada vez que clones el proyecto por primera vez o bajes cambios importantes.

### 1. Variables de Entorno (Archivos Ignorados)
Por seguridad, los archivos `.env` no se suben a Git. Antes de levantar el proyecto, asegúrate de tener tus variables de entorno locales configuradas.

Copia el archivo de ejemplo en las rutas correspondientes:
```bash
# Ejemplo para el backend y frontend
cp .env.example .env
```

**⚠️ ¡IMPORTANTE PARA DOCKER!**
Si vas a levantar el proyecto usando Docker Compose, asegúrate de agregar la siguiente línea en el archivo `.env` del frontend (`apps/web-app/.env`). Esto le dirá a Vite que enrute las peticiones a la red interna de contenedores y no a localhost (esto ya está automatizado en `docker-compose.yml`, pero es vital tenerlo en cuenta):
```env
IS_DOCKER=true
```

### 2. Flujo de Trabajo: Bajar Cambios y Limpieza Profunda
Si alguien añadió nuevas librerías, hacer un simple `git pull` puede romper tu entorno local. Usa esta secuencia para bajar cambios, limpiar la basura residual y reinstalar todo desde cero.

**Ejecuta esto en la terminal (Raíz del proyecto):**
```powershell
# 1. Traer los últimos cambios del repositorio
git pull origin main

# 2. Borrar dependencias locales y archivos de caché conflictivos (Windows Powershell)
rm -Recurse -Force node_modules, package-lock.json
npm cache clean --force

# 3. Reinstalar dependencias limpias
npm install --legacy-peer-deps
```

### 3. Levantar el Proyecto (Contenedores)
Ya con el código limpio, deja que Docker se encargue de orquestar la base de datos, el backend y el frontend. 

**Para encender el proyecto forzando una reconstrucción limpia:**
```bash
docker-compose up --build
```
*El flag `--build` es la regla de oro: le dice a Docker que vuelva a leer los `package.json` e instale cualquier dependencia nueva dentro del contenedor, asegurando que el entorno sea idéntico al de tus compañeros.*

### 🧹 Comandos de Rescate (Troubleshooting)
Si sientes que el proyecto hace cosas raras, los puertos se quedan pegados o los contenedores no reflejan tus cambios, ejecuta esta limpieza total (nuke) de Docker:

```bash
# Apagar y borrar contenedores, redes y volúmenes huérfanos
docker-compose down -v --remove-orphans

# Limpiar todo el sistema de Docker (Precaución: borra imágenes sin uso)
docker system prune -a --volumes -f
```
Después de esto, vuelve a ejecutar `docker-compose up --build` y tendrás un entorno 100% fresco.

---

## 📱 5. Configuración de Red (Mobile)
Para que el celular (Expo Go) se conecte al backend:
1. Asegúrate de estar en la **misma red Wi-Fi** que la PC.
2. Si usas `./dev.ps1`, la IP se configura sola.
3. Si lo haces manual, pon tu IP local en el `.env` de `apps/mobile-app`.

---

## 🏗️ Estructura del Monorepo
- **`apps/api-backend`**: FastAPI + MongoDB.
- **`apps/web-app`**: React + Vite (Panel Admin).
- **`apps/mobile-app`**: Expo SDK 54 (App Nativa).

---
---
*Última Actualización: Mayo 2026 - Versión Consolidada (Unified API & Banda Integrated)*
