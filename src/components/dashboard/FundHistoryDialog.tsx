'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Paper,
    Avatar,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface FundHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    monthName: string;
    fundDeposits: any[];
    selectedDate: Date;
    allMembers: any[];
    currency?: string;
    currencySymbols: Record<string, string>;
    getYYYYMM: (date: Date) => string;
    formatDateLocale: (date: string | Date) => string;
    formatTimeLocale: (date: string | Date) => string;
}

const FundHistoryDialog: React.FC<FundHistoryDialogProps> = ({
    open,
    onClose,
    monthName,
    fundDeposits,
    selectedDate,
    allMembers,
    currency,
    currencySymbols,
    getYYYYMM,
    formatDateLocale,
    formatTimeLocale,
}) => {
    const approvedDeposits = (fundDeposits || []).filter(d => d.status === 'approved');
    const monthStr = getYYYYMM(selectedDate);
    const currentMonthDeposits = approvedDeposits
        .filter(d => d.date.startsWith(monthStr))
        .sort((a, b) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime());

    const displayCurrencySymbol = currencySymbols[currency || 'BDT'] || currency || '৳';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', py: 2, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'success.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(76, 175, 80, 0.15)' }}>
                        <HistoryIcon sx={{ fontSize: '1.2rem' }} />
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main', lineHeight: 1.1, fontSize: '1.1rem' }}>Fund Deposit History</Typography>
                        <Typography variant="caption" sx={{ color: 'success.main', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {monthName}
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 2, py: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {currentMonthDeposits.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px dashed divider' }}>
                            <AccountBalanceWalletIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5, mb: 1 }} />
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                                No deposits this month.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {currentMonthDeposits.map((d: any) => {
                                const member = allMembers.find((m: any) => (typeof m === 'string' ? m : m.email) === d.email);
                                const name = (typeof member === 'object' && member?.name) ? member.name : d.email.split('@')[0];
                                const photoUrl = typeof member === 'object' ? member?.photoUrl : undefined;

                                return (
                                    <Paper key={d.id} elevation={0} sx={{
                                        p: 1.5,
                                        bgcolor: 'background.paper',
                                        borderRadius: 2.5,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid',
                                        borderColor: 'rgba(76, 175, 80, 0.15)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(76, 175, 80, 0.08)' }
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar src={photoUrl} alt={name || 'Member'} sx={{ width: 32, height: 32, bgcolor: 'success.light', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                {name[0]?.toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'success.main', lineHeight: 1.1, fontSize: '1rem' }}>
                                                    {displayCurrencySymbol}{d.amount.toFixed(2)}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.85rem', opacity: 0.9 }}>
                                                    {name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                                                {formatDateLocale(d.approvedAt || d.createdAt)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, fontSize: '0.7rem' }}>
                                                {formatTimeLocale(d.approvedAt || d.createdAt)}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                    onClick={onClose}
                    fullWidth
                    variant="contained"
                    color="success"
                    sx={{ borderRadius: 3, py: 1, fontWeight: 700 }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FundHistoryDialog;
