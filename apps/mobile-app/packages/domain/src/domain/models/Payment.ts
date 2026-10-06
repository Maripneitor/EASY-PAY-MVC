/** Payment entity — records a payment made by a member within a group. */

export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Payment {
    id: string;
    groupId: string;
    memberId: string;
    amount: number;
    status: PaymentStatus;
    paidAt?: string;        // ISO 8601 date string (set when status = 'completed')
    description?: string;
}
