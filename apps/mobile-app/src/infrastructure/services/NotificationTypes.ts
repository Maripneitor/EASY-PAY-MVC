export type NotificationType =
    | 'user_joined'
    | 'group_closed'
    | 'item_assigned'
    | 'payment_due'
    | 'payment_received'
    | 'invitation';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    timestamp: number;
    read: boolean;
    icon?: string;
    iconColor?: string;
    amount?: string;
    userName?: string;
    groupName?: string;
    avatar?: string;
    route?: string;
}
