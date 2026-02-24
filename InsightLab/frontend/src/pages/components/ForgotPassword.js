import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import api from '../../services/api';

function ForgotPassword({ open, handleClose }) {
  const [step, setStep] = React.useState(1); // 1: Enter email, 2: Enter code & new password
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const handleCloseDialog = () => {
    resetForm();
    handleClose();
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess('Password reset code sent to your email!');
      setStep(2);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      setSuccess('Password reset successfully! You can now sign in with your new password.');
      setTimeout(() => {
        handleCloseDialog();
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { backgroundImage: 'none' },
        },
      }}
    >
      <DialogTitle>
        {step === 1 ? 'Reset Password' : 'Enter Reset Code'}
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {step === 1 ? (
          <>
            <DialogContentText>
              Enter your account&apos;s email address, and we&apos;ll send you a code to reset your password.
            </DialogContentText>
            <form onSubmit={handleSendCode}>
              <OutlinedInput
                autoFocus
                required
                margin="dense"
                id="email"
                name="email"
                placeholder="Email address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </form>
          </>
        ) : (
          <>
            <DialogContentText>
              Enter the 6-digit code sent to your email and choose a new password.
            </DialogContentText>
            <form onSubmit={handleResetPassword}>
              <TextField
                autoFocus
                required
                margin="dense"
                label="Reset Code"
                placeholder="Enter 6-digit code"
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputProps={{ maxLength: 6 }}
              />
              <TextField
                required
                margin="dense"
                label="New Password"
                type="password"
                placeholder="Enter new password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mt: 2 }}
              />
              <TextField
                required
                margin="dense"
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mt: 2 }}
              />
            </form>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleCloseDialog} disabled={loading}>
          Cancel
        </Button>
        {step === 1 ? (
          <Button
            variant="contained"
            onClick={handleSendCode}
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : 'Send Code'}
          </Button>
        ) : (
          <>
            <Button onClick={() => setStep(1)} disabled={loading}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading || !code || !newPassword || !confirmPassword}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
