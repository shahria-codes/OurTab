'use client';

import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Avatar,
    Divider,
    Button
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatDateLocale, formatTimeLocale } from '@/utils/date';
import { House } from '@/hooks/useHouseData';

interface DepositDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    pendingDeposits: any[];
    allMembers: any[];
    user: any;
    house: House | null;
    displayCurrency: string;
    monthName: string;
    memberFundAccounting: Record<string, any>;
    houseFundStatsResult: any;
    handleCancelDeposit: (id: string) => void;
    monthStr: string;
}

export default function DepositDetailsDialog({
    open,
    onClose,
    pendingDeposits,
    allMembers,
    user,
    house,
    displayCurrency,
    monthName,
    memberFundAccounting,
    houseFundStatsResult,
    handleCancelDeposit,
    monthStr
}: DepositDetailsDialogProps) {
    
    const members = [...allMembers].filter((m: any) => {
        const email = typeof m === 'string' ? m : m.email;
        const details = house?.memberDetails?.[email];
        if (details?.joinedAt && details.joinedAt.substring(0, 7) > monthStr) {
            return false;
        }
        if (details?.leftDate && details.leftDate.substring(0, 7) < monthStr) {
            return false;
        }
        return true;
    }).sort((a, b) => {
        const emailA = typeof a === 'string' ? a : a.email;
        const emailB = typeof b === 'string' ? b : b.email;
        if (emailA === user?.email) return -1;
        if (emailB === user?.email) return 1;
        return 0;
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>House Fund — Deposit Contributions</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {/* Pending Deposits Section */}
                    {pendingDeposits.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: '1.2rem' }} /> Pending Requests
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {pendingDeposits.map((d: any) => {
                                    const isMyDeposit = d.email === user?.email;
                                    const name = (allMembers.find((m: any) => (typeof m === 'string' ? m : m.email) === d.email)?.name) || d.email.split('@')[0];

                                    return (
                                        <Box key={d.id} sx={{ p: 1.5, bgcolor: 'rgba(237, 108, 2, 0.05)', borderRadius: 2, border: '1px solid', borderColor: 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{displayCurrency}{d.amount.toFixed(2)}</Typography>
                                                <Typography variant="caption" color="text.secondary">{name} • {formatDateLocale(d.createdAt)} • {formatTimeLocale(d.createdAt)}</Typography>
                                            </Box>
                                            {isMyDeposit && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleCancelDeposit(d.id)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* Member Breakdown Section */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Monthly Breakdown ({monthName})
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {members.map((m: any) => {
                                const email = typeof m === 'string' ? m : m.email;
                                const mStats = memberFundAccounting[email] || {
                                    deposits: 0, rent: 0, utilities: 0, wage: 0, mealCount: 0, mealCost: 0,
                                    periodicDeposits: 0, periodicRent: 0, periodicUtilities: 0, periodicWage: 0,
                                    periodicMealCount: 0, periodicMealCost: 0,
                                    openingBalance: 0, closingBalance: 0
                                };
                                const name = (typeof m === 'object' && m?.name) || email.split('@')[0];
                                const photoUrl = typeof m === 'object' ? m?.photoUrl : undefined;
                                const remaining = mStats.closingBalance;

                                return (
                                    <Box key={email} sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar src={photoUrl} alt={name || 'Member'} sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '1rem' }}>
                                                    {name[0]?.toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{name}</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" color="text.secondary" display="block">Opening Balance</Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: mStats.openingBalance >= 0 ? 'success.main' : 'error.main' }}>
                                                    {displayCurrency}{mStats.openingBalance.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ pl: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Deposits</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                                                    + {displayCurrency}{mStats.periodicDeposits.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Rent</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                                                    - {displayCurrency}{mStats.periodicRent.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Utilities</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                                                    - {displayCurrency}{mStats.periodicUtilities.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Worker Wage</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                                                    - {displayCurrency}{mStats.periodicWage.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Meals ({mStats.periodicMealCount})
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                                                    - {displayCurrency}{mStats.periodicMealCost.toFixed(2)}
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ my: 1, opacity: 0.6 }} />

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Closing Balance</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: remaining >= 0 ? 'success.main' : 'error.main' }}>
                                                    {remaining >= 0 ? '' : '-'}{displayCurrency}{Math.abs(remaining).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}

                            <Box sx={{ mt: 1, pt: 2, borderTop: '2px dashed', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    House Totals Summary
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Previous Remaining</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: houseFundStatsResult.previousMonthsRemaining >= 0 ? 'success.main' : 'error.main' }}>
                                        {displayCurrency}{houseFundStatsResult.previousMonthsRemaining.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Collected</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                        + {displayCurrency}{houseFundStatsResult.periodicTotalDeposits.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Rent</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                        - {displayCurrency}{houseFundStatsResult.periodicTotalRent.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Utilities</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                        - {displayCurrency}{houseFundStatsResult.periodicTotalUtilities.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Worker Wage</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                        - {displayCurrency}{houseFundStatsResult.periodicTotalWages.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Groceries</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                        - {displayCurrency}{houseFundStatsResult.periodicTotalGroceries.toFixed(2)}
                                    </Typography>
                                </Box>
                                {houseFundStatsResult.refundedDeposits > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">Refunded Deposits (Left Members)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                            - {displayCurrency}{houseFundStatsResult.refundedDeposits.toFixed(2)}
                                        </Typography>
                                    </Box>
                                )}
                                {houseFundStatsResult.periodicTotalMisc > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">Other/Misc</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                            - {displayCurrency}{houseFundStatsResult.periodicTotalMisc.toFixed(2)}
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Total Meals</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {houseFundStatsResult.periodicTotalMeals}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2">Avg Meal Cost</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {displayCurrency}{houseFundStatsResult.periodicCostPerMeal.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Remaining Fund</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: houseFundStatsResult.remainingFund >= 0 ? 'success.main' : 'error.main' }}>
                                        {displayCurrency}{houseFundStatsResult.remainingFund.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
