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
    Paper,
    Button
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Expense } from '@/hooks/useHouseData';

interface SettlementHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    expenses: Expense[];
    allMembers: any[];
    user: any;
    displayCurrency: string;
}

export default function SettlementHistoryDialog({
    open,
    onClose,
    expenses,
    allMembers,
    user,
    displayCurrency
}: SettlementHistoryDialogProps) {
    
    const relevantSettlements = expenses
        .filter(exp => exp.isSettlementPayment && (exp.userId === user?.email || exp.settlementBetween?.includes(user?.email || '')))
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Settlement History</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {relevantSettlements.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>No past settlements found.</Typography>
                    ) : (
                        relevantSettlements.map(exp => {
                            const fromEmail = exp.userId;
                            const toEmail = exp.settlementBetween?.find((e: string) => e !== fromEmail) || '';
                            const fromMember = allMembers.find(m => m.email === fromEmail);
                            const toMember = allMembers.find(m => m.email === toEmail);
                            const createdDate = new Date(exp.createdAt || exp.date);
                            const approvedDate = exp.approvedAt ? new Date(exp.approvedAt) : createdDate;
                            const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
                            const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
                            const formattedCreatedDate = `${createdDate.toLocaleDateString('en-GB', dateOptions)}, ${createdDate.toLocaleTimeString('en-GB', timeOptions)}`;
                            const formattedApprovedDate = `${approvedDate.toLocaleDateString('en-GB', dateOptions)}, ${approvedDate.toLocaleTimeString('en-GB', timeOptions)}`;

                            return (
                                <Paper key={exp.id} sx={{
                                    p: 2,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    bgcolor: 'rgba(0,0,0,0.02)'
                                }}>
                                    {/* Watermark Tag */}
                                    <Box sx={{
                                        position: 'absolute',
                                        right: -10,
                                        top: 10,
                                        opacity: 0.05,
                                        transform: 'rotate(-15deg)'
                                    }}>
                                        {exp.method === 'cash' ? (
                                            <PaymentsIcon sx={{ fontSize: 80, color: 'text.primary' }} />
                                        ) : (
                                            <AccountBalanceIcon sx={{ fontSize: 80, color: 'text.primary' }} />
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative', zIndex: 1 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Avatar src={fromMember?.photoUrl} alt={fromMember?.name} sx={{ width: 40, height: 40 }} />
                                            <Typography variant="caption" noWrap sx={{ maxWidth: 60 }}>
                                                {fromEmail === user?.email ? 'You' : (fromMember?.name?.split(' ')[0] || fromEmail.split('@')[0])}
                                            </Typography>
                                        </Box>
                                        <ArrowForwardIosIcon color="action" sx={{ fontSize: 16 }} />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Avatar src={toMember?.photoUrl} alt={toMember?.name} sx={{ width: 40, height: 40 }} />
                                            <Typography variant="caption" noWrap sx={{ maxWidth: 60 }}>
                                                {toEmail === user?.email ? 'You' : (toMember?.name?.split(' ')[0] || toEmail.split('@')[0])}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                                            <Typography variant="h6" color="success.main" fontWeight="bold">
                                                {displayCurrency}{exp.amount.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(0,0,0,0.1)', pt: 1, position: 'relative', zIndex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.65rem' }}>
                                            <ArrowForwardIcon sx={{ fontSize: 13 }} /> {formattedCreatedDate}
                                        </Typography>
                                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.65rem' }}>
                                            <DoneAllIcon sx={{ fontSize: 13 }} /> {formattedApprovedDate}
                                        </Typography>
                                    </Box>
                                </Paper>
                            );
                        })
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
