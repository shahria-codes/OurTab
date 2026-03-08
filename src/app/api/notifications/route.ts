import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { AppNotification } from '@/types/notification';
import { sendPushNotification } from '@/lib/pushNotifications';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    try {
        // --- 1. Birthday Check Logic (Removed) ---
        // Moved to a scheduled Firebase Cloud Function to ensure precise local timezone delivery. 
        // See functions/src/index.ts

        // --- 2. Fetch Notifications & Cleanup ---
        const snapshot = await adminDb
            .collection('notifications')
            .where('userId', '==', userId)
            .get();

        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

        const toDeleteIds: string[] = [];
        const keptNotifications: AppNotification[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data() as AppNotification;
            const createdAt = data.createdAt || '';
            const isRead = data.read || false;

            // Delete logic: read > 12h, unread > 2 days
            const shouldDelete = isRead ? createdAt < twelveHoursAgo : createdAt < twoDaysAgo;

            if (shouldDelete) {
                toDeleteIds.push(doc.id);
            } else {
                keptNotifications.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // Trigger background cleanup if there are things to delete
        if (toDeleteIds.length > 0) {
            (async () => {
                try {
                    // Firebase batch limited to 500 items
                    for (let i = 0; i < toDeleteIds.length; i += 500) {
                        const batch = adminDb.batch();
                        const chunk = toDeleteIds.slice(i, i + 500);
                        chunk.forEach(id => {
                            batch.delete(adminDb.collection('notifications').doc(id));
                        });
                        await batch.commit();
                    }
                } catch (e) {
                    console.error('Error during notification cleanup batch:', e);
                }
            })();
        }

        // Sort by createdAt desc in memory
        keptNotifications.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

        // Return top 50
        const notifications = keptNotifications.slice(0, 50);

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { notificationIds, ids, markAllRead, userId, read } = body;

        // Use notificationIds if ids is not provided (for compatibility with useNotifications.ts)
        const targetIds = notificationIds || ids;

        if (markAllRead && userId) {
            const batch = adminDb.batch();
            const unreadSnap = await adminDb
                .collection('notifications')
                .where('userId', '==', userId)
                .where('read', '==', false)
                .get();

            unreadSnap.docs.forEach((doc) => {
                batch.update(doc.ref, { read: true });
            });

            await batch.commit();
            return NextResponse.json({ success: true, count: unreadSnap.size });
        }

        if (targetIds && Array.isArray(targetIds)) {
            const batch = adminDb.batch();
            targetIds.forEach((id: string) => {
                const ref = adminDb.collection('notifications').doc(id);
                // Default to true if read is not provided
                batch.update(ref, { read: read !== undefined ? read : true });
            });
            await batch.commit();
            return NextResponse.json({ success: true, count: targetIds.length });
        }

        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
        return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    try {
        await adminDb.collection('notifications').doc(notificationId).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
