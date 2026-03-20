'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    IconButton,
    Grid,
    Stack,
    Button,
    Snackbar,
    Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import IosShareIcon from '@mui/icons-material/IosShare';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { MessengerIcon } from '@/components/Icons';
import { House } from '@/hooks/useHouseData';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

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
    const [copied, setCopied] = React.useState(false);

    const getShareLinks = () => {
        if (typeof window === 'undefined' || !house) return { url: '', text: '' };
        const url = `${window.location.origin}/join?houseId=${house.id}`;
        const text = `Join my house "${house.name}" on OurTab to track our shared expenses!`;
        return { url, text };
    };

    const { url, text } = getShareLinks();

    const handleCopyLink = () => {
        handleCopy(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const shareOptions = [
        {
            label: 'WhatsApp',
            color: '#25D366',
            shadow: 'rgba(37, 211, 102, 0.35)',
            hover: '#128C7E',
            icon: <WhatsAppIcon />,
            onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank'),
            ariaLabel: 'Share via WhatsApp',
        },
        {
            label: 'Messenger',
            color: '#1877F2',
            shadow: 'rgba(24, 119, 242, 0.35)',
            hover: '#0d65d9',
            icon: <MessengerIcon />,
            onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'),
            ariaLabel: 'Share via Messenger',
        },
        {
            label: 'Telegram',
            color: '#0088cc',
            shadow: 'rgba(0, 136, 204, 0.35)',
            hover: '#0077b3',
            icon: <TelegramIcon />,
            onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank'),
            ariaLabel: 'Share via Telegram',
        },
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                }
            }}
        >
            {/* Gradient header */}
            <Box sx={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
                pt: 4,
                pb: 3,
                px: 3,
                textAlign: 'center',
                position: 'relative',
            }}>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    aria-label="Close share dialog"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                {/* Icon ring */}
                <Box sx={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                    backdropFilter: 'blur(8px)',
                }}>
                    <GroupAddIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>

                <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, letterSpacing: '-0.01em', mb: 0.5 }}>
                    Invite to {house?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Share the link and grow your household
                </Typography>
            </Box>

            <DialogContent sx={{ p: 3, pt: 2.5 }}>

                {/* Link copy row */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.2,
                    pl: 2,
                    borderRadius: 3,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 3,
                }}>
                    <Typography
                        variant="caption"
                        sx={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 700,
                            color: 'primary.main',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                        }}
                    >
                        {url}
                    </Typography>
                    <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                        <IconButton
                            size="small"
                            onClick={handleCopyLink}
                            sx={{
                                color: copied ? 'success.main' : 'primary.main',
                                bgcolor: copied ? 'rgba(16,185,129,0.1)' : 'rgba(108,99,255,0.08)',
                                borderRadius: 2,
                                p: 0.8,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: copied ? 'rgba(16,185,129,0.15)' : 'rgba(108,99,255,0.15)' }
                            }}
                            aria-label="Copy invite link"
                        >
                            {copied ? <CheckIcon sx={{ fontSize: 18 }} /> : <ContentCopyIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Divider label */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Share via
                    </Typography>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                </Box>

                {/* Social share buttons */}
                <Grid container spacing={2} sx={{ mb: typeof navigator !== 'undefined' && 'share' in navigator ? 2 : 0 }}>
                    {shareOptions.map((opt) => (
                        <Grid size={4} key={opt.label}>
                            <Stack alignItems="center" spacing={0.75}>
                                <IconButton
                                    onClick={opt.onClick}
                                    aria-label={opt.ariaLabel}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: opt.color,
                                        color: 'white',
                                        boxShadow: `0 8px 20px ${opt.shadow}`,
                                        '&:hover': { bgcolor: opt.hover, transform: 'translateY(-3px)', boxShadow: `0 14px 28px ${opt.shadow}` },
                                        transition: 'all 0.25s ease',
                                    }}
                                >
                                    {opt.icon}
                                </IconButton>
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', color: 'text.secondary' }}>
                                    {opt.label}
                                </Typography>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>

                {/* System share button */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<IosShareIcon />}
                        onClick={async () => {
                            try {
                                await navigator.share({ title: 'Join my House on OurTab', text, url });
                            } catch (err) {
                                if ((err as Error).name !== 'AbortError') handleCopy(url);
                            }
                        }}
                        sx={{
                            mt: 1,
                            borderRadius: 3,
                            py: 1.1,
                            textTransform: 'none',
                            fontWeight: 700,
                            borderColor: 'divider',
                            color: 'text.secondary',
                            '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'rgba(108,99,255,0.04)' }
                        }}
                    >
                        More options…
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}
