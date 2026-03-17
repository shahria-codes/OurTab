import { House, Expense } from '@/hooks/useHouseData';
import { FundDeposit } from '@/types/fund-types';
import { isTakingMeal } from './meals';

export interface MemberAccounting {
    deposits: number;
    rent: number;
    utilities: number;
    wage: number;
    misc: number;
    mealCount: number;
    mealCost: number;
    // Periodic stats (for the target month only)
    periodicDeposits: number;
    periodicRent: number;
    periodicUtilities: number;
    periodicWage: number;
    periodicMisc: number;
    periodicMealCount: number;
    periodicMealCost: number;
    openingBalance: number;
    closingBalance: number;
}

export type MemberAccountingRecord = Record<string, MemberAccounting>;

export interface HouseAccountingSummary {
    totalDeposits: number;
    totalRent: number;
    totalUtilities: number;
    totalWages: number;
    totalGroceries: number;
    totalMisc: number;
    totalMeals: number;
    costPerMeal: number;
    previousMonthsRemaining: number;
    refundedDeposits: number;
    remainingFund: number;
    // Periodic summary
    periodicTotalDeposits: number;
    periodicTotalRent: number;
    periodicTotalUtilities: number;
    periodicTotalWages: number;
    periodicTotalGroceries: number;
    periodicTotalMisc: number;
    periodicTotalMeals: number;
    periodicCostPerMeal: number;
}

export interface HouseAccountingResult {
    members: MemberAccountingRecord;
    summary: HouseAccountingSummary;
}

