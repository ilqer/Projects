import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { keyframes } from '@mui/system';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import { useTheme } from '@mui/material/styles';

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
`;

const glow = keyframes`
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
`;

const glitch1 = keyframes`
  0% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
  100% { transform: translate(0); }
`;

const glitch2 = keyframes`
  0% { transform: translate(0); }
  20% { transform: translate(3px, -3px); }
  40% { transform: translate(3px, 3px); }
  60% { transform: translate(-3px, -3px); }
  80% { transform: translate(-3px, 3px); }
  100% { transform: translate(0); }
`;


const AccessDenied = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);


  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(to bottom right, ${theme.palette.mode === 'dark' ? '#0f172a, #581c87, #0f172a' : '#f1f5f9, #e9d5ff, #f1f5f9'})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background particles */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
              opacity: 0.1,
              '@keyframes floatParticle': {
                '0%': {
                  transform: `translateY(${Math.random() * window.innerHeight}px)`,
                  opacity: 0.1,
                },
                '50%': {
                  opacity: 0.5,
                },
                '100%': {
                  transform: `translateY(${Math.random() * window.innerHeight}px)`,
                  opacity: 0.1,
                },
              },
              animation: `floatParticle ${Math.random() * 5 + 5}s linear infinite`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </Box>

      {/* Grid pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)'} 1px, transparent 1px),
                            linear-gradient(90deg, ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          zIndex: 0,
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          {/* Lock Icon with animation */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
              animation: `${float} 3s ease-in-out infinite`,
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'primary.main',
                  filter: 'blur(40px)',
                  opacity: 0.5,
                  animation: `${glow} 2s ease-in-out infinite`,
                }}
              />
              <LockIcon
                sx={{
                  fontSize: 96,
                  color: 'primary.light',
                  position: 'relative',
                }}
              />
            </Box>
          </Box>

          {/* ACCESS DENIED Text with glitch effect */}
          <Box sx={{ position: 'relative', mb: 4, minHeight: { xs: '80px', md: '120px' } }}>
            {/* Normal ACCESS DENIED - glitch sırasında gizlenir */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '48px', md: '72px' },
                fontWeight: 'bold',
                letterSpacing: '0.1em',
                background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.secondary?.main || theme.palette.primary.main}, ${theme.palette.primary.light})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                userSelect: 'none',
                position: 'relative',
                opacity: glitchActive ? 0 : 1,
                transition: 'opacity 0.1s ease',
              }}
            >
              ACCESS DENIED
            </Typography>
            {/* Glitch efektleri - sadece glitch aktifken görünür, ACCESS DENIED yazısının yerinde titreme efekti */}
            {glitchActive && (
              <>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '48px', md: '72px' },
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.secondary?.main || theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: 0.9,
                    zIndex: 2,
                    animation: `${glitch1} 0.2s linear`,
                  }}
                >
                  ACCESS DENIED
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '48px', md: '72px' },
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.secondary?.main || theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: 0.9,
                    zIndex: 3,
                    animation: `${glitch2} 0.2s linear`,
                  }}
                >
                  ACCESS DENIED
                </Typography>
              </>
            )}
          </Box>

          {/* Error message */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <BlockIcon sx={{ color: 'primary.light' }} />
              <Typography variant="h5" sx={{ color: 'primary.light' }}>
                Permission Denied
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: '500px',
                mx: 'auto',
              }}
            >
              You do not have the necessary permissions to access this page.
              Please contact an administrator if you believe this is an error.
            </Typography>
          </Box>

          {/* Code block decoration */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
              borderRadius: 2,
              p: 3,
              maxWidth: '600px',
              mx: 'auto',
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                }}
              />
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                }}
              />
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                }}
              />
            </Box>
            <Box
              component="pre"
              sx={{
                textAlign: 'left',
                fontSize: '0.875rem',
                color: 'primary.light',
                overflowX: 'auto',
                m: 0,
                fontFamily: 'monospace',
              }}
            >
              <code>{`if (user.hasPermission()) {
  render(<Page />);
} else {
  throw new Error("403: Access Denied");
}`}</code>
            </Box>
          </Paper>

          {/* Action buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{
                bgcolor: 'primary.main',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Go Home
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.light',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  borderColor: 'primary.dark',
                  transform: 'scale(1.05)',
                  '& .MuiSvgIcon-root': {
                    transform: 'rotate(180deg)',
                  },
                },
                transition: 'all 0.3s ease',
                '& .MuiSvgIcon-root': {
                  transition: 'transform 0.5s ease',
                },
              }}
            >
              Reload Page
            </Button>
          </Box>

          {/* Error code */}
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontFamily: 'monospace',
            }}
          >
            ERROR_CODE: 0x403_ACCESS_DENIED
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AccessDenied;
