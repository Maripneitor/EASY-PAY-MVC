import { httpClient } from '../http-client';

class PaymentRepository {
    async getCards(userId: string): Promise<any[]> {
        const response = await httpClient.get(`/auth/cards/${userId}`);
        return response.data;
    }

    async addCard(userId: string, card: any): Promise<void> {
        await httpClient.post(`/auth/cards/${userId}`, card);
    }

    async removeCard(userId: string, cardId: string): Promise<void> {
        await httpClient.delete(`/auth/cards/${userId}/${cardId}`);
    }

    async setDefaultCard(userId: string, cardId: string): Promise<void> {
        await httpClient.patch(`/auth/cards/${userId}/${cardId}/default`);
    }
}

export const paymentRepository = new PaymentRepository();
