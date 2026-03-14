'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';

interface CancelPaymentDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

const CancelPaymentDialog: React.FC<CancelPaymentDialogProps> = ({
    open,
    onClose,
    onConfirm,
}) => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Cancel Payment Request</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to cancel this payment request? The receiver will no longer be able to approve it.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Back</Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={onConfirm}
                >
                    Confirm Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CancelPaymentDialog;
