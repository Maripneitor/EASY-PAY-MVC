import { httpClient } from '../http-client';

class StatsRepository {
    async getGlobalStats(): Promise<any> {
        const response = await httpClient.get(`/stats/global`);
        return response.data;
    }

    async getUserStats(userId: string): Promise<any> {
        const response = await httpClient.get(`/stats/user/${userId}`);
        return response.data;
    }

    async getUserCharts(userId: string): Promise<any> {
        const response = await httpClient.get(`/stats/user/${userId}/charts`);
        return response.data;
    }

    async getGroupStats(groupId: string): Promise<any> {
        const response = await httpClient.get(`/stats/group/${groupId}`);
        return response.data;
    }

    async getUserTransactions(userId: string): Promise<any> {
        const response = await httpClient.get(`/stats/user/${userId}/transactions`);
        return response.data;
    }
}

export const statsRepository = new StatsRepository();
