import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { ROUTES } from '../../infrastructure/routes';
import { getAuthToken } from '../../infrastructure/api/http-client';
import { toast } from 'sonner';
import { useRef } from 'react';

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuthContext();
    const { isAdmin, canWriteExpenses, canWriteGroups, canViewStats } = usePermissions();
    const token = getAuthToken();
    const tempUserId = localStorage.getItem('temp_userId');
    const location = useLocation();
    const lastDeniedPathRef = useRef<string | null>(null);

    // 1. Rutas de paso seguro para verificacion de 2FA
    const securityRoutes = [ROUTES.TWO_FACTOR_SETUP, ROUTES.TWO_FACTOR_VERIFY];
    if (securityRoutes.includes(location.pathname as any) && tempUserId) {
        return <Outlet />;
    }

    // Mientras se restaura e hidrata la sesión (JWT de localStorage o cookie), no expulsar al usuario
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-xs font-mono text-slate-400">Verificando sesión...</span>
                </div>
            </div>
        );
    }

    // 2. Si no esta autenticado, redirigir al login
    if (!isAuthenticated && !token) {
        return <Navigate to={ROUTES.AUTH} replace state={{ from: location.pathname }} />;
    }

    // 3. Navigation Guard: Control de acceso para Dashboard de Administración
    if (location.pathname === ROUTES.ADMIN && !isAdmin) {
        if (lastDeniedPathRef.current !== location.pathname) {
            lastDeniedPathRef.current = location.pathname;
            toast.error('Acceso denegado: Se requiere rol de Administrador para acceder al panel de control.');
        }
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    // 4. Navigation Guard: Control de acceso para Registrar / Editar Gastos (expenses:write)
    const isExpenseWriteRoute = location.pathname.includes('/registrar-gasto') || location.pathname.includes('/editar-item');
    if (isExpenseWriteRoute && !canWriteExpenses) {
        if (lastDeniedPathRef.current !== location.pathname) {
            lastDeniedPathRef.current = location.pathname;
            toast.error('Acceso denegado: Tu rol actual no cuenta con permiso para registrar o editar gastos.');
        }
        const match = location.pathname.match(/\/grupo\/([^\/]+)/);
        const redirectTarget = match ? `/grupo/${match[1]}` : ROUTES.DASHBOARD;
        return <Navigate to={redirectTarget} replace />;
    }

    // 5. Navigation Guard: Control de acceso para Crear Grupos (groups:write)
    if (location.pathname === ROUTES.CREATE_GROUP && !canWriteGroups) {
        if (lastDeniedPathRef.current !== location.pathname) {
            lastDeniedPathRef.current = location.pathname;
            toast.error('Acceso denegado: Tu rol actual no cuenta con permiso para crear nuevos grupos.');
        }
        return <Navigate to={ROUTES.GROUPS} replace />;
    }

    // 6. Navigation Guard: Control de acceso para Estadísticas (stats:read)
    if (location.pathname === ROUTES.STATS && !canViewStats) {
        if (lastDeniedPathRef.current !== location.pathname) {
            lastDeniedPathRef.current = location.pathname;
            toast.error('Acceso denegado: Tu rol actual no cuenta con permiso para consultar métricas y estadísticas.');
        }
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <Outlet />;
};