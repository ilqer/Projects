import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Box, TextField, Button, Typography, Alert, Container } from '@mui/material';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  // Get email passed from Registration page state
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await authService.verifyEmail(email, code);
      setMsg({ type: 'success', text: 'Verified! Redirecting...' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendCode(email);
      setMsg({ type: 'info', text: 'New code sent to your email.' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to send code.' });
    }
  };

  if (!email) return <Typography>Error: No email provided. Please register again.</Typography>;

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" align="center">Verify Email</Typography>
        <Typography variant="body2" align="center">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </Typography>

        {msg.text && <Alert severity={msg.type}>{msg.text}</Alert>}

        <TextField
          label="6-Digit Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 4 } }}
        />

        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={loading || code.length < 6}
        >
          {loading ? 'Verifying...' : 'Verify Account'}
        </Button>

        <Button variant="text" onClick={handleResend} disabled={loading}>
          Resend Code
        </Button>
      </Box>
    </Container>
  );
}
