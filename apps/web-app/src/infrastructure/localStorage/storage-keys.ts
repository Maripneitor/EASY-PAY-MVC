/**
 * Storage Keys
 *
 * Centralized constants for all localStorage keys used by Easy-Pay.
 * Prefixed with 'ep_' to avoid collisions with other apps on the same origin.
 * Versioned with 'v1' to allow future migrations.
 */
export const STORAGE_KEYS = {
    // ── Auth ──────────────────────────────────────────────────────────────────
    AUTH_TOKEN:     'ep_auth_token',
    AUTH_USER:      'ep_auth_user',
    GUEST_SESSION:  'ep_guest_session',

    // ── Groups ────────────────────────────────────────────────────────────────
    /** All groups cached locally for offline-first access */
    GROUPS_CACHE:   'ep_v1_groups_cache',
    /** Currently active group id */
    ACTIVE_GROUP:   'ep_v1_active_group',

    // ── App preferences ───────────────────────────────────────────────────────
    THEME:          'ep_theme',
    LAST_ROUTE:     'ep_last_route',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
