export async function GET() {
    const script = `
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: '${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}',
    authDomain: '${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}',
    projectId: '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}',
    storageBucket: '${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}',
    messagingSenderId: '${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}',
    appId: '${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Use title/body/icon from data (set by server) since we send data-only
    // messages to avoid FCM showing a duplicate system notification.
    const notificationTitle = payload.data?.title || payload.notification?.title || 'OurTab';
    const notificationOptions = {
        body: payload.data?.body || payload.notification?.body || '',
        icon: payload.data?.icon || '/icon-192.png',
        badge: '/icon-192.png',
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = '/notifications';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, navigate it to /notifications and focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('navigate' in client) {
                    return client.navigate(targetUrl).then((c) => c && c.focus());
                }
            }
            // No open window — open a new one
            return clients.openWindow(targetUrl);
        })
    );
});
`;

    return new Response(script, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache, max-age=0' // Ensure SW is always fresh
        }
    });
}
