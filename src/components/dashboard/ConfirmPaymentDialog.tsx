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
    TextField,
    Chip,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';

interface ConfirmPaymentDialogProps {
    open: boolean;
    onClose: () => void;
    paySettlement: any;
    allMembers: any[];
    payAmount: string;
    setPayAmount: (amount: string) => void;
    payMethod: 'bank' | 'cash';
    setPayMethod: (method: 'bank' | 'cash') => void;
    displayCurrency: string;
    onConfirm: () => Promise<void>;
}

const ConfirmPaymentDialog: React.FC<ConfirmPaymentDialogProps> = ({
    open,
    onClose,
    paySettlement,
    allMembers,
    payAmount,
    setPayAmount,
    payMethod,
    setPayMethod,
    displayCurrency,
    onConfirm,
}) => {
    if (!paySettlement) return null;

    const toMember = allMembers.find(m => m.email === paySettlement.to);
    const toName = toMember?.name || paySettlement.to.split('@')[0];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography>
                        Paying <strong>{toName}</strong>
                    </Typography>

                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        value={payAmount}
                        onChange={(e) => {
                            const val = e.target.value;
                            const max = paySettlement?.amount ?? Infinity;
                            if (val === '' || Number(val) <= max) {
                                setPayAmount(val);
                            } else {
                                setPayAmount(String(max));
                            }
                        }}
                        inputProps={{ min: 0.01, step: '0.01', max: paySettlement?.amount }}
                        helperText={`Max: ${displayCurrency}${paySettlement?.amount.toFixed(2)}`}
                        InputProps={{
                            startAdornment: (
                                <Box component="span" sx={{ mr: 0.5, color: 'text.secondary' }}>{displayCurrency}</Box>
                            ),
                        }}
                    />

                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Payment method</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                label="🏦 Bank"
                                clickable
                                color={payMethod === 'bank' ? 'primary' : 'default'}
                                variant={payMethod === 'bank' ? 'filled' : 'outlined'}
                                onClick={() => setPayMethod('bank')}
                                sx={{ fontWeight: payMethod === 'bank' ? 'bold' : 'normal' }}
                            />
                            <Chip
                                label="💵 Cash"
                                clickable
                                color={payMethod === 'cash' ? 'success' : 'default'}
                                variant={payMethod === 'cash' ? 'filled' : 'outlined'}
                                onClick={() => setPayMethod('cash')}
                                sx={{ fontWeight: payMethod === 'cash' ? 'bold' : 'normal' }}
                            />
                        </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        {toName} will receive a notification to approve. Once approved, the settlement will update automatically.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<PaymentsIcon />}
                    disabled={!payAmount || Number(payAmount) <= 0 || Number(payAmount) > (paySettlement?.amount ?? Infinity)}
                    onClick={onConfirm}
                >
                    Confirm Payment
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmPaymentDialog;
