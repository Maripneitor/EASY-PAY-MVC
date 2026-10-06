import { httpClient } from '../http-client';

export interface OcrResult {
    success: boolean;
    scan_id: string;
    data: {
        restaurant_name: string;
        items: Array<{
            name: string;
            price: number;
            quantity: number;
        }>;
        subtotal: number;
        tax: number;
        tip: number;
        total: number;
        raw_text: string;
    };
}

class OcrRepository {
    async scanTicket(base64Image: string, groupId?: string, userId?: string): Promise<OcrResult> {
        const response = await httpClient.post('/ocr/scan', {
            image_base64: base64Image,
            group_id: groupId,
            user_id: userId
        });
        return response.data;
    }

    async getHistory(groupId: string) {
        const response = await httpClient.get(`/ocr/history/${groupId}`);
        return response.data;
    }

    async deleteScan(scanId: string) {
        const response = await httpClient.delete(`/ocr/scan/${scanId}`);
        return response.data;
    }
}

export const ocrRepository = new OcrRepository();
