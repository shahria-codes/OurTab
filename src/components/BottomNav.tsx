'use client';
import { useEffect, useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Avatar from '@mui/material/Avatar';

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, house } = useAuth();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Detect keyboard on mobile
        const handleResize = () => {
            if (window.visualViewport) {
                // Robust check: if viewport is less than 75% of screen height, keyboard is likely open
                const isKeyboardOpen = window.visualViewport.height < window.screen.height * 0.75;
                setIsVisible(!isKeyboardOpen);
            }
        };

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                setIsVisible(false);
            }
        };

        const handleFocusOut = () => {
            // Small delay to allow click events on buttons to register before UI shifts
            setTimeout(() => {
                setIsVisible(true);
            }, 200);
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, pb: 'calc(env(safe-area-inset-bottom) + 8px)' }} elevation={3} className="glass-nav">
            <BottomNavigation
                showLabels
                value={pathname}
                onChange={(event, newValue) => {
                    router.push(newValue);
                }}
                sx={{
                    background: 'transparent',
                    '& .MuiBottomNavigationAction-root': {
                        minWidth: 'auto',
                        padding: '10px 0',

                    },
                    '& .Mui-selected': {
                        color: 'primary.main',
                    }
                }}
            >
                <BottomNavigationAction label="Dashboard" value="/dashboard" icon={<DashboardIcon />} />
                <BottomNavigationAction label="Buy List" value="/buy-list" icon={<ShoppingCartIcon />} />
                {house?.typeOfHouse === 'meals_and_expenses' && (
                    <BottomNavigationAction label="Meals" value="/meals" icon={<RestaurantMenuIcon />} />
                )}
                <BottomNavigationAction label="Expense" value="/expense" icon={<FormatListBulletedIcon />} />
                <BottomNavigationAction
                    label="Profile"
                    value="/profile"
                    icon={
                        user?.photoURL ? (
                            <Avatar src={user.photoURL} sx={{ width: 24, height: 24, mb: '2px' }} />
                        ) : (
                            <PersonIcon />
                        )
                    }
                />
            </BottomNavigation>
        </Paper>
    );
}
