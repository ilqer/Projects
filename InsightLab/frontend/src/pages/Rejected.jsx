import React from 'react';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const Rejected = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Request Rejected
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            p: 3,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : theme.palette.background.default,
            minHeight: '100vh',
          })}
        >
          <Toolbar />
          <Container maxWidth="sm">
            <Paper sx={{ p: 3 }} elevation={3}>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Researcher Access Request Rejected
              </Typography>
              <Typography sx={{ mb: 2 }}>
                {user?.fullName ? `${user.fullName}, ` : ''}
                unfortunately, your researcher access request was rejected by the admin.
              </Typography>
              <Typography sx={{ mb: 3 }}>
                If you believe this is a mistake or you have additional information, please contact support or submit a new request later.
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleLogout}>
                Log out
              </Button>
            </Paper>
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default Rejected;


