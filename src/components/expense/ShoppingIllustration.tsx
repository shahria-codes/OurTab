'use client';

import Image from 'next/image';
import Box from '@mui/material/Box';

export default function ShoppingIllustration() {
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 350,
                margin: '40px auto 32px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                animation: 'fadeIn 0.8s ease-out',
                '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '115%',
                    height: '115%',
                    top: '-5%',
                    left: '-7.5%',
                    zIndex: 0,
                    background: 'linear-gradient(135deg, #E6E6FA 0%, #D8BFD8 100%)',
                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                    animation: 'morph 8s ease-in-out infinite',
                    boxShadow: 'inset 0 0 50px rgba(255, 255, 255, 0.5), 0 8px 20px rgba(216, 191, 216, 0.4)',
                },
                '@keyframes morph': {
                    '0%, 100%': {
                        borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                    },
                    '34%': {
                        borderRadius: '70% 30% 50% 50% / 30% 30% 70% 70%',
                    },
                    '67%': {
                        borderRadius: '100% 60% 60% 100% / 100% 100% 60% 60%',
                    },
                },
            }}
        >
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '350/260', zIndex: 1, filter: 'drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.1))' }}>
                <Image
                    src="/shopping.min.svg"
                    alt="Add items to get started"
                    fill
                    sizes="(max-width: 350px) 100vw, 350px"
                    priority
                    style={{
                        objectFit: 'contain'
                    }}
                />
            </Box>
        </Box>
    );
}
