import { useAuth } from '@/components/AuthContext';
import { useHouseData } from '@/hooks/useHouseData';

export interface ExpenseTodo {
    id: string;
    itemName: string;
    houseId: string;
    addedBy: string;
    isCompleted: boolean;
    createdAt: string;
    completedAt?: string;
    completedBy?: string;  // user email, or 'auto' for auto-marked
    expenseId?: string;
}

export function useExpenseTodos() {
    const { house } = useAuth();

    // Instead of a separate SWR fetch, use the real-time data we already established
    const { todos, loading: isLoading, mutateTodos: mutate } = useHouseData();

    const addTodosBatch = async (items: string[], addedBy: string) => {
        if (!house?.id || items.length === 0) return;

        try {
            const res = await fetch('/api/expense-todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, houseId: house.id, addedBy })
            });
            if (res.ok) {
                mutate();
                return await res.json();
            }
        } catch (err) {
            console.error('Failed to add todos batch:', err);
        }
    };

    const toggleTodo = async (id: string, isCompleted: boolean, completedBy?: string) => {
        try {
            const res = await fetch('/api/expense-todos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isCompleted, completedBy })
            });
            if (res.ok) {
                mutate();
            }
        } catch (err) {
            console.error('Failed to toggle todo:', err);
        }
    };

    const deleteTodo = async (id: string) => {
        try {
            const res = await fetch(`/api/expense-todos?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                mutate();
            }
        } catch (err) {
            console.error('Failed to delete todo:', err);
        }
    };

    return {
        todos: todos || [],
        loading: isLoading,
        addTodosBatch,
        toggleTodo,
        deleteTodo,
        mutate
    };
}
