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
            // Data-only payload: no top-level `notification` key and no
            // `android.notification` block. This ensures FCM does NOT show a
            // system-level notification on Android, which would bypass the
            // service worker's onBackgroundMessage handler entirely.
            // The SW reads title/body/icon from `data` and calls
            // self.registration.showNotification() itself — giving us a
            // consistent, fully-customised notification on all platforms.
            data: stringifiedData,
            token: fcmToken,
            android: {
                priority: 'high',
                // No `notification` block here — keep this data-only so the
                // service worker's onBackgroundMessage fires on Android web.
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
