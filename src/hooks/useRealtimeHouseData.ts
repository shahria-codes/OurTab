'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    getDoc,
} from 'firebase/firestore';
import { useAuth } from '@/components/AuthContext';
import type { House, Expense, ExpenseTodo, Settlement } from './useHouseData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberProfile {
    name?: string;
    photoUrl?: string;
    fcmToken?: string;
    utcOffset?: number;
    birthday?: string;
    whatsapp?: string;
    messenger?: string;
    iban?: string;
    wallet?: string;
    profession?: string;
    mealsEnabled?: boolean;
    offFromDate?: string;
}

interface MemberProfileCache {
    [email: string]: MemberProfile;
}

type Unsubscriber = () => void;

interface RealtimeHouseData {
    house: House | null;
    expenses: Expense[];
    todos: ExpenseTodo[];
    fundDeposits: any[];
    meals: any[];
    settlements: Settlement[];
    loading: boolean;
    error: Error | null;
    mutateHouse: () => void;
    mutateExpenses: () => void;
    mutateTodos: () => void;
    mutateFundDeposits: () => void;
    mutateMeals: () => void;
    mutateSettlements: () => void;
}

// ─── Global Cache (Session Persistence) ───────────────────────────────────────
// This cache allows the app to show "stale" data immediately when navigating 
// between pages, avoiding the "Loader" spinner flash.
let globalHouseDataCache: House | null = null;
let globalExpensesCache: Expense[] = [];
let globalTodosCache: ExpenseTodo[] = [];
let globalDepositsCache: any[] = [];
let globalMealsCache: any[] = [];
let globalSettlementsCache: Settlement[] = [];
let globalHouseIdCache: string | null = null;
let lastCachedUserEmail: string | null = null;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRealtimeHouseData(): RealtimeHouseData {
    const { user } = useAuth();

    // Prevent cross-user data leakage by clearing cache if the user has changed 
    // since the last time this hook was used (e.g. logout/login cycle).
    if (user?.email !== lastCachedUserEmail) {
        globalHouseIdCache = null;
        globalHouseDataCache = null;
        globalExpensesCache = [];
        globalTodosCache = [];
        globalDepositsCache = [];
        globalMealsCache = [];
        globalSettlementsCache = [];
        lastCachedUserEmail = user?.email || null;
    }

    const [houseId, setHouseId] = useState<string | null>(globalHouseIdCache);
    const [house, setHouse] = useState<House | null>(globalHouseDataCache);
    const [expenses, setExpenses] = useState<Expense[]>(globalExpensesCache);
    const [todos, setTodos] = useState<ExpenseTodo[]>(globalTodosCache);
    const [fundDeposits, setFundDeposits] = useState<any[]>(globalDepositsCache);
    const [meals, setMeals] = useState<any[]>(globalMealsCache);
    const [settlements, setSettlements] = useState<Settlement[]>(globalSettlementsCache);
    const [loading, setLoading] = useState(!globalHouseDataCache);
    const [error, setError] = useState<Error | null>(null);

    // Cache member profiles so we don't re-fetch on every house snapshot
    const memberProfileCache = useRef<MemberProfileCache>({});

    // Track active unsubscribe functions so we can clean up
    const unsubscribers = useRef<Unsubscriber[]>([]);

    // ── Step 1: Resolve houseId from users/{email} ──────────────────────────
    useEffect(() => {
        if (!user?.email) {
            setHouseId(null);
            setHouse(null);
            setLoading(false);
            return;
        }

        if (!globalHouseDataCache) setLoading(true);

        getDoc(doc(db, 'users', user.email))
            .then((snap: any) => {
                if (snap.exists()) {
                    const data: any = snap.data();
                    const resolvedId: string | null = data.houseId || data.groupId || null;
                    setHouseId(resolvedId);
                    globalHouseIdCache = resolvedId;
                    if (!resolvedId) setLoading(false);
                } else {
                    setHouseId(null);
                    globalHouseIdCache = null;
                    setLoading(false);
                }
            })
            .catch((err: Error) => {
                setError(err);
                setLoading(false);
            });
    }, [user?.email]);

    // ── Step 2: Fetch member profiles via API (Admin SDK, bypasses Firestore rules) ──
    const enrichMembers = async (memberEmails: string[]): Promise<void> => {
        const missing = memberEmails.filter(e => !memberProfileCache.current[e]);
        if (missing.length === 0) return;

        try {
            const res = await fetch(`/api/users?emails=${encodeURIComponent(missing.join(','))}`);
            if (res.ok) {
                const profiles: Record<string, any> = await res.json();
                for (const email of missing) {
                    memberProfileCache.current[email] = profiles[email] || {};
                }
            }
        } catch {
            // Non-fatal: members will render without profile enrichment
            for (const email of missing) {
                memberProfileCache.current[email] = {};
            }
        }
    };

    // ── Step 3: Attach all onSnapshot listeners once houseId is known ────────
    useEffect(() => {
        if (!houseId) return;

        // Clear any previous listeners
        unsubscribers.current.forEach(u => u());
        unsubscribers.current = [];

        const houseRef = doc(db, 'houses', houseId);
        const pendingPaymentsRef = collection(db, 'houses', houseId, 'pendingPayments');

        // ── House + pendingPayments ──────────────────────────────────────────
        let latestHouseData: Record<string, any> | null = null;
        let latestPendingPayments: any[] = [];
        let houseReady = false;
        let paymentsReady = false;

        const buildAndSetHouse = async (houseRaw: Record<string, any> | null, payments: any[]) => {
            if (!houseRaw) return;

            const memberEmails: string[] = houseRaw.members || [];
            const pastMemberEmails: string[] = houseRaw.pastMembers || [];
            const allEmails = [...new Set([...memberEmails, ...pastMemberEmails])];

            await enrichMembers(allEmails);

            const members = memberEmails.map((email: string) => {
                const profile = memberProfileCache.current[email] || {};
                const details = houseRaw.memberDetails?.[email] || {};
                return { email, ...profile, ...details };
            });

            const pastMembers = pastMemberEmails.map((email: string) => {
                const profile = memberProfileCache.current[email] || {};
                const details = houseRaw.memberDetails?.[email] || {};
                return { email, ...profile, ...details };
            });

            // Remove old pendingPayments array field if present, replace with subcollection data
            const { pendingPayments: _old, ...restHouseData } = houseRaw;
            void _old;

            const finalHouse = {
                id: houseId,
                ...restHouseData,
                members,
                pastMembers,
                pendingPayments: payments,
            } as House;

            setHouse(finalHouse);
            globalHouseDataCache = finalHouse;
            setLoading(false);
        };

        const unsubHouse = onSnapshot(
            houseRef,
            (snap: any) => {
                latestHouseData = snap.exists() ? (snap.data() as Record<string, any>) : null;
                houseReady = true;
                if (paymentsReady) {
                    buildAndSetHouse(latestHouseData, latestPendingPayments);
                }
            },
            (err: Error) => setError(err)
        );

        const unsubPayments = onSnapshot(
            pendingPaymentsRef,
            (snap: any) => {
                latestPendingPayments = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                paymentsReady = true;
                if (houseReady) {
                    buildAndSetHouse(latestHouseData, latestPendingPayments);
                }
            },
            (err: Error) => setError(err)
        );

        // ── Expenses ─────────────────────────────────────────────────────────
        const unsubExpenses = onSnapshot(
            query(collection(db, 'expenses'), where('houseId', '==', houseId)),
            (snap: any) => {
                const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Expense[];
                setExpenses(data);
                globalExpensesCache = data;
            },
            (err: Error) => setError(err)
        );

        // ── Shopping Todos ────────────────────────────────────────────────────
        const unsubTodos = onSnapshot(
            query(collection(db, 'shopping_todos'), where('houseId', '==', houseId)),
            (snap: any) => {
                const now = new Date();
                const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
                const data = snap.docs
                    .map((d: any) => ({ id: d.id, ...d.data() }))
                    .filter((todo: any) =>
                        !(todo.isCompleted && todo.completedAt && new Date(todo.completedAt) < twelveHoursAgo)
                    )
                    .sort((a: any, b: any) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ) as ExpenseTodo[];
                setTodos(data);
                globalTodosCache = data;
            },
            (err: Error) => setError(err)
        );

        // ── Fund Deposits ─────────────────────────────────────────────────────
        const unsubDeposits = onSnapshot(
            query(collection(db, 'fundDeposits'), where('houseId', '==', houseId)),
            (snap: any) => {
                const data = snap.docs
                    .map((d: any) => ({ id: d.id, ...d.data() }))
                    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setFundDeposits(data);
                globalDepositsCache = data;
            },
            (err: Error) => setError(err)
        );

        // ── Meal Statuses ────────────────────────────────────────────────────
        const unsubMeals = onSnapshot(
            query(collection(db, 'mealStatuses'), where('houseId', '==', houseId)),
            (snap: any) => {
                const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                setMeals(data);
                globalMealsCache = data;
            },
            (err: Error) => setError(err)
        );

        // ── Settlements ──────────────────────────────────────────────────────
        const unsubSettlements = onSnapshot(
            query(collection(db, 'settlements'), where('houseId', '==', houseId)),
            (snap: any) => {
                const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Settlement[];
                setSettlements(data);
                globalSettlementsCache = data;
            },
            (err: Error) => setError(err)
        );

        unsubscribers.current = [
            unsubHouse,
            unsubPayments,
            unsubExpenses,
            unsubTodos,
            unsubDeposits,
            unsubMeals,
            unsubSettlements,
        ];

        return () => {
            unsubscribers.current.forEach(u => u());
            unsubscribers.current = [];
        };
    }, [houseId]);

    // ── Invalidate member cache when user changes ────────────────────────────
    useEffect(() => {
        memberProfileCache.current = {};
    }, [user?.email]);

    // ── No-op mutate functions (onSnapshot auto-updates state) ───────────────
    // Kept for API compatibility: code that calls mutate*() after a write is fine
    // because onSnapshot will reflect the change automatically.
    const noop = () => { };

    return {
        house,
        expenses,
        todos,
        fundDeposits,
        meals,
        settlements,
        loading,
        error,
        mutateHouse: noop,
        mutateExpenses: noop,
        mutateTodos: noop,
        mutateFundDeposits: noop,
        mutateMeals: noop,
        mutateSettlements: noop,
    };
}
