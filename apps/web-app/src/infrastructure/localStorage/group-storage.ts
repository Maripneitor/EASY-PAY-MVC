import { Group } from '@easy-pay/domain';
import { STORAGE_KEYS } from './storage-keys';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupsCache {
    groups: Group[];
    cachedAt: string; // ISO 8601
}

// ─── Cache TTL ────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isCacheValid = (cachedAt: string): boolean => {
    const age = Date.now() - new Date(cachedAt).getTime();
    return age < CACHE_TTL_MS;
};

// ─── Group Storage API ────────────────────────────────────────────────────────

/**
 * Saves the groups list to localStorage for offline-first access.
 */
export const saveGroupsToStorage = (groups: Group[]): void => {
    try {
        const cache: GroupsCache = {
            groups,
            cachedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.GROUPS_CACHE, JSON.stringify(cache));
    } catch (error) {
        console.warn('[group-storage] Failed to save groups:', error);
    }
};

/**
 * Retrieves cached groups from localStorage.
 * Returns null if the cache is missing, invalid JSON, or older than TTL.
 */
export const getGroupsFromStorage = (): Group[] | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.GROUPS_CACHE);
        if (!raw) return null;

        const cache = JSON.parse(raw) as GroupsCache;

        if (!isCacheValid(cache.cachedAt)) {
            console.info('[group-storage] Cache expired — fetching fresh data.');
            clearGroupsCache();
            return null;
        }

        return cache.groups;
    } catch {
        console.warn('[group-storage] Corrupt cache — clearing.');
        clearGroupsCache();
        return null;
    }
};

/**
 * Saves a single group (upsert) into the local cache.
 * Used when receiving real-time WebSocket updates in offline-first mode.
 */
export const upsertGroupInStorage = (updatedGroup: Group): void => {
    try {
        const existing = getGroupsFromStorage() ?? [];
        const idx = existing.findIndex(g => g.id === updatedGroup.id);

        if (idx >= 0) {
            existing[idx] = updatedGroup;
        } else {
            existing.push(updatedGroup);
        }

        saveGroupsToStorage(existing);
    } catch (error) {
        console.warn('[group-storage] Failed to upsert group:', error);
    }
};

/**
 * Returns a single cached group by id, or null if not found.
 */
export const getGroupFromStorage = (groupId: string): Group | null => {
    const groups = getGroupsFromStorage();
    return groups?.find(g => g.id === groupId) ?? null;
};

/**
 * Removes the groups cache entirely.
 */
export const clearGroupsCache = (): void => {
    localStorage.removeItem(STORAGE_KEYS.GROUPS_CACHE);
};

/**
 * Saves the active group id so the app can restore it after a refresh.
 */
export const setActiveGroupId = (groupId: string | null): void => {
    if (groupId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, groupId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP);
    }
};

export const getActiveGroupId = (): string | null =>
    localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP);
