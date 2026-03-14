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
} from '@mui/material';

interface SubmitDepositDialogProps {
    open: boolean;
    onClose: () => void;
    depositAmount: string;
    setDepositAmount: (amount: string) => void;
    displayCurrency: string;
    onConfirm: () => Promise<void>;
}

const SubmitDepositDialog: React.FC<SubmitDepositDialogProps> = ({
    open,
    onClose,
    depositAmount,
    setDepositAmount,
    displayCurrency,
    onConfirm,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Submit Fund Deposit</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Enter the amount you transferred to the central house account. This will need approval by the manager.
                    </Typography>
                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <Box component="span" sx={{ mr: 0.5, color: 'text.secondary' }}>{displayCurrency}</Box>
                            ),
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={onConfirm}
                    disabled={!depositAmount || Number(depositAmount) <= 0}
                >
                    Request Approval
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubmitDepositDialog;
