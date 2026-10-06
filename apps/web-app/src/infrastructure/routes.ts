/**
 * Centralización de rutas de la aplicación para facilitar la internacionalización
 * y el mantenimiento de enlaces.
 */
export const ROUTES = {
    // Públicas
    LANDING: '/',
    AUTH: '/autenticacion',
    RECOVER_PASSWORD: '/recuperar-password',
    RESET_PASSWORD: '/restablecer-password',
    QR_SCANNER: '/escaner-qr',
    TWO_FACTOR_SETUP: '/configurar-2fa',
    TWO_FACTOR_VERIFY: '/verificar-2fa',

    // Protegidas (Dashboard)
    DASHBOARD: '/panel',
    GROUPS: '/grupos',
    CREATE_GROUP: '/crear-grupo',
    GROUP_DETAIL: (id: string) => `/grupo/${id}`,
    REGISTER_EXPENSE: (groupId: string) => `/grupo/${groupId}/registrar-gasto`,
    EDIT_EXPENSE: (groupId: string, itemId: string) => `/grupo/${groupId}/editar-item/${itemId}`,
    SETTLE_UP: (id: string) => `/grupo/${id}/liquidar`,
    STATS: '/estadisticas',
    PROFILE: '/perfil',
    CHANGE_PASSWORD: '/cambiar-password',
    PERSONAL_DATA: '/perfil/datos-personales',
    OCR_SCANNER: '/escaner-ocr',
    ADMIN: '/admin',
} as const;

export type RouteKey = keyof typeof ROUTES;
