import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Search, CheckCircle, Cancel, PersonAdd, Refresh } from '@mui/icons-material';
import { userService } from '../../../services/api';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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
    role: '',
  });

  // ----------------------------
  // CSV Helpers
  // ----------------------------
  const toCsvValue = (v) => {
    if (v === null || v === undefined) return '""';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const downloadCsv = (filename, rows) => {
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const formatBackendDate = (iso) => {
    if (!iso) return null;

    // Backend timezone göndermiyorsa UTC varsay
    const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso);
    const date = new Date(hasTimezone ? iso : iso + 'Z');

    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
  };

  // Load Users
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await userService.getAllUsers();
      const nonAdmins = (res.data || []).filter((u) => u.role !== 'ADMIN');
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

  // Filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleExportUsersCsv = () => {
    const data = filteredUsers;

    const header = ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Status', 'Last Login', 'Joined'];

    const rows = data.map((u) => [
      toCsvValue(u.id),
      toCsvValue(u.username),
      toCsvValue(u.fullName),
      toCsvValue(u.email),
      toCsvValue(u.role),
      toCsvValue(u.active ? 'Active' : 'Inactive'),
      toCsvValue(u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : ''),
      toCsvValue(u.createdAt ? new Date(u.createdAt).toISOString() : ''),
    ]);

    downloadCsv(`users_${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  // ----------------------------
  // Actions
  // ----------------------------
  const handleApproveResearcher = async (userId) => {
    try {
      await userService.approveResearcher(userId);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectResearcher = async (userId) => {
    try {
      await userService.rejectResearcher(userId);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleApproveReactivation = async (userId) => {
    try {
      await userService.approveReactivation(userId);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to approve reactivation');
    }
  };

  const handleRejectReactivation = async (userId) => {
    try {
      await userService.rejectReactivation(userId);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reject reactivation');
    }
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

  const handleEdit = (u) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      newPassword: '',
      role: u.role,
    });
    setEditDialog(true);
  };

  const handleDelete = (u) => {
    setSelectedUser(u);
    setDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        newPassword: formData.newPassword || undefined,
        role: formData.role,
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

  // Requests
  const researcherRequests = users.filter((u) => u.researcherRequested && u.active);
  const reactivationRequests = users.filter((u) => u.reactivationRequested && !u.active);

  const getRoleBadgeColor = (role) => {
    const colors = { ADMIN: 'error', RESEARCHER: 'primary', REVIEWER: 'secondary', PARTICIPANT: 'success' };
    return colors[role] || 'default';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, roles, and access requests
        </Typography>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {researcherRequests.length > 0 && (
        <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'primary.light', bgcolor: 'primary.50' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.dark' }}>
              <PersonAdd sx={{ verticalAlign: 'middle', mr: 1 }} />
              Researcher Access Requests ({researcherRequests.length})
            </Typography>
            <Grid container spacing={2}>
              {researcherRequests.map((user) => (
                <Grid item xs={12} md={6} key={user.id}>
                  <Paper sx={{ p: 2, border: 1, borderColor: 'primary.light' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {user.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" startIcon={<CheckCircle />} onClick={() => handleApproveResearcher(user.id)}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<Cancel />} onClick={() => handleRejectResearcher(user.id)}>
                          Reject
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {reactivationRequests.length > 0 && (
        <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'warning.light', bgcolor: 'warning.50' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'warning.dark' }}>
              <Refresh sx={{ verticalAlign: 'middle', mr: 1 }} />
              Reactivation Requests ({reactivationRequests.length})
            </Typography>
            <Grid container spacing={2}>
              {reactivationRequests.map((user) => (
                <Grid item xs={12} md={6} key={user.id}>
                  <Paper sx={{ p: 2, border: 1, borderColor: 'warning.light' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {user.fullName || user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" startIcon={<CheckCircle />} onClick={() => handleApproveReactivation(user.id)}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<Cancel />} onClick={() => handleRejectReactivation(user.id)}>
                          Reject
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ flex: 1 }}
            />
            <TextField select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="RESEARCHER">Researcher</MenuItem>
              <MenuItem value="REVIEWER">Reviewer</MenuItem>
              <MenuItem value="PARTICIPANT">Participant</MenuItem>
            </TextField>
            <TextField select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>

            <Button variant="outlined" onClick={handleExportUsersCsv}>
              Export CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip label={user.role} color={getRoleBadgeColor(user.role)} size="small" />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Chip label={user.active ? 'Active' : 'Inactive'} color={user.active ? 'success' : 'default'} size="small" />
                          {user.researcherRequested && <Chip label="Researcher Request" color="primary" size="small" />}
                          {user.reactivationRequested && <Chip label="Reactivation Request" color="warning" size="small" />}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{formatBackendDate(user.lastLoginAt) || 'Not logged in yet'}</Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{formatBackendDate(user.createdAt) || 'N/A'}</Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          <FormControlLabel
                            control={<Switch checked={user.active} onChange={() => handleToggleStatus(user)} color="success" size="small" />}
                            label=""
                          />
                          <Button size="small" variant="outlined" onClick={() => handleEdit(user)}>
                            Edit
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(user)}>
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} fullWidth />
            <TextField label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
            <TextField label="Full Name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={formData.role} label="Role" onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
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
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedUser?.fullName || selectedUser?.username}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
