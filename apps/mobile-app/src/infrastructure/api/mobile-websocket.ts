import { getApiBaseUrl } from './network.config';

class MobileWebSocketClient {
    private ws: WebSocket | null = null;
    private baseURL: string;
    private listeners: Map<string, ((data: any) => void)[]> = new Map();
    private reconnectTimer: any = null;
    private currentGroupId: string | null = null;
    private currentToken: string | null = null;

    constructor() {
        // Obtenemos la base pero sin el /api/ final para construir la ruta manual
        let apiBase = getApiBaseUrl(8002); // El microservicio de grupos está en el 8002
        if (apiBase.endsWith('/api/')) {
            apiBase = apiBase.slice(0, -5);
        } else if (apiBase.endsWith('/api')) {
            apiBase = apiBase.slice(0, -4);
        }
        this.baseURL = apiBase.replace(/^http/, 'ws');
    }

    connect(groupId: string, token: string) {
        if (this.ws) this.disconnect();
        this.currentGroupId = groupId;
        this.currentToken = token;

        // La ruta completa debe ser /api/groups/ws/ID
        const wsUrl = `${this.baseURL}/api/groups/ws/${groupId}?token=${token}`;
        console.info(`[WS-Mobile] Conectando a: ${wsUrl}`);
        
        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log(`[WS] ✅ Conectado al grupo: ${groupId}`);
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Match the backend format: { "type": "...", "data": {...} }
                    const eventType = data.type;
                    const payload = data.data;

                    const eventListeners = this.listeners.get(eventType);
                    if (eventListeners) {
                        eventListeners.forEach(cb => cb(payload));
                    }
                    
                    // Fallback for general updates
                    const allListeners = this.listeners.get('*');
                    if (allListeners) {
                        allListeners.forEach(cb => cb(data));
                    }
                } catch (err) {
                    console.error("[WS] Error parseando mensaje", err);
                }
            };

            this.ws.onerror = (e) => {
                console.error(`[WS] ❌ Error en conexión:`, e);
            };

            this.ws.onclose = (e) => {
                console.log(`[WS] 🔌 Conexión cerrada para grupo: ${groupId}. Reintentando en 5s...`);
                this.scheduleReconnect();
            };
        } catch (e) {
            console.error("[WS] Error al crear WebSocket:", e);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.currentGroupId && this.currentToken) {
                this.connect(this.currentGroupId, this.currentToken);
            }
        }, 5000);
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    disconnect() {
        this.currentGroupId = null;
        this.currentToken = null;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const wsClient = new MobileWebSocketClient();
