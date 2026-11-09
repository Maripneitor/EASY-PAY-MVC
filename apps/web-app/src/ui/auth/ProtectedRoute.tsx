import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { ROUTES } from '../../infrastructure/routes';
import { getAuthToken } from '../../infrastructure/api/http-client';
import { toast } from 'sonner';
import { useRef } from 'react';

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuthContext();
    const { isAdmin, canWriteExpenses } = usePermissions();
    const token = getAuthToken();
    const tempUserId = localStorage.getItem('temp_userId');
    const location = useLocation();
    const lastDeniedPathRef = useRef<string | null>(null);

    // 1. Rutas de paso seguro para verificacion de 2FA
    const securityRoutes = [ROUTES.TWO_FACTOR_SETUP, ROUTES.TWO_FACTOR_VERIFY];
    if (securityRoutes.includes(location.pathname as any) && tempUserId) {
        return <Outlet />;
    }

    if (isLoading) {
        return null;
    }

    // 2. Si no esta autenticado, redirigir al login
    if (!isAuthenticated && !token) {
        return <Navigate to={ROUTES.AUTH} replace state={{ from: location.pathname }} />;
    }

    // 3. Control de acceso para Dashboard de Administracion
    if (location.pathname === ROUTES.ADMIN && !isAdmin) {
        if (lastDeniedPathRef.current !== location.pathname) {
            lastDeniedPathRef.current = location.pathname;
            toast.error('Acceso denegado: Se requiere rol de Administrador.');
        }
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    // 4. Control de acceso para Registrar / Editar Gastos (expenses:write)
    const isExpenseWriteRoute = location.pathname.includes('/registrar-gasto') || location.pathname.includes('/editar-item');
    if (isExpenseWriteRoute && !canWriteExpenses) {
        if (lastDeniedPathRef.current !== location.pathname) {
            lastDeniedPathRef.current = location.pathname;
            toast.error('Acceso denegado: Tu rol es de solo lectura y no permite registrar ni editar gastos.');
        }
        // Extraer groupId para volver al detalle del grupo si es posible
        const match = location.pathname.match(/\/grupo\/([^\/]+)/);
        const redirectTarget = match ? `/grupo/${match[1]}` : ROUTES.DASHBOARD;
        return <Navigate to={redirectTarget} replace />;
    }

    return <Outlet />;
};