export function calculateMemberFundAccounting(
    house: House | null | undefined,
    expenses: Expense[],
    fundDeposits: FundDeposit[],
    meals: any[],
    targetMonthOverride?: string // Format: YYYY-MM
): HouseAccountingResult {
    const emptyResult: HouseAccountingResult = {
        members: {},
        summary: {
            totalDeposits: 0,
            totalRent: 0,
            totalUtilities: 0,
            totalWages: 0,
            totalGroceries: 0,
            totalMisc: 0,
            totalMeals: 0,
            costPerMeal: 0,
            previousMonthsRemaining: 0,
            refundedDeposits: 0,
            remainingFund: 0,
            periodicTotalDeposits: 0,
            periodicTotalRent: 0,
            periodicTotalUtilities: 0,
            periodicTotalWages: 0,
            periodicTotalGroceries: 0,
            periodicTotalMisc: 0,
            periodicTotalMeals: 0,
            periodicCostPerMeal: 0
        }
    };

    if (!house || !house.members || house.typeOfHouse !== 'meals_and_expenses') return emptyResult;

    // 1. Combine active and past members
    const members = [...(house.members || []), ...(house.pastMembers || [])];
    const stats: MemberAccountingRecord = {};

    const getEmail = (m: any) => typeof m === 'string' ? m : m.email;
    members.forEach(m => {
        stats[getEmail(m)] = {
            deposits: 0, rent: 0, utilities: 0, wage: 0, misc: 0,
            mealCount: 0, mealCost: 0,
            periodicDeposits: 0, periodicRent: 0, periodicUtilities: 0, periodicWage: 0, periodicMisc: 0,
            periodicMealCount: 0, periodicMealCost: 0,
            openingBalance: 0, closingBalance: 0
        };
    });

    const getYYYYMM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // Collect all unique months across all history
    const months = new Set<string>();
    (expenses || []).forEach(e => months.add(getYYYYMM(new Date(e.date))));
    (fundDeposits || []).filter(d => d.status === 'approved').forEach(d => {
        months.add(getYYYYMM(new Date(d.createdAt || d.date)));
    });
    (meals || []).forEach(m => months.add(m.date.substring(0, 7)));

    const currentMonth = getYYYYMM(new Date());
    const targetMonth = targetMonthOverride || currentMonth;
    months.add(targetMonth);

    const sortedMonths = Array.from(months).sort();

    // Summary counters
    let houseTotalDeposits = 0;
    let houseTotalRent = 0;
    let houseTotalUtilities = 0;
    let houseTotalWages = 0;
    let houseTotalGroceries = 0;
    let houseTotalMisc = 0;
    let houseTotalMeals = 0;
    let previousMonthsRemaining = 0;

    // Periodic summary counters
    let periodicTotalDeposits = 0;
    let periodicTotalRent = 0;
    let periodicTotalUtilities = 0;
    let periodicTotalWages = 0;
    let periodicTotalMeals = 0;
    let periodicTotalGroceries = 0;
    let periodicTotalMisc = 0;

    for (const monthStr of sortedMonths) {
        if (monthStr > targetMonth) break;

        const isPreviousMonth = monthStr < targetMonth;
        const isTargetMonth = monthStr === targetMonth;

        // 2. Identify active members for THIS MONTH
        const activeMembersForMonth = members.filter(m => {
            const mEmail = getEmail(m);
            const details = house.memberDetails?.[mEmail];

            if (details?.joinedAt && details.joinedAt.substring(0, 7) > monthStr) {
                return false;
            }

            if (!details?.leftDate) return true;
            return details.leftDate.substring(0, 7) >= monthStr;
        });

        const mealsPerDay = house.mealsPerDay || 3;
        const monthlyMemberMeals: { [key: string]: number } = {};
        activeMembersForMonth.forEach(m => monthlyMemberMeals[getEmail(m)] = 0);

        // Calculate meals for this month
        const [year, monthNum] = monthStr.split('-').map(Number);
        const houseCreatedAt = house.createdAt ? new Date(house.createdAt) : null;

        let startDay = 1;
        if (houseCreatedAt && houseCreatedAt.getFullYear() === year && houseCreatedAt.getMonth() + 1 === monthNum) {
            startDay = houseCreatedAt.getDate();
        }

        const now = new Date();
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        let endDay = daysInMonth;

        if (now.getFullYear() === year && now.getMonth() + 1 === monthNum) {
            endDay = Math.min(daysInMonth, now.getDate());
        } else if (now.getFullYear() < year || (now.getFullYear() === year && now.getMonth() + 1 < monthNum)) {
            endDay = 0; // Future month
        }

        for (let i = startDay; i <= endDay; i++) {
            const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            activeMembersForMonth.forEach(m => {
                const mEmail = getEmail(m);
                // Stop counting meals for a member after their left date (inclusive)
                const memberLeftDate = house.memberDetails?.[mEmail]?.leftDate;
                if (memberLeftDate && dateStr > memberLeftDate) return;
                if (mealsPerDay === 3 && isTakingMeal(mEmail, dateStr, 'breakfast', house, meals)) monthlyMemberMeals[mEmail]++;
                if (isTakingMeal(mEmail, dateStr, 'lunch', house, meals)) monthlyMemberMeals[mEmail]++;
                if (isTakingMeal(mEmail, dateStr, 'dinner', house, meals)) monthlyMemberMeals[mEmail]++;
            });
        }

        const monthlyMealsConsumed = Object.values(monthlyMemberMeals).reduce((sum, count) => sum + count, 0);
        houseTotalMeals += monthlyMealsConsumed;
        if (isTargetMonth) periodicTotalMeals = monthlyMealsConsumed;

        // Deposits for this month (from ALL members, even past)
        let monthlyDepositsTotal = 0;
        (fundDeposits || [])
            .filter(d => d.status === 'approved' && getYYYYMM(new Date(d.createdAt || d.date)) === monthStr)
            .forEach(d => {
                if (stats[d.email]) {
                    stats[d.email].deposits += Number(d.amount);
                    if (isTargetMonth) stats[d.email].periodicDeposits += Number(d.amount);
                }
                houseTotalDeposits += Number(d.amount);
                monthlyDepositsTotal += Number(d.amount);
            });
        if (isTargetMonth) periodicTotalDeposits = monthlyDepositsTotal;

        // Rent for this month (only charge ACTIVE members)
        let monthlyRentTotal = 0;
        activeMembersForMonth.forEach(m => {
            const mEmail = getEmail(m);
            // Default to member object rentAmount unless overriden by house.memberDetails
            const memberObjRent = typeof m === 'object' && m.rentAmount !== undefined ? m.rentAmount : 0;
            const rent = house.memberDetails?.[mEmail]?.rentAmount ?? memberObjRent;

            if (stats[mEmail]) {
                stats[mEmail].rent += rent;
                if (isTargetMonth) stats[mEmail].periodicRent += rent;
            }
            houseTotalRent += rent;
            monthlyRentTotal += rent;
        });
        if (isTargetMonth) periodicTotalRent = monthlyRentTotal;

        // Expenses for this month
        let monthlyGroceries = 0;
        let monthlyUtilities = 0;
        let monthlyWage = 0;
        let monthlyMisc = 0;

        (expenses || [])
            .filter(e => !e.isSettlementPayment && getYYYYMM(new Date(e.date)) === monthStr)
            .forEach(exp => {
                if (exp.category === 'groceries' || !exp.category) monthlyGroceries += Number(exp.amount);
                else if (exp.category === 'utilities') monthlyUtilities += Number(exp.amount);
                else if (exp.category === 'wage') monthlyWage += Number(exp.amount);
                else monthlyMisc += Number(exp.amount);
            });

        houseTotalGroceries += monthlyGroceries;
        houseTotalUtilities += monthlyUtilities;
        houseTotalMisc += monthlyMisc;
        houseTotalWages += monthlyWage;

        if (isTargetMonth) {
            periodicTotalGroceries = monthlyGroceries;
            periodicTotalUtilities = monthlyUtilities;
            periodicTotalMisc = monthlyMisc;
            periodicTotalWages = monthlyWage;
        }

        const totalMonthlyExpenses = monthlyRentTotal + (monthlyUtilities + monthlyMisc) + monthlyWage + monthlyGroceries;
        if (isPreviousMonth) {
            previousMonthsRemaining += (monthlyDepositsTotal - totalMonthlyExpenses);
        }

        // Shares only split among ACTIVE members
        const activeCount = activeMembersForMonth.length;
        const activeEmails = activeMembersForMonth.map(m => getEmail(m));

        // Fair distribution for Utilities, Wage, Misc
        const distributeCents = (totalAmount: number, count: number) => {
            if (count <= 0) return { base: 0, remainder: 0 };
            const totalCents = Math.round(totalAmount * 100);
            return {
                base: Math.floor(totalCents / count),
                remainder: totalCents % count
            };
        };

        const utilDist = distributeCents(monthlyUtilities, activeCount);
        const wageDist = distributeCents(monthlyWage, activeCount);
        const miscDist = distributeCents(monthlyMisc, activeCount);

        // Fair distribution for Meals (weighted by count)
        const totalGroceryCents = Math.round(monthlyGroceries * 100);
        const memberMealCents: Record<string, number> = {};
        if (monthlyMealsConsumed > 0) {
            let distributedCents = 0;
            activeEmails.forEach(email => {
                const count = monthlyMemberMeals[email] || 0;
                // Weighted floor
                const share = Math.floor((count * totalGroceryCents) / monthlyMealsConsumed);
                memberMealCents[email] = share;
                distributedCents += share;
            });

            let remainingCents = totalGroceryCents - distributedCents;
            // Distribute remaining cents to those who ate meals, sorted by count to be "fairer"
            const sortedByMeals = [...activeEmails].sort((a, b) => (monthlyMemberMeals[b] || 0) - (monthlyMemberMeals[a] || 0));
            let idx = 0;
            while (remainingCents > 0) {
                const email = sortedByMeals[idx % sortedByMeals.length];
                if ((monthlyMemberMeals[email] || 0) > 0) {
                    memberMealCents[email]++;
                    remainingCents--;
                } else {
                    // If we run out of people who ate, just give to anyone active (shouldn't happen if monthlyMealsConsumed > 0)
                    memberMealCents[email]++;
                    remainingCents--;
                }
                idx++;
            }
        } else {
            activeEmails.forEach(email => memberMealCents[email] = 0);
        }

        // Update stats for ALL members (some just carry over balance)
        members.forEach(m => {
            const mEmail = getEmail(m);
            if (stats[mEmail]) {
                const prevClosing = stats[mEmail].closingBalance || 0;
                if (isTargetMonth) stats[mEmail].openingBalance = Math.round(prevClosing * 100) / 100;

                const activeIdx = activeEmails.indexOf(mEmail);
                const isActive = activeIdx !== -1;

                if (isActive) {
                    const uShare = (utilDist.base + (activeIdx < utilDist.remainder ? 1 : 0)) / 100;
                    const wShare = (wageDist.base + (activeIdx < wageDist.remainder ? 1 : 0)) / 100;
                    const miShare = (miscDist.base + (activeIdx < miscDist.remainder ? 1 : 0)) / 100;
                    const meShare = (memberMealCents[mEmail] || 0) / 100;

                    stats[mEmail].utilities = Math.round((stats[mEmail].utilities + uShare) * 100) / 100;
                    stats[mEmail].wage = Math.round((stats[mEmail].wage + wShare) * 100) / 100;
                    stats[mEmail].misc = Math.round((stats[mEmail].misc + miShare) * 100) / 100;

                    const mMealCount = monthlyMemberMeals[mEmail] || 0;
                    stats[mEmail].mealCount += mMealCount;
                    stats[mEmail].mealCost = Math.round((stats[mEmail].mealCost + meShare) * 100) / 100;

                    if (isTargetMonth) {
                        stats[mEmail].periodicUtilities = uShare;
                        stats[mEmail].periodicWage = wShare;
                        stats[mEmail].periodicMisc = miShare;
                        stats[mEmail].periodicMealCount = mMealCount;
                        stats[mEmail].periodicMealCost = meShare;
                    }
                } else if (isTargetMonth) {
                    // Make sure periodic values are 0 if not active in target month
                    stats[mEmail].periodicUtilities = 0;
                    stats[mEmail].periodicWage = 0;
                    stats[mEmail].periodicMisc = 0;
                    stats[mEmail].periodicMealCount = 0;
                    stats[mEmail].periodicMealCost = 0;
                }

                // Update closing balance for each month to carry over
                // Ensure all additions/subtractions are rounded to 2 decimal places to prevent floating point drift
                const totalDeductions = stats[mEmail].rent + stats[mEmail].utilities + stats[mEmail].wage + stats[mEmail].misc + stats[mEmail].mealCost;
                stats[mEmail].closingBalance = Math.round((stats[mEmail].deposits - totalDeductions) * 100) / 100;
            }
        });
    }

    let houseRefundedDeposits = 0;
    members.forEach(m => {
        const mEmail = getEmail(m);
        const leftDate = house.memberDetails?.[mEmail]?.leftDate;
        if (leftDate) {
            const leftYYYYMM = leftDate.substring(0, 7);
            if (leftYYYYMM <= targetMonth) {
                if (stats[mEmail] && stats[mEmail].closingBalance > 0) {
                    houseRefundedDeposits += stats[mEmail].closingBalance;
                }
            }
        }
    });

    return {
        members: stats,
        summary: {
            totalDeposits: houseTotalDeposits,
            totalRent: houseTotalRent,
            totalUtilities: houseTotalUtilities,
            totalWages: houseTotalWages,
            totalGroceries: houseTotalGroceries,
            totalMisc: houseTotalMisc,
            totalMeals: houseTotalMeals,
            costPerMeal: houseTotalMeals > 0 ? (houseTotalGroceries / houseTotalMeals) : 0,
            previousMonthsRemaining: previousMonthsRemaining,
            refundedDeposits: houseRefundedDeposits,
            remainingFund: houseTotalDeposits - (houseTotalRent + houseTotalUtilities + houseTotalWages + houseTotalGroceries + houseTotalMisc) - houseRefundedDeposits,
            // Periodic
            periodicTotalDeposits,
            periodicTotalRent,
            periodicTotalUtilities,
            periodicTotalWages,
            periodicTotalMeals,
            periodicTotalGroceries,
            periodicTotalMisc,
            periodicCostPerMeal: periodicTotalMeals > 0 ? (periodicTotalGroceries / periodicTotalMeals) : 0
        }
    };
}
