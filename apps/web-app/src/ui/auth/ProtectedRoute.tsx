import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ROUTES } from '../../infrastructure/routes';
import { STORAGE_KEYS } from '../../infrastructure/localStorage/storage-keys';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, user } = useAuthContext();
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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

    // 3. Calculo de roles y permisos
    const userRoles = (user?.roles || ['Usuario Regular']).map((r: string) => r.toLowerCase());
    const isAdmin = userRoles.includes('administrador') || userRoles.includes('admin');
    const isEditor = userRoles.includes('editor');
    const userPermissions = user?.permissions || [];

    const canWriteGroups = isAdmin || isEditor || userPermissions.includes('groups:write');
    const canWriteExpenses = isAdmin || isEditor || userPermissions.includes('expenses:write');

    // 4. Control de acceso para Dashboard de Administracion
    if (location.pathname === ROUTES.ADMIN && !isAdmin) {
        if (lastDeniedPathRef.current !== location.pathname) {
            lastDeniedPathRef.current = location.pathname;
            toast.error('Acceso denegado: Se requiere rol de Administrador.');
        }
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    // 5. Control de acceso para Crear Grupo (Solo Admin y Editor tienen permiso groups:write)
    if (location.pathname === ROUTES.CREATE_GROUP && !canWriteGroups) {
        // Permitir si viene con el parametro ?tab=join
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('tab') !== 'join') {
            if (lastDeniedPathRef.current !== location.pathname) {
                lastDeniedPathRef.current = location.pathname;
                toast.info('Tu rol actual permite unirte a grupos existentes mediante codigo.');
            }
            return <Navigate to={`${ROUTES.CREATE_GROUP}?tab=join`} replace />;
        }
    }

    // 6. Control de acceso para Registrar / Editar Gastos (expenses:write)
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