import { Group } from '@easy-pay/domain';

type GroupUpdateCallback = (group: Group) => void;
type Unsubscribe = () => void;

const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws';

// ─── Reconnection config ──────────────────────────────────────────────────────
const RECONNECT_DELAY_MS   = 3_000;
const MAX_RECONNECT_ATTEMPTS = 5;

// ─── WebSocket client ─────────────────────────────────────────────────────────

/**
 * Opens a WebSocket connection for a specific group and calls `callback`
 * whenever the server broadcasts a group update.
 *
 * Handles:
 *  - Automatic JSON parsing of incoming messages
 *  - Reconnection with exponential backoff (up to MAX_RECONNECT_ATTEMPTS)
 *  - Clean teardown via the returned unsubscribe function
 *
 * @returns Unsubscribe function — call it in useEffect cleanup.
 *
 * Example:
 *   const unsub = subscribeToGroup('abc123', (group) => setGroup(group));
 *   return () => unsub();
 */
export const subscribeToGroup = (
    groupId: string,
    callback: GroupUpdateCallback
): Unsubscribe => {
    let ws: WebSocket | null = null;
    let attempts = 0;
    let destroyed = false;

    const connect = () => {
        if (destroyed) return;

        const url = `${WS_BASE_URL}/groups/${groupId}`;
        ws = new WebSocket(url);

        ws.onopen = () => {
            attempts = 0; // Reset on successful connection
            console.info(`[ws] Connected to group ${groupId}`);
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data as string) as Group;
                callback(data);
            } catch {
                console.warn('[ws] Failed to parse message:', event.data);
            }
        };

        ws.onclose = (event) => {
            if (destroyed) return;

            console.warn(`[ws] Disconnected from group ${groupId} (code: ${event.code})`);

            if (attempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = RECONNECT_DELAY_MS * Math.pow(2, attempts); // Exponential backoff
                attempts++;
                console.info(`[ws] Reconnecting in ${delay}ms (attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                setTimeout(connect, delay);
            } else {
                console.error('[ws] Max reconnect attempts reached. Giving up.');
            }
        };

        ws.onerror = (error) => {
            console.error('[ws] Error:', error);
        };
    };

    connect();

    // Return unsubscribe / cleanup function
    return () => {
        destroyed = true;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Unsubscribed');
        }
        ws = null;
    };
};
