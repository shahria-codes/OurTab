import { useRealtimeHouseData } from './useRealtimeHouseData';

// ─── Re-export types for backward compatibility ───────────────────────────────

export interface House {
    id: string;
    name: string;
    createdBy: string;
    createdAt?: string;
    currency?: string;
    typeOfHouse?: 'expenses' | 'meals_and_expenses';
    mealsPerDay?: 2 | 3;
    mealUpdateWindowStart?: string;
    mealUpdateWindowEnd?: string;
    mealOffRequests?: Record<string, {
        requestedAt: string;
        status: 'pending' | 'approved';
    }>;
    members?: {
        email: string;
        name?: string;
        photoUrl?: string;
        role?: 'manager' | 'member';
        rentAmount?: number;
        profession?: string;
        birthday?: string;
        whatsapp?: string;
        messenger?: string;
        iban?: string;
        wallet?: string;
        mealsEnabled?: boolean;
        offFromDate?: string;
    }[];
    memberDetails?: Record<string, {
        role: 'manager' | 'member',
        rentAmount: number,
        mealsEnabled?: boolean,
        offFromDate?: string,
        leftDate?: string;
        joinedAt?: string;
    }>;
    joinDayMealRequests?: Record<string, {
        joinDate: string;
        eligibleMeals: string[];
        requestedMeals: string[];
        status: 'pending' | 'approved' | 'rejected';
        approvedMeals?: string[];
    }>;
    pastMembers?: {
        email: string;
        name?: string;
        photoUrl?: string;
        role?: 'manager' | 'member';
        rentAmount?: number;
        profession?: string;
        birthday?: string;
        whatsapp?: string;
        messenger?: string;
        iban?: string;
        wallet?: string;
    }[];
    pendingPayments?: {
        id: string;
        from: string;
        to: string;
        amount: number;
        method?: 'cash' | 'bank';
        status: 'pending' | 'approved';
        createdAt: string;
    }[];
}

export interface Expense {
    id: string;
    amount: number;
    description: string;
    userId: string;
    houseId: string;
    date: string;
    category?: string;
    contributors?: Array<{ email: string; amount: number }>;
    isSettlementPayment?: boolean;
    method?: 'bank' | 'cash';
    createdAt?: string;
    approvedAt?: string;
    settlementBetween?: string[];
}

export interface ExpenseTodo {
    id: string;
    itemName: string;
    isCompleted: boolean;
    addedBy: string;
    houseId: string;
    createdAt: string;
    completedAt?: string;
    completedBy?: string;
    expenseId?: string;
}

export interface Settlement {
    id?: string;
    houseId: string;
    month: number;
    year: number;
    settlements: {
        from: string;
        to: string;
        amount: number;
        paid: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
}

// ─── Hook (delegates to onSnapshot-based implementation) ─────────────────────

export function useHouseData() {
    return useRealtimeHouseData();
}
