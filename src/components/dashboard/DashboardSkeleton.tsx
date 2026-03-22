'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

/** A card-shaped skeleton that matches each stat widget */
function StatCardSkeleton({ accentColor = 'rgba(108,99,255,0.08)' }: { accentColor?: string }) {
    return (
        <Paper
            className="glass"
            sx={{
                p: 3,
                borderRadius: 4,
                height: '100%',
                minHeight: 180,
                background: accentColor,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Background icon ghost */}
            <Skeleton
                variant="circular"
                width={100}
                height={100}
                sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.15 }}
            />

            {/* Label */}
            <Skeleton variant="text" width="40%" height={16} sx={{ borderRadius: 1 }} />

            {/* Big number */}
            <Skeleton variant="text" width="60%" height={52} sx={{ borderRadius: 2 }} />

            {/* Sub-label */}
            <Skeleton variant="text" width="80%" height={14} sx={{ borderRadius: 1 }} />

            {/* Footer row */}
            <Box sx={{ display: 'flex', gap: 2, mt: 'auto', pt: 1.5 }}>
                <Skeleton variant="text" width="35%" height={14} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width="30%" height={14} sx={{ borderRadius: 1 }} />
            </Box>
        </Paper>
    );
}

/** A list-row skeleton for the expense list */
function ExpenseRowSkeleton() {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
            {/* Avatar / category dot */}
            <Skeleton variant="circular" width={36} height={36} />

            {/* Description + date */}
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="55%" height={16} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width="35%" height={12} sx={{ borderRadius: 1 }} />
            </Box>

            {/* Amount chip */}
            <Skeleton variant="rounded" width={64} height={28} sx={{ borderRadius: 2 }} />
        </Box>
    );
}

export default function DashboardSkeleton() {
    return (
        <main>
            <Container maxWidth="lg" sx={{ mt: 2, mb: 10 }}>

                {/* ── Header ───────────────────────────────────── */}
                <Box
                    className="glass-nav"
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 2,
                        mb: 0.1,
                        mx: { xs: -2, sm: -3 },
                        px: { xs: 2, sm: 3 },
                        backgroundColor: 'transparent !important',
                    }}
                >
                    <Skeleton variant="text" width={140} height={40} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="circular" width={36} height={36} />
                </Box>

                {/* Sub-heading */}
                <Skeleton variant="text" width={280} height={20} sx={{ mb: 1.5, borderRadius: 1 }} />

                {/* ── Month Navigator ───────────────────────────── */}
                <Paper
                    className="glass"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 4,
                        p: 1.5,
                        borderRadius: 4,
                        maxWidth: 400,
                        mx: 'auto',
                    }}
                >
                    <Skeleton variant="circular" width={36} height={36} />
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton variant="text" width={160} height={28} sx={{ borderRadius: 1 }} />
                    </Stack>
                    <Skeleton variant="circular" width={36} height={36} />
                </Paper>

                {/* ── Stat Cards Row ────────────────────────────── */}
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <StatCardSkeleton accentColor="rgba(255,101,132,0.05)" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <StatCardSkeleton accentColor="rgba(108,99,255,0.05)" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <StatCardSkeleton accentColor="rgba(2,136,209,0.05)" />
                    </Grid>
                </Grid>

                {/* ── Settlements Section ───────────────────────── */}
                <Box sx={{ mt: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="text" width={180} height={28} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 2 }} />
                    </Box>

                    {/* Settlement rows */}
                    {[1, 2].map((i) => (
                        <Paper
                            key={i}
                            className="glass"
                            sx={{
                                p: 2,
                                mb: 1.5,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                background: 'rgba(108,99,255,0.04)',
                            }}
                        >
                            <Skeleton variant="circular" width={40} height={40} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="60%" height={16} sx={{ borderRadius: 1 }} />
                                <Skeleton variant="text" width="40%" height={12} sx={{ borderRadius: 1 }} />
                            </Box>
                            <Skeleton variant="rounded" width={90} height={32} sx={{ borderRadius: 2 }} />
                        </Paper>
                    ))}
                </Box>

                {/* ── Expense List ──────────────────────────────── */}
                <Box sx={{ mt: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="text" width={160} height={28} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rounded" width={100} height={30} sx={{ borderRadius: 2 }} />
                    </Box>

                    <Paper className="glass" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Box
                                key={i}
                                sx={{
                                    px: 2.5,
                                    borderBottom: i < 5 ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                }}
                            >
                                <ExpenseRowSkeleton />
                            </Box>
                        ))}
                    </Paper>
                </Box>

            </Container>
        </main>
    );
}
