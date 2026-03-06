'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import HomeIcon from '@mui/icons-material/Home';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { useToast } from '@/components/ToastContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Loader from '@/components/Loader';

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading, mutateHouse, mutateUser } = useAuth();
    const { showToast } = useToast();

    const houseId = searchParams.get('houseId');
    const [houseName, setHouseName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requestPending, setRequestPending] = useState(false);

    useEffect(() => {
        if (!houseId) {
            setError('Invalid or missing invitation link.');
            setLoading(false);
            return;
        }

        const fetchHouseInfo = async () => {
            try {
                const res = await fetch(`/api/houses/join?houseId=${houseId}`);
                const data = await res.json();
                if (res.ok) {
                    setHouseName(data.name);
                } else {
                    setError(data.error || 'House not found.');
                }

                // Check for existing request if user is logged in
                if (user?.email) {
                    const reqRes = await fetch(`/api/houses/join-requests?houseId=${houseId}`);
                    if (reqRes.ok) {
                        const requests = await reqRes.json();
                        const myRequest = requests.find((r: any) => r.id === user.email);
                        if (myRequest) {
                            setRequestPending(true);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching house info:', err);
                setError('Failed to fetch house information.');
            } finally {
                setLoading(false);
            }
        };

        fetchHouseInfo();
    }, [houseId, user?.email]);

    const handleJoin = async () => {
        if (!user?.email || !houseId) return;

        setJoining(true);
        try {
            const res = await fetch('/api/houses/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, houseId })
            });

            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Join request sent!', 'success');
                setRequestPending(true);
                if (mutateUser) mutateUser();
            } else {
                showToast(data.error || 'Failed to join house.', 'error');
            }
        } catch (err) {
            console.error('Error joining house:', err);
            showToast('An error occurred while joining.', 'error');
        } finally {
            setJoining(false);
        }
    };
    const handleCancel = async () => {
        if (!user?.email || !houseId) return;
        setJoining(true);
        try {
            const res = await fetch('/api/houses/join-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ houseId, email: user.email, action: 'cancel' })
            });
            if (res.ok) {
                showToast('Join request cancelled.', 'success');
                setRequestPending(false);
                if (mutateUser) mutateUser();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to cancel request.', 'error');
            }
        } catch (err) {
            console.error('Error cancelling request:', err);
            showToast('Error cancelling request.', 'error');
        } finally {
            setJoining(false);
        }
    };

    if (authLoading || loading) {
        return <Loader />;
    }

    return (
        <Box component="main" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#f8fafc', py: 4 }}>
            <Container maxWidth="sm">
                <Paper className="glass" sx={{
                    p: { xs: 3, md: 4 },
                    textAlign: 'center',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                }}>
                    <Box sx={{ mb: 4 }}>
                        <Avatar sx={{
                            width: 80,
                            height: 80,
                            bgcolor: 'primary.main',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 8px 16px rgba(108, 99, 255, 0.3)'
                        }}>
                            <HomeIcon sx={{ fontSize: 40 }} />
                        </Avatar>

                        {error ? (
                            <>
                                <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 800 }}>
                                    Oops!
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                                    {error}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={() => router.push('/')}
                                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                                >
                                    Go Back Home
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#1a202c' }}>
                                    House Invitation
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                                    You have been invited to join <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{houseName}</Box>
                                </Typography>

                                {!user ? (
                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                                            Please sign in to accept the invitation
                                        </Typography>
                                        <GoogleSignInButton />
                                    </Box>
                                ) : (
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        {requestPending ? (
                                            <Paper sx={{
                                                p: 2,
                                                bgcolor: 'rgba(108, 99, 255, 0.04)',
                                                borderRadius: 4,
                                                border: '1px dashed rgba(108, 99, 255, 0.3)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CircularProgress size={14} thickness={6} sx={{ color: 'primary.main' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                        Request Pending
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                                                    Waiting for member approval.
                                                </Typography>
                                                <Button
                                                    variant="text"
                                                    color="error"
                                                    size="small"
                                                    disabled={joining}
                                                    startIcon={joining ? <CircularProgress size={12} color="inherit" /> : <CloseIcon sx={{ fontSize: '1rem !important' }} />}
                                                    onClick={handleCancel}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        py: 0,
                                                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.05)' }
                                                    }}
                                                >
                                                    Cancel Request
                                                </Button>
                                            </Paper>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                size="large"
                                                fullWidth
                                                disabled={joining}
                                                startIcon={joining ? <CircularProgress size={20} color="inherit" /> : <GroupAddIcon />}
                                                onClick={handleJoin}
                                                sx={{
                                                    borderRadius: 4,
                                                    py: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 800,
                                                    fontSize: '1rem',
                                                    boxShadow: '0 10px 20px rgba(108, 99, 255, 0.2)',
                                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 24px rgba(108, 99, 255, 0.3)' }
                                                }}
                                            >
                                                {joining ? 'Sending...' : 'Accept Invitation'}
                                            </Button>
                                        )}

                                        <Button
                                            variant="text"
                                            color="inherit"
                                            onClick={() => router.push('/dashboard')}
                                            sx={{ textTransform: 'none', fontWeight: 600, opacity: 0.6, fontSize: '0.85rem' }}
                                        >
                                            {requestPending ? 'Back to Dashboard' : 'Decline & Go to Dashboard'}
                                        </Button>
                                    </Stack>
                                )}
                            </>
                        )}
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<Loader />}>
            <JoinContent />
        </Suspense>
    );
}
