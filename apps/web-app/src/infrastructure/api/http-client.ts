import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { STORAGE_KEYS } from '../localStorage/storage-keys';

// ─── Token helpers in-memory y persistencia segura de sesión ─────────────────
let inMemoryAccessToken: string | null = null;

export const setAuthToken = (token: string): void => {
    inMemoryAccessToken = token;
    try {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch {}
};

export const clearAuthToken = (): void => {
    inMemoryAccessToken = null;
    try {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {}
};

export const getAuthToken = (): string | null => {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (stored) {
            inMemoryAccessToken = stored;
            return stored;
        }
    } catch {}
    return null;
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
    withCredentials: true, // Envía cookies HttpOnly (refresh token) para prevenir XSS
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

// ─── Variables para Silent Refresh con Cola de Peticiones ────────────────────
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ─── Response interceptor — Silent Refresh y normalización de errores ─────────
httpClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                               originalRequest?.url?.includes('/auth/register') ||
                               originalRequest?.url?.includes('/auth/refresh');

        // Captura de 401 Unauthorized para renovación silenciosa de token
        if (error.response?.status === 401 && !isAuthEndpoint && originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return httpClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Petición a /auth/refresh con credenciales para enviar la cookie HttpOnly
                const refreshResponse = await axios.post<{
                    status: string;
                    access_token?: string;
                    user?: any;
                }>(
                    `${httpClient.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const data = refreshResponse.data;
                if (data.status === 'success' && data.access_token) {
                    const newToken = data.access_token;
                    setAuthToken(newToken);
                    if (data.user) {
                        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
                    }

                    processQueue(null, newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return httpClient(originalRequest);
                } else {
                    throw new Error('No se pudo renovar la sesión.');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAuthToken();
                localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
                localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
                window.location.href = '/autenticacion';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Captura de 403 Forbidden por revocación o cambio de roles/permisos
        if (error.response?.status === 403) {
            const forbiddenMessage =
                (error.response?.data as any)?.detail ??
                (error.response?.data as any)?.message ??
                'Acceso denegado por políticas de permisos o cambio de rol.';

            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('auth:forbidden', {
                        detail: {
                            status: 403,
                            message: forbiddenMessage,
                            url: originalRequest?.url,
                        },
                    })
                );
            }
        }

        // Normalización del mensaje de error
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
