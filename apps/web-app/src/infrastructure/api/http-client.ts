import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { STORAGE_KEYS } from '../localStorage/storage-keys';

// ─── Token helpers ────────────────────────────────────────────────────────────
const AUTH_TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;

export const setAuthToken = (token: string): void => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
};

const getAuthToken = (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
};

// ─── Axios instance ───────────────────────────────────────────────────────────
// El proxy de Vite (vite.config.ts) redirige /api/* a los microservicios en 127.0.0.1.
// Usamos ruta relativa para que funcione sin importar el puerto de Vite (5173 o 5174).
const getDynamicApiUrl = () => {
    const url = import.meta.env.VITE_API_BASE_URL;
    // Si hay una URL externa configurada (ej: para producción), usarla.
    // Si no, usar ruta relativa para aprovechar el proxy de Vite.
    if (url && !url.startsWith('/') && !url.includes('localhost')) {
        return url.replace(/\/api\/?$/, '') + '/api';
    }
    return '/api';
};

export const httpClient: AxiosInstance = axios.create({
    baseURL: getDynamicApiUrl(),
    timeout: 10_000,
    headers: {
        'Content-Type': 'application/json',
        'Accept':        'application/json',
    },
});

// ─── Request interceptor — inject Authorization header ────────────────────────
httpClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// ─── Response interceptor — normalize errors ──────────────────────────────────
httpClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/register');
        
        if (error.response?.status === 401 && !isAuthEndpoint) {
            // Token expired or invalid — clear full session and redirect to auth
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
            window.location.href = '/autenticacion';
        }

        // Normalize error message for UI consumption
        const responseData = error.response?.data;
        const message =
            (responseData as any)?.detail ??
            (responseData as any)?.message ??
            (typeof responseData === 'string' ? responseData : null) ??
            error.message ??
            'Error desconocido';

        console.error('HTTP Client Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: responseData,
            message: message
        });

        return Promise.reject(new Error(message));
    }
);
