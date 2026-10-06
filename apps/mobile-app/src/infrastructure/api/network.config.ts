import Constants from 'expo-constants';

export function getApiBaseUrl(servicePort: number = 8001) {
    const fixPort = (url: string) => url.replace(':8001', `:${servicePort}`);

    let baseUrl = '';

    // 1. Producción o variable explícita (.env)
    if (process.env.EXPO_PUBLIC_API_URL) {
        baseUrl = process.env.EXPO_PUBLIC_API_URL;
    } 
    // 2. Detección automática en Browser/PWA
    else if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
        baseUrl = `http://${window.location.hostname}:8001`;
    }
    // 3. Detección automática en LAN
    else {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
            const ip = hostUri.split(':')[0];
            baseUrl = `http://${ip}:8001`;
        } else {
            baseUrl = `http://localhost:8001`;
        }
    }

    // Asegurar que termina en /api/
    if (!baseUrl.endsWith('/api/')) {
        baseUrl = baseUrl.endsWith('/api') ? `${baseUrl}/` : `${baseUrl}/api/`;
    }

    return servicePort === 8001 ? baseUrl : fixPort(baseUrl);
}

export const NETWORK_CONFIG = {
  get BASE_URL() {
    return getApiBaseUrl(8001);
  },
  SERVICE_PORTS: {
    AUTH: 8001,
    GROUPS: 8002,
    STATS: 8003,
    OCR: 8004,
    NOTIFICATIONS: 8005,
    WALLET: 8006,
  },
  TIMEOUT: 15000,
  ENDPOINTS: {
    AUTH: '/auth',
    USER: '/auth', 
    GROUPS: '/groups',
    STATS: '/stats',
    OCR: '/ocr',
    NOTIFICATIONS: '/notifications',
    WALLET: '/wallet',
  }
};
