import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const STORAGE_KEY = 'easypay_notifications';

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

interface NotificationContextType {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    hasAlerts: boolean;
    setHasAlerts: (has: boolean) => void;
    notifications: AppNotification[];
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    notifyUserJoined: (userName: string, groupName: string, groupId: string) => void;
    notifyGroupClosed: (groupName: string, amountOwed: number, groupId: string) => void;
    notifyItemAssigned: (itemName: string, amount: number, assignedBy: string, groupId: string) => void;
    notifyPaymentDue: (groupName: string, amountOwed: number, owedTo: string, groupId: string) => void;
    notifyPaymentReceived: (fromUser: string, amount: number, groupName: string, groupId: string) => void;
    notifyInvitation: (fromUser: string, groupName: string, groupId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function makeId() {
    return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function timeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(stored => {
            if (stored) setNotifications(JSON.parse(stored));
        }).catch(() => {});
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(() => {});
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const hasAlerts = unreadCount > 0;

    const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        setNotifications(prev => [{
            ...n,
            id: makeId(),
            timestamp: Date.now(),
            read: false,
        }, ...prev]);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => setNotifications([]), []);

    const notifyUserJoined = (userName: string, groupName: string, groupId: string) => {
        addNotification({ type: 'user_joined', title: '👥 Nuevo integrante',
            body: `${userName} se unió a "${groupName}"`,
            userName, groupName, icon: 'person-add', iconColor: '#60a5fa',
            route: '/(tabs)/group', data: { groupId } });
    };

    const notifyGroupClosed = (groupName: string, amountOwed: number, groupId: string) => {
        addNotification({ type: 'group_closed', title: '🔒 Grupo cerrado',
            body: `Tu parte en "${groupName}": $${amountOwed.toFixed(2)}`,
            groupName, amount: `$${amountOwed.toFixed(2)}`,
            icon: 'lock', iconColor: '#f97316',
            route: '/(tabs)/payments', data: { groupId, amountOwed } });
    };

    const notifyItemAssigned = (itemName: string, amount: number, assignedBy: string, groupId: string) => {
        addNotification({ type: 'item_assigned', title: '🍽️ Item asignado',
            body: `${assignedBy} te asignó "${itemName}" — $${amount.toFixed(2)}`,
            userName: assignedBy, amount: `$${amount.toFixed(2)}`,
            icon: 'restaurant', iconColor: '#fb923c',
            route: '/(tabs)/group', data: { groupId, amount } });
    };

    const notifyPaymentDue = (groupName: string, amountOwed: number, owedTo: string, groupId: string) => {
        addNotification({ type: 'payment_due', title: '💸 Debes pagar',
            body: `Debes $${amountOwed.toFixed(2)} a ${owedTo} por "${groupName}"`,
            groupName, amount: `$${amountOwed.toFixed(2)}`, userName: owedTo,
            icon: 'payment', iconColor: '#ef4444',
            route: '/(tabs)/payments', data: { groupId, amountOwed, owedTo } });
    };

    const notifyPaymentReceived = (fromUser: string, amount: number, groupName: string, groupId: string) => {
        addNotification({ type: 'payment_received', title: '✅ Pago recibido',
            body: `${fromUser} te pagó $${amount.toFixed(2)} por "${groupName}"`,
            userName: fromUser, amount: `+$${amount.toFixed(2)}`, groupName,
            icon: 'attach-money', iconColor: '#4ade80',
            route: '/(tabs)/payments', data: { groupId, amount } });
    };

    const notifyInvitation = (fromUser: string, groupName: string, groupId: string) => {
        addNotification({ type: 'invitation', title: '📩 Invitación',
            body: `${fromUser} te invitó al grupo "${groupName}"`,
            userName: fromUser, groupName, icon: 'mail', iconColor: '#a78bfa',
            route: '/(tabs)/notifications', data: { groupId } });
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount, setUnreadCount: () => {},
            hasAlerts, setHasAlerts: () => {},
            notifications, addNotification,
            markAsRead, markAllAsRead, removeNotification, clearAll,
            notifyUserJoined, notifyGroupClosed, notifyItemAssigned,
            notifyPaymentDue, notifyPaymentReceived, notifyInvitation,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};