import React, { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { useToast } from '@/components/ToastContext';
import { House } from '@/hooks/useHouseData';

interface JoinDayMealDialogProps {
    house?: House;
    userEmail?: string | null;
    onSuccess?: () => void;
}

export default function JoinDayMealDialog({ house, userEmail, onSuccess }: JoinDayMealDialogProps) {
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedMeals, setSelectedMeals] = useState<Record<string, boolean>>({});

    const [eligibleMeals, setEligibleMeals] = useState<string[]>([]);

    useEffect(() => {
        if (!house || !userEmail) return;

        const email = userEmail.toLowerCase();
        const memberDetail = house.memberDetails?.[email];
        if (!memberDetail?.joinedAt) return;

        // Skip if already requested
        if (house.joinDayMealRequests?.[email]) return;

        const joinedAt = new Date(memberDetail.joinedAt);
        const joinedDateStr = joinedAt.toISOString().substring(0, 10);

        // Only show for the day they join (in local time check or just if ISO matches today's ISO date)
        const todayStr = new Date().toISOString().substring(0, 10);
        if (joinedDateStr !== todayStr) return;

        const windowEnd = house.mealUpdateWindowEnd || '05:00';
        const [endHour, endMin] = windowEnd.split(':').map(Number);
        const windowEndMins = endHour * 60 + endMin;
        const joinedMins = joinedAt.getUTCHours() * 60 + joinedAt.getUTCMinutes();

        // Must join AFTER window ends
        if (joinedMins <= windowEndMins) return;

        const mealsPerDay = house.mealsPerDay || 3;
        const mins = joinedMins;
        const h10 = 10 * 60;
        const h15 = 15 * 60;
        const h19 = 19 * 60;

        let eligible: string[] = [];
        if (mins < h19) {
            if (mins < h10) {
                eligible = mealsPerDay === 3 ? ['breakfast', 'lunch', 'dinner'] : ['lunch', 'dinner'];
            } else if (mins < h15) {
                eligible = ['lunch', 'dinner'];
            } else {
                eligible = ['dinner'];
            }
        }

        if (eligible.length > 0) {
            setEligibleMeals(eligible);

            // Pre-select all eligible meals
            const initialSelected: Record<string, boolean> = {};
            eligible.forEach(m => { initialSelected[m] = true; });
            setSelectedMeals(initialSelected);

            setOpen(true);
        }

    }, [house, userEmail]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async () => {
        if (!house?.id || !userEmail) return;

        const requestedMeals = Object.keys(selectedMeals).filter(m => selectedMeals[m]);

        if (requestedMeals.length === 0) {
            showToast('Please select at least one meal to request', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/meals/join-day-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    houseId: house.id,
                    email: userEmail,
                    requestedMeals,
                })
            });

            if (res.ok) {
                showToast('Meal request sent to managers!', 'success');
                setOpen(false);
                if (onSuccess) onSuccess();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to send request', 'error');
            }
        } catch (error) {
            console.error('Error sending meal request:', error);
            showToast('Failed to send request', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!open || eligibleMeals.length === 0) return null;

    const labels: Record<string, string> = {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner'
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : handleClose} PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 400 } }}>
            <DialogTitle sx={{ textAlign: 'center', pb: 1, pt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        <RestaurantMenuIcon />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Meals for Today?</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                    Since you joined the house late today, your meals are turned off by default. Would you like to request meals for today?
                </Typography>

                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                        Eligible Meals
                    </Typography>
                    <FormGroup>
                        {eligibleMeals.map(meal => (
                            <FormControlLabel
                                key={meal}
                                control={
                                    <Checkbox
                                        checked={!!selectedMeals[meal]}
                                        onChange={(e) => setSelectedMeals(prev => ({ ...prev, [meal]: e.target.checked }))}
                                        color="primary"
                                    />
                                }
                                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{labels[meal] || meal}</Typography>}
                            />
                        ))}
                    </FormGroup>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 0, flexDirection: 'column', gap: 1 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{ borderRadius: 2, py: 1.2, fontWeight: 700 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Request'}
                </Button>
                <Button
                    fullWidth
                    variant="text"
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                >
                    Dismiss
                </Button>
            </DialogActions>
        </Dialog>
    );
}
