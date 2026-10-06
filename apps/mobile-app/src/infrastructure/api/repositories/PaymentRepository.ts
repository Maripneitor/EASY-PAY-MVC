import { httpClient } from '../http-client';
import { NETWORK_CONFIG } from '../network.config';

class PaymentRepository {
    async getCards(userId: string): Promise<any[]> {
        const response = await httpClient.get(`${NETWORK_CONFIG.ENDPOINTS.USER}/cards/${userId}`);
        return response.data;
    }

    async addCard(userId: string, card: any): Promise<void> {
        await httpClient.post(`${NETWORK_CONFIG.ENDPOINTS.USER}/cards/${userId}`, card);
    }

    async removeCard(userId: string, cardId: string): Promise<void> {
        await httpClient.delete(`${NETWORK_CONFIG.ENDPOINTS.USER}/cards/${userId}/${cardId}`);
    }

    async setDefaultCard(userId: string, cardId: string): Promise<void> {
        await httpClient.patch(`${NETWORK_CONFIG.ENDPOINTS.USER}/cards/${userId}/${cardId}/default`);
    }

    async getStats(userId: string): Promise<any> {
        const response = await httpClient.get(`/stats/user/${userId}`);
        return response.data;
    }

    async getTransactions(userId: string): Promise<any[]> {
        const response = await httpClient.get(`/stats/user/${userId}/transactions`);
        return response.data;
    }
}

export const paymentRepository = new PaymentRepository();
