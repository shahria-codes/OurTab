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
    Stack,
    Button,
    Tooltip,
    IconButton
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import CakeIcon from '@mui/icons-material/Cake';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { MessengerIcon } from '@/components/Icons';
import { House } from '@/hooks/useHouseData';
import { formatBirthday } from '@/utils/date';

interface MemberDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    member: {
        email: string;
        name?: string;
        photoUrl?: string;
        iban?: string;
        profession?: string;
        birthday?: string;
        whatsapp?: string;
        messenger?: string;
        wallet?: string;
    } | null;
    house: House | null;
    handleCopy: (text: string) => void;
}

export default function MemberDetailsDialog({
    open,
    onClose,
    member,
    house,
    handleCopy
}: MemberDetailsDialogProps) {
    if (!member) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 4, bgcolor: 'background.paper', overflow: 'hidden' }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pb: 1 }}>Member Details</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
                    {/* Header: Image and Name */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Avatar
                            src={member.photoUrl}
                            alt={member.name}
                            sx={{ width: 80, height: 80, border: '3px solid', borderColor: 'primary.light', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center' }}>
                            {member.name || member.email.split('@')[0]}
                        </Typography>
                    </Box>

                    <Divider sx={{ opacity: 0.6 }} />

                    {/* Details Grid */}
                    <Stack spacing={2}>
                        {/* Profession */}
                        {member.profession && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <WorkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Profession
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {member.profession}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Birthday */}
                        {member.birthday && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CakeIcon sx={{ color: 'error.light', fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Birthday
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {formatBirthday(member.birthday)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* IBAN - Only show for Expenses Tracking houses */}
                        {house?.typeOfHouse === 'expenses' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        IBAN
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', pr: 1 }}>
                                        {member.iban || 'Not provided'}
                                    </Typography>
                                </Box>
                                {member.iban && (
                                    <Tooltip title="Copy IBAN">
                                        <IconButton 
                                            onClick={() => handleCopy(member.iban!)} 
                                            size="small" 
                                            sx={{ bgcolor: 'white' }}
                                            aria-label="Copy IBAN"
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        )}
                    </Stack>

                    {/* Social Links */}
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, textAlign: 'center' }}>
                            Social Connect
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<WhatsAppIcon />}
                                disabled={!member.whatsapp}
                                onClick={() => member.whatsapp && window.open(member.whatsapp.startsWith('http') ? member.whatsapp : `https://wa.me/${member.whatsapp}`, '_blank')}
                                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                            >
                                WhatsApp
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<MessengerIcon />}
                                disabled={!member.messenger}
                                onClick={() => member.messenger && window.open(member.messenger.startsWith('http') ? member.messenger : `https://m.me/${member.messenger}`, '_blank')}
                                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                            >
                                Messenger
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button onClick={onClose} fullWidth variant="contained" sx={{ borderRadius: 3, py: 1, fontWeight: 700 }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
