import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ROUTES } from '../../infrastructure/routes';
import { STORAGE_KEYS } from '../../infrastructure/localStorage/storage-keys';

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, user } = useAuthContext();
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN); // Fallback
    const tempUserId = localStorage.getItem('temp_userId');
    const location = useLocation();

    if (isLoading) {
        return null; // AnimatedRoutes maneja el loader global
    }

    // 1. Definimos las rutas de "paso seguro" para el flujo de 2FA
    const securityRoutes = [ROUTES.TWO_FACTOR_SETUP, ROUTES.TWO_FACTOR_VERIFY];

    // 2. Si el usuario va a una de estas rutas y tenemos su ID temporal, lo dejamos pasar
    if (securityRoutes.includes(location.pathname as any) && tempUserId) {
        return <Outlet />;
    }

    // 3. Si no está autenticado (y tampoco hay token), redirigir al login
    if (!isAuthenticated && !token) {
        return <Navigate to={ROUTES.AUTH} replace />;
    }

    // 4. Control de acceso para Dashboard de Administración
    if (location.pathname === ROUTES.ADMIN) {
        const isAdmin = Boolean(
            user?.roles?.some((r: string) => r.toLowerCase() === 'administrador' || r.toLowerCase() === 'admin')
        );
        if (!isAdmin) {
            return <Navigate to={ROUTES.DASHBOARD} replace />;
        }
    }

    // 5. Si está autenticado, continuar
    return <Outlet />;
};