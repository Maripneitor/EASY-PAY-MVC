import { httpClient, setAuthToken, clearAuthToken } from '../infrastructure/api/http-client';
import { STORAGE_KEYS } from '../infrastructure/localStorage/storage-keys';

export interface User {
    id: string;
    nombre: string;
    email: string;
    avatarUrl?: string;
    financial_profile?: {
        beneficiario?: string;
        clabe?: string;
        entidad_financiera?: string;
    };
    roles?: string[];
    permissions?: string[];
    [key: string]: any;
}

export interface LoginResponse {
    status: 'success' | 'error' | '2fa_required' | 'not_verified';
    message: string;
    access_token?: string;
    user?: User;
    user_id?: string;
}

class AuthService {
    async login(identifier: string, password: string): Promise<LoginResponse> {
        try {
            const response = await httpClient.post<LoginResponse>('/auth/login', {
                identifier,
                password
            });
            
            const data = response.data;
            
            if (data.status === 'success' && data.access_token && data.user) {
                this.persistSession(data.access_token, data.user);
            }
            
            return data;
        } catch (error: any) {
            console.error('[AuthService] Login failed:', error);
            throw error;
        }
    }

    persistSession(token: string, user: User): void {
        setAuthToken(token);
        this.updateUserSession(user);
    }

    updateUserSession(user: User): void {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify({
            ...user,
            name: user.nombre || user.name, // Support both formats
            avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || user.name || 'U')}`
        }));
    }

    clearSession(): void {
        clearAuthToken();
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
    }

    getStoredUser(): User | null {
        const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
        return stored ? JSON.parse(stored) : null;
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const response = await httpClient.get<User>('/auth/me');
            if (response.data) {
                this.updateUserSession(response.data);
                return response.data;
            }
        } catch (error) {
            console.warn('[AuthService] Error fetching /auth/me:', error);
        }
        return null;
    }

    async refreshProfile(userId: string): Promise<User | null> {
        try {
            const response = await httpClient.get<User>(`/auth/profile/${userId}`);
            if (response.data) {
                this.updateUserSession(response.data);
                return response.data;
            }
        } catch (error) {
            console.warn(`[AuthService] Error fetching profile for ${userId}:`, error);
        }
        return null;
    }

    async refreshToken(): Promise<{ status: string; access_token?: string; user?: User } | null> {
        try {
            const response = await httpClient.post<{ status: string; access_token?: string; user?: User }>('/auth/refresh');
            if (response.data && response.data.status === 'success' && response.data.access_token) {
                setAuthToken(response.data.access_token);
                if (response.data.user) {
                    this.updateUserSession(response.data.user);
                }
                return response.data;
            }
        } catch (error) {
            console.warn('[AuthService] Error in refreshToken:', error);
        }
        return null;
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    }
}

export const authService = new AuthService();
