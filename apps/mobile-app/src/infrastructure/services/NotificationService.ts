import { AppNotification, NotificationType } from './NotificationTypes';

export { AppNotification, NotificationType };

class NotificationService {
    static async notifyUserJoined(userName: string, groupName: string, groupId: string) {}
    static async notifyGroupClosed(groupName: string, amountOwed: number, groupId: string) {}
    static async notifyItemAssigned(itemName: string, amount: number, assignedBy: string, groupId: string) {}
    static async notifyPaymentDue(groupName: string, amountOwed: number, owedTo: string, groupId: string) {}
    static async notifyPaymentReceived(fromUser: string, amount: number, groupName: string, groupId: string) {}
    static async notifyInvitation(fromUser: string, groupName: string, groupId: string) {}
    static async setBadgeCount(count: number) {}
    static addNotificationReceivedListener(handler: any) { return { remove: () => {} }; }
    static addNotificationResponseListener(handler: any) { return { remove: () => {} }; }
}

export default NotificationService;
