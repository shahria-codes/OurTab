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
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface AddMemberDialogProps {
    open: boolean;
    onClose: () => void;
    newMemberEmail: string;
    setNewMemberEmail: (email: string) => void;
    onConfirm: () => Promise<void>;
}

const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
    open,
    onClose,
    newMemberEmail,
    setNewMemberEmail,
    onConfirm,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { borderRadius: 4, width: '100%', maxWidth: 450 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 3 }}>
                <Box sx={{
                    display: 'flex',
                    p: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)',
                    color: 'white'
                }}>
                    <PersonAddIcon />
                </Box>
                <Typography variant="h5" component="span" sx={{ fontWeight: 800 }}>Add Member</Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Invite someone to join your house. They'll be able to track expenses and contribute.
                </Typography>
                <TextField
                    autoFocus
                    label="Email Address"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    error={!!newMemberEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)}
                    helperText={!!newMemberEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail) ? "Please enter a valid email address" : ""}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                        }
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                    onClick={onClose}
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={!newMemberEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)}
                    variant="contained"
                    sx={{
                        borderRadius: 2.5,
                        px: 4,
                        py: 1,
                        fontWeight: 700,
                        textTransform: 'none',
                        background: 'linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)',
                        boxShadow: '0 4px 15px rgba(108, 99, 255, 0.3)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #5b54d6 30%, #e55a76 90%)',
                            boxShadow: '0 6px 20px rgba(108, 99, 255, 0.4)',
                        }
                    }}
                >
                    Add Member
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddMemberDialog;
