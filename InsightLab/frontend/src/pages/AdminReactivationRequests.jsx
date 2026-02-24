import React, { useEffect, useState } from 'react';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import SideMenu from './components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';

const AdminReactivationRequests = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('Reactivation Requests');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.getReactivationRequests();
      setRequests(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      await userService.approveReactivation(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Approval failed');
    }
  };

  const reject = async (id) => {
    try {
      await userService.rejectReactivation(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Rejection failed');
    }
  };

  const handleTabChange = (newTab) => {
    if (newTab === 'Researcher Requests') {
      navigate('/admin/researcher-requests');
    } else if (newTab === 'Overview') {
      navigate('/dashboard');
    }
    setCurrentTab(newTab);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/dashboard?tab=Profile');
  };

  useEffect(() => {
    load();
  }, []);

  if (!user || user.role !== 'ADMIN') {
    return <div>Unauthorized</div>;
  }

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu currentTab={currentTab} onTabChange={handleTabChange} onLogout={handleLogout} onProfileClick={handleProfileClick} user={user} />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
            minHeight: '100vh',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header currentTab={currentTab} />
            <Container maxWidth="lg" sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: 800, maxWidth: '100%' }}>
                  <Paper sx={{ p: 3 }} elevation={3}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Pending Reactivation Requests
                    </Typography>
                    {error && (
                      <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>
                    )}
                    {loading ? (
                      <Box sx={{ p: 1 }}>Loading...</Box>
                    ) : requests.length === 0 ? (
                      <Box sx={{ p: 1 }}>No pending reactivation requests.</Box>
                    ) : (
                      <List disablePadding>
                        {requests.map((u, idx) => (
                          <React.Fragment key={u.id}>
                            <ListItem
                              secondaryAction={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button size="small" variant="outlined" color="error" onClick={() => reject(u.id)}>
                                    Reject
                                  </Button>
                                  <Button size="small" variant="contained" onClick={() => approve(u.id)}>
                                    Approve
                                  </Button>
                                </Box>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar>{(u.fullName || u.username || 'U').charAt(0).toUpperCase()}</Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {u.fullName || u.username}
                                    <Chip label="Deactivated" size="small" color="error" />
                                    {u.reactivationRejected && <Chip label="Previously Rejected" size="small" color="warning" />}
                                  </Box>
                                }
                                secondary={`${u.email} • ${u.username} • Role: ${u.role}`}
                              />
                            </ListItem>
                            {idx < requests.length - 1 && <Divider component="li" />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Paper>
                </Box>
              </Box>
            </Container>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default AdminReactivationRequests;