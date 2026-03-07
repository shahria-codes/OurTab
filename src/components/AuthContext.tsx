'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { House } from '@/hooks/useHouseData';

interface AuthContextType {
    user: User | null;
    house: House | null;
    currency?: string;
    dbUser: any;
    loading: boolean;
    signIn: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logOut: () => Promise<void>;
    logout: () => Promise<void>;
    updateCurrency: (newCurrency: string) => Promise<void>;
    mutateUser: () => void;
    mutateHouse: () => void;
    notificationPermission: NotificationPermission;
    isNotificationSupported: boolean;
    requestNotificationPermission: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    house: null,
    currency: undefined,
    dbUser: null,
    loading: true,
    signIn: async () => { },
    signInWithGoogle: async () => { },
    logOut: async () => { },
    logout: async () => { },
    updateCurrency: async () => { },
    mutateUser: () => { },
    mutateHouse: () => { },
    notificationPermission: 'default',
    isNotificationSupported: false,
    requestNotificationPermission: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Helper for safe localStorage access
    const getCachedData = (key: string) => {
        if (typeof window === 'undefined') return undefined;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : undefined;
        } catch {
            return undefined;
        }
    };

    // Use SWR to keep house data accessible globally in context
    const { data: userData, mutate: mutateUser, isLoading: dbUserLoading } = useSWR(
        user?.email ? `/api/users?email=${user.email}` : null,
        url => fetch(url).then(res => res.json()),
        {
            fallbackData: getCachedData(`user_${user?.email}`),
            onSuccess: (data) => typeof window !== 'undefined' && window.localStorage.setItem(`user_${user?.email}`, JSON.stringify(data))
        }
    );

    // Use SWR to keep house details accessible
    const { data: house, mutate: mutateHouse, isLoading: houseLoading } = useSWR(
        user?.email ? `/api/houses/my-house?email=${user.email}` : null,
        url => fetch(url).then(res => res.json()),
        {
            refreshInterval: 5000,
            fallbackData: getCachedData(`house_${user?.email}`),
            onSuccess: (data) => typeof window !== 'undefined' && window.localStorage.setItem(`house_${user?.email}`, JSON.stringify(data))
        }
    );

    const updateCurrency = async (newCurrency: string) => {
        if (!house?.id) return;
        try {
            const res = await fetch('/api/houses/update-currency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ houseId: house.id, currency: newCurrency }),
            });
            if (res.ok) {
                mutateHouse();
            }
        } catch (error) {
            console.error("Error updating currency:", error);
        }
    };

    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [isNotificationSupported, setIsNotificationSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSupported = 'Notification' in window && 'serviceWorker' in navigator && !!messaging;
            setIsNotificationSupported(isSupported);
            if (isSupported) {
                setNotificationPermission(window.Notification.permission);
            }
        }
    }, [messaging]);

    // Shared helper: obtain + save FCM token using a specific SW registration.
    const saveFcmToken = async (userEmail: string, swRegistration: ServiceWorkerRegistration) => {
        if (!messaging) return;
        try {
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: swRegistration
            });
            if (currentToken) {
                await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail, fcmToken: currentToken }),
                });
                mutateUser();
            }
        } catch (err) {
            console.error('[FCM] Error saving token:', err);
        }
    };

    const requestNotificationPermission = async () => {
        if (!user || !isNotificationSupported || !messaging) return false;

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                // Clear out any old service workers to prevent conflicts (e.g. from next-pwa or old SWs with query params)
                const existingRegistrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of existingRegistrations) {
                    await registration.unregister();
                }

                const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

                if (user.email) {
                    console.log('[FCM] Registering token after permission grant...');
                    await saveFcmToken(user.email, swRegistration);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error('Error requesting notification permission:', err);
            return false;
        }
    };

    // When a new service worker takes over (after a code deployment), the push
    // subscription tied to the old SW registration becomes invalid. FCM sends
    // push messages to the old token, but they are never delivered.
    // Fix: listen for `controllerchange` and silently refresh the FCM token so
    // users never need to reinstall the PWA after an update.
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const handleControllerChange = async () => {
            if (!user?.email || !messaging) return;
            if (window.Notification.permission !== 'granted') return;

            console.log('[FCM] Service worker updated — refreshing FCM token...');
            try {
                // Re-register the firebase messaging SW explicitly so getToken
                // uses the correct registration after the controller changes.
                const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                await saveFcmToken(user.email, swRegistration);
                console.log('[FCM] Token refreshed after SW update.');
            } catch (err) {
                console.error('[FCM] Failed to refresh token after SW update:', err);
            }
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, [user, messaging]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Sync user to DB
                try {
                    fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: firebaseUser.email,
                            name: firebaseUser.displayName,
                            photoUrl: firebaseUser.photoURL,
                        }),
                    }).then(res => {
                        if (res.ok) {
                            mutateUser();
                        }
                    });

                    // If permission is already granted, try to refresh token silently
                    if ('Notification' in window && window.Notification.permission === 'granted' && messaging) {
                        // We don't block login on this
                        requestNotificationPermission().catch(() => { });
                    }
                } catch (error) {
                    console.error("Error syncing user with DB:", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [mutateUser, isNotificationSupported]);

    const signIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };

    const logOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            router.push('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            house: house || null,
            currency: house?.currency,
            dbUser: userData,
            loading,
            signIn,
            signInWithGoogle: signIn,
            logOut,
            logout: logOut,
            updateCurrency,
            mutateUser,
            mutateHouse,
            notificationPermission,
            isNotificationSupported,
            requestNotificationPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
