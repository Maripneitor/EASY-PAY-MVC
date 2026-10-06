import { httpClient } from '../http-client';
import { NETWORK_CONFIG } from '../network.config';

export interface UserStats {
    total_spent: number;
    categories: {
        name: string;
        amount: number;
        color: string;
    }[];
    monthly_activity: {
        month: string;
        amount: number;
    }[];
}

class StatsRepository {
    async getUserStats(userId: string): Promise<UserStats> {
        try {
            const response = await httpClient.get(`${NETWORK_CONFIG.ENDPOINTS.STATS}/user/${userId}/charts`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw error;
        }
    }
}

export const statsRepository = new StatsRepository();
