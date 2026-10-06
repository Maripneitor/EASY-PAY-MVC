import { httpClient } from '../http-client';
import { NETWORK_CONFIG } from '../network.config';

class UserRepository {
    async register(data: any): Promise<any> {
        const response = await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/register`, data);
        return response.data;
    }

    async login(data: any): Promise<any> {
        const response = await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/login`, data);
        return response.data;
    }

    async updateUser(data: any): Promise<any> {
        // ✅ Usamos el endpoint seguro que extrae el ID del Token
        const response = await httpClient.put(`${NETWORK_CONFIG.ENDPOINTS.USER}/update`, data);
        return response.data;
    }

    async toggleTwoFactor(enabled: boolean): Promise<any> {
        const response = await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/2fa/toggle`, {
            enabled
        });
        return response.data;
    }

    async changePassword(userId: string, data: any): Promise<any> {
        const response = await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/change-password/${userId}`, data);
        return response.data;
    }

    async setupTwoFactor(userId: string): Promise<any> {
        const response = await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/2fa/setup/${userId}`);
        return response.data;
    }

    async verifyTwoFactor(userId: string, code: string): Promise<any> {
        // Soporte para ambos formatos (un argumento o dos) para retrocompatibilidad
        const payload = typeof code === 'undefined' ? { code: userId } : { code };
        const id = typeof code === 'undefined' ? 'me' : userId;
        
        const response = await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/2fa/verify/${id}`, payload);
        return response.data;
    }

    async requestPasswordReset(email: string): Promise<any> {
        const response = await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/request-password-reset`, {
            email
        });
        return response.data;
    }

    async getUserProfile(userId: string): Promise<any> {
        const response = await httpClient.get(`${NETWORK_CONFIG.ENDPOINTS.USER}/profile/${userId}`);
        return response.data;
    }
}

export const userRepository = new UserRepository();
