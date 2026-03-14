'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    Avatar,
    IconButton,
    Grid,
    Stack,
    Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import IosShareIcon from '@mui/icons-material/IosShare';
import { MessengerIcon } from '@/components/Icons';
import { House } from '@/hooks/useHouseData';

interface ShareHouseDialogProps {
    open: boolean;
    onClose: () => void;
    house: House | null;
    handleCopy: (text: string) => void;
}

export default function ShareHouseDialog({
    open,
    onClose,
    house,
    handleCopy
}: ShareHouseDialogProps) {
    
    const getShareLinks = () => {
        if (typeof window === 'undefined' || !house) return { url: '', text: '' };
        const url = `${window.location.origin}/join?houseId=${house.id}`;
        const text = `Join my house "${house.name}" on OurTab to track our shared expenses!`;
        return { url, text };
    };

    const { url, text } = getShareLinks();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
                }
            }}
        >
            <Box sx={{
                height: 60,
                background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, letterSpacing: '0.05em' }}>
                    SHARE INVITE
                </Typography>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', top: 10, right: 10, color: 'white', opacity: 0.8 }}
                    aria-label="Close share dialog"
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                    <Avatar alt="Group Invite Icon" sx={{
                        width: 52,
                        height: 52,
                        bgcolor: 'rgba(108, 99, 255, 0.1)',
                        color: '#6C63FF',
                        mx: 'auto',
                        mb: 1.5,
                        boxShadow: '0 10px 20px rgba(108, 99, 255, 0.1)'
                    }}>
                        <GroupIcon sx={{ fontSize: 26 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#1a202c', mb: 0.5 }}>
                        Invite to {house?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, opacity: 0.7 }}>
                        Grow your household and manage expenses together
                    </Typography>
                </Box>

                <Box sx={{
                    p: 1.5,
                    bgcolor: 'rgba(0,0,0,0.03)',
                    borderRadius: 3,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px dashed rgba(0,0,0,0.1)'
                }}>
                    <Typography variant="caption" sx={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 700,
                        color: 'primary.main',
                        px: 1
                    }}>
                        {url}
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => handleCopy(url)}
                        sx={{ minWidth: 'auto', fontWeight: 800, textTransform: 'none' }}
                    >
                        Copy
                    </Button>
                </Box>

                <Grid container spacing={2}>
                    <Grid size={4}>
                        <Stack alignItems="center" spacing={1}>
                            <IconButton
                                onClick={() => {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                                }}
                                sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: '#25D366',
                                    color: 'white',
                                    boxShadow: '0 8px 15px rgba(37, 211, 102, 0.3)',
                                    '&:hover': { bgcolor: '#128C7E', transform: 'translateY(-3px)' },
                                    transition: 'all 0.3s ease'
                                }}
                                aria-label="Share via WhatsApp"
                            >
                                <WhatsAppIcon />
                            </IconButton>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>WhatsApp</Typography>
                        </Stack>
                    </Grid>

                    <Grid size={4}>
                        <Stack alignItems="center" spacing={1}>
                            <IconButton
                                onClick={() => {
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                                }}
                                sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: '#1877F2',
                                    color: 'white',
                                    boxShadow: '0 8px 15px rgba(24, 119, 242, 0.3)',
                                    '&:hover': { bgcolor: '#0d65d9', transform: 'translateY(-3px)' },
                                    transition: 'all 0.3s ease'
                                }}
                                aria-label="Share via Messenger"
                            >
                                <MessengerIcon />
                            </IconButton>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>Messenger</Typography>
                        </Stack>
                    </Grid>

                    <Grid size={4}>
                        <Stack alignItems="center" spacing={1}>
                            <IconButton
                                onClick={() => {
                                    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: '#0088cc',
                                    color: 'white',
                                    boxShadow: '0 8px 15px rgba(0, 136, 204, 0.3)',
                                    '&:hover': { bgcolor: '#0077b3', transform: 'translateY(-3px)' },
                                    transition: 'all 0.3s ease'
                                }}
                                aria-label="Share via Telegram"
                            >
                                <TelegramIcon />
                            </IconButton>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>Telegram</Typography>
                        </Stack>
                    </Grid>
                </Grid>

                {typeof navigator !== 'undefined' && navigator.share && (
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<IosShareIcon />}
                        onClick={async () => {
                            try {
                                await navigator.share({
                                    title: 'Join my House on OurTab',
                                    text: text,
                                    url: url,
                                });
                            } catch (err) {
                                if ((err as Error).name !== 'AbortError') handleCopy(url);
                            }
                        }}
                        sx={{
                            mt: 3,
                            borderRadius: 3,
                            py: 1.2,
                            textTransform: 'none',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                            color: 'white',
                            boxShadow: '0 8px 20px rgba(108, 99, 255, 0.2)',
                            border: 'none',
                            '&:hover': {
                                boxShadow: '0 12px 25px rgba(108, 99, 255, 0.3)',
                                filter: 'brightness(1.05)'
                            }
                        }}
                    >
                        Open System Share
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}
