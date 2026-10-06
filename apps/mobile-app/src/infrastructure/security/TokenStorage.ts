import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Securely handles authentication tokens in Mobile using Keychain/Keystore.
 */
export class TokenStorage {
    static async setToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }

    static async getToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    }

    static async setRefreshToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }

    static async getRefreshToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }

    static async clear(): Promise<void> {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
}
