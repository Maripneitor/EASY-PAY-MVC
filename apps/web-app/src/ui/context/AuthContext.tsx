import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@infrastructure/localStorage/storage-keys';
import { clearAuthToken, getAuthToken, setAuthToken } from '@infrastructure/api/http-client';
import { authService, type User } from '@services/authService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuestSession {
    id: string;           // Temporary session id
    name: string;
    joinedGroupCode?: string;
}

export interface AuthContextType {
    /** Authenticated registered user */
    user: User | null;
    /** Guest session (no account, just a name) */
    guest: GuestSession | null;
    /** Current auth token */
    token?: string | null;
    /** Initial loading state (restoring session) */
    isLoading: boolean;
    /** State during login/logout operations */
    isAuthenticating: boolean;
    /** True if user OR guest session is active */
    isAuthenticated: boolean;
    /** True only for guest sessions */
    isGuest: boolean;

    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<any>;
    loginAsGuest: (name: string, groupCode?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserSession: (updatedUser: User, newToken?: string) => void;
    refreshUserPermissions: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [guest, setGuest] = useState<GuestSession | null>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => getAuthToken());
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

    // ── Restore session from in-memory token, localStorage, or silent refresh on mount ──
    useEffect(() => {
        let isMounted = true;

        const syncSession = async () => {
            setIsLoading(true);
            try {
                // 1. Obtener token y usuario almacenados (localStorage / memoria)
                let currentToken = getAuthToken();
                let storedUser = authService.getStoredUser();

                // 2. Si no hay token de acceso, intentar recuperarlo vía refresh token en cookie HttpOnly
                if (!currentToken) {
                    try {
                        const refreshRes = await authService.refreshToken();
                        if (refreshRes?.access_token) {
                            currentToken = refreshRes.access_token;
                            setAuthToken(currentToken);
                            if (refreshRes.user) {
                                storedUser = refreshRes.user;
                                authService.updateUserSession(storedUser);
                            }
                        }
                    } catch {
                        // Refresh token expirado o no presente
                    }
                }

                // 3. Si el token está presente, asegurar sincronización de perfil y roles
                if (currentToken && isMounted) {
                    setToken(currentToken);
                    if (storedUser) {
                        setUser(storedUser);
                        setGuest(null);
                    }
                    try {
                        const freshUser = await authService.getCurrentUser();
                        if (freshUser && isMounted) {
                            setUser(freshUser);
                            setGuest(null);
                        }
                    } catch {
                        // Si falla la red temporalmente pero storedUser existe, mantenemos storedUser
                    }
                } else if (isMounted) {
                    // 4. Si no hay sesión de usuario, verificar sesión de invitado
                    const storedGuest = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION);
                    if (storedGuest) {
                        setUser(null);
                        setToken(null);
                        setGuest(JSON.parse(storedGuest));
                    } else {
                        setUser(null);
                        setToken(null);
                        setGuest(null);
                    }
                }
            } catch (err) {
                console.warn('[AuthContext] Error sincronizando sesión:', err);
                if (isMounted) {
                    setUser(null);
                    setToken(null);
                    setGuest(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.AUTH_USER || e.key === STORAGE_KEYS.GUEST_SESSION || e.key === STORAGE_KEYS.AUTH_TOKEN) {
                syncSession();
            }
        };

        syncSession();
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            isMounted = false;
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // ── Auth methods ───────────────────────────────────────────────────────────

    const loginWithGoogle = useCallback(async (): Promise<void> => {
        setIsAuthenticating(true);
        try {
            await new Promise(r => setTimeout(r, 500));
            toast.info("Inicia sesión con tu correo para continuar. Google OAuth estará disponible próximamente.");
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const loginWithEmail = useCallback(async (email: string, password: string): Promise<any> => {
        setIsAuthenticating(true);
        try {
            const result = await authService.login(email, password);
            
            if (result.status === 'success') {
                const storedUser = authService.getStoredUser();
                setUser(storedUser);
                setToken(getAuthToken());
                setGuest(null);
                localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
            }
            return result;
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const loginAsGuest = useCallback(async (name: string, groupCode?: string): Promise<void> => {
        setIsAuthenticating(true);
        try {
            const guestSession: GuestSession = {
                id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                name: name.trim(),
                joinedGroupCode: groupCode,
            };

            // Clear registered user session
            authService.clearSession();
            setUser(null);
            setToken(null);

            // Set guest session
            localStorage.setItem(STORAGE_KEYS.GUEST_SESSION, JSON.stringify(guestSession));
            setGuest(guestSession);
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        setIsAuthenticating(true);
        try {
            authService.clearSession();
            setUser(null);
            setToken(null);
            setGuest(null);
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const updateUserSession = useCallback((updatedUser: User, newToken?: string): void => {
        if (newToken) {
            authService.persistSession(newToken, updatedUser);
            setToken(newToken);
        } else {
            authService.updateUserSession(updatedUser);
        }
        setUser(authService.getStoredUser());
    }, []);

    const refreshUserPermissions = useCallback(async (): Promise<void> => {
        const storedUser = authService.getStoredUser();
        const currentToken = getAuthToken();
        if (!currentToken || !storedUser?.id) return;

        try {
            // Consultar datos y permisos en tiempo real desde el backend
            const updatedUser = (await authService.getCurrentUser()) || (await authService.refreshProfile(storedUser.id));
            if (updatedUser) {
                setUser(authService.getStoredUser());
            }
        } catch (error: any) {
            console.warn('[AuthContext] Error refrescando permisos:', error);
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                toast.error('Tu sesión ha expirado o tus permisos fueron revocados.');
                await logout();
            }
        }
    }, [logout]);

    // ── Escuchar eventos 403 Forbidden por revocación o cambio de rol ─────────
    useEffect(() => {
        const handleForbidden = async (e: Event) => {
            const customEvent = e as CustomEvent<{ message?: string; url?: string }>;
            const detailMsg = customEvent.detail?.message || 'Acceso denegado';

            console.warn('[AuthContext] 403 Forbidden detectado:', detailMsg);

            const storedUser = authService.getStoredUser();
            if (!storedUser?.id) {
                await logout();
                return;
            }

            try {
                // Verificar estado real del usuario en el backend
                const updatedUser = (await authService.getCurrentUser()) || (await authService.refreshProfile(storedUser.id));
                if (updatedUser) {
                    const freshUser = authService.getStoredUser();
                    setUser(freshUser);

                    // Verificar si ya no es Administrador y notificar al usuario
                    const wasAdmin = (storedUser.roles || []).some((r: string) => r.toLowerCase() === 'administrador' || r.toLowerCase() === 'admin');
                    const isNowAdmin = (freshUser?.roles || []).some((r: string) => r.toLowerCase() === 'administrador' || r.toLowerCase() === 'admin');

                    if (wasAdmin && !isNowAdmin) {
                        toast.error('Tus privilegios de Administrador han sido revocados.', {
                            description: 'Tu perfil fue actualizado en tiempo real a Usuario Regular.',
                        });
                    } else {
                        toast.error(detailMsg);
                    }
                } else {
                    toast.error('Sesión no autorizada. Redirigiendo...');
                    await logout();
                }
            } catch {
                await logout();
            }
        };

        window.addEventListener('auth:forbidden', handleForbidden);
        return () => window.removeEventListener('auth:forbidden', handleForbidden);
    }, [logout]);

    // ── Context value ──────────────────────────────────────────────────────────

    const value: AuthContextType = {
        user,
        guest,
        token,
        isLoading,
        isAuthenticating,
        isAuthenticated: Boolean((user && (token || getAuthToken())) || guest),
        isGuest: !user && !!guest,
        loginWithGoogle,
        loginWithEmail,
        loginAsGuest,
        logout,
        updateUserSession,
        refreshUserPermissions,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuthContext = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuthContext must be used inside <AuthProvider>');
    }
    return ctx;
};
