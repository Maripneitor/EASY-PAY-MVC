# Universidad Autónoma de Chiapas (UNACH)
## Seguridad en Cómputo — Tema: Confidencialidad
### Caso Práctico: Desarrollo de Aplicación Web con Gestión de Roles y Permisos de Usuario

---

## 🏛️ 1. Resumen Ejecutivo y Cumplimiento de la Arquitectura MVC

El proyecto **Easy-Pay** ha sido estructurado bajo el patrón arquitectónico **Modelo-Vista-Controlador (MVC)** con separación estricta entre cliente (Frontend Web) y servidor (API REST Backend), garantizando el principio de confidencialidad, integridad y mínimo privilegio.

```
EASY-PAY-MVC/
├── apps/
│   ├── api-backend/                   # 🐍 BACKEND REST API (FastAPI + Python + MongoDB)
│   │   ├── models/                    # [MODELO] Persistencia y reglas de datos (POO / Repositorios)
│   │   │   ├── user_model.py          # Modelo de usuarios y bloqueo de fuerza bruta
│   │   │   ├── role_model.py          # Modelo de roles predeterminados y dinámicos
│   │   │   ├── audit_model.py         # Modelo inmutable de auditoría y accesos
│   │   │   ├── group_model.py         # Modelo de contenidos y grupos
│   │   │   └── item_model.py          # Modelo de gastos y registros
│   │   ├── controllers/               # [CONTROLADOR] Lógica de negocio y orquestación
│   │   │   ├── user_controller.py     # Lógica de registro, login, 2FA y contraseñas
│   │   │   ├── admin_controller.py    # Lógica de administración, roles y auditoría
│   │   │   └── group_controller.py    # Lógica de grupos y balances
│   │   ├── routers/                   # [DISPATCHER / RUTAS] Endpoints HTTP REST (GET, POST, PUT, DELETE)
│   │   │   ├── user_router.py         # /api/auth/*
│   │   │   ├── admin_router.py        # /api/admin/*
│   │   │   └── group_router.py        # /api/groups/*
│   │   ├── core/                      # Seguridad y Middleware del Sistema
│   │   │   ├── permissions.py         # Verificación JWT, roles y permisos en servidor
│   │   │   ├── rate_limiter.py        # Protección contra ataques de fuerza bruta (Rate Limiting)
│   │   │   └── base_repository.py     # Abstracción base para MongoDB
│   │   ├── schemas/                   # Validación y sanitización estricta de datos (Pydantic)
│   │   └── services/                  # Servicios criptográficos (Bcrypt, JWT) y correo
│   │
│   └── web-app/                       # ⚛️ FRONTEND WEB SPA (React + TypeScript + Tailwind CSS)
│       └── src/
│           ├── ui/                    # [VISTA] Capa de presentación visual e interfaz de usuario
│           │   ├── pages/             # Vistas de páginas (AdminDashboard, Auth, Dashboard, Groups, etc.)
│           │   ├── components/        # Componentes UI reutilizables (Sidebar, Modals, Forms)
│           │   ├── auth/              # Guards de navegación (ProtectedRoute según rol del usuario)
│           │   └── routes/            # Configuración de rutas (AnimatedRoutes)
│           ├── services/              # Consumo de la API REST mediante HTTP (Axios / Fetch)
│           │   ├── authService.ts     # Peticiones con Authorization: Bearer <token>
│           │   ├── adminService.ts    # Consumo exclusivo de endpoints administrativos
│           │   └── groupService.ts    # Consumo de contenidos y recursos
│           └── infrastructure/        # Configuración de URLs, rutas y almacenamiento seguro
```

---

## 📋 2. Matriz de Cumplimiento de Requerimientos Funcionales

