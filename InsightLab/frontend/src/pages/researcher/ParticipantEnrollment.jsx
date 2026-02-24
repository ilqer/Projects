import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Grid, Card, CardContent, Chip, LinearProgress, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Stack, Divider, TextField, InputAdornment, MenuItem,
  Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Autocomplete, Switch, FormControlLabel, Tooltip,
  Menu, ListItemIcon, ListItemText
} from '@mui/material';
import {
  People as PeopleIcon, CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon, Cancel as CancelIcon,
  Search as SearchIcon, FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon, Email as EmailIcon, Add as AddIcon,
  Delete as DeleteIcon, Refresh as RefreshIcon, MoreVert as MoreVertIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { studyService } from '../../services/api';

const ParticipantEnrollment = ({ embedded = false, studyIdProp = null }) => {
  const navigate = useNavigate();
  const { studyId: studyIdParam } = useParams();
  const studyId = studyIdProp || studyIdParam;
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState(null);
  const [availableParticipants, setAvailableParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [deletingParticipant, setDeletingParticipant] = useState(false);
  const [addError, setAddError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [enrollmentToUpdate, setEnrollmentToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load study details
      const studyResponse = await studyService.getStudyById(studyId);
      setStudy(studyResponse.data);
      
      // Load enrollments
      const enrollmentsResponse = await studyService.getStudyEnrollments(studyId);
      setEnrollments(enrollmentsResponse.data);
      
      // Load stats
      const statsResponse = await studyService.getStudyEnrollmentStats(studyId);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Error loading enrollment data:', err);
      setError(err.response?.data?.message || 'Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const refreshEnrollmentsAndStats = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLastRefresh(new Date());
      }
      // Only refresh enrollments and stats, not the study details
      const [enrollmentsResponse, statsResponse] = await Promise.all([
        studyService.getStudyEnrollments(studyId),
        studyService.getStudyEnrollmentStats(studyId)
      ]);
      
      setEnrollments(enrollmentsResponse.data);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Error refreshing data:', err);
      // Fallback to full reload if partial refresh fails
      await loadData();
    }
  }, [studyId]);

  useEffect(() => {
    if (studyId) {
      loadData();
    }
  }, [studyId]);

  // Auto-refresh every 10 seconds when autoRefresh is enabled
  useEffect(() => {
    if (!studyId || !autoRefresh) return;

    const intervalId = setInterval(() => {
      refreshEnrollmentsAndStats(true); // Silent refresh (don't update lastRefresh timestamp in the function)
      setLastRefresh(new Date());
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [studyId, autoRefresh, refreshEnrollmentsAndStats]);

  const loadAvailableParticipants = async () => {
    try {
      const response = await studyService.getAvailableParticipants(studyId);
      setAvailableParticipants(response.data);
    } catch (err) {
      console.error('Error loading available participants:', err);
      setAddError('Failed to load available participants');
    }
  };

  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
    setSelectedParticipant(null);
    setAddError('');
    loadAvailableParticipants();
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setSelectedParticipant(null);
    setAddError('');
  };

  const handleParticipantSelect = () => {
    if (!selectedParticipant) {
      setAddError('Please select a participant');
      return;
    }
    setAddDialogOpen(false);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedParticipant(null);
  };

  const handleAddParticipant = async () => {
    try {
      setAddingParticipant(true);
      setAddError('');
      
      await studyService.enrollParticipant(studyId, selectedParticipant.id);
      
      // Refresh enrollments and stats dynamically
      await refreshEnrollmentsAndStats(false);
      
      handleCloseConfirmDialog();
    } catch (err) {
      console.error('Error adding participant:', err);
      setAddError(err.response?.data?.message || 'Failed to add participant');
      setConfirmDialogOpen(false);
      setAddDialogOpen(true);
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleOpenDeleteDialog = (enrollment) => {
    setEnrollmentToDelete(enrollment);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setEnrollmentToDelete(null);
  };

  const handleDeleteParticipant = async () => {
    if (!enrollmentToDelete) return;

    try {
      setDeletingParticipant(true);
      
      await studyService.unenrollParticipant(studyId, enrollmentToDelete.id);
      
      // Refresh enrollments and stats dynamically
      await refreshEnrollmentsAndStats(false);
      
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting participant:', err);
      setError(err.response?.data?.message || 'Failed to remove participant');
      handleCloseDeleteDialog();
    } finally {
      setDeletingParticipant(false);
    }
  };

  const handleOpenStatusMenu = (event, enrollment) => {
    event.stopPropagation();
    console.log('Opening status menu for enrollment:', enrollment);
    setStatusMenuAnchor(event.currentTarget);
    setEnrollmentToUpdate(enrollment);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    // Don't clear enrollmentToUpdate - it's needed for the dialog
  };

  const handleStatusOptionClick = (status) => {
    console.log('Status option clicked:', status, 'Current enrollmentToUpdate:', enrollmentToUpdate);
    if (!enrollmentToUpdate) {
      console.error('No enrollment selected when trying to update status');
      setError('No enrollment selected. Please try again.');
      return;
    }
    setNewStatus(status);
    setStatusMenuAnchor(null); // Close menu without clearing enrollmentToUpdate
    // Open dialog immediately
    setStatusUpdateDialogOpen(true);
  };
  
  const handleMenuClose = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setStatusMenuAnchor(null);
    // Don't clear enrollmentToUpdate here - we might need it for the dialog
    // Only clear if dialog is not opening
    if (!statusUpdateDialogOpen) {
      setEnrollmentToUpdate(null);
    }
  };

  const handleCloseStatusUpdateDialog = () => {
    setStatusUpdateDialogOpen(false);
    setEnrollmentToUpdate(null);
    setNewStatus('');
    setError(''); // Clear any errors when closing dialog
  };

  const handleUpdateStatus = async () => {
    console.log('handleUpdateStatus called', { enrollmentToUpdate, newStatus, studyId });
    
    if (!enrollmentToUpdate || !newStatus) {
      console.error('Missing enrollment or status:', { enrollmentToUpdate, newStatus });
      setError('Missing enrollment or status information. Please try again.');
      return;
    }

    if (!enrollmentToUpdate.id) {
      console.error('Missing enrollment ID:', enrollmentToUpdate);
      setError('Missing enrollment ID. Please try again.');
      return;
    }

    try {
      setUpdatingStatus(true);
      setError('');
      
      console.log('Updating enrollment status:', {
        studyId,
        enrollmentId: enrollmentToUpdate.id,
        status: newStatus,
        enrollment: enrollmentToUpdate
      });
      
      const response = await studyService.updateEnrollmentStatus(studyId, enrollmentToUpdate.id, newStatus);
      console.log('Update successful:', response);
      
      // Refresh enrollments and stats dynamically
      await refreshEnrollmentsAndStats(false);
      
      handleCloseStatusUpdateDialog();
    } catch (err) {
      console.error('Error updating enrollment status:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        responseData: err.response?.data,
        status: err.response?.status
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update enrollment status';
      setError(errorMessage);
      // Don't close dialog on error so user can see the error message
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'ENROLLED':
        return 'primary';
      case 'INVITED':
        return 'warning';
      case 'DROPPED':
        return 'error';
      case 'DECLINED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon />;
      case 'IN_PROGRESS':
        return <TrendingUpIcon />;
      case 'ENROLLED':
        return <PeopleIcon />;
      case 'INVITED':
        return <ScheduleIcon />;
      case 'DROPPED':
        return <CancelIcon />;
      case 'DECLINED':
        return <CancelIcon />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = 
      !searchQuery ||
      enrollment.participantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.participantEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.participantUsername?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Header for embedded mode
  const embeddedHeader = (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end" sx={{ mb: 2 }}>
      {lastRefresh && (
        <Typography variant="caption" color="text.secondary">
          Updated {lastRefresh.toLocaleTimeString()}
        </Typography>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={autoRefresh}
            onChange={(e) => {
              setAutoRefresh(e.target.checked);
              if (e.target.checked) setLastRefresh(new Date());
            }}
            size="small"
          />
        }
        label={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <RefreshIcon fontSize="small" />
            <Typography variant="caption">Auto</Typography>
          </Stack>
        }
      />
      <Tooltip title="Refresh now">
        <IconButton
          size="small"
          onClick={() => {
            refreshEnrollmentsAndStats();
            setLastRefresh(new Date());
          }}
          disabled={loading}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  // Main content that can be embedded or standalone
  const mainContent = (
    <Container maxWidth="xl" sx={{ py: embedded ? 0 : 0 }}>
      {embedded && embeddedHeader}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : (
              <>
                {/* Study Header */}
                {study && (
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {study.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {study.description}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Chip 
                        label={study.status} 
                        color={study.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                      {study.maxParticipants && (
                        <Chip 
                          label={`Max: ${study.maxParticipants} participants`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Paper>
                )}

                {/* Statistics Cards */}
                {stats && (
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PeopleIcon color="primary" />
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stats.totalEnrollments}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Total Enrollments
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <ScheduleIcon color="warning" />
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stats.invited}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Invited
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PeopleIcon color="primary" />
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stats.enrolled}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Enrolled
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TrendingUpIcon color="info" />
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stats.inProgress}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                In Progress
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircleIcon color="success" />
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stats.completed}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Completed
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                    {stats.maxParticipants && (
                      <Grid item xs={12}>
                        <Card>
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                Enrollment Capacity
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {stats.totalEnrollments} / {stats.maxParticipants}
                              </Typography>
                            </Stack>
                            <LinearProgress 
                              variant="determinate" 
                              value={(stats.totalEnrollments / stats.maxParticipants) * 100}
                              sx={{ mt: 1, height: 8, borderRadius: 1 }}
                              color={stats.remainingSlots > 0 ? 'primary' : 'error'}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              {stats.remainingSlots > 0 
                                ? `${stats.remainingSlots} slots remaining`
                                : 'Study is full'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Filters and Add Button */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by name, email, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          label="Status"
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <MenuItem value="ALL">All Statuses</MenuItem>
                          <MenuItem value="INVITED">Invited</MenuItem>
                          <MenuItem value="ENROLLED">Enrolled</MenuItem>
                          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                          <MenuItem value="COMPLETED">Completed</MenuItem>
                          <MenuItem value="DROPPED">Dropped</MenuItem>
                          <MenuItem value="DECLINED">Declined</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {filteredEnrollments.length} of {enrollments.length} participants
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddDialog}
                        disabled={stats && stats.maxParticipants && stats.totalEnrollments >= stats.maxParticipants}
                      >
                        Add Participant
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Enrollments Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Participant</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Progress</strong></TableCell>
                        <TableCell><strong>Enrolled At</strong></TableCell>
                        <TableCell><strong>Completed At</strong></TableCell>
                        <TableCell><strong>Days Remaining</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEnrollments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No participants found matching your criteria
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {enrollment.participantName || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {enrollment.participantEmail}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  @{enrollment.participantUsername}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(enrollment.status)}
                                label={enrollment.status.replace('_', ' ')}
                                color={getStatusColor(enrollment.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ minWidth: 100 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={enrollment.progress || 0}
                                  sx={{ height: 8, borderRadius: 1, mb: 0.5 }}
                                  color={enrollment.progress === 100 ? 'success' : 'primary'}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {enrollment.progress || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(enrollment.enrolledAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {enrollment.completedAt ? formatDate(enrollment.completedAt) : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {enrollment.daysRemaining !== null && enrollment.daysRemaining !== undefined
                                  ? enrollment.daysRemaining > 0
                                    ? `${enrollment.daysRemaining} days`
                                    : 'Ended'
                                  : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Update Status">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleOpenStatusMenu(e, enrollment)}
                                      disabled={updatingStatus}
                                      aria-label="Update status"
                                    >
                                      <MoreVertIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Remove Participant">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleOpenDeleteDialog(enrollment)}
                                      disabled={deletingParticipant}
                                      aria-label="Remove participant"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Add Participant Dialog */}
                <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
                  <DialogTitle>Add Participant to Study</DialogTitle>
                  <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                      {addError && (
                        <Alert severity="error">{addError}</Alert>
                      )}
                      
                      <Autocomplete
                        options={availableParticipants}
                        getOptionLabel={(option) => `${option.fullName} (${option.email})`}
                        value={selectedParticipant}
                        onChange={(event, newValue) => setSelectedParticipant(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Participant"
                            placeholder="Search by name or email..."
                            required
                          />
                        )}
                        renderOption={(props, option) => (
                          <Box component="li" {...props}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {option.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.email} • @{option.username}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        noOptionsText="No available participants"
                      />
                    </Stack>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseAddDialog} disabled={addingParticipant}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleParticipantSelect}
                      variant="contained"
                      disabled={!selectedParticipant || addingParticipant}
                      startIcon={<AddIcon />}
                    >
                      Next
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Confirm Add Dialog */}
                <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog} maxWidth="sm" fullWidth>
                  <DialogTitle>Confirm Add Participant</DialogTitle>
                  <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {selectedParticipant && (
                        <>
                          <Alert severity="warning">
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                              Are you sure you want to add this participant to the study?
                            </Typography>
                            <Typography variant="body2">
                              <strong>Participant:</strong> {selectedParticipant.fullName}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Email:</strong> {selectedParticipant.email}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Username:</strong> @{selectedParticipant.username}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Study:</strong> {study?.title}
                            </Typography>
                          </Alert>
                        </>
                      )}
                    </Stack>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} disabled={addingParticipant}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddParticipant}
                      variant="contained"
                      disabled={addingParticipant}
                      startIcon={addingParticipant ? <CircularProgress size={20} /> : <AddIcon />}
                      color="primary"
                    >
                      {addingParticipant ? 'Adding...' : 'Yes, Add Participant'}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Delete Participant Dialog */}
                <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
                  <DialogTitle>Remove Participant from Study</DialogTitle>
                  <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {enrollmentToDelete && (
                        <Alert severity="error">
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                            Are you sure you want to remove this participant from the study?
                          </Typography>
                          <Typography variant="body2">
                            <strong>Participant:</strong> {enrollmentToDelete.participantName}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Email:</strong> {enrollmentToDelete.participantEmail}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Username:</strong> @{enrollmentToDelete.participantUsername}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Study:</strong> {study?.title}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                            This action cannot be undone.
                          </Typography>
                        </Alert>
                      )}
                    </Stack>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} disabled={deletingParticipant}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteParticipant}
                      variant="contained"
                      disabled={deletingParticipant}
                      startIcon={deletingParticipant ? <CircularProgress size={20} /> : <DeleteIcon />}
                      color="error"
                    >
                      {deletingParticipant ? 'Removing...' : 'Yes, Remove Participant'}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Status Update Menu */}
                <Menu
                  anchorEl={statusMenuAnchor}
                  open={Boolean(statusMenuAnchor)}
                  onClose={handleMenuClose}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MenuItem 
                    onClick={() => handleStatusOptionClick('DROPPED')}
                    disabled={enrollmentToUpdate?.status === 'DROPPED'}
                  >
                    <ListItemIcon>
                      <CancelIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Mark as Dropped" />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleStatusOptionClick('COMPLETED')}
                    disabled={enrollmentToUpdate?.status === 'COMPLETED'}
                  >
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Mark as Completed" />
                  </MenuItem>
                </Menu>

                {/* Update Status Confirmation Dialog */}
                <Dialog open={statusUpdateDialogOpen} onClose={handleCloseStatusUpdateDialog} maxWidth="sm" fullWidth>
                  <DialogTitle>Update Enrollment Status</DialogTitle>
                  <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                          {error}
                        </Alert>
                      )}
                      {enrollmentToUpdate ? (
                        <>
                          <Alert severity="info">
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                              Are you sure you want to update this participant's enrollment status?
                            </Typography>
                            <Typography variant="body2">
                              <strong>Participant:</strong> {enrollmentToUpdate.participantName || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Email:</strong> {enrollmentToUpdate.participantEmail || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Enrollment ID:</strong> {enrollmentToUpdate.id || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Current Status:</strong> {enrollmentToUpdate.status?.replace(/_/g, ' ') || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>New Status:</strong> {newStatus?.replace(/_/g, ' ') || 'N/A'}
                            </Typography>
                          </Alert>
                        </>
                      ) : (
                        <Alert severity="warning">
                          <Typography variant="body2">
                            Enrollment information is missing. Please try again.
                          </Typography>
                        </Alert>
                      )}
                    </Stack>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseStatusUpdateDialog} disabled={updatingStatus}>
                      Cancel
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Update Status button clicked');
                        handleUpdateStatus();
                      }}
                      variant="contained"
                      disabled={updatingStatus || !enrollmentToUpdate || !newStatus}
                      startIcon={updatingStatus ? <CircularProgress size={20} /> : <FlagIcon />}
                      color="primary"
                      type="button"
                    >
                      {updatingStatus ? 'Updating...' : 'Update Status'}
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
    </Container>
  );

  // Return embedded version without AppTheme and AppBar
  if (embedded) {
    return mainContent;
  }

  // Return standalone version with AppTheme and AppBar
  return (
    <AppTheme>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Participant Enrollment & Progress
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mr: 2 }}>
              {lastRefresh && (
                <Tooltip title={`Last updated: ${lastRefresh.toLocaleTimeString()}`}>
                  <Typography variant="caption" color="text.secondary">
                    Updated {lastRefresh.toLocaleTimeString()}
                  </Typography>
                </Tooltip>
              )}
              <Tooltip title={autoRefresh ? "Auto-refresh enabled (10s)" : "Auto-refresh disabled"}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => {
                        setAutoRefresh(e.target.checked);
                        if (e.target.checked) setLastRefresh(new Date());
                      }}
                      size="small"
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <RefreshIcon fontSize="small" />
                      <Typography variant="caption">Auto</Typography>
                    </Stack>
                  }
                />
              </Tooltip>
              <Tooltip title="Refresh now">
                <IconButton
                  size="small"
                  onClick={() => {
                    refreshEnrollmentsAndStats();
                    setLastRefresh(new Date());
                  }}
                  disabled={loading}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          {mainContent}
        </Box>
      </Box>
    </AppTheme>
  );
};

export default ParticipantEnrollment;
