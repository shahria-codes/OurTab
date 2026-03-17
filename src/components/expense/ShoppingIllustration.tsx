'use client';

import Image from 'next/image';
import Box from '@mui/material/Box';

export default function ShoppingIllustration() {
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 350,
                margin: '24px auto',
                display: 'flex',
                justifyContent: 'center',
                animation: 'fadeIn 0.8s ease-out',
                '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
            }}
        >
            <Image
                src="/shopping.min.svg"
                alt="Add items to get started"
                width={350}
                height={260}
                priority
                style={{
                    width: '100%',
                    height: 'auto',
                    filter: 'drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.05))',
                }}
            />
        </Box>
    );
}
