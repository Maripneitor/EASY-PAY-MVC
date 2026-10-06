import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userRepository } from '../../../infrastructure/api/repositories';
import { STORAGE_KEYS } from '../../../infrastructure/localStorage/storage-keys';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../../infrastructure/routes';

export const useAuth = () => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { loginWithEmail, logout: contextLogout } = useAuthContext();

    // --- REGISTRO ---
    const register = async (userData: any) => {
        setIsAuthenticating(true);
        setError(null);
        try {
            const data = await userRepository.register(userData);

            if (data.status === 'success') {
                const actualId = data.user_id || data.id || data._id;
                localStorage.setItem('temp_userId', actualId);
                localStorage.setItem('userEmail', userData.email);
                navigate(ROUTES.TWO_FACTOR_VERIFY);
            }
        } catch (err: any) {
            setError(err.message || 'Error en el registro. Intenta con otro email.');
        } finally {
            setIsAuthenticating(false);
        }
    };

    // --- LOGIN ---
    const login = async (identifier: string, password: string) => {
        setIsAuthenticating(true);
        setError(null);

        try {
            const data = await loginWithEmail(identifier, password);

            if (data.status === 'success') {
                navigate(ROUTES.DASHBOARD);
                return;
            }

            if (data.status === '2fa_required' || data.status === 'not_verified') {
                localStorage.setItem('temp_userId', data.user_id || '');
                localStorage.setItem('userEmail', data.user?.email || identifier || "");
                navigate(data.status === 'not_verified' ? ROUTES.TWO_FACTOR_SETUP : ROUTES.TWO_FACTOR_VERIFY);
                return;
            }

        } catch (err: any) {
            setError(err.message || 'Credenciales incorrectas o error de servidor');
        } finally {
            setIsAuthenticating(false);
        }
    };

    // --- LOGOUT ---
    const logout = () => {
        contextLogout();
    };


    return {
        mode,
        setMode,
        loginType,
        setLoginType,
        isAuthenticating,
        loading: isAuthenticating, // Maintain backward compatibility for the view if needed
        error,
        setError,
        register,
        login,
        logout,
        navigate
    };
};