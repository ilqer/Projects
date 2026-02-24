// EditProfile.jsx
import React, { useMemo, useState } from 'react';
import { userService } from '../services/api';
import {
  Box, Button, Collapse, TextField, Typography, Alert, Stack, IconButton, InputAdornment, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';

function EditProfile({ user }) {
  const userId = user?.id;

  // Şifre değişimi UI kontrolü
  const [showPwd, setShowPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);         // success / error mesajı
  const [msgType, setMsgType] = useState('success'); // 'success' | 'error'

  const canSubmit = useMemo(() => {
    return currentPwd.length > 0 && newPwd.length >= 6 && newPwd === confirmPwd;
  }, [currentPwd, newPwd, confirmPwd]);

  const resetPwdState = () => {
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setShowCur(false);
    setShowNew(false);
  };

  const handleTogglePwd = () => {
    // aç-kapa
    const next = !showPwd;
    setShowPwd(next);
    setMsg(null);
    if (!next) resetPwdState(); // kapatırken temizle
  };

  const handleChangePassword = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setMsg(null);
    try {
      await userService.changePassword(userId, {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      setMsgType('success');
      setMsg('Password changed successfully.');
      handleTogglePwd(); // kapat ve temizle
    } catch (err) {
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to change password.';
      setMsgType('error');
      setMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* ... Mevcut profil alanların (email, full name vs.) KENDİ formun ... */}

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" alignItems="center" spacing={1}>
        <Lock fontSize="small" />
        <Typography variant="h6">Password</Typography>
      </Stack>

      <Box sx={{ mt: 1 }}>
        <Button variant={showPwd ? 'outlined' : 'contained'} onClick={handleTogglePwd}>
          {showPwd ? 'Cancel' : 'Change password'}
        </Button>
      </Box>

      <Collapse in={showPwd} unmountOnExit>
        <Stack spacing={2} sx={{ mt: 2, maxWidth: 520 }}>
          {msg && <Alert severity={msgType}>{msg}</Alert>}

          <TextField
            label="Current password"
            type={showCur ? 'text' : 'password'}
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCur((s) => !s)} edge="end">
                    {showCur ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="New password"
            type={showNew ? 'text' : 'password'}
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            helperText={newPwd && newPwd.length < 6 ? 'At least 6 characters' : ' '}
            error={!!newPwd && newPwd.length < 6}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew((s) => !s)} edge="end">
                    {showNew ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm new password"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            error={!!confirmPwd && confirmPwd !== newPwd}
            helperText={confirmPwd && confirmPwd !== newPwd ? 'Passwords do not match' : ' '}
            required
          />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Saving…' : 'Save new password'}
            </Button>
            <Button variant="text" onClick={handleTogglePwd} disabled={loading}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Collapse>
    </Box>
  );
}

export default EditProfile;
