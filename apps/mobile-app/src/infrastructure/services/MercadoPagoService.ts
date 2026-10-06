// ─── Configuración ───────────────────────────────────────────────────────────
const MP_PUBLIC_KEY = 'TEST-999731aa-b864-4ad0-b011-0cc5777a8779';
const MP_ACCESS_TOKEN = 'TEST-2534982372409312-042803-becc4ab738ab8959dd28ce2a02faffb0-132798166';
const MP_API = 'https://api.mercadopago.com';

export type MPPaymentMethod = 'card' | 'oxxo' | 'spei';

export interface MPCardData {
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
    cardholderName: string;
    docType: string;
    docNumber: string;
}

export interface MPPaymentResult {
    id: string;
    status: 'approved' | 'pending' | 'rejected' | 'in_process';
    statusDetail: string;
    paymentMethod: string;
    amount: number;
    // Para OXXO
    oxxoCode?: string;
    oxxoExpiresAt?: string;
    // Para SPEI
    clabe?: string;
    bankName?: string;
}

class MercadoPagoService {

    // ─── Tokenizar tarjeta ────────────────────────────────────────────────────
    static async createCardToken(card: MPCardData): Promise<string> {
        const response = await fetch(`${MP_API}/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                card_number: card.cardNumber.replace(/\s/g, ''),
                expiration_month: parseInt(card.expirationMonth),
                expiration_year: parseInt(card.expirationYear),
                security_code: card.securityCode,
                cardholder: {
                    name: card.cardholderName,
                    identification: {
                        type: card.docType,
                        number: card.docNumber,
                    },
                },
            }),
        });

        const data = await response.json();
        if (!response.ok || !data.id) {
            throw new Error(data.message ?? 'Error al tokenizar la tarjeta.');
        }
        return data.id;
    }

    // ─── Pago con tarjeta ─────────────────────────────────────────────────────
    static async payWithCard(
        amount: number,
        cardToken: string,
        payerEmail: string,
        description: string,
        installments: number = 1,
    ): Promise<MPPaymentResult> {
        const response = await fetch(`${MP_API}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': `easypay-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            },
            body: JSON.stringify({
                transaction_amount: amount,
                token: cardToken,
                description,
                installments,
                payment_method_id: 'visa', // Se detecta automáticamente del token
                payer: { email: payerEmail },
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'Error al procesar el pago.');

        return {
            id: String(data.id),
            status: data.status,
            statusDetail: data.status_detail,
            paymentMethod: data.payment_method_id,
            amount: data.transaction_amount,
        };
    }

    // ─── Pago en OXXO ─────────────────────────────────────────────────────────
    static async payWithOxxo(
        amount: number,
        payerEmail: string,
        payerName: string,
        description: string,
    ): Promise<MPPaymentResult> {
        const response = await fetch(`${MP_API}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': `easypay-oxxo-${Date.now()}`,
            },
            body: JSON.stringify({
                transaction_amount: amount,
                description,
                payment_method_id: 'oxxo',
                payer: {
                    email: payerEmail,
                    first_name: payerName.split(' ')[0],
                    last_name: payerName.split(' ').slice(1).join(' ') || payerName,
                },
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'Error al generar referencia OXXO.');

        return {
            id: String(data.id),
            status: data.status,
            statusDetail: data.status_detail,
            paymentMethod: 'oxxo',
            amount: data.transaction_amount,
            oxxoCode: data.point_of_interaction?.transaction_data?.barcode?.content,
            oxxoExpiresAt: data.date_of_expiration,
        };
    }

    // ─── Pago SPEI (Transferencia bancaria) ───────────────────────────────────
    static async payWithSpei(
        amount: number,
        payerEmail: string,
        description: string,
    ): Promise<MPPaymentResult> {
        const response = await fetch(`${MP_API}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': `easypay-spei-${Date.now()}`,
            },
            body: JSON.stringify({
                transaction_amount: amount,
                description,
                payment_method_id: 'clabe',
                payer: { email: payerEmail },
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'Error al generar CLABE.');

        return {
            id: String(data.id),
            status: data.status,
            statusDetail: data.status_detail,
            paymentMethod: 'clabe',
            amount: data.transaction_amount,
            clabe: data.point_of_interaction?.transaction_data?.bank_transfer_id
                ?? data.point_of_interaction?.transaction_data?.financial_institution,
            bankName: 'STP',
        };
    }

    // ─── Consultar estado de pago ─────────────────────────────────────────────
    static async getPaymentStatus(paymentId: string): Promise<string> {
        const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
        });
        const data = await response.json();
        return data.status ?? 'unknown';
    }

    // ─── Formatear número de tarjeta ──────────────────────────────────────────
    static formatCardNumber(value: string): string {
        return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    }

    static formatExpiry(value: string): string {
        const clean = value.replace(/\D/g, '').slice(0, 4);
        if (clean.length >= 2) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
        return clean;
    }

    static detectCardBrand(number: string): string {
        const n = number.replace(/\s/g, '');
        if (/^4/.test(n)) return 'visa';
        if (/^5[1-5]/.test(n)) return 'mastercard';
        if (/^3[47]/.test(n)) return 'amex';
        return 'credit-card';
    }
}

export default MercadoPagoService;
