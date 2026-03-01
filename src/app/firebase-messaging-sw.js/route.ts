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

// Note: We DO NOT provide \`messaging.onBackgroundMessage\` here.
// Omitting it allows the Firebase SDK to automatically display a notification
// when the app is in the background, fully utilizing the 'notification' 
// payload from the server. This fixes background push on all Web platforms.

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
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
