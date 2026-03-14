'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from '@mui/material';

interface EditExpenseDialogProps {
    open: boolean;
    onClose: () => void;
    editDescription: string;
    setEditDescription: (desc: string) => void;
    editAmount: string;
    setEditAmount: (amount: string) => void;
    onConfirm: () => Promise<void>;
}

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
    open,
    onClose,
    editDescription,
    setEditDescription,
    editAmount,
    setEditAmount,
    onConfirm,
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="description"
                    label="Description"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField
                    margin="dense"
                    id="amount"
                    label="Amount"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditExpenseDialog;
