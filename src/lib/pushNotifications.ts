import { adminDb, adminMessaging } from './firebaseAdmin';

export async function sendPushNotification(email: string, title: string, body: string, data?: any, iconUrl?: string) {
    try {
        const userDoc = await adminDb.collection('users').doc(email).get();
        if (!userDoc.exists) {
            console.log(`User ${email} not found for push notification`);
            return;
        }

        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;

        if (!fcmToken) {
            console.log(`User ${email} has no FCM token`);
            return;
        }

        const notificationIcon = iconUrl || 'https://ourtab.vercel.app/icon-192.png';
        const stringifiedData: { [key: string]: string } = {};
        if (data) {
            Object.keys(data).forEach(key => {
                stringifiedData[key] = String(data[key]);
            });
        }

        // Include icon in data so the service worker can use it
        stringifiedData.icon = notificationIcon;
        stringifiedData.title = title;
        stringifiedData.body = body;

        const message: any = {
            // No top-level `notification` key: prevents FCM from showing a
            // *second* system-level notification alongside the one the service
            // worker shows in onBackgroundMessage (which would cause duplicates).
            // Android & iOS still get their native notification via the
            // platform-specific blocks below.
            data: stringifiedData,
            token: fcmToken,
            android: {
                priority: 'high',
                notification: {
                    title,
                    body,
                    sound: 'default',
                    channelId: 'default',
                    color: '#6C63FF',
                    image: notificationIcon
                },
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title, body },
                        sound: 'default',
                        contentAvailable: true,
                        mutableContent: true,
                    },
                },
                fcm_options: {
                    image: notificationIcon
                }
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                fcmOptions: {
                    link: '/notifications'
                }
            }
        };

        const response = await adminMessaging.send(message);
        console.log('Successfully sent push notification:', response);
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}
