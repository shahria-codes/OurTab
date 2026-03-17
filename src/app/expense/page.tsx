'use client';

import Container from '@mui/material/Container';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import { useToast } from '@/components/ToastContext';
import { calculateMemberFundAccounting } from '@/utils/accounting';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PeopleIcon from '@mui/icons-material/People';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CircularProgress from '@mui/material/CircularProgress';
import { Contributor } from '@/types/settlement-types';
import { useRef } from 'react';
import Image from 'next/image';
import ReceiptProcessor from '@/components/ReceiptProcessor';
import ShoppingIllustration from '@/components/expense/ShoppingIllustration';

interface GroceryItem {
    id: string;
    name: string;
    price: number;
}

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
    settlementBetween?: string[];
}

interface HouseMember {
    email: string;
    name?: string;
    photoUrl?: string;
    role?: 'manager' | 'member';
    rentAmount?: number;
}

export default function ExpensePage() {
    const { user, currency, dbUser, house } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    // Item list state
    const [items, setItems] = useState<GroceryItem[]>([]);

    // Current item being added
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');

    // Optional note for this expense
    const [note, setNote] = useState('');

    const [loading, setLoading] = useState(false);
    const [fundDeposits, setFundDeposits] = useState<any[]>([]);
    const [meals, setMeals] = useState<any[]>([]);
    const [expenseCategory, setExpenseCategory] = useState<string>('groceries');

    // House Members state from useHouseData hooked house members directly
    const houseMembers = house?.members || [];

    const [contributors, setContributors] = useState<{ [email: string]: string }>({});
    const [selectedContributors, setSelectedContributors] = useState<Set<string>>(new Set());
    const [myContribution, setMyContribution] = useState<string>('');
    const [scanning, setScanning] = useState(false);
    const [uploadAnchorEl, setUploadAnchorEl] = useState<null | HTMLElement>(null);
    const [showAIWarning, setShowAIWarning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);


    // Add item to list
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();

        if (!itemName.trim() || !itemPrice) return;

        const newItem: GroceryItem = {
            id: Date.now().toString(),
            name: itemName.trim(),
            price: parseFloat(itemPrice)
        };

        setItems([...items, newItem]);
        setItemName('');
        setItemPrice('');
        setShowAIWarning(false);
    };


    // Remove item from list
    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    // Update item price
    const handleUpdateItemPrice = (id: string, newPrice: string) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, price: parseFloat(newPrice) || 0 };
            }
            return item;
        }));
    };

    // Handle Receipt Scan
    const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanning(true);
        setShowAIWarning(false);
        showToast('Scanning receipt...', 'info');

        try {
            let fileToProcess = file;

            // Check if file is HEIC/HEIF
            const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' ||
                file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

            if (isHEIC) {
                showToast('Converting iPhone photo...', 'info');
                try {
                    const heic2any = (await import('heic2any')).default;
                    const result = await heic2any({
                        blob: file,
                        toType: 'image/jpeg',
                        quality: 0.8
                    });

                    const blob = Array.isArray(result) ? result[0] : result;
                    fileToProcess = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                        type: 'image/jpeg'
                    });
                } catch (convErr) {
                    console.error('HEIC conversion failed:', convErr);
                    // Fallback to original file
                }
            }

            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(fileToProcess);
            });

            const base64Image = await base64Promise;

            const res = await fetch('/api/ai/process-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to scan receipt');
            }

            const newItems = await res.json();

            if (Array.isArray(newItems) && newItems.length > 0) {
                const formattedItems: GroceryItem[] = newItems.map((item: any) => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: item.name,
                    price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
                }));

                setItems(prev => [...prev, ...formattedItems]);
                setShowAIWarning(true);
                showToast(`Successfully added ${formattedItems.length} items from receipt!`, 'success');
            } else {
                showToast('No items found on the receipt.', 'warning');
            }
        } catch (err: any) {
            console.error('Scan error:', err);
            showToast(err.message || 'Failed to scan receipt. Please try again.', 'error');
        } finally {
            setScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (galleryInputRef.current) galleryInputRef.current.value = '';
        }
    };

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price, 0);

    // Format currency symbol
    const getCurrencySymbol = () => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'BDT': return '৳';
            default: return '$';
        }
    };

    // Removed useEffect for loading group members - using cached 'group' from useAuth

    // Handle contributor selection
    const handleContributorToggle = (email: string) => {
        const newSelected = new Set(selectedContributors);
        if (newSelected.has(email)) {
            newSelected.delete(email);
            const newContributors = { ...contributors };
            delete newContributors[email];
            setContributors(newContributors);
        } else {
            newSelected.add(email);
        }
        setSelectedContributors(newSelected);
    };

    const handleContributorAmountChange = (email: string, amount: string) => {
        setContributors({
            ...contributors,
            [email]: amount
        });
    };

    const handleMyContributionChange = (amount: string) => {
        setMyContribution(amount);
        const amountNum = parseFloat(amount) || 0;

        if (selectedContributors.size > 0 && total > 0) {
            const remainingForOthers = Math.max(0, total - amountNum);
            const sharePerOther = remainingForOthers / selectedContributors.size;

            const newContributors: { [email: string]: string } = {};
            selectedContributors.forEach(email => {
                newContributors[email] = sharePerOther.toFixed(2);
            });
            setContributors(newContributors);
        }
    };

    const handleSplitEqually = () => {
        if (selectedContributors.size === 0) return;

        const includingMe = selectedContributors.has(user?.email || '');
        const totalPeople = selectedContributors.size + (includingMe ? 0 : 1);
        const equalShare = total / totalPeople;
        const equalShareStr = equalShare.toFixed(2);

        const newContributors: { [email: string]: string } = {};
        selectedContributors.forEach(email => {
            newContributors[email] = equalShareStr;
        });

        setContributors(newContributors);
        setMyContribution(equalShareStr);
    };

    const handleIPayAll = () => {
        setSelectedContributors(new Set());
        setContributors({});
        setMyContribution(total.toFixed(2));
    };

    // Calculate totals
    const totalContributions = Object.values(contributors).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
    const myContributionNum = parseFloat(myContribution) || 0;
    const remaining = total - totalContributions - myContributionNum;


    // Auto-fill "Your contribution" with the remaining amount when others' contributions change
    useEffect(() => {
        if (total > 0 && selectedContributors.size > 0) {
            const autoAmount = total - totalContributions;
            // Only update if the difference is significant to avoid overwriting user typing
            if (Math.abs((parseFloat(myContribution) || 0) - autoAmount) > 0.001) {
                setMyContribution(Math.max(0, autoAmount).toFixed(2));
            }
        }
    }, [totalContributions, total, selectedContributors.size, myContribution]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0) {
            showToast('Please add at least one item.', 'error');
            return;
        }

        if (!user) return;

        setLoading(true);


        try {
            console.log('Starting expense submission for user:', user.email);

            // Use cached dbUser
            if (!dbUser || !dbUser.houseId) {
                console.log('User has no houseId in cache');
                // Fallback check or just error?
                // If cache is consistent, this should be enough.
                if (!dbUser?.houseId) {
                    showToast('You must belong to a house to add expenses.', 'error');
                    setLoading(false);
                    return;
                }
            }

            // Create description with items breakdown
            const itemsBreakdown = items.map(item => `${item.name} ${getCurrencySymbol()}${item.price.toFixed(2)}`).join(', ');
            const description = note
                ? `${note} (Items: ${itemsBreakdown})`
                : itemsBreakdown;

            // Prepare contributors array
            const contributorsList: Contributor[] = [];

            // Add selected contributors
            selectedContributors.forEach(email => {
                const amountStr = contributors[email] || '0';
                const amount = parseFloat(amountStr) || 0;
                if (amount > 0) {
                    contributorsList.push({ email, amount });
                }
            });

            // Always add the creator's contribution (remaining amount)
            const creatorAmount = myContributionNum > 0 ? myContributionNum : Math.max(0, total - totalContributions);
            if (creatorAmount > 0.01) {
                contributorsList.push({ email: user.email!, amount: parseFloat(creatorAmount.toFixed(2)) });
            }

            const expenseRes = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total.toString(),
                    description,
                    category: house?.typeOfHouse === 'meals_and_expenses' ? expenseCategory : 'groceries',
                    userId: user.email, // Use email as ID concept
                    houseId: dbUser.houseId,
                    contributors: contributorsList.length > 0 ? contributorsList : undefined,
                    clientTimestamp: new Date().toISOString()
                })
            });

            if (!expenseRes.ok) {
                const errorData = await expenseRes.json();
                console.error('Failed to create expense:', errorData);
                throw new Error('Failed to create expense');
            }

            showToast('Expense submitted successfully!', 'success');
            setItems([]);
            setNote('');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (err) {
            console.error('Error adding expense:', err);
            showToast('Failed to submit expense. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [openHistory, setOpenHistory] = useState(false);
    const [monthlyExpenses, setMonthlyExpenses] = useState<{ [key: string]: Expense[] }>({});
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]); // Optional: only needed if calculating settlements all-time
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [expandedMonth, setExpandedMonth] = useState<string | false>(false);
    const [loadingMonth, setLoadingMonth] = useState<string | null>(null);

    // Removed local groupData state, use 'group' from useAuth

    // Helper to load image for PDF
    const loadImage = (url: string): Promise<string | null> => {
        return new Promise((resolve) => {
            if (!url) {
                resolve(null);
                return;
            }
            const img = new window.Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => {
                console.warn('Failed to load image:', url);
                resolve(null);
            };
            img.src = url;
        });
    };


    // Fetch available months list and load current month
    const handleOpenHistory = async () => {
        if (!user || !house) return;
        setLoading(true);
        try {
            if (house.id) {
                // 1. Generate available months from house.createdAt to now
                const months: string[] = [];
                const now = new Date();
                const startDate = house.createdAt ? new Date(house.createdAt) : new Date(now.getFullYear(), now.getMonth() - 6, 1); // fallback 6 months
                
                let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth(), 1);

                while (current <= end) {
                    const yr = current.getFullYear();
                    const mo = String(current.getMonth() + 1).padStart(2, '0');
                    months.unshift(`${yr}-${mo}`); // Newest first
                    current.setMonth(current.getMonth() + 1);
                }
                setAvailableMonths(months);

                // 2. Pre-fetch the current month immediately
                const currentMonthKey = months[0];
                await fetchMonthData(house.id, currentMonthKey, house.typeOfHouse);
                setExpandedMonth(currentMonthKey);
                setOpenHistory(true);
            } else {
                showToast('House not found', 'error');
            }
        } catch (error) {
            console.error("Failed to open history", error);
            showToast('Failed to load history', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch data for a specific month (lazy load)
    const fetchMonthData = async (houseId: string, monthKey: string, typeOfHouse?: string) => {
        try {
            setLoadingMonth(monthKey);
            const expensesRes = await fetch(`/api/expenses?houseId=${houseId}&month=${monthKey}`);
            const expensesData = await expensesRes.json();

            if (typeOfHouse === 'meals_and_expenses') {
                // Fetch just this month's meals and deposits if needed, though they don't have month filtering yet.
                // For now, this optimization primarily tackles expenses (the largest collection)
                const [depositsRes, mealsRes] = await Promise.all([
                    fetch(`/api/fund-deposits?houseId=${houseId}`),
                    fetch(`/api/meals?houseId=${houseId}`)
                ]);
                const depositsData = await depositsRes.json();
                const mealsData = await mealsRes.json();
                
                // Add to existing deposits and meals safely
                setFundDeposits(prev => {
                    const existingIds = new Set(prev.map(d => d.id));
                    const newDeposits = depositsData.filter((d: any) => !existingIds.has(d.id));
                    return [...prev, ...newDeposits];
                });
                setMeals(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMeals = mealsData.filter((m: any) => !existingIds.has(m.id));
                    return [...prev, ...newMeals];
                });
            }

            setMonthlyExpenses(prev => ({ ...prev, [monthKey]: expensesData }));
            
            // Also add to allExpenses for settlement logic in the PDF, though historically we'd want all-time data
            // Since the PDF requires all expenses to calculate settlements perfectly, we handle it incrementally
            setAllExpenses(prev => {
                const existingIds = new Set(prev.map(e => e.id));
                const newExpenses = expensesData.filter((e: Expense) => !existingIds.has(e.id));
                return [...prev, ...newExpenses];
            });

        } catch (error) {
            console.error(`Failed to fetch data for ${monthKey}`, error);
            showToast(`Failed to load expenses for ${formatMonthDisplay(monthKey)}`, 'error');
        } finally {
            setLoadingMonth(null);
        }
    };

    const handleExpandMonth = (monthKey: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedMonth(isExpanded ? monthKey : false);
        // If expanding and data not loaded, fetch it
        if (isExpanded && house?.id && !monthlyExpenses[monthKey]) {
            fetchMonthData(house.id, monthKey, house.typeOfHouse);
        }
    };

    // Convert a YYYY-MM key to a human-readable label like "March 2026"
    const formatMonthDisplay = (yyyymm: string) => {
        const [yr, mo] = yyyymm.split('-');
        const d = new Date(Number(yr), Number(mo) - 1, 1);
        return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    };

    const downloadPDF = async (month: string) => {
        try {
            console.log('Starting PDF generation for:', month);
            // month is YYYY-MM — parse it safely (no locale parsing issues on iOS)
            const targetMonth = month; // Already in YYYY-MM format
            const monthDisplayLabel = formatMonthDisplay(month);
            const currentHouseData = house;


            const monthExpenses = monthlyExpenses[month];
            if (!monthExpenses) {
                console.error('No expenses found for month:', month);
                return;
            }

            // Filter out settlements for table and total
            const expenses = monthExpenses.filter((e: Expense) => !e.isSettlementPayment);

            const memberBalances: { [email: string]: number } = {};
            const members = currentHouseData?.members || [];
            const allMembersMap = new Map();
            [...(currentHouseData?.pastMembers || []), ...members].forEach(m => {
                allMembersMap.set(m.email, m);
            });
            const allMembers = Array.from(allMembersMap.values());

            const totalGroupExpense = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
            void totalGroupExpense;

            // For meals_and_expenses houses, fetch fresh data (don't rely on stale React state)
            let freshMealsList: any[] = [];
            let freshFundsList: any[] = [];
            if (currentHouseData?.typeOfHouse === 'meals_and_expenses' && currentHouseData?.id) {
                const [freshMealsRes, freshFundsRes] = await Promise.all([
                    fetch(`/api/meals?houseId=${currentHouseData.id}`),
                    fetch(`/api/fund-deposits?houseId=${currentHouseData.id}`)
                ]);
                freshMealsList = await freshMealsRes.json();
                freshFundsList = await freshFundsRes.json();
            }

            // --- SETTLEMENT LOGIC --- (Follows Dashboard logic using allExpenses)
            if (currentHouseData?.typeOfHouse !== 'meals_and_expenses') {
                const membersMap = new Map();
                [...(currentHouseData?.pastMembers || []), ...(currentHouseData?.members || [])].forEach(m => {
                    membersMap.set(m.email, m);
                });
                const allMembers = Array.from(membersMap.values());
                allMembers.forEach((m: HouseMember) => { memberBalances[m.email] = 0; });
                allExpenses.forEach((exp: Expense) => {
                    const amount = exp.amount;
                    const payer = exp.userId;

                    const expMonth = exp.date.substring(0, 7);
                    const activeMembersAtTime = allMembers.filter(m => {
                        const details = currentHouseData?.memberDetails?.[m.email];
                        if (details?.joinedAt && details.joinedAt.substring(0, 7) > expMonth) {
                            return false;
                        }
                        if (!details?.leftDate) return true;
                        return details.leftDate.substring(0, 7) >= expMonth;
                    });
                    const relevantMembers = activeMembersAtTime.length > 0 ? activeMembersAtTime : allMembers;

                    if (exp.isSettlementPayment && exp.settlementBetween && exp.settlementBetween.length === 2) {
                        const [p, r] = [exp.userId, exp.settlementBetween.find((e: string) => e !== exp.userId)!];
                        if (memberBalances[p] !== undefined) memberBalances[p] += amount;
                        else memberBalances[p] = amount;
                        if (memberBalances[r] !== undefined) memberBalances[r] -= amount;
                        else memberBalances[r] = -amount;
                        return;
                    }

                    if (exp.contributors && exp.contributors.length > 0) {
                        let contributorTotal = 0;
                        exp.contributors.forEach((c: { email: string; amount: number }) => {
                            if (memberBalances[c.email] !== undefined) {
                                memberBalances[c.email] += c.amount;
                            } else {
                                memberBalances[c.email] = c.amount;
                            }
                            contributorTotal += c.amount;
                        });
                        const remainder = amount - contributorTotal;
                        if (remainder > 0.01) {
                            if (memberBalances[payer] !== undefined) {
                                memberBalances[payer] += remainder;
                            } else {
                                memberBalances[payer] = remainder;
                            }
                        }
                    } else {
                        if (memberBalances[payer] !== undefined) {
                            memberBalances[payer] += amount;
                        } else {
                            memberBalances[payer] = amount;
                        }
                    }

                    const sharePerPerson = amount / relevantMembers.length;
                    relevantMembers.forEach((m: HouseMember) => {
                        if (memberBalances[m.email] !== undefined) memberBalances[m.email] -= sharePerPerson;
                        else memberBalances[m.email] = -sharePerPerson;
                    });
                });
            }
            else {
                // Use the already-fetched fresh data (no need to re-fetch)
                const mealsList = freshMealsList;
                const fundsList = freshFundsList;

                const getYYYYMM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                // month is already in YYYY-MM format — no unsafe string parsing needed

                const months = new Set<string>();
                allExpenses.forEach((e: Expense) => months.add(getYYYYMM(new Date(e.date))));

                if (Array.isArray(fundsList)) {
                    fundsList.filter((d: any) => d.status === 'approved').forEach((d: any) => {
                        months.add(getYYYYMM(new Date(d.createdAt)));
                    });
                }
                if (Array.isArray(mealsList)) {
                    mealsList.forEach((m: any) => months.add(m.date.substring(0, 7)));
                }

                months.add(targetMonth);
                const sortedMonths = Array.from(months).sort();

                members.forEach((m: HouseMember) => {
                    memberBalances[m.email] = 0;
                });

                for (const monthStr of sortedMonths) {
                    if (monthStr > targetMonth) break;

                    const mealsPerDay = currentHouseData.mealsPerDay || 3;
                    let monthlyMealsConsumed = 0;
                    const monthlyMemberMeals: { [key: string]: number } = {};
                    members.forEach((m: HouseMember) => monthlyMemberMeals[m.email] = 0);

                    if (Array.isArray(mealsList) && mealsList.length > 0) {
                        mealsList.filter((m: any) => m.date.startsWith(monthStr)).forEach((dayRecord: any) => {
                            members.forEach((m: HouseMember) => {
                                const mMeals = dayRecord.meals?.[m.email] || {};
                                if (mealsPerDay === 3 && (mMeals.breakfast ?? true)) monthlyMemberMeals[m.email]++;
                                if (mMeals.lunch ?? true) monthlyMemberMeals[m.email]++;
                                if (mMeals.dinner ?? true) monthlyMemberMeals[m.email]++;
                            });
                        });
                    }

                    monthlyMealsConsumed = Object.values(monthlyMemberMeals).reduce((sum, count) => sum + count, 0);

                    if (Array.isArray(fundsList)) {
                        fundsList
                            .filter((d: any) => d.status === 'approved' && getYYYYMM(new Date(d.createdAt)) === monthStr)
                            .forEach((d: any) => {
                                if (memberBalances[d.email] !== undefined) memberBalances[d.email] += d.amount;
                            });
                    }

                    members.forEach((m: HouseMember) => {
                        const rent = m.rentAmount || 0;
                        memberBalances[m.email] -= rent;
                    });

                    let monthlyGroceries = 0;
                    let monthlyOther = 0;

                    allExpenses
                        .filter((e: Expense) => getYYYYMM(new Date(e.date)) === monthStr)
                        .forEach((exp: Expense) => {
                            if (exp.isSettlementPayment && exp.settlementBetween && exp.settlementBetween.length === 2) {
                                const [payer, receiver] = [exp.userId, exp.settlementBetween.find(e => e !== exp.userId)!];
                                if (memberBalances[payer] !== undefined) memberBalances[payer] += exp.amount;
                                else memberBalances[payer] = exp.amount;
                                if (memberBalances[receiver] !== undefined) memberBalances[receiver] -= exp.amount;
                                else memberBalances[receiver] = -exp.amount;
                                return;
                            }

                            if (exp.category === 'groceries' || !exp.category) {
                                monthlyGroceries += exp.amount;
                            } else {
                                monthlyOther += exp.amount;
                            }
                        });

                    const otherSharePerPerson = members.length > 0 ? (monthlyOther / members.length) : 0;
                    const mealUnitPrice = monthlyMealsConsumed > 0 ? (monthlyGroceries / monthlyMealsConsumed) : 0;

                    members.forEach((m: HouseMember) => {
                        memberBalances[m.email] -= otherSharePerPerson;
                        const memberGroceryCost = monthlyMemberMeals[m.email] * mealUnitPrice;
                        memberBalances[m.email] -= memberGroceryCost;
                    });
                }
            }

            const netBalances: { id: string, amount: number }[] = [];
            Object.keys(memberBalances).forEach(email => {
                netBalances.push({
                    id: email,
                    amount: memberBalances[email]
                });
            });

            const receivers = netBalances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount);
            const payers = netBalances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount);

            const settlements: { debtorName: string, creditorName: string, amountStr: string }[] = [];
            let r = 0;
            let p = 0;

            while (r < receivers.length && p < payers.length) {
                const receiver = receivers[r];
                const payer = payers[p];
                const amount = Math.min(Math.abs(payer.amount), receiver.amount);

                if (amount > 0.01) {
                    const debtorName = allMembers.find((m: HouseMember) => m.email === payer.id)?.name || payer.id.split('@')[0];
                    const creditorName = allMembers.find((m: HouseMember) => m.email === receiver.id)?.name || receiver.id.split('@')[0];

                    settlements.push({
                        debtorName,
                        creditorName,
                        amountStr: `${amount.toFixed(2)}`
                    });
                }

                receiver.amount -= amount;
                payer.amount += amount;

                if (receiver.amount < 0.01) r++;
                if (payer.amount > -0.01) p++;
            }

            const activeMemberCount = members.length;
            if (activeMemberCount === 0) {
                // ...
            } else if (settlements.length === 0) {
                // ...
            }


            // Pre-load assets
            // Use SVG icon if PNG is missing or problematic, but ideally convert to PNG
            // Since we have a helper that converts images to PNG data URLs via canvas, we can use that on the SVG.
            const logoDataUrl = await loadImage('/icon.png');

            // We no longer fetch member photos for the PDF to prevent 429 rate limit errors 

            // Import jsPDF
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // --- HEADER ---
            // House Name (Centered with stylish font)
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(currentHouseData?.name || 'My House', pageWidth / 2, 20, { align: 'center' });

            // Left: House Members
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            let leftY = 30;
            if (allMembers && allMembers.length > 0) {
                const membersToShow = allMembers.filter((m: HouseMember) => {
                    const details = currentHouseData?.memberDetails?.[m.email];
                    if (details?.joinedAt && details.joinedAt.substring(0, 7) > targetMonth) {
                        return false;
                    }
                    if (details?.leftDate && details.leftDate.substring(0, 7) < targetMonth) {
                        return false;
                    }
                    return true;
                });

                membersToShow.forEach((m: HouseMember) => {
                    const mName = m.name || m.email.split('@')[0];
                    doc.text(mName, 14, leftY);
                    leftY += 4;
                });
            }

            // Subtitle: House Type
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            const houseTypeStr = currentHouseData?.typeOfHouse === 'meals_and_expenses'
                ? 'Meals and Expenses Tracking'
                : 'Shared Expenses Tracking';
            doc.text(houseTypeStr, pageWidth / 2, 26, { align: 'center' });

            //house currency
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Currency: ${currentHouseData?.currency}`, pageWidth / 2, 32, { align: 'center' });

            // Right: Generation Info
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const rightX = pageWidth - 14;
            doc.text(`Generated by: ${user?.displayName || user?.email?.split('@')[0]}`, rightX, 30, { align: 'right' });

            const today = new Date();
            const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            doc.text(`Date: ${todayStr}`, rightX, 36, { align: 'right' });

            // Report Month Title (Optional, fits context)
            const titleY = Math.max(leftY, 45) + 5;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Expense Report: ${monthDisplayLabel}`, pageWidth / 2, titleY, { align: 'center' });

            // --- TABLE ---
            // Sort expenses by date (latest first)
            const sortedExpenses = [...expenses].sort((a, b) => {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            const tableData = sortedExpenses.map(exp => {
                const dateObj = new Date(exp.date);
                const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

                const member = allMembers.find((m: HouseMember) => m.email === exp.userId);
                const fullName = member?.name || exp.userId.split('@')[0];
                const names = fullName.split(' ');
                const displayName = names.length >= 2 ? `${names[0]} ${names[1]}` : names[0];

                let userCellContent = '';
                const contribs = exp.contributors || [];
                const isMealsHouse = currentHouseData?.typeOfHouse === 'meals_and_expenses';

                if (contribs.length > 0) {
                    const shopperContrib = contribs.find(c => c.email === exp.userId);
                    const shopperAmount = shopperContrib ? shopperContrib.amount : 0;
                    userCellContent = isMealsHouse ? displayName : `${displayName} ${shopperAmount.toFixed(2)}`;

                    const others = contribs.filter(c => c.email !== exp.userId);
                    if (others.length > 0) {
                        userCellContent += isMealsHouse ? '' : '\n------------------\n';
                        userCellContent += others.map(c => {
                            const otherMember = allMembers.find((m: HouseMember) => m.email === c.email);
                            const otherFullName = otherMember?.name || c.email.split('@')[0];
                            const otherNames = otherFullName.split(' ');
                            const otherDisplayName = otherNames.length >= 2 ? `${otherNames[0]} ${otherNames[1]}` : otherNames[0];
                            return isMealsHouse ? `, ${otherDisplayName}` : `${otherDisplayName} ${c.amount.toFixed(2)}`;
                        }).join(isMealsHouse ? '' : '\n');
                    }
                } else {
                    userCellContent = isMealsHouse ? displayName : `${displayName} ${exp.amount.toFixed(2)}`;
                }

                return [
                    dateStr,
                    exp.description.replace(/[৳৳৳৳]/g, '').split(' Tk')[0].split(' ó')[0].trim(),
                    {
                        content: userCellContent,
                        styles: { fontSize: 7, valign: 'middle' as const, halign: 'left' as const }
                    },
                    `${exp.amount.toFixed(2)}`
                ];
            });

            // Calculate Total
            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            tableData.push(['', '', 'Total', `${total.toFixed(2)}`]);

            autoTable(doc, {
                head: [['Date', 'Description', 'Spender', 'Amount']],
                body: tableData,
                startY: titleY + 5,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 3, valign: 'middle' },
                headStyles: { fillColor: [50, 50, 50] },
                columnStyles: {
                    0: { cellWidth: 22 }, // Date
                    1: { cellWidth: 'auto' }, // Desc
                    2: { cellWidth: 40 }, // User
                    3: { cellWidth: 18, halign: 'right' } // Amount
                }
            });

            // --- HOUSE FUND - MEMBER BREAKDOWN SECTION (For Meals and Expenses Houses) ---
            if (currentHouseData?.typeOfHouse === 'meals_and_expenses') {
                const getYYYYMM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                // month is already in YYYY-MM format — use targetMonth directly

                // Use freshly fetched data instead of stale React state (fixes iOS issue)
                const accountingResult = calculateMemberFundAccounting(currentHouseData, allExpenses, freshFundsList, freshMealsList, targetMonth);
                const accounting = accountingResult.members;
                const summary = accountingResult.summary;
                const finalY = (doc as any).lastAutoTable?.finalY || titleY + 20;

                doc.addPage();
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text("House Fund — Member Breakdown", pageWidth / 2, 20, { align: 'center' });
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Report Period: ${monthDisplayLabel}`, pageWidth / 2, 28, { align: 'center' });

                const fundTableData: any[] = [];
                allMembers.forEach((m: HouseMember) => {
                    const stats = accounting[m.email];
                    if (stats) {
                        const joinedAt = currentHouseData?.memberDetails?.[m.email]?.joinedAt;
                        if (joinedAt) {
                            const joinedYYYYMM = joinedAt.substring(0, 7);
                            if (joinedYYYYMM > targetMonth) {
                                return; // Skip members who joined after the target month
                            }
                        }

                        const leftDate = currentHouseData?.memberDetails?.[m.email]?.leftDate;
                        if (leftDate) {
                            const leftYYYYMM = leftDate.substring(0, 7);
                            if (leftYYYYMM < targetMonth) {
                                return; // Skip members who left before the target month
                            }
                        }

                        const netBalance = stats.closingBalance;

                        let memberNameDisplay = m.name || m.email.split('@')[0];
                        if (leftDate) {
                            const leftYYYYMM = leftDate.substring(0, 7);
                            if (leftYYYYMM <= targetMonth) {
                                let dateStr = '';
                                if (leftDate.length <= 10) {
                                    const [, mm, dd] = leftDate.split('-');
                                    const day = parseInt(dd);
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    dateStr = `${day} ${months[parseInt(mm) - 1]}`;
                                } else {
                                    const d = new Date(leftDate);
                                    const day = d.getDate();
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const h = d.getHours(), m = d.getMinutes();
                                    const timeStr = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                                    dateStr = `${day} ${months[d.getMonth()]}, ${timeStr}`;
                                }
                                memberNameDisplay += `\n(${dateStr})`;
                            }
                        }

                        fundTableData.push([
                            memberNameDisplay,
                            `${stats.periodicDeposits.toFixed(2)}`,
                            `- ${stats.periodicRent.toFixed(2)}`,
                            `- ${stats.periodicUtilities.toFixed(2)}`,
                            `- ${stats.periodicWage.toFixed(2)}`,
                            `- ${stats.periodicMisc.toFixed(2)}`,
                            {
                                content: `(${stats.periodicMealCount}) - ${stats.periodicMealCost.toFixed(2)}`,
                                styles: { halign: 'right' }
                            },
                            {
                                content: `${netBalance.toFixed(2)}`,
                                styles: { fontStyle: 'bold', textColor: netBalance >= 0 ? [0, 100, 0] : [150, 0, 0] }
                            }
                        ]);
                    }
                });

                autoTable(doc, {
                    head: [['Member', 'Deposits', 'Rent', 'Utils', 'Wage', 'Other', 'Meals Count: Cost', 'Balance']],
                    body: fundTableData,
                    startY: 35,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
                    headStyles: { fillColor: [76, 175, 80], halign: 'center' },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 'auto' },
                        1: { halign: 'right', cellWidth: 'auto' },
                        2: { halign: 'right', cellWidth: 'auto' },
                        3: { halign: 'right', cellWidth: 'auto' },
                        4: { halign: 'right', cellWidth: 'auto' },
                        5: { halign: 'right', cellWidth: 'auto' },
                        6: { halign: 'right', cellWidth: 'auto' },
                        7: { halign: 'right', cellWidth: 'auto' }
                    }
                });

                const tableFinalY = (doc as any).lastAutoTable?.finalY + 15;

                // House Totals Summary Section in PDF
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text("House Totals Summary", 14, tableFinalY);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                let summaryY = tableFinalY + 8;

                const summaryItems = [
                    { label: "Previous Months Remaining", value: `${summary.previousMonthsRemaining.toFixed(2)}`, color: summary.previousMonthsRemaining >= 0 ? [0, 100, 0] : [150, 0, 0] },
                    { label: "Total Fund Collected", value: `${summary.periodicTotalDeposits.toFixed(2)}`, color: [0, 100, 0] },
                    { label: "Total Rent Deducted", value: `- ${summary.periodicTotalRent.toFixed(2)}`, color: [150, 0, 0] },
                    { label: "Total Utilities", value: `- ${summary.periodicTotalUtilities.toFixed(2)}`, color: [150, 0, 0] },
                    { label: "Total Worker Wage", value: `- ${summary.periodicTotalWages.toFixed(2)}`, color: [150, 0, 0] },
                    { label: "Total Grocery Cost", value: `- ${summary.periodicTotalGroceries.toFixed(2)}`, color: [150, 0, 0] },
                ];

                if (summary.periodicTotalMisc > 0) {
                    summaryItems.push({ label: "Other/Misc Costs", value: `- ${summary.periodicTotalMisc.toFixed(2)}`, color: [150, 0, 0] });
                }

                if (summary.refundedDeposits > 0) {
                    summaryItems.push({ label: "Refunded Deposits (Left Members)", value: `- ${summary.refundedDeposits.toFixed(2)}`, color: [150, 0, 0] });
                }

                summaryItems.push(
                    { label: "Meals in this Month", value: `${summary.periodicTotalMeals}`, color: [0, 0, 0] },
                    { label: "Cost per Meal", value: `${summary.periodicCostPerMeal.toFixed(2)}`, color: [0, 0, 150] }
                );

                summaryItems.forEach(item => {
                    doc.setTextColor(0, 0, 0);
                    doc.text(item.label, 14, summaryY);
                    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
                    doc.text(String(item.value), pageWidth - 14, summaryY, { align: 'right' });
                    summaryY += 6;
                });

                doc.setDrawColor(200, 200, 200);
                doc.line(14, summaryY + 2, pageWidth - 14, summaryY + 2);
                summaryY += 10;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                const fundColor = summary.remainingFund >= 0 ? [0, 100, 0] : [150, 0, 0];
                doc.setTextColor(fundColor[0], fundColor[1], fundColor[2]);
                doc.text("Remaining House Fund", 14, summaryY);
                doc.text(`${summary.remainingFund.toFixed(2)}`, pageWidth - 14, summaryY, { align: 'right' });
            }

            // --- SETTLEMENT SECTION (For Standard Shared Houses) ---
            if (currentHouseData?.typeOfHouse !== 'meals_and_expenses') {
                const finalY = (doc as any).lastAutoTable?.finalY + 15;

                doc.setFontSize(14);
                doc.setFont('abril', 'bold');
                doc.text("Settlement Plan", 14, finalY);

                if (settlements.length > 0) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    let settleY = finalY + 8;

                    settlements.forEach((s) => {
                        const text = `${s.creditorName} will get ${currentHouseData?.currency} ${s.amountStr} from ${s.debtorName}`;
                        doc.text(text, 14, settleY);
                        settleY += 6;
                    });
                } else {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.text("All settled! Everyone paid their share.", 14, finalY + 8);
                }
            }

            // --- FOOTER ---
            const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                const footerY = doc.internal.pageSize.height - 10;

                const footerText = 'OurTab';
                const logoDim = 6;
                // Draw Brand Logo (Centered relative to text)
                const textWidth = doc.getTextWidth(footerText);
                const totalWidth = logoDim + 2 + textWidth; // 2 is padding between logo and text
                const startX = (pageWidth - totalWidth) / 2;

                if (logoDataUrl) {
                    try {
                        doc.addImage(logoDataUrl, 'PNG', startX, footerY - 5, logoDim, logoDim);
                    } catch (e) {
                        console.warn('Failed to add logo to PDF', e);
                    }
                }

                // Brand Name (on same line as logo)
                doc.setFontSize(10);
                doc.setFont('times', 'bold');
                doc.text(footerText, startX + logoDim + 2, footerY);

                // Page Number (Right aligned)
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                const pageString = `Page ${i} of ${pageCount}`;
                doc.text(pageString, pageWidth - 14, footerY, { align: 'right' });
            }

            console.log('Saving PDF...');

            const [yr, mo] = month.split('-');
            const shortYear = yr.slice(2);
            const safeHouseName = (currentHouseData?.name || 'House').replace(/[^a-zA-Z0-9]/g, '');
            const day = String(today.getDate()).padStart(2, '0');
            const fileName = `${mo}-${shortYear}_${safeHouseName}_${day}_expenses.pdf`;

            doc.save(fileName);

            showToast('PDF downloaded successfully!', 'success');
        } catch (error) {
            console.error("PDF generation failed:", error);
            showToast('Failed to generate PDF. Check console for details.', 'error');
        }
    };

    return (
        <AuthGuard>
            <main>
                <Container maxWidth="sm" sx={{ mt: 4, mb: 10 }}>
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
                            backdropFilter: 'blur(20px)',
                            borderRadius: '12px',
                            padding: "4px",
                            background: 'linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2,
                            letterSpacing: '-0.02em'
                        }}>
                            Expense
                        </Typography>
                        <IconButton
                            color="primary"
                            onClick={handleOpenHistory}
                            aria-label="View history"
                            sx={{
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.1)' },
                                width: 44,
                                height: 44
                            }}
                        >
                            <HistoryIcon />
                        </IconButton>
                    </Box>


                    {/* Add Item Form */}
                    <Paper className="glass" sx={{ p: 2, mb: 2, background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Box component="form" onSubmit={handleAddItem}>
                            {house?.typeOfHouse === 'meals_and_expenses' && (
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                    <InputLabel id="category-label">Category</InputLabel>
                                    <Select
                                        labelId="category-label"
                                        value={expenseCategory}
                                        label="Category"
                                        onChange={(e) => setExpenseCategory(e.target.value)}
                                        disabled={loading}
                                    >
                                        <MenuItem value="groceries">Groceries</MenuItem>
                                        <MenuItem value="utilities">Utilities</MenuItem>
                                        <MenuItem value="wage">Wage</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <TextField
                                    label="Item Name"
                                    required
                                    size="small"
                                    value={itemName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setItemName(value ? value.charAt(0).toUpperCase() + value.slice(1) : '');
                                    }}
                                    disabled={loading}
                                    placeholder="Milk, Bread..."
                                    sx={{ flexGrow: 2 }}
                                />
                                <TextField
                                    label={`Price (${getCurrencySymbol()})`}
                                    type="number"
                                    required
                                    size="small"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(e.target.value)}
                                    disabled={loading}
                                    inputProps={{ step: '0.01', min: '0' }}
                                    sx={{ width: '100px' }}
                                />
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', flex: 1 }}
                                    disabled={loading || scanning}
                                >
                                    Add to List
                                </Button>
                                <input
                                    type="file"
                                    accept="image/*,image/heic,image/heif,.heic,.heif"
                                    capture="environment"
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleScanReceipt}
                                />
                                <input
                                    type="file"
                                    accept="image/*,image/heic,image/heif,.heic,.heif"
                                    hidden
                                    ref={galleryInputRef}
                                    onChange={handleScanReceipt}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={(e) => setUploadAnchorEl(e.currentTarget)}
                                    disabled={loading || scanning}
                                    sx={{
                                        borderRadius: 2,
                                        minWidth: '56px',
                                        borderColor: 'primary.main',
                                        '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.05)' }
                                    }}
                                >
                                    {scanning ? <CircularProgress size={24} color="inherit" /> : <PhotoCameraIcon color="primary" />}
                                </Button>
                                <Menu
                                    anchorEl={uploadAnchorEl}
                                    open={Boolean(uploadAnchorEl)}
                                    onClose={() => setUploadAnchorEl(null)}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    PaperProps={{
                                        sx: {
                                            borderRadius: 2,
                                            mt: -1,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }
                                    }}
                                >
                                    <MenuItem onClick={() => {
                                        setUploadAnchorEl(null);
                                        fileInputRef.current?.click();
                                    }}>
                                        <PhotoCameraIcon sx={{ mr: 1, fontSize: 20 }} color="primary" />
                                        Take Photo
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        setUploadAnchorEl(null);
                                        galleryInputRef.current?.click();
                                    }}>
                                        <PhotoLibraryIcon sx={{ mr: 1, fontSize: 20 }} color="primary" />
                                        Select from device
                                    </MenuItem>
                                </Menu>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Items List */}
                    {items.length > 0 && (
                        <>
                            {showAIWarning && (
                                <Alert
                                    severity="info"
                                    icon={<InfoIcon fontSize="inherit" />}
                                    sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        background: 'rgba(224, 242, 255, 0.7)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(0, 145, 255, 0.2)',
                                        '& .MuiAlert-message': { fontWeight: 500 }
                                    }}
                                >
                                    AI may make mistakes. Please check and edit prices before submitting.
                                </Alert>
                            )}
                            <Paper className="glass" sx={{ p: 2, mb: 2, background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Cart ({items.length})</Typography>
                                    <Typography variant="subtitle1" color="primary" fontWeight="bold">
                                        {getCurrencySymbol()}{Number(total).toFixed(2)}
                                    </Typography>
                                </Box>
                                <List disablePadding>
                                    {items.map((item, index) => (
                                        <div key={item.id}>
                                            <ListItem
                                                disableGutters
                                                sx={{ py: 0.5 }}
                                                secondaryAction={
                                                    <IconButton 
                                                        edge="end" 
                                                        size="small" 
                                                        onClick={() => handleRemoveItem(item.id)} 
                                                        disabled={loading} 
                                                        color="error"
                                                        aria-label="Remove item"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText
                                                    primary={item.name}
                                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                    secondary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                                                {getCurrencySymbol()}
                                                            </Typography>
                                                            <TextField
                                                                size="small"
                                                                type="number"
                                                                variant="standard"
                                                                value={item.price || ''}
                                                                onChange={(e) => handleUpdateItemPrice(item.id, e.target.value)}
                                                                inputProps={{
                                                                    step: '0.01',
                                                                    min: '0',
                                                                    style: { fontSize: '1rem', padding: '2px 0' }
                                                                }}
                                                                sx={{ width: '80px' }}
                                                                disabled={loading}
                                                            />
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            {index < items.length - 1 && <Divider component="li" />}
                                        </div>
                                    ))}
                                </List>
                            </Paper>
                        </>
                    )}

                    {/* Contributor Selection */}
                    {items.length > 0 && houseMembers.length > 1 && house?.typeOfHouse !== 'meals_and_expenses' && (
                        <Paper className="glass" sx={{ mb: 2, background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <Accordion defaultExpanded sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PeopleIcon color="primary" />
                                        <Typography variant="h6">Who&apos;s Contributing?</Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Select house members who are contributing money for this purchase
                                        </Typography>

                                        {/* House Members */}
                                        {houseMembers
                                            .filter(member => member.email !== user?.email)
                                            .map((member) => (
                                                <Box key={member.email} sx={{ mb: 2 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={selectedContributors.has(member.email)}
                                                                onChange={() => handleContributorToggle(member.email)}
                                                                disabled={loading}
                                                            />
                                                        }
                                                        label={member.name || member.email.split('@')[0]}
                                                    />
                                                    {selectedContributors.has(member.email) && (
                                                        <Box sx={{ pl: 4, pr: 0, mt: 1 }}>
                                                            <TextField
                                                                label={`Amount (${getCurrencySymbol()})`}
                                                                type="number"
                                                                size="small"
                                                                fullWidth
                                                                value={contributors[member.email] || ''}
                                                                onChange={(e) => handleContributorAmountChange(member.email, e.target.value)}
                                                                disabled={loading}
                                                                inputProps={{ step: '0.01', min: '0' }}
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}

                                        {/* My Contribution */}
                                        <Divider sx={{ my: 2 }} />
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Your contribution:
                                            </Typography>
                                            <TextField
                                                label={`My Amount (${getCurrencySymbol()})`}
                                                type="number"
                                                size="small"
                                                fullWidth
                                                value={myContribution}
                                                onChange={(e) => handleMyContributionChange(e.target.value)}
                                                disabled={loading}
                                                inputProps={{ step: '0.01', min: '0' }}
                                            />
                                        </Box>

                                        {/* Quick Actions */}
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleSplitEqually}
                                                disabled={loading || selectedContributors.size === 0}
                                            >
                                                Split Equally
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleIPayAll}
                                                disabled={loading}
                                            >
                                                I&apos;ll Pay All
                                            </Button>
                                        </Box>

                                        {/* Summary */}
                                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Total:</Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {getCurrencySymbol()}{Number(total).toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Others&apos; contributions:</Typography>
                                                <Typography variant="body2">
                                                    {getCurrencySymbol()}{Number(totalContributions).toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Your contribution:</Typography>
                                                <Typography variant="body2">
                                                    {getCurrencySymbol()}{Number(myContributionNum).toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {remaining >= 0 ? 'Remaining:' : 'Over by:'}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="bold"
                                                    color={remaining < -0.01 ? 'error' : remaining > 0.01 ? 'warning.main' : 'success.main'}
                                                >
                                                    {getCurrencySymbol()}{Number(Math.abs(remaining)).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {remaining > 0.01 && (
                                            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                                                ℹ️ You&apos;ll cover the remaining amount
                                            </Typography>
                                        )}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    )}

                    {/* Submit Form */}
                    {items.length > 0 && (
                        <Paper className="glass" sx={{ p: 2, background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <TextField
                                    label="Note (Optional)"
                                    fullWidth
                                    size="small"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={loading}
                                    placeholder="e.g., Weekly groceries"
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Complete Purchase'}
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    {items.length === 0 && !scanning && (
                        <Box sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Typography color="text.secondary">
                                Add items to your expense to get started
                            </Typography>
                            <ShoppingIllustration />
                        </Box>
                    )}

                    {scanning && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                            <ReceiptProcessor />
                        </Box>
                    )}
                </Container>

                <Box sx={{ pb: 7 }}>
                    <BottomNav />
                </Box>

                <Dialog open={openHistory} onClose={() => setOpenHistory(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Monthly History</DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                        <List sx={{ p: 2 }}>
                            {availableMonths.map(monthKey => {
                                const isDownloading = loadingMonth === monthKey;
                                return (
                                    <ListItem 
                                        key={monthKey}
                                        sx={{ 
                                            mb: 1, 
                                            borderRadius: 2, 
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            px: 3,
                                            py: 2
                                        }}
                                    >
                                        <Typography fontWeight="bold" variant="body1">
                                            {formatMonthDisplay(monthKey)}
                                        </Typography>
                                        
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            startIcon={isDownloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                            onClick={() => {
                                                if (!isDownloading) {
                                                    downloadPDF(monthKey);
                                                }
                                            }}
                                            disabled={isDownloading}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                                        </Button>
                                    </ListItem>
                                );
                            })}
                            
                            {availableMonths.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography color="text.secondary">No history available</Typography>
                                </Box>
                            )}
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenHistory(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </main>
        </AuthGuard>
    );
}

