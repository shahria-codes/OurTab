'use client';

import { useState, useMemo } from 'react';
import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EuroIcon from '@mui/icons-material/Euro';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import GroupIcon from '@mui/icons-material/Group';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import { useHouseData } from '@/hooks/useHouseData';
import { useToast } from '@/components/ToastContext';
import { calculateMemberFundAccounting } from '@/utils/accounting';
import Loader from '@/components/Loader';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import Avatar from '@mui/material/Avatar';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentsIcon from '@mui/icons-material/Payments';
import DeleteIcon from '@mui/icons-material/Delete';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import IosShareIcon from '@mui/icons-material/IosShare';
import NotificationBell from '@/components/NotificationBell';
import dynamic from 'next/dynamic';
import { formatDateLocale, formatTimeLocale, formatTimeStr, formatBirthday } from '@/utils/date';
import { isTakingMeal, countMemberMeals } from '@/utils/meals';
import JoinDayMealDialog from '@/components/JoinDayMealDialog';

const ExpenseDetailDialog = dynamic(() => import('@/components/dashboard/ExpenseDetailDialog'));
const DepositDetailsDialog = dynamic(() => import('@/components/dashboard/DepositDetailsDialog'));
const ShareHouseDialog = dynamic(() => import('@/components/dashboard/ShareHouseDialog'));
const MemberDetailsDialog = dynamic(() => import('@/components/dashboard/MemberDetailsDialog'));
const SettlementHistoryDialog = dynamic(() => import('@/components/dashboard/SettlementHistoryDialog'));
const CancelPaymentDialog = dynamic(() => import('@/components/dashboard/CancelPaymentDialog'));
const ConfirmPaymentDialog = dynamic(() => import('@/components/dashboard/ConfirmPaymentDialog'));
const SubmitDepositDialog = dynamic(() => import('@/components/dashboard/SubmitDepositDialog'));
const FundHistoryDialog = dynamic(() => import('@/components/dashboard/FundHistoryDialog'));
const AddMemberDialog = dynamic(() => import('@/components/dashboard/AddMemberDialog'));
const EditExpenseDialog = dynamic(() => import('@/components/dashboard/EditExpenseDialog'));
const DeleteConfirmationDialog = dynamic(() => import('@/components/dashboard/DeleteConfirmationDialog'));




interface Expense {
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

export default function Dashboard() {
    const { user, loading: authLoading, currency } = useAuth();
    const router = useRouter();

    // Use the custom hook for data fetching
    const { house, expenses, todos, fundDeposits, meals, loading: dataLoading, mutateHouse, mutateExpenses, mutateFundDeposits, mutateMeals } = useHouseData();

    // Derived state for all members (active + past)
    const allMembers = useMemo(() => {
        const membersMap = new Map();
        [...(house?.pastMembers || []), ...(house?.members || [])].forEach(m => {
            membersMap.set(m.email, m);
        });
        return Array.from(membersMap.values());
    }, [house]);

    // Derived state for pending todos
    const pendingTodos = useMemo(() => {
        return todos?.filter(todo => !todo.isCompleted) || [];
    }, [todos]);

    const pendingDeposits = useMemo(() => {
        return fundDeposits?.filter(d => d.status === 'pending') || [];
    }, [fundDeposits]);

    const myPendingAmount = useMemo(() => {
        return pendingDeposits
            .filter(d => d.email === user?.email)
            .reduce((sum, d) => sum + Number(d.amount), 0);
    }, [pendingDeposits, user]);

    // Combine loading states
    const loading = authLoading || (!!user && dataLoading);

    const currencySymbols: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'BDT': '৳'
    };

    const [selectedDate, setSelectedDate] = useState(new Date());
    const monthName = selectedDate.toLocaleString(undefined, { month: 'long' });
    const getYYYYMM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const currencyIcons: { [key: string]: React.ElementType } = {
        'USD': AttachMoneyIcon,
        'EUR': EuroIcon,
        'BDT': CurrencyExchangeIcon
    };

    const CurrencyIcon = currencyIcons[currency as keyof typeof currencyIcons] || AttachMoneyIcon;
    const displayCurrency = currencySymbols[currency as keyof typeof currencySymbols] || '$';

    const { showToast } = useToast();
    const [openAddMember, setOpenAddMember] = useState(false);
    const [openShareDialog, setOpenShareDialog] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const [openEditExpense, setOpenEditExpense] = useState(false);
    const [editingExpenseId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [showAllExpenses, setShowAllExpenses] = useState(false);

    // Expense Detail Modal State
    const [openExpenseDetail, setOpenExpenseDetail] = useState(false);
    const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<Expense | null>(null);

    // Settle Money state
    const [openPayDialog, setOpenPayDialog] = useState(false);
    const [paySettlement, setPaySettlement] = useState<{ from: string; to: string; amount: number } | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState<'cash' | 'bank'>('bank');

    // Settlement History Dialog State
    const [openHistoryDialog, setOpenHistoryDialog] = useState(false);

    // Cancel Payment State
    const [cancelPaymentId, setCancelPaymentId] = useState<string | null>(null);

    // Fund Deposit State
    const [openDepositDialog, setOpenDepositDialog] = useState(false);
    const [openDepositDetails, setOpenDepositDetails] = useState(false);
    const [openFundHistoryDialog, setOpenFundHistoryDialog] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    // Member Details Dialog State
    const [openMemberDialog, setOpenMemberDialog] = useState(false);
    const [selectedMember, setSelectedMember] = useState<{
        email: string;
        name?: string;
        photoUrl?: string;
        iban?: string;
        profession?: string;
        birthday?: string;
        whatsapp?: string;
        messenger?: string;
        wallet?: string;
    } | null>(null);

    const handleMemberClick = (member: {
        email: string;
        name?: string;
        photoUrl?: string;
        iban?: string;
        profession?: string;
        birthday?: string;
        whatsapp?: string;
        messenger?: string;
        wallet?: string;
    }) => {
        setSelectedMember(member);
        setOpenMemberDialog(true);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    };

    const getShareLinks = () => {
        if (typeof window === 'undefined' || !house) return { url: '', text: '' };
        const url = `${window.location.origin}/join?houseId=${house.id}`;
        const text = `Join my house "${house.name}" on OurTab to track our shared expenses!`;
        return { url, text };
    };

    const handleShareHouse = async () => {
        if (!house?.id) return;
        const { url, text } = getShareLinks();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${house.name} on OurTab`,
                    text: text,
                    url: url
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setOpenShareDialog(true);
                }
            }
        } else {
            setOpenShareDialog(true);
        }
    };



    const handleSaveEdit = async () => {
        if (!editingExpenseId || !user) return;

        try {
            const res = await fetch('/api/expenses', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingExpenseId,
                    userId: user.email,
                    amount: editAmount,
                    description: editDescription
                })
            });

            if (res.ok) {
                // Update local state by revalidating SWR
                mutateExpenses();
                setOpenEditExpense(false);
                showToast('Expense updated successfully!', 'success');
            } else {
                showToast('Failed to update expense. It might be older than 48 hours.', 'error');
            }
        } catch (error) {
            console.error('Failed to update expense', error);
            showToast('Error updating expense', 'error');
        }
    };

    const handleRequestDeposit = async () => {
        if (!house?.id || !user?.email || !depositAmount) return;
        try {
            const res = await fetch('/api/fund-deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    houseId: house.id,
                    email: user.email,
                    amount: depositAmount
                })
            });
            if (res.ok) {
                showToast('Deposit request submitted!', 'success');
                setOpenDepositDialog(false);
                setDepositAmount('');
                mutateFundDeposits(); // Refresh deposits array to update UI
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to submit deposit Request', 'error');
            }
        } catch (error: any) {
            console.error('Error submitting deposit', error);
            showToast(error.message || 'Error submitting deposit', 'error');
        }
    };

    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

    const handleDeleteExpense = (id: string) => {
        setExpenseToDelete(id);
        setOpenDeleteConfirm(true);
    };

    const confirmDeleteExpense = async () => {
        if (!expenseToDelete || !user) return;

        try {
            const res = await fetch(`/api/expenses?id=${expenseToDelete}&userId=${user.email}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                mutateExpenses();
                showToast('Expense deleted successfully!', 'success');
            } else {
                showToast('Failed to delete expense. It might be older than 48 hours.', 'error');
            }
        } catch (error) {
            console.error('Failed to delete expense', error);
            showToast('Error deleting expense', 'error');
        } finally {
            setOpenDeleteConfirm(false);
            setExpenseToDelete(null);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberEmail || !house) return;

