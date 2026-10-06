import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TokenStorage } from '../security/TokenStorage';

import { NETWORK_CONFIG, getApiBaseUrl } from './network.config';

const getAuthToken = async (): Promise<string | null> => {
    return await TokenStorage.getToken();
};


// URL de la API — Usando la configuración de red centralizada
const API_BASE_URL = NETWORK_CONFIG.BASE_URL;

export const httpClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10_000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

httpClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        let url = config.url || '';
        
        // Normalize URL to not start with / (avoids Axios ignoring baseURL path)
        if (url.startsWith('/')) {
            url = url.substring(1);
            config.url = url;
        }

        // --- Microservices Logic: Route to correct port based on path ---
        let port = NETWORK_CONFIG.SERVICE_PORTS.AUTH; // Default 8001

        const path = url.toLowerCase();
        if (path.startsWith('groups')) port = NETWORK_CONFIG.SERVICE_PORTS.GROUPS;
        else if (path.startsWith('stats')) port = NETWORK_CONFIG.SERVICE_PORTS.STATS;
        else if (path.startsWith('ocr')) port = NETWORK_CONFIG.SERVICE_PORTS.OCR;
        else if (path.startsWith('notifications')) port = NETWORK_CONFIG.SERVICE_PORTS.NOTIFICATIONS;
        else if (path.startsWith('wallet')) port = NETWORK_CONFIG.SERVICE_PORTS.WALLET;
        else if (path.startsWith('auth')) port = NETWORK_CONFIG.SERVICE_PORTS.AUTH;

        // Update baseURL dynamically
        const dynamicBaseURL = getApiBaseUrl(port);
        config.baseURL = dynamicBaseURL;
        
        if (__DEV__) {
            console.log(`[HTTP] ${config.method?.toUpperCase()} ${url} -> Port: ${port} (Base: ${dynamicBaseURL})`);
        }

        // No enviar token en peticiones de login o registro
        const isAuthPath = url.includes('auth/login') || url.includes('auth/register');
        
        if (!isAuthPath) {
            const token = await getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

httpClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
        if (error.response?.status === 401) {
            await TokenStorage.clear();
            await AsyncStorage.removeItem('user_data');
        }

        return Promise.reject(error);
    }
);