| # | Requerimiento | Implementación en Backend | Implementación en Frontend | Estado |
|---|---------------|---------------------------|----------------------------|--------|
| **1** | **Gestión de Usuarios** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/change-password/{id}`, `POST /api/auth/request-password-reset` | `Auth.tsx`, `RecoverPasswordPage.tsx`, `Profile.tsx` | ✅ Cumplido |
| **2** | **Gestión de Roles** (Administrador, Editor, Usuario Regular) | `models/role_model.py` (función `seed_default_roles`), `GET /api/admin/roles` | `AdminDashboard.tsx` (pestaña Roles) | ✅ Cumplido |
| **3** | **Gestión Dinámica de Permisos** | `POST /api/admin/roles`, `PUT /api/admin/roles/{id}`, `core/permissions.py` | Matriz interactiva de permisos por recurso y acción en `AdminDashboard.tsx` | ✅ Cumplido |
| **4** | **Control de Acceso** | Dependencias `require_role(...)` y `require_permission(...)` en cada endpoint | Guard `ProtectedRoute.tsx` y renderizado condicional en `Sidebar.tsx` | ✅ Cumplido |
| **5** | **Dashboard de Administración** | `GET /api/admin/users`, `PUT /api/admin/users/{id}/roles`, `GET /api/admin/audit-logs` | Panel de Administración con 3 pestañas: Usuarios, Roles/Permisos y Auditoría | ✅ Cumplido |
| **6** | **Arquitectura Web y Consumo Exclusivo REST API** | FastAPI con respuestas JSON, sin exposición directa de BD | Cliente React consumiendo exclusivamente endpoints vía `Authorization: Bearer <token>` | ✅ Cumplido |

---

## 🛡️ 3. Matriz de Cumplimiento de Requerimientos de Seguridad Computacional

### 1. Cifrado de Contraseñas (Bcrypt con Salt)
* **Archivo:** `apps/api-backend/services/auth_service.py`
* **Mecanismo:** Las contraseñas se hashean utilizando `bcrypt.hashpw` con salt dinámico de 12 rondas (`bcrypt.gensalt(12)`).
* **Verificación:** Las contraseñas nunca se almacenan en texto plano ni mediante algoritmos reversibles.

### 2. Comunicación Cifrada (HTTPS/TLS)
* **Mecanismo:** La aplicación está configurada para operar sobre HTTPS/TLS en producción, cookies con flag `Secure=True` y políticas HSTS.

### 3. Gestión Segura de Tokens JWT
* **Archivo:** `apps/api-backend/services/auth_service.py`, `routers/user_router.py`
* **Expiración corta de Access Token:** 15 minutos (`ACCESS_TOKEN_EXPIRE_MINUTES=15`).
* **Refresh Tokens:** Emisión de tokens de renovación rotativos de 7 días.
* **Firma segura:** Firmado con algoritmo `HS256` utilizando `JWT_SECRET` almacenado estrictamente en variables de entorno `.env`.
* **Protección contra XSS:** Los refresh tokens se almacenan en cookies con atributos `HttpOnly`, `Secure=True` y `SameSite="lax"`.

### 4. Autorización Verificada en el Servidor
* **Archivo:** `apps/api-backend/core/permissions.py`
* **Mecanismo:** Cada endpoint valida la firma, expiración y permisos requeridos (`require_permission` o `require_role`) directamente en el backend, evitando el bypass mediante manipulación del cliente.

### 5. Validación y Sanitización de Entradas
* **Archivos:** `apps/api-backend/schemas/*`, `apps/api-backend/utils/security.py`
* **Mecanismo:** Todos los modelos de entrada se validan estrictamente mediante **Pydantic**; los campos de texto se sanean contra ataques de inyección NoSQL y Cross-Site Scripting (XSS).

### 6. Protección contra Fuerza Bruta y Rate Limiting
* **Archivos:** `apps/api-backend/core/rate_limiter.py`, `apps/api-backend/models/user_model.py`
* **Bloqueo Temporal:** Tras 5 intentos fallidos consecutivos de inicio de sesión, la cuenta se bloquea automáticamente durante 15 minutos (`locked_until`).
* **Rate Limiting:** Los endpoints de autenticación cuentan con limitador de peticiones en memoria por IP.

### 7. Registro de Auditoría con Trazabilidad (Inmutable)
* **Archivos:** `apps/api-backend/models/audit_model.py`, `apps/api-backend/controllers/admin_controller.py`
* **Mecanismo:** Cada inicio de sesión, intento fallido, cambio de roles, modificación de permisos o acceso administrativo se registra con:
  - `user_email` / `user_id`
  - `timestamp` (UTC)
  - `ip_address` (IP real del cliente)
  - `user_agent` (navegador/dispositivo)
  - `action` y `resource`
* **Inmutabilidad:** La colección `AuditLogs` no posee endpoints de actualización ni eliminación desde la aplicación.

### 8. Manejo Seguro de CORS
* **Archivo:** `apps/api-backend/main.py`
* **Mecanismo:** `CORSMiddleware` restringe el acceso únicamente a los orígenes explícitamente autorizados (`ALLOWED_ORIGINS`), impidiendo accesos no autorizados de otros dominios.

### 9. Principio de Mínimo Privilegio
* **Roles Predeterminados:**
  - **Administrador:** Acceso completo a usuarios, roles, auditoría y contenidos.
  - **Editor:** Puede crear, modificar y eliminar contenidos (`groups:write`, `groups:delete`, `expenses:write`, `expenses:delete`), pero no puede administrar usuarios ni roles del sistema.
  - **Usuario Regular:** Solo puede visualizar y consultar contenidos (`groups:read`, `expenses:read`, `wallets:read`).

### 10. Manejo de Errores sin Fuga de Información
* **Archivo:** `apps/api-backend/main.py`
* **Mecanismo:** Se implementa un manejador global de excepciones (`@app.exception_handler(Exception)`) que registra el stack trace en los logs internos del servidor pero devuelve al cliente una respuesta JSON limpia y genérica (código HTTP 500) sin exponer rutas internas, versiones ni datos de la BD.

---

## 🚀 4. Guía de Ejecución y Pruebas

### Paso 1: Ejecutar la Suite de Pruebas de Cumplimiento UNACH
Para verificar automáticamente el 100% de los requerimientos de seguridad:
```powershell
cd apps/api-backend
python verify_unach_compliance.py
```
> **Resultado esperado:** `20/20 PRUEBAS SUPERADAS EXITOSAMENTE (100% CUMPLIMIENTO)`.

### Paso 2: Iniciar el Backend API REST
```powershell
cd apps/api-backend
uvicorn main:app --reload --port 8000
```
- Documentación Swagger interactiva: `http://localhost:8000/docs`

### Paso 3: Iniciar el Frontend Web
```powershell
cd apps/web-app
npm run dev
```
- Aplicación web accesible en el navegador: `http://localhost:5173`
