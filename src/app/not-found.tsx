'use client';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';

export default function NotFound() {
  const router = useRouter();

  return (
    <main style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      {/* Animated Background Blobs consistent with homepage */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        filter: 'blur(80px)',
        opacity: { xs: 0.4, md: 0.6 }
      }}>
        <Box className="animate-blob" sx={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '40vw',
          height: '40vw',
          bgcolor: 'rgba(108, 99, 255, 0.3)',
          borderRadius: '50%',
        }} />
        <Box className="animate-blob" sx={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '35vw',
          height: '35vw',
          bgcolor: 'rgba(255, 101, 132, 0.2)',
          borderRadius: '50%',
          animationDelay: '2s'
        }} />
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: 2 }}>
        <Box
          className="animate-stagger"
          sx={{
            py: { xs: 8, md: 10 },
            px: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ 
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-15px)' },
              '100%': { transform: 'translateY(0px)' },
            }
          }}>
            <Typography
              variant="h1"
              component="div"
              sx={{
                fontSize: { xs: '6rem', md: '8rem' },
                lineHeight: 1,
                mb: 2,
                display: 'inline-block',
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
              }}
            >
              😔
            </Typography>
          </Box>

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1.5,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontSize: { xs: '3rem', md: '4rem' }
            }}
          >
            404
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: 'text.primary',
              letterSpacing: '-0.5px'
            }}
          >
            Page Not Found
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 5,
              maxWidth: '85%',
              lineHeight: 1.6,
              opacity: 0.8
            }}
          >
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/')}
            startIcon={<HomeIcon />}
            sx={{
              borderRadius: '16px',
              px: { xs: 4, md: 5 },
              py: 1.5,
              background: 'linear-gradient(45deg, #6C63FF 30%, #FF6584 90%)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.05rem',
              boxShadow: '0 10px 20px rgba(108, 99, 255, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 15px 25px rgba(108, 99, 255, 0.4)',
              }
            }}
          >
            Back to Homepage
          </Button>
        </Box>
      </Container>
    </main>
  );
}
