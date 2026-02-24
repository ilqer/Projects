import React, { useEffect, useState } from 'react';
import { userService } from '../services/api';
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
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    newPassword: '',
    role: ''
  });

  const loadUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      const nonAdmins = res.data.filter(u => u.role !== 'ADMIN');
      setUsers(nonAdmins);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (u) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      newPassword: '',
      role: u.role
    });
    setEditDialog(true);
  };

  const handleDelete = (u) => {
    setSelectedUser(u);
    setDeleteDialog(true);
  };

  const handleToggleStatus = async (u) => {
    const action = u.active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${u.fullName || u.username}'s account?`)) {
      try {
        await userService.adminToggleUserStatus(u.id, !u.active);
        loadUsers();
      } catch (e) {
        setError(e.response?.data?.message || `Failed to ${action} user`);
      }
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        newPassword: formData.newPassword || undefined,
        role: formData.role
      };
      await userService.adminUpdateUser(selectedUser.id, updateData);
      setEditDialog(false);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update user');
    }
  };

  const confirmDelete = async () => {
    try {
      await userService.deleteUser(selectedUser.id);
      setDeleteDialog(false);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return <div>Unauthorized</div>;
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              All Users
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="lg">
            <Paper sx={{ p: 3 }} elevation={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Registered Users ({users.length})
              </Typography>
              {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
              {loading ? (
                <Box sx={{ p: 2 }}>Loading...</Box>
              ) : users.length === 0 ? (
                <Box sx={{ p: 2 }}>No users found.</Box>
              ) : (
                <List disablePadding>
                  {users.map((u, idx) => (
                    <React.Fragment key={u.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>{(u.fullName || u.username || 'U').charAt(0).toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {u.fullName || u.username}
                              <Chip 
                                label={u.role} 
                                size="small" 
                                color={
                                  u.role === 'RESEARCHER' ? 'primary' : 
                                  u.role === 'REVIEWER' ? 'secondary' : 
                                  u.role === 'PARTICIPANT' ? 'default' : 
                                  'primary'
                                }
                                sx={u.role === 'PARTICIPANT' ? { bgcolor: 'success.main', color: 'white' } : {}}
                              />
                              {!u.active && <Chip label="Deactivated" size="small" color="error" />}
                              {u.active && u.reactivationRejected && <Chip label="Reactivation Rejected" size="small" color="warning" />}
                            </Box>
                          }
                          secondary={`${u.email} • ${u.username} • Joined: ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}`}
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={u.active}
                                onChange={() => handleToggleStatus(u)}
                                color="success"
                              />
                            }
                            label={u.active ? 'Active' : 'Inactive'}
                            labelPlacement="start"
                          />
                          <Button size="small" variant="outlined" onClick={() => handleEdit(u)}>Edit</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(u)}>Delete</Button>
                        </Stack>
                      </ListItem>
                      {idx < users.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Container>
        </Box>
      </Box>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="PARTICIPANT">Participant</MenuItem>
                <MenuItem value="RESEARCHER">Researcher</MenuItem>
                <MenuItem value="REVIEWER">Reviewer</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="New Password (leave empty to keep current)"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete {selectedUser?.fullName || selectedUser?.username}? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
};

export default AdminUsers;