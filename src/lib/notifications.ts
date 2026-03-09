import { adminDb } from '@/lib/firebaseAdmin';
import { AppNotification } from '@/types/notification';
import { sendPushNotification } from './pushNotifications';

export async function createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    try {
        const newDoc: Omit<AppNotification, 'id'> = {
            ...notification,
            read: false,
            createdAt: new Date().toISOString()
        };
        await adminDb.collection('notifications').add(newDoc);

        // Fetch current unread count to update badge
        const unreadSnap = await adminDb.collection('notifications')
            .where('userId', '==', notification.userId)
            .where('read', '==', false)
            .get();
        const badgeCount = unreadSnap.size;

        // Send push notification
        const pushTitle = notification.title || (notification.senderName ? `${notification.senderName}` : 'House Update');
        const pushBody = notification.message;
        const iconUrl = notification.senderPhotoUrl;
        await sendPushNotification(notification.userId, pushTitle, pushBody, null, iconUrl, badgeCount);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}
