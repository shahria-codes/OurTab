'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, messaging, db } from '@/lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
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

    // Use SWR to keep house details accessible (no polling — real-time updates
    // come from Firestore onSnapshot listeners in useHouseData)
    const { data: house, mutate: mutateHouse, isLoading: houseLoading } = useSWR(
        user?.email ? `/api/houses/my-house?email=${user.email}` : null,
        url => fetch(url).then(res => res.json()),
        {
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

    // Shared helper: obtain + save FCM token for a given SW registration.
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

    // Called only when the user explicitly grants permission for the first time.
    // Resets all existing SWs and registers a fresh firebase-messaging-sw.js.
    const requestNotificationPermission = async () => {
        if (!user || !isNotificationSupported || !messaging) return false;

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                // Clear out any old service workers to prevent conflicts
                const existingRegistrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of existingRegistrations) {
                    await registration.unregister();
                }

                const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                await swRegistration.update();

                if (user.email) {
                    await saveFcmToken(user.email, swRegistration);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error('[FCM] Error requesting notification permission:', err);
            return false;
        }
    };

    // Silently refreshes the FCM token against the existing SW registration.
    // Called on every auth state change when permission is already granted.
    // Does NOT unregister SWs — that would be destructive and break things.
    const refreshFcmTokenSilently = async (userEmail: string) => {
        if (!messaging) return;
        try {
            // Find the firebase messaging SW registration if it exists
            const registrations = await navigator.serviceWorker.getRegistrations();
            const existingReg = registrations.find(r =>
                r.active?.scriptURL?.includes('firebase-messaging-sw.js')
            );

            // Use the existing registration, or register fresh if not found
            const swReg = existingReg ?? await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            await saveFcmToken(userEmail, swReg);
        } catch (err) {
            // Non-fatal — don't block auth flow
            console.error('[FCM] Silent token refresh failed:', err);
        }
    };

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
                            utcOffset: new Date().getTimezoneOffset(),
                        }),
                    }).then(res => {
                        if (res.ok) {
                            mutateUser();
                        }
                    });

                    // If permission already granted, silently refresh the FCM token.
                    if ('Notification' in window && window.Notification.permission === 'granted' && messaging && firebaseUser.email) {
                        refreshFcmTokenSilently(firebaseUser.email).catch(() => { });
                    }
                } catch (error) {
                    console.error("Error syncing user with DB:", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [mutateUser, isNotificationSupported]);

    // ─── Real-time User Profile Listener ──────────────────────────────────────
    // Listens for changes to the user's document in Firestore (e.g. house join 
    // approval, house deletion, role changes) and triggers SWR refreshes.
    useEffect(() => {
        if (!user?.email || !db) return;

        const unsub = onSnapshot(doc(db, 'users', user.email), (snapshot: any) => {
            if (snapshot.exists()) {
                // Trigger SWR to refresh data across the app
                mutateUser();
                // If houseId changed, mutate house too
                mutateHouse();
            }
        });

        return () => unsub();
    }, [user?.email, mutateUser, mutateHouse]);

    const signIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };

    const logout = async () => {
        try {
            // Unregister token from DB so they stop receiving notifications
            if (user?.email) {
                await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        fcmToken: '' // Empty string clears the token
                    }),
                });
            }
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
            logout,
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
