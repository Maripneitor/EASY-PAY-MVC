import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@infrastructure/localStorage/storage-keys';
import { clearAuthToken } from '@infrastructure/api/http-client';
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
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [guest, setGuest] = useState<GuestSession | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

    // ── Restore session from localStorage on mount ─────────────────────────────
    useEffect(() => {
        const syncSession = () => {
            try {
                const storedUser = authService.getStoredUser();
                const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                const storedGuest = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION);

                if (storedUser) {
                    setUser(storedUser);
                    setToken(storedToken);
                    setGuest(null);
                } else if (storedGuest) {
                    setUser(null);
                    setToken(null);
                    setGuest(JSON.parse(storedGuest));
                } else {
                    setUser(null);
                    setToken(null);
                    setGuest(null);
                }
            } catch {
                setUser(null);
                setToken(null);
                setGuest(null);
            } finally {
                setIsLoading(false);
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEYS.AUTH_USER || e.key === STORAGE_KEYS.AUTH_TOKEN || e.key === STORAGE_KEYS.GUEST_SESSION) {
                syncSession();
            }
        };

        syncSession();
        window.addEventListener('storage', handleStorageChange);
        
        return () => window.removeEventListener('storage', handleStorageChange);
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
                const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                setUser(storedUser);
                setToken(storedToken);
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

    // ── Context value ──────────────────────────────────────────────────────────

    const value: AuthContextType = {
        user,
        guest,
        token,
        isLoading,
        isAuthenticating,
        isAuthenticated: !!(user || guest),
        isGuest: !user && !!guest,
        loginWithGoogle,
        loginWithEmail,
        loginAsGuest,
        logout,
        updateUserSession,
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
