import { httpClient } from '../api/http-client';
import { TokenStorage } from '../security/TokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../domain/types';

export interface LoginResponse {
    status: 'success' | 'error' | '2fa_required' | 'not_verified';
    message: string;
    access_token?: string;
    user?: {
        id?: string;
        _id?: string;
        nombre: string;
        email: string;
    };
    user_id?: string;
    email?: string;
}

class AuthService {
    async login(identifier: string, password: string): Promise<LoginResponse> {
        try {
            const response = await httpClient.post<LoginResponse>('/auth/login', {
                identifier,
                password
            });
            return response.data;
        } catch (error: any) {
            console.error('[AuthService] Mobile Login failed:', error);
            throw error;
        }
    }

    async saveSession(token: string, user: User): Promise<void> {
        await TokenStorage.setToken(token);
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
    }

    async clearSession(): Promise<void> {
        await TokenStorage.clear();
        await AsyncStorage.removeItem('user_data');
    }
}

export const authService = new AuthService();