        try {
            const res = await fetch('/api/houses/add-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newMemberEmail, houseId: house.id, addedBy: user?.email })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Member added successfully!', 'success');
                setNewMemberEmail('');
                mutateHouse();
                setOpenAddMember(false);
            } else {
                showToast(data.error || 'Failed to add member', 'error');
            }
        } catch {
            showToast('Error adding member', 'error');
        }
    };

    const handleCancelDeposit = async (depositId: string) => {
        try {
            const res = await fetch(`/api/fund-deposits?depositId=${depositId}&email=${user?.email}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast('Deposit request cancelled', 'success');
                mutateFundDeposits();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to cancel deposit', 'error');
            }
        } catch {
            showToast('Error cancelling deposit', 'error');
        }
    };

    const handleCancelPayment = async () => {
        if (!cancelPaymentId || !house || !user) return;
        try {
            const res = await fetch('/api/houses/cancel-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    houseId: house.id,
                    paymentId: cancelPaymentId,
                    cancellerEmail: user.email,
                }),
            });
            if (res.ok) {
                showToast('Payment request cancelled.', 'success');
                mutateHouse();
                setCancelPaymentId(null);
            } else {
                const d = await res.json();
                showToast(d.error || 'Failed to cancel', 'error');
            }
        } catch {
            showToast('Error cancelling request', 'error');
        }
    };

    const handleConfirmPayment = async () => {
        if (!paySettlement || !house || !user?.email) return;
        try {
            const res = await fetch('/api/houses/request-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    houseId: house.id,
                    fromEmail: paySettlement.from,
                    toEmail: paySettlement.to,
                    amount: payAmount,
                    method: payMethod,
                }),
            });
            if (res.ok) {
                showToast('Payment request sent!', 'success');
                setOpenPayDialog(false);
                setPaySettlement(null);
                setPayAmount('');
                mutateHouse();
            } else {
                const d = await res.json();
                showToast(d.error || 'Failed to send request', 'error');
            }
        } catch {
            showToast('Error sending request', 'error');
        }
    };



    const handlePreviousMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setSelectedDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setSelectedDate(newDate);
    };

    // Filter expenses for selected month
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedDate.getMonth() &&
            expenseDate.getFullYear() === selectedDate.getFullYear();
    });

    // Calculate totals based on filtered expenses
    const totalFilteredExpenses = filteredExpenses
        .filter(exp => !exp.isSettlementPayment)
        .reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate my actual expenses accounting for contributors
    const myFilteredExpenses = (() => {
        if (!house?.members || !user?.email) return 0;

        const numMembers = house.members.length;
        let myTotal = 0;

        const regularFilteredExpenses = filteredExpenses.filter((e: Expense) => !e.isSettlementPayment);

        regularFilteredExpenses.forEach((exp: Expense) => {
            // Calculate my share of this expense
            const myShare = exp.amount / numMembers;
            myTotal += myShare;
        });

        return myTotal;
    })();

    // Calculate per-member accounting for the Fund Dialog
    const accountingResult = useMemo(() => {
        return calculateMemberFundAccounting(house, expenses, fundDeposits, meals, getYYYYMM(selectedDate));
    }, [house, expenses, fundDeposits, meals, selectedDate]);

    const memberFundAccounting = accountingResult.members;
    const houseFundStatsResult = accountingResult.summary;

    // House Fund Stats (total collected, spent, rentDeducted, remaining)
    const houseFundStats = useMemo(() => {
        if (!house || house.typeOfHouse !== 'meals_and_expenses') return { collected: 0, spent: 0, rentDeducted: 0, remaining: 0 };

        // Use the centralized accounting result for consistency
        return {
            collected: houseFundStatsResult.periodicTotalDeposits,
            spent: houseFundStatsResult.periodicTotalGroceries + houseFundStatsResult.periodicTotalUtilities + houseFundStatsResult.periodicTotalWages,
            spentGroceries: houseFundStatsResult.periodicTotalGroceries,
            spentUtilities: houseFundStatsResult.periodicTotalUtilities,
            spentWage: houseFundStatsResult.periodicTotalWages,
            spentMisc: 0, // Misc is already folded into utilities in accounting.ts
            totalMealsCount: houseFundStatsResult.periodicTotalMeals,
            avgMealCost: houseFundStatsResult.periodicCostPerMeal,
            rentDeducted: houseFundStatsResult.periodicTotalRent,
            remaining: houseFundStatsResult.remainingFund // This is the closing balance for the selected month
        };
    }, [houseFundStatsResult, house]);

    // Memoize settlement calculation to prevent re-render issues
    const settlements = useMemo(() => {
        if (!house || !allMembers || allMembers.length < 2) return [];

        const memberBalances: { [key: string]: number } = {};
        allMembers.forEach(m => memberBalances[m.email] = 0);

        // === 1. EXPENSES ONLY TRACKING (Legacy/Default) ===
        if (house.typeOfHouse !== 'meals_and_expenses') {
            expenses.forEach((exp: Expense) => {
                const amount = exp.amount;
                const payer = exp.userId;

                const expMonth = exp.date.substring(0, 7);
                const activeMembersAtTime = allMembers.filter(m => {
                    const details = house.memberDetails?.[m.email];
                    if (!details?.leftDate) return true;
                    return details.leftDate.substring(0, 7) >= expMonth;
                });
                const relevantMembers = activeMembersAtTime.length > 0 ? activeMembersAtTime : allMembers;


                if (exp.isSettlementPayment && exp.settlementBetween && exp.settlementBetween.length === 2) {
                    const [p, r] = [exp.userId, exp.settlementBetween.find(e => e !== exp.userId)!];
                    if (memberBalances[p] !== undefined) memberBalances[p] += amount;
                    if (memberBalances[r] !== undefined) memberBalances[r] -= amount;
                    return;
                }

                // Normal Expense Logic
                if (exp.contributors && exp.contributors.length > 0) {
                    let contributorTotal = 0;
                    exp.contributors.forEach(contributor => {
                        if (memberBalances[contributor.email] !== undefined) {
                            memberBalances[contributor.email] += contributor.amount;
                        }
                        contributorTotal += contributor.amount;
                    });
                    const remainder = amount - contributorTotal;
                    if (remainder > 0.01) {
                        if (memberBalances[payer] !== undefined) memberBalances[payer] += remainder;
                    }
                } else {
                    if (memberBalances[payer] !== undefined) memberBalances[payer] += amount;
                }

                const sharePerPerson = amount / relevantMembers.length;
                relevantMembers.forEach(m => {
                    memberBalances[m.email] -= sharePerPerson;
                });
            });
        }
        // === 2. MEALS AND EXPENSES TRACKING ===
        else if (memberFundAccounting) {
            Object.keys(memberFundAccounting).forEach(email => {
                memberBalances[email] = memberFundAccounting[email].closingBalance;
            });
        }

        // Calculate net balances (Positive = is owed money, Negative = owes money)
        const netBalances: { id: string, amount: number }[] = [];
        Object.keys(memberBalances).forEach(email => {
            netBalances.push({
                id: email,
                amount: memberBalances[email]
            });
        });

        // Separate into receivers (+) and payers (-)
        const receivers = netBalances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount);
        const payers = netBalances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount);

        const calculatedSettlements = [];
        let r = 0;
        let p = 0;

        while (r < receivers.length && p < payers.length) {
            const receiver = receivers[r];
            const payer = payers[p];
            const amount = Math.min(Math.abs(payer.amount), receiver.amount);

            if (amount > 0.01) {
                calculatedSettlements.push({
                    from: payer.id,
                    to: receiver.id,
                    amount: amount
                });
            }

            receiver.amount -= amount;
            payer.amount += amount;

            if (receiver.amount < 0.01) r++;
            if (payer.amount > -0.01) p++;
        }

        return calculatedSettlements;
    }, [house, expenses, memberFundAccounting]);

    const myDebt = useMemo(() => {
        if (!user?.email || !settlements) return 0;
        return settlements
            .filter(s => s.from === user.email)
            .reduce((sum: number, s: { from: string; to: string; amount: number }) => sum + s.amount, 0);
    }, [settlements, user]);

    const myCredit = useMemo(() => {
        if (!user?.email || !settlements) return 0;
        return settlements
            .filter(s => s.to === user.email)
            .reduce((sum: number, s: { from: string; to: string; amount: number }) => sum + s.amount, 0);
    }, [settlements, user]);

    if (loading) {
        return <Loader />;
    }

    return (
        <AuthGuard>
            <main>
                <Container maxWidth="lg" sx={{ mt: 4, mb: 5 }}>
                    <Box className="glass-nav" sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 2,
                        mb: 0.1,
                        mx: { xs: -2, sm: -3 },
                        px: { xs: 2, sm: 3 },
                        backgroundColor: 'transparent !important', // Let glass-nav handle it
                    }}>
                        <Typography variant="h4" component="h1" sx={{
                            fontWeight: 800,
                            background: 'linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2,
                            backdropFilter: 'blur(20px)',
                            borderRadius: '12px',
                            padding: '4px',
                            letterSpacing: '-0.02em'
                        }}>
                            Dashboard
                        </Typography>
                        <NotificationBell aria-label="Notifications" />
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8, fontWeight: 500 }}>
                        Overview of your household finances and expenses
                    </Typography>

                    {/* Month Navigator - Premium Glass Style */}
                    <Paper className="glass" sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 4,
                        p: 1.5,
                        borderRadius: 4,
                        maxWidth: 400,
                        mx: 'auto',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                    }}>
                        <IconButton
                            onClick={handlePreviousMonth}
                            disabled={
                                !!house?.createdAt &&
                                (selectedDate.getFullYear() < new Date(house.createdAt).getFullYear() ||
                                    (selectedDate.getFullYear() === new Date(house.createdAt).getFullYear() && selectedDate.getMonth() <= new Date(house.createdAt).getMonth()))
                            }
                            aria-label="Previous Month"
                            sx={{
                                color: 'primary.main',
                                bgcolor: 'rgba(108, 99, 255, 0.05)',
                                '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.1)' }
                            }}
                        >
                            <KeyboardArrowLeftIcon />
                        </IconButton>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarMonthIcon sx={{ color: 'primary.main', opacity: 0.7 }} fontSize="small" />
                            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.01em', minWidth: 160, textAlign: 'center' }}>
                                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </Typography>
                        </Stack>

                        <IconButton
                            onClick={handleNextMonth}
                            disabled={selectedDate.getFullYear() > new Date().getFullYear() || (selectedDate.getFullYear() === new Date().getFullYear() && selectedDate.getMonth() >= new Date().getMonth())}
                            aria-label="Next Month"
                            sx={{
                                color: 'primary.main',
                                bgcolor: 'rgba(108, 99, 255, 0.05)',
                                '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.1)' }
                            }}
                        >
                            <KeyboardArrowRightIcon />
                        </IconButton>
                    </Paper>

                    <Grid container spacing={3}>
                        {/* Fund Deposits Widget (First for Meals and Expenses) */}
                        {house?.typeOfHouse === 'meals_and_expenses' && (
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper className="glass" sx={{
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 4,
                                    background: 'rgba(255, 101, 132, 0.05)',
                                    border: '1px solid rgba(255, 101, 132, 0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        background: 'rgba(255, 101, 132, 0.08)',
                                        boxShadow: '0 12px 30px rgba(255, 101, 132, 0.15)',
                                        '& .stat-icon': { transform: 'scale(1.1) rotate(-10deg)', opacity: 0.25 }
                                    }
                                }} onClick={() => setOpenDepositDetails(true)}>
                                    <Box className="stat-icon" sx={{ transition: 'all 0.3s ease', position: 'absolute', top: -15, right: -15, opacity: 0.15, color: 'secondary.main' }}>
                                        <AccountBalanceIcon sx={{ fontSize: 110 }} />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                House Fund
                                            </Typography>
                                            {pendingDeposits.length > 0 && (
                                                <Chip
                                                    label={`${pendingDeposits.length} Pending`}
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); setOpenFundHistoryDialog(true); }}
                                            aria-label="Fund History"
                                            sx={{
                                                marginLeft: 2,
                                                color: 'primary.main',
                                                background: 'rgba(255, 101, 132, 0.1)',
                                                '&:hover': { background: 'rgba(255, 101, 132, 0.2)' },
                                                p: 0.5
                                            }}
                                        >
                                            <HistoryIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h3" sx={{
                                                fontWeight: 900,
                                                display: 'flex',
                                                alignItems: 'baseline',
                                                color: houseFundStats.remaining < 0 ? 'error.main' : 'secondary.main'
                                            }}>
                                                <Box component="span" sx={{ fontSize: '0.6em', opacity: 0.7, mr: 0.5 }}>{displayCurrency}</Box>
                                                {Math.floor(houseFundStats.remaining)}
                                                <Box component="span" sx={{ fontSize: '0.4em', opacity: 0.5, ml: 0.5 }}>.{houseFundStats.remaining.toFixed(2).split('.')[1]}</Box>
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push('/expense');
                                                }}
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    bgcolor: '#6C63FF',
                                                    '&:hover': { bgcolor: '#5a52e0' },
                                                    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.2)',
                                                }}
                                            >
                                                Expense
                                            </Button>
                                        </Box>

                                        <Grid container spacing={1}>
                                            {[
                                                { label: 'Total', value: houseFundStats.collected, color: 'text.primary' },
                                                { label: 'Spent', value: houseFundStats.spent, color: 'error.main' },
                                                { label: 'Rent', value: houseFundStats.rentDeducted, color: 'warning.main' }
                                            ].map((stat, i) => (
                                                <Grid size={4} key={i}>
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>{stat.label}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: stat.color }}>
                                                        {stat.value.toFixed(0)}
                                                    </Typography>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>

                                    <Box sx={{
                                        mt: 3,
                                        pt: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderTop: '1px solid rgba(76, 175, 80, 0.1)'
                                    }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>My Contribution ({monthName})</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
                                                    {displayCurrency}{(memberFundAccounting[user?.email || '']?.periodicDeposits || 0).toFixed(2)}
                                                </Typography>
                                                {myPendingAmount > 0 && (
                                                    <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                                                        ({displayCurrency}{myPendingAmount.toFixed(0)} pending)
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDepositDialog(true);
                                            }}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                boxShadow: 'none',
                                                '&:hover': { boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)' }
                                            }}
                                        >
                                            Deposit
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}

                        {/* Total Cost Widget — hidden for meals_and_expenses */}
                        {house?.typeOfHouse !== 'meals_and_expenses' && (
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper className="glass" sx={{
                                    p: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 4,
                                    background: 'rgba(108, 99, 255, 0.05)',
                                    border: '1px solid rgba(108, 99, 255, 0.2)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        background: 'rgba(108, 99, 255, 0.08)',
                                        boxShadow: '0 12px 30px rgba(108, 99, 255, 0.15)',
                                        '& .stat-icon': { transform: 'scale(1.1) rotate(10deg)', opacity: 0.25 }
                                    }
                                }}>
                                    <Box className="stat-icon" sx={{ transition: 'all 0.3s ease', position: 'absolute', top: -15, right: -15, opacity: 0.15, color: 'primary.main' }}>
                                        <CurrencyIcon sx={{ fontSize: 110 }} />
                                    </Box>

                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
                                        Total Expenses
                                    </Typography>

                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h3" sx={{ fontWeight: 900, display: 'flex', alignItems: 'baseline' }}>
                                                <Box component="span" sx={{ fontSize: '0.6em', opacity: 0.7, mr: 0.5 }}>{displayCurrency}</Box>
                                                {Math.floor(totalFilteredExpenses)}
                                                <Box component="span" sx={{ fontSize: '0.4em', opacity: 0.5, ml: 0.5 }}>.{totalFilteredExpenses.toFixed(2).split('.')[1]}</Box>
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push('/expense');
                                                }}
                                                sx={{
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    bgcolor: '#6C63FF',
                                                    '&:hover': { bgcolor: '#5a52e0' },
                                                    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.2)',
                                                }}
                                            >
                                                Expense
                                            </Button>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.05em' }}>
                                                Mine: {displayCurrency}{myFilteredExpenses.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(108, 99, 255, 0.1)' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Settlements</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); setOpenHistoryDialog(true); }}
                                                sx={{ p: 0.5, color: 'primary.main' }}
                                            >
                                                <HistoryIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    <ArrowUpwardIcon color="error" sx={{ fontSize: 12, mr: 0.2 }} /> Pay
                                                </Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'error.main', lineHeight: 1 }}>
                                                    {displayCurrency}{myDebt.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem sx={{ opacity: 0.1, height: 20, my: 'auto' }} />
                                            <Box>
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                                                    <ArrowDownwardIcon color="success" sx={{ fontSize: 12, mr: 0.2 }} /> Get
                                                </Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'success.main', lineHeight: 1 }}>
                                                    {displayCurrency}{myCredit.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}
                        {/* Group Name Widget */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper className="glass" sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: 4,
                                background: 'rgba(2, 136, 209, 0.05)',
                                border: '1px solid rgba(2, 136, 209, 0.2)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 8px 25px rgba(2, 136, 209, 0.15)',
                                    '& .stat-icon': { transform: 'scale(1.1) rotate(10deg)', opacity: 0.25 }
                                }
                            }}>
                                <Box className="stat-icon" sx={{ transition: 'all 0.3s ease', position: 'absolute', top: -15, right: -15, opacity: 0.15, color: 'info.main' }}>
                                    <GroupIcon sx={{ fontSize: 110 }} />
                                </Box>
                                {house ? (
                                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'info.main', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                Household
                                            </Typography>
                                            <Tooltip title="Share Invitation Link">
                                                <IconButton
                                                    onClick={handleShareHouse}
                                                    size="small"
                                                    sx={{
                                                        background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                                                        color: 'white',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        boxShadow: '0 4px 10px rgba(108, 99, 255, 0.3)',
                                                        '&:hover': {
                                                            transform: 'scale(1.15) rotate(5deg)',
                                                            boxShadow: '0 6px 15px rgba(108, 99, 255, 0.4)',
                                                            filter: 'brightness(1.1)'
                                                        }
                                                    }}
                                                >
                                                    <IosShareIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Typography variant="h4" sx={{
                                            fontWeight: 900,
                                            background: 'linear-gradient(45deg, #0288d1 30%, #26c6da 90%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            mb: 0.5,
                                            lineHeight: 1.2
                                        }}>
                                            {house.name}
                                        </Typography>

                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontStyle: 'italic', display: 'block', mb: 2.5 }}>
                                            {house.typeOfHouse === 'meals_and_expenses' ? 'Meals and Expenses Tracking' : 'Shared Expenses Tracking'}
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 3 }}>
                                            {house.members?.map((member) => (
                                                <Tooltip key={member.email} title={member.name || member.email.split('@')[0]}>
                                                    <Avatar
                                                        alt={member.name}
                                                        src={member.photoUrl}
                                                        onClick={() => handleMemberClick(member)}
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            cursor: 'pointer',
                                                            border: '2px solid rgba(255,255,255,0.2)',
                                                            transition: 'transform 0.2s',
                                                            '&:hover': { transform: 'scale(1.1) translateY(-2px)', borderColor: 'info.main' }
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))}
                                        </Box>

                                        <Button
                                            variant="contained"
                                            color="info"
                                            fullWidth
                                            startIcon={<PersonAddIcon />}
                                            onClick={() => setOpenAddMember(true)}
                                            sx={{
                                                mt: 'auto',
                                                borderRadius: 3,
                                                py: 1.2,
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                boxShadow: '0 4px 15px rgba(2, 136, 209, 0.2)',
                                                bgcolor: 'rgba(2, 136, 209, 0.1)',
                                                color: 'info.main',
                                                '&:hover': {
                                                    bgcolor: 'rgba(2, 136, 209, 0.2)',
                                                    transform: 'translateY(-2px)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            Add Member
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                                        <Typography variant="h6" color="info.main" sx={{ fontWeight: 800, mb: 1 }}>
                                            My House
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                                            You haven&apos;t joined any household yet.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="info"
                                            href="/profile?action=create-house"
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                        >
                                            Create House
                                        </Button>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* Buy List Widget */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper className="glass" sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: 4,
                                background: 'rgba(237, 108, 2, 0.05)',
                                border: '1px solid rgba(237, 108, 2, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    background: 'rgba(237, 108, 2, 0.08)',
                                    boxShadow: '0 12px 30px rgba(237, 108, 2, 0.15)',
                                    '& .stat-icon': { transform: 'scale(1.1) rotate(10deg)', opacity: 0.25 }
                                },
                            }}
                                onClick={() => router.push('/buy-list')}
                            >
                                <Box className="stat-icon" sx={{ transition: 'all 0.3s ease', position: 'absolute', top: -15, right: -15, opacity: 0.15, color: 'warning.main' }}>
                                    <FormatListBulletedIcon sx={{ fontSize: 110 }} />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'warning.main', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Buy List ({pendingTodos.length})
                                    </Typography>
                                </Box>

                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative', zIndex: 1 }}>
                                    {pendingTodos.length === 0 ? (
                                        <Typography color="text.secondary" variant="body2" sx={{ my: 'auto', textAlign: 'center', opacity: 0.7 }}>
                                            All caught up! ✨
                                        </Typography>
                                    ) : (
                                        pendingTodos.slice(0, 3).map(todo => (
                                            <Box key={todo.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', boxShadow: '0 0 10px rgba(237, 108, 2, 0.4)' }} />
                                                <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: 600 }}>
                                                    {todo.itemName}
                                                </Typography>
                                            </Box>
                                        ))
                                    )}
                                    {pendingTodos.length > 3 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 700, ml: 2.5 }}>
                                            + {pendingTodos.length - 3} more items
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', transition: 'color 0.2s', '&:hover': { color: 'warning.main' } }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                        {pendingTodos.length === 0 ? 'Add item' : 'View full list'}
                                    </Typography>
                                    <ArrowForwardIosIcon sx={{ fontSize: 10 }} />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>


                    {/* Pending Payment Requests (Receiver View) */}
                    {house?.typeOfHouse !== 'meals_and_expenses' && house && (() => {
                        const myPending = (house.pendingPayments || []).filter(
                            p => p.to === user?.email && p.status === 'pending'
                        );
                        if (myPending.length === 0) return null;
                        const houseMembers = house.members || [];
                        return (
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PaymentsIcon sx={{ color: 'info.main' }} /> Incoming Payments
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {myPending.map(payment => {
                                        const fromMember = houseMembers.find(m => m.email === payment.from);
                                        const fromName = fromMember?.name || payment.from.split('@')[0];
                                        return (
                                            <Paper key={payment.id} className="glass" sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                background: 'rgba(2, 136, 209, 0.04)',
                                                border: '1px solid rgba(2, 136, 209, 0.2)',
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                justifyContent: 'space-between',
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: 2
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar src={fromMember?.photoUrl} alt={fromMember?.name || 'Member'} sx={{ width: 40, height: 40, border: '2px solid rgba(2, 136, 209, 0.2)' }} />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                            {fromName} sent {displayCurrency}{payment.amount.toFixed(2)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                                                            Status: Waiting for your approval
                                                        </Typography>
                                                        {payment.method && (
                                                            <Chip
                                                                label={payment.method === 'cash' ? 'Cash' : 'Bank'}
                                                                size="small"
                                                                sx={{ ml: 1, height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(2, 136, 209, 0.1)', color: 'info.main' }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    color="info"
                                                    size="small"
                                                    startIcon={<HowToVoteIcon />}
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch('/api/houses/approve-payment', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    houseId: house.id,
                                                                    paymentId: payment.id,
                                                                    approverEmail: user?.email,
                                                                }),
                                                            });
                                                            if (res.ok) {
                                                                showToast('Payment approved!', 'success');
                                                                mutateHouse();
                                                                mutateExpenses();
                                                            }
                                                        } catch {
                                                            showToast('Error approving payment', 'error');
                                                        }
                                                    }}
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(2, 136, 209, 0.2)' }}
                                                >
                                                    Approve
                                                </Button>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </Box>
                        );
                    })()}

                    {/* Active Meal Summary and Tomorrow's Meal Widget Container */}
                    {house?.typeOfHouse === 'meals_and_expenses' && (
                        <Grid container spacing={3} sx={{ mt: 2 }}>
                            {/* Tomorrow's Meal Opt-Out Card */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                {(() => {
                                    const windowStart = house.mealUpdateWindowStart || '20:00';
                                    const windowEnd = house.mealUpdateWindowEnd || '05:00';
                                    const now = new Date();
                                    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    const isCrossMidnight = windowStart > windowEnd;
                                    const inWindow = isCrossMidnight
                                        ? (currentHHMM >= windowStart || currentHHMM <= windowEnd)
                                        : (currentHHMM >= windowStart && currentHHMM <= windowEnd);

                                    if (!inWindow) return (
                                        <Paper className="glass" sx={{
                                            p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2,
                                            bgcolor: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.1)'
                                        }}>
                                            <TimerOffIcon sx={{ color: 'text.disabled' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Meal window closed. Opens at Today <strong>{formatTimeStr(windowStart)}</strong> and closes at Tomorrow <strong>{formatTimeStr(windowEnd)}</strong>.
                                            </Typography>
                                        </Paper>
                                    );

                                    const isAfterMidnightPart = isCrossMidnight && currentHHMM <= windowEnd;
                                    const targetDate = new Date(now);
                                    if (!isAfterMidnightPart) targetDate.setDate(targetDate.getDate() + 1);
                                    const targetDateStr = targetDate.toISOString().split('T')[0];

                                    const myEmail = user?.email || '';
                                    const myDetails = (house.memberDetails?.[myEmail] || {}) as any;

                                    const isOff = myDetails.mealsEnabled === false && myDetails.offFromDate && targetDateStr >= myDetails.offFromDate;

                                    if (isOff) return (
                                        <Paper className="glass" sx={{
                                            p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2,
                                            bgcolor: 'rgba(255, 101, 132, 0.05)', border: '1px solid rgba(255, 101, 132, 0.2)'
                                        }}>
                                            <RestaurantIcon sx={{ color: '#FF6584' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF6584' }}>
                                                Your meals are turned OFF starting from {myDetails.offFromDate}.
                                            </Typography>
                                        </Paper>
                                    );

                                    const tomorrowStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                                    const tomorrowRecord = (meals || []).find(m => m.date === tomorrowStr);
                                    const myMeals = tomorrowRecord?.meals?.[myEmail] || {};
                                    const mealsPerDay = house.mealsPerDay || 3;

                                    const handleTomorrowMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner', current: boolean) => {
                                        try {
                                            const res = await fetch('/api/meals', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ houseId: house.id, date: tomorrowStr, email: myEmail, mealType, isTaking: !current })
                                            });
                                            if (res.ok) mutateMeals();
                                        } catch { /* silent */ }
                                    };

                                    return (
                                        <Paper className="glass" sx={{
                                            p: 3,
                                            height: '100%',
                                            bgcolor: 'rgba(76,175,80,0.06)',
                                            border: '1px solid rgba(76,175,80,0.15)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <RestaurantIcon sx={{ fontSize: 18 }} /> Tomorrow&apos;s Meal
                                                </Typography>
                                                <Chip label={`Closes at ${windowEnd}`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 700, color: 'success.main', borderColor: 'rgba(76,175,80,0.3)', bgcolor: 'rgba(76,175,80,0.05)' }} />
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, alignItems: 'stretch' }}>
                                                {[
                                                    { id: 'breakfast', label: 'B', full: 'Breakfast', checked: myMeals.breakfast ?? true },
                                                    { id: 'lunch', label: 'L', full: 'Lunch', checked: myMeals.lunch ?? true },
                                                    { id: 'dinner', label: 'D', full: 'Dinner', checked: myMeals.dinner ?? true }
                                                ].filter(m => m.id !== 'breakfast' || mealsPerDay === 3).map(meal => (
                                                    <Box
                                                        key={meal.id}
                                                        onClick={() => handleTomorrowMeal(meal.id as any, meal.checked)}
                                                        sx={{
                                                            flex: 1,
                                                            py: 2.5,
                                                            px: 1.5,
                                                            borderRadius: 4,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            bgcolor: meal.checked ? 'success.main' : 'rgba(0,0,0,0.06)',
                                                            color: meal.checked ? 'white' : 'text.secondary',
                                                            border: '1px solid',
                                                            borderColor: meal.checked ? 'success.dark' : 'rgba(0,0,0,0.1)',
                                                            boxShadow: meal.checked ? '0 6px 18px rgba(76, 175, 80, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            '&:hover': {
                                                                transform: 'translateY(-4px)',
                                                                bgcolor: meal.checked ? 'success.dark' : 'rgba(0,0,0,0.08)',
                                                                boxShadow: meal.checked ? '0 8px 20px rgba(76, 175, 80, 0.4)' : '0 6px 12px rgba(0,0,0,0.1)'
                                                            }
                                                        }}
                                                    >
                                                        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1, mb: 0.5 }}>{meal.label}</Typography>
                                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>{meal.full}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Paper>
                                    );
                                })()}
                            </Grid>

                            {/* Active Meal Summary */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                {(() => {
                                    const windowStart = house.mealUpdateWindowStart || '20:00';
                                    const now = new Date();
                                    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    const summaryDate = new Date(now);
                                    if (currentHHMM >= windowStart) summaryDate.setDate(summaryDate.getDate() + 1);

                                    const summaryStr = `${summaryDate.getFullYear()}-${String(summaryDate.getMonth() + 1).padStart(2, '0')}-${String(summaryDate.getDate()).padStart(2, '0')}`;
                                    const summaryLabel = summaryDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
                                    const summaryRecord = (meals || []).find(m => m.date === summaryStr);
                                    const mealsPerDay = house.mealsPerDay || 3;

                                    return (
                                        <Paper className="glass" sx={{
                                            p: 3,
                                            bgcolor: 'rgba(108, 99, 255, 0.04)',
                                            border: '1px solid rgba(108, 99, 255, 0.15)',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <GroupIcon sx={{ fontSize: 18 }} /> Meal Summary — {summaryLabel}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, flexGrow: 1, alignItems: 'center', '::-webkit-scrollbar': { height: 4 } }}>
                                                {allMembers.filter(m => {
                                                    const details = house?.memberDetails?.[m.email];
                                                    const monthStr = summaryStr.substring(0, 7);
                                                    if (details?.joinedAt && details.joinedAt.substring(0, 7) > monthStr) return false;
                                                    if (details?.leftDate && details.leftDate.substring(0, 7) < monthStr) return false;
                                                    return true;
                                                }).map(member => {
                                                    const mb = isTakingMeal(member.email, summaryStr, 'breakfast', house, meals);
                                                    const ml = isTakingMeal(member.email, summaryStr, 'lunch', house, meals);
                                                    const md = isTakingMeal(member.email, summaryStr, 'dinner', house, meals);
                                                    const hasAny = (mealsPerDay === 3 ? mb : false) || ml || md;

                                                    // Hide members who are not taking any meal
                                                    if (!hasAny) return null;

                                                    return (
                                                        <Box key={member.email} sx={{
                                                            minWidth: 90,
                                                            p: 1.5,
                                                            bgcolor: 'rgba(255,255,255,0.7)',
                                                            borderRadius: 3,
                                                            border: '1px solid rgba(255,255,255,0.3)',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': { transform: 'scale(1.02)', bgcolor: 'white' }
                                                        }}>
                                                            <Avatar src={member.photoUrl} alt={member.name || 'Member'} sx={{ width: 36, height: 36, mb: 1, border: '2px solid', borderColor: hasAny ? 'primary.light' : 'error.light', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                                {member.name ? member.name[0].toUpperCase() : member.email[0].toUpperCase()}
                                                            </Avatar>
                                                            <Typography variant="caption" noWrap sx={{ fontWeight: 800, width: '100%', textAlign: 'center', mb: 1, fontSize: '0.7rem' }}>
                                                                {member.name?.split(' ')[0] || member.email.split('@')[0]}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                {[
                                                                    { id: 'b', show: mealsPerDay === 3, active: mb },
                                                                    { id: 'l', show: true, active: ml },
                                                                    { id: 'd', show: true, active: md }
                                                                ].filter(m => m.show).map(m => (
                                                                    <Box key={m.id} sx={{
                                                                        width: 16, height: 16, borderRadius: '50%',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: '0.55rem', fontWeight: 900,
                                                                        bgcolor: m.active ? 'primary.main' : 'rgba(0,0,0,0.04)',
                                                                        color: m.active ? 'white' : 'text.disabled',
                                                                        border: '1px solid', borderColor: m.active ? 'primary.dark' : 'rgba(0,0,0,0.1)',
                                                                        boxShadow: m.active ? '0 1px 3px rgba(108, 99, 255, 0.3)' : 'none'
                                                                    }}>
                                                                        {m.id.toUpperCase()}
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Paper>
                                    );
                                })()}
                            </Grid>
                        </Grid>
                    )}

                    {/* Pending Deposit Approvals (Manager View) */}
                    {house?.typeOfHouse === 'meals_and_expenses' && (house.memberDetails?.[user?.email || '']?.role === 'manager' || house.createdBy === user?.email) && (() => {
                        const pendingDeposits = (fundDeposits || []).filter(d => d.status === 'pending');
                        if (pendingDeposits.length === 0) return null;

                        return (
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccountBalanceIcon sx={{ color: 'success.main' }} /> Pending Deposits
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {pendingDeposits.map(deposit => {
                                        const fromMember = (house.members || []).find(m => m.email === deposit.email);
                                        const fromName = fromMember?.name || deposit.email.split('@')[0];
                                        return (
                                            <Paper key={deposit.id} className="glass" sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                background: 'rgba(76, 175, 80, 0.04)',
                                                border: '1px solid rgba(76, 175, 80, 0.2)',
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                justifyContent: 'space-between',
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: 2
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar src={fromMember?.photoUrl} alt={fromMember?.name || 'Member'} sx={{ width: 40, height: 40, border: '2px solid rgba(76, 175, 80, 0.2)' }} />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                            {fromName} requested to deposit {displayCurrency}{deposit.amount.toFixed(2)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                                                            Verify the transfer and approve
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch('/api/fund-deposits/approve', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ depositId: deposit.id, action: 'reject', managerEmail: user?.email })
                                                                });
                                                                if (res.ok) {
                                                                    showToast('Deposit rejected', 'info');
                                                                    mutateHouse();
                                                                    mutateFundDeposits();
                                                                }
                                                            } catch {
                                                                showToast('Error processing request', 'error');
                                                            }
                                                        }}
                                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                                    >
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch('/api/fund-deposits/approve', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ depositId: deposit.id, action: 'approve', managerEmail: user?.email })
                                                                });
                                                                if (res.ok) {
                                                                    showToast('Deposit approved', 'success');
                                                                    mutateHouse();
                                                                    mutateFundDeposits();
                                                                }
                                                            } catch {
                                                                showToast('Error processing request', 'error');
                                                            }
                                                        }}
                                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)' }}
                                                    >
                                                        Approve
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </Box>
                        );
                    })()}

                    {/* House Fund Summary Table (Bottom) */}
                    {house?.typeOfHouse === 'meals_and_expenses' && (
                        <Box sx={{ mt: 6 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalanceWalletIcon color="primary" /> Monthly Summary — {selectedDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                            </Typography>
                            <Paper className="glass" sx={{ p: 3, borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Grid container spacing={4}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, fontWeight: 700 }}>Financial Status</Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Current Remaining Fund</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: houseFundStatsResult.remainingFund >= 0 ? 'success.main' : 'error.main' }}>{displayCurrency}{houseFundStatsResult.remainingFund.toFixed(2)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Prev. Months Remaining</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayCurrency}{houseFundStatsResult.previousMonthsRemaining.toFixed(2)}</Typography>
                                            </Box>
                                            <Divider sx={{ opacity: 0.1 }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                Note: Remaining funds are automatically added to the next month's calculation.
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, fontWeight: 700 }}>Meal Accounting</Typography>
                                        <Box sx={{ overflowX: 'auto' }}>
                                            <Box sx={{ minWidth: 280, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.05)', pb: 1 }}>
                                                    <Typography variant="caption" sx={{ flex: 1.5, fontWeight: 800 }}>Member</Typography>
                                                    <Typography variant="caption" sx={{ flex: 1, fontWeight: 800, textAlign: 'center' }}>Meals</Typography>
                                                    <Typography variant="caption" sx={{ flex: 1, fontWeight: 800, textAlign: 'center' }}>Spent</Typography>
                                                    <Typography variant="caption" sx={{ flex: 1, fontWeight: 800, textAlign: 'right' }}>Balance</Typography>
                                                </Box>
                                                {(() => {
                                                    const monthStr = getYYYYMM(selectedDate);
                                                    return allMembers.filter(m => {
                                                        const details = house?.memberDetails?.[m.email];
                                                        if (details?.joinedAt && details.joinedAt.substring(0, 7) > monthStr) return false;
                                                        if (details?.leftDate && details.leftDate.substring(0, 7) < monthStr) return false;
                                                        return true;
                                                    }).map(member => {
                                                        const mStats = memberFundAccounting[member.email] || {
                                                            deposits: 0, rent: 0, utilities: 0, wage: 0, mealCount: 0, mealCost: 0,
                                                            periodicDeposits: 0, periodicRent: 0, periodicUtilities: 0, periodicWage: 0,
                                                            periodicMealCount: 0, periodicMealCost: 0,
                                                            openingBalance: 0, closingBalance: 0
                                                        };
                                                        const remaining = mStats.closingBalance;
                                                        const details = house?.memberDetails?.[member.email];
                                                        const leftDate = details?.leftDate;
                                                        const hasLeft = !!leftDate && leftDate.substring(0, 7) === monthStr;
                                                        const leftLabel = hasLeft && leftDate
                                                            ? (() => {
                                                                if (leftDate.length <= 10) {
                                                                    const [, mm, dd] = leftDate.split('-');
                                                                    const day = parseInt(dd);
                                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                                    return `${day} ${months[parseInt(mm) - 1]}`;
                                                                }
                                                                const d = new Date(leftDate);
                                                                const day = d.getDate();
                                                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                                const h = d.getHours(), m = d.getMinutes();
                                                                const timeStr = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                                                                return `${day} ${months[d.getMonth()]}, ${timeStr}`;
                                                            })()
                                                            : null;


                                                        return (
                                                            <Box key={member.email} sx={{ display: 'flex', alignItems: 'center', opacity: hasLeft ? 0.65 : 1 }}>
                                                                <Box sx={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Avatar src={member.photoUrl} alt={member.name || 'Member'} sx={{ width: 20, height: 20, fontSize: '0.6rem', filter: hasLeft ? 'grayscale(1)' : 'none' }}>{member.name?.[0]}</Avatar>
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: hasLeft ? 'text.disabled' : 'inherit', lineHeight: 1.2 }}>{member.name?.split(' ').slice(0, 2).join(' ')}</Typography>
                                                                        {leftLabel && (
                                                                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.primary', opacity: 0.7, fontStyle: 'italic', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                                                                {leftLabel}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                                <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', color: hasLeft ? 'text.disabled' : 'inherit' }}>{mStats.periodicMealCount}</Typography>
                                                                <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', color: hasLeft ? 'text.disabled' : 'inherit' }}>{displayCurrency}{mStats.periodicMealCost.toFixed(2)}</Typography>
                                                                <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', fontWeight: 800, color: hasLeft ? 'text.disabled' : remaining >= 0 ? 'success.main' : 'error.main' }}>
                                                                    {displayCurrency}{remaining.toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    });
                                                })()}
                                                <Box sx={{ display: 'flex', mt: 1, pt: 1, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                                                    <Typography variant="body2" sx={{ flex: 1.5, fontWeight: 800, fontSize: '0.8rem' }}>Total</Typography>
                                                    <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{houseFundStatsResult.periodicTotalMeals}</Typography>
                                                    <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{displayCurrency}{houseFundStatsResult.periodicTotalGroceries.toFixed(2)}</Typography>
                                                    <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', fontWeight: 800, color: 'primary.main', fontSize: '0.75rem' }}>
                                                        {displayCurrency}{houseFundStatsResult.periodicCostPerMeal.toFixed(2)}/meal
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>
                    )}

                    {/* Settlements Widget */}
                    {house?.typeOfHouse !== 'meals_and_expenses' && house && expenses.length > 0 && house.members && house.members.length > 1 && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom>Settlements (Who owes whom)</Typography>
                            <Grid container spacing={2}>
                                {settlements.length === 0 ? (
                                    <Grid size={{ xs: 12 }}>
                                        <Paper className="glass" sx={{ p: 2, background: 'transparent' }}>
                                            <Typography color="text.secondary">All settled up! No payments needed.</Typography>
                                        </Paper>
                                    </Grid>
                                ) : (
                                    settlements.map((settlement, index) => {
                                        const members = house?.members || [];
                                        const fromMember = members.find(m => m.email === settlement.from);
                                        const toMember = members.find(m => m.email === settlement.to);
                                        const fromName = fromMember?.name || settlement.from.split('@')[0];
                                        const toName = toMember?.name || settlement.to.split('@')[0];
                                        const isCurrentUserPayer = settlement.from === user?.email;
                                        const isCurrentUserReceiver = settlement.to === user?.email;

                                        // Check if current user has a pending payment request for this pair
                                        const hasPendingRequest = (house.pendingPayments || []).some(
                                            p => p.from === settlement.from && p.to === settlement.to && p.status === 'pending'
                                        );

                                        // IBAN of receiver (available from member data fetched via my-house API)
                                        const toUserIban = (toMember as { iban?: string })?.iban;

                                        let message;
                                        if (isCurrentUserPayer) {
                                            message = (
                                                <Typography variant="body1">
                                                    <strong>You</strong> owe <strong>{toName}</strong>
                                                </Typography>
                                            );
                                        } else if (isCurrentUserReceiver) {
                                            message = (
                                                <Typography variant="body1">
                                                    <strong>{fromName}</strong> owes <strong>you</strong>
                                                </Typography>
                                            );
                                        } else {
                                            message = (
                                                <Typography variant="body1">
                                                    <strong>{fromName}</strong> owes <strong>{toName}</strong>
                                                </Typography>
                                            );
                                        }

                                        return (
                                            <Grid size={{ xs: 12, md: 6 }} key={`${settlement.from}-${settlement.to}-${settlement.amount}-${index}`}>
                                                <Paper className="glass" sx={{ p: 2, background: 'transparent', borderLeft: `4px solid ${isCurrentUserPayer ? '#ff9800' : isCurrentUserReceiver ? '#4caf50' : '#6C63FF'}` }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                                        <Box>
                                                            {message}
                                                            {isCurrentUserPayer && toUserIban && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                                                                    IBAN: {toUserIban}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                                                {displayCurrency}{settlement.amount.toFixed(2)}
                                                            </Typography>
                                                            {isCurrentUserPayer && (
                                                                hasPendingRequest ? (
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        color="warning"
                                                                        onClick={() => {
                                                                            const pendingReq = (house.pendingPayments || []).find(
                                                                                p => p.from === settlement.from && p.to === settlement.to && p.status === 'pending'
                                                                            );
                                                                            if (pendingReq) {
                                                                                setCancelPaymentId(pendingReq.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        Cancel Request
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="contained"
                                                                        size="small"
                                                                        startIcon={<PaymentsIcon />}
                                                                        color="success"
                                                                        onClick={() => {
                                                                            setPaySettlement(settlement);
                                                                            setPayAmount(settlement.amount.toFixed(2));
                                                                            setPayMethod('bank');
                                                                            setOpenPayDialog(true);
                                                                        }}
                                                                    >
                                                                        Pay Now
                                                                    </Button>
                                                                )
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        );
                                    })
                                )}
                            </Grid>
                        </Box>
                    )}


                    <Box sx={{ mt: 6 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormatListBulletedIcon sx={{ color: 'primary.main' }} /> Expenses for {selectedDate.toLocaleString('default', { month: 'long' })}
                        </Typography>
                        {filteredExpenses.length === 0 ? (
                            <Paper className="glass" sx={{ p: 4, textAlign: 'center', borderRadius: 4, background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                <Typography color="text.secondary">No expenses found for this month.</Typography>
                            </Paper>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {(() => {
                                    const sortedExpenses = [...filteredExpenses]
                                        .filter((e: Expense) => !e.isSettlementPayment)
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                    const displayedExpenses = showAllExpenses ? sortedExpenses : sortedExpenses.slice(0, 5);

                                    return (
                                        <>
                                            {displayedExpenses.map((expense) => {
                                                const member = allMembers.find(m => m.email === expense.userId);
                                                const memberName = member?.name || expense.userId.split('@')[0];
                                                const expenseDate = new Date(expense.date);
                                                const expenseDateStr = `${formatDateLocale(expenseDate, { day: 'numeric', month: 'short' })}, ${formatTimeLocale(expenseDate)}`;

                                                const isOwner = user?.email === expense.userId;
                                                const now = new Date();
                                                const diffInHours = (now.getTime() - expenseDate.getTime()) / (1000 * 60 * 60);
                                                const canEdit = isOwner && diffInHours <= 48;

                                                return (
                                                    <Paper
                                                        key={expense.id}
                                                        className="glass"
                                                        onClick={() => {
                                                            if (expense.category === 'groceries') {
                                                                setSelectedExpenseDetail(expense);
                                                                setOpenExpenseDetail(true);
                                                            }
                                                        }}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 3,
                                                            background: 'rgba(255, 255, 255, 0.03)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            transition: 'all 0.2s ease',
                                                            cursor: expense.category === 'groceries' ? 'pointer' : 'default',
                                                            '&:hover': {
                                                                background: 'rgba(255, 255, 255, 0.06)',
                                                                transform: expense.category === 'groceries' ? 'translateY(-2px)' : 'none',
                                                                borderColor: expense.category === 'groceries' ? 'secondary.main' : 'primary.main',
                                                                boxShadow: expense.category === 'groceries' ? '0 8px 25px rgba(108, 99, 255, 0.15)' : 'none'
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                                                <Avatar src={member?.photoUrl} alt={member?.name || 'Member'} sx={{ width: 36, height: 36, border: '2px solid rgba(108, 99, 255, 0.2)' }} />
                                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            mb: 0.25,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: expense.category === 'groceries' ? 'nowrap' : 'normal'
                                                                        }}
                                                                    >
                                                                        {house?.typeOfHouse === 'meals_and_expenses' && expense.category
                                                                            ? `${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}: `
                                                                            : ''}
                                                                        {expense.description}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', opacity: 0.8 }}>
                                                                        {(() => {
                                                                            const hasOtherContributors = expense.contributors && expense.contributors.some(c => c.email !== expense.userId);
                                                                            const shopperContrib = expense.contributors?.find(c => c.email === expense.userId);

                                                                            return (
                                                                                <>
                                                                                    <span style={{ fontWeight: 400 }}>
                                                                                        {memberName}
                                                                                        {hasOtherContributors && shopperContrib && ` ${displayCurrency}${shopperContrib.amount.toFixed(2)}`}
                                                                                    </span>
                                                                                    {hasOtherContributors && (
                                                                                        <>
                                                                                            <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                                                                                            <span style={{ opacity: 0.8 }}>
                                                                                                {expense.contributors?.[0] && expense.contributors
                                                                                                    .filter(c => c.email !== expense.userId)
                                                                                                    .map((c, i, arr) => {
                                                                                                        const contribMember = allMembers.find(m => m.email === c.email);
                                                                                                        const cName = contribMember?.name || c.email.split('@')[0];
                                                                                                        return `${cName} ${displayCurrency}${c.amount.toFixed(2)}${i < arr.length - 1 ? ', ' : ''}`;
                                                                                                    })
                                                                                                    .join('')}
                                                                                            </span>
                                                                                        </>
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                        <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                                                                        {expenseDateStr}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
                                                                <Typography variant="h6" color="primary" sx={{ fontWeight: 900 }}>
                                                                    {displayCurrency}{expense.amount.toFixed(2)}
                                                                </Typography>
                                                                {canEdit && (
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteExpense(expense.id);
                                                                        }}
                                                                        sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)', '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' } }}
                                                                        aria-label="Delete expense"
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                );
                                            })}
                                            {sortedExpenses.length > 5 && (
                                                <Button
                                                    onClick={() => setShowAllExpenses(!showAllExpenses)}
                                                    sx={{
                                                        mt: 1,
                                                        alignSelf: 'center',
                                                        borderRadius: 3,
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        color: 'primary.main',
                                                        bgcolor: 'rgba(108, 99, 255, 0.05)',
                                                        px: 4,
                                                        '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.1)' }
                                                    }}
                                                >
                                                    {showAllExpenses ? 'Show Less' : `Show ${sortedExpenses.length - 5} More`}
                                                </Button>
                                            )}
                                        </>
                                    );
                                })()}
                            </Box>
                        )}
                    </Box>
                </Container>

                <Box sx={{ pb: 7 }}> {/* Padding for BottomNav */}
                    <BottomNav />
                </Box>

                <DeleteConfirmationDialog
                    open={openDeleteConfirm}
                    onClose={() => setOpenDeleteConfirm(false)}
                    onConfirm={confirmDeleteExpense}
                    title="Delete Expense"
                    message="Are you sure you want to delete this expense? This action cannot be undone."
                />

                <AddMemberDialog
                    open={openAddMember}
                    onClose={() => setOpenAddMember(false)}
                    newMemberEmail={newMemberEmail}
                    setNewMemberEmail={setNewMemberEmail}
                    onConfirm={handleAddMember}
                />

                <EditExpenseDialog
                    open={openEditExpense}
                    onClose={() => setOpenEditExpense(false)}
                    editDescription={editDescription}
                    setEditDescription={setEditDescription}
                    editAmount={editAmount}
                    setEditAmount={setEditAmount}
                    onConfirm={handleSaveEdit}
                />

                <CancelPaymentDialog
                    open={!!cancelPaymentId}
                    onClose={() => setCancelPaymentId(null)}
                    onConfirm={handleCancelPayment}
                />

                <ConfirmPaymentDialog
                    open={openPayDialog}
                    onClose={() => setOpenPayDialog(false)}
                    paySettlement={paySettlement}
                    allMembers={allMembers}
                    payAmount={payAmount}
                    setPayAmount={setPayAmount}
                    payMethod={payMethod}
                    setPayMethod={setPayMethod}
                    displayCurrency={displayCurrency}
                    onConfirm={handleConfirmPayment}
                />

                <SubmitDepositDialog
                    open={openDepositDialog}
                    onClose={() => setOpenDepositDialog(false)}
                    depositAmount={depositAmount}
                    setDepositAmount={setDepositAmount}
                    displayCurrency={displayCurrency}
                    onConfirm={handleRequestDeposit}
                />

                <DepositDetailsDialog
                    open={openDepositDetails}
                    onClose={() => setOpenDepositDetails(false)}
                    pendingDeposits={pendingDeposits}
                    allMembers={allMembers}
                    user={user}
                    house={house}
                    displayCurrency={displayCurrency}
                    monthName={monthName}
                    memberFundAccounting={memberFundAccounting}
                    houseFundStatsResult={houseFundStatsResult}
                    handleCancelDeposit={handleCancelDeposit}
                    monthStr={getYYYYMM(selectedDate)}
                />

                <ExpenseDetailDialog
                    open={openExpenseDetail}
                    onClose={() => setOpenExpenseDetail(false)}
                    expense={selectedExpenseDetail}
                    allMembers={allMembers}
                    displayCurrency={displayCurrency}
                />

                <FundHistoryDialog
                    open={openFundHistoryDialog}
                    onClose={() => setOpenFundHistoryDialog(false)}
                    monthName={monthName}
                    fundDeposits={fundDeposits}
                    selectedDate={selectedDate}
                    allMembers={allMembers}
                    currency={currency}
                    currencySymbols={currencySymbols}
                    getYYYYMM={getYYYYMM}
                    formatDateLocale={formatDateLocale}
                    formatTimeLocale={formatTimeLocale}
                />

                <MemberDetailsDialog
                    open={openMemberDialog}
                    onClose={() => setOpenMemberDialog(false)}
                    member={selectedMember}
                    house={house}
                    handleCopy={handleCopy}
                />

                <SettlementHistoryDialog
                    open={openHistoryDialog}
                    onClose={() => setOpenHistoryDialog(false)}
                    expenses={expenses}
                    allMembers={allMembers}
                    user={user}
                    displayCurrency={displayCurrency}
                />
            </main>
            <ShareHouseDialog
                open={openShareDialog}
                onClose={() => setOpenShareDialog(false)}
                house={house}
                handleCopy={handleCopy}
            />
            {house?.typeOfHouse === 'meals_and_expenses' && (
                <JoinDayMealDialog
                    house={house ?? undefined}
                    userEmail={user?.email}
                    onSuccess={() => mutateHouse()}
                />
            )}
        </AuthGuard >
    );
}
