import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'ADMIN') {
    return <div>Unauthorized</div>;
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Admin Panel
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="md">
            <Paper sx={{ p: 3 }} elevation={3}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Admin Management
              </Typography>
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate('/admin/researcher-requests')}>
                    <ListItemIcon>
                      <PersonAddIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Researcher Requests" 
                      secondary="Review and approve researcher role requests"
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate('/admin/reactivation-requests')}>
                    <ListItemIcon>
                      <LockOpenIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Reactivation Requests" 
                      secondary="Review and approve account reactivation requests"
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate('/admin/users')}>
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="View All Users" 
                      secondary="See all registered users and manage accounts"
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </Paper>
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default AdminPanel;