// src/pages/researcher/AssignReviewers.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Snackbar,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import { userService, studyService, reviewerAssignmentService } from '../../services/api';

const AssignReviewers = ({ embedded = false, studyIdProp = null }) => {
  const navigate = useNavigate();
  const { studyId: studyIdParam } = useParams();
  const studyId = studyIdProp || studyIdParam;

  const [study, setStudy] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [alreadyAssignedIds, setAlreadyAssignedIds] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Filter/Tab states
  const [filterTab, setFilterTab] = useState(0); // 0: All, 1: Assigned, 2: Not Assigned
  const [searchQuery, setSearchQuery] = useState('');

  // Withdraw dialog
  const [withdrawDialog, setWithdrawDialog] = useState({ open: false, assignment: null });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [studyRes, usersRes, assignmentsRes] = await Promise.all([
        studyService.getStudyById(studyId),
        userService.getAllUsers(),
        reviewerAssignmentService.getAssignmentsByStudy(studyId),
      ]);

      setStudy(studyRes.data);

      const reviewerList = usersRes.data.filter(
        (u) => u.role === 'REVIEWER' && u.active
      );
      setReviewers(reviewerList);

      const assignmentList = assignmentsRes.data || [];
      setAssignments(assignmentList);
      
      const assignedIds = assignmentList.map((a) => a.reviewerId);
      setAlreadyAssignedIds(assignedIds);

      setSelectedReviewerIds((prev) =>
        prev.filter((id) => !assignedIds.includes(id))
      );
    } catch (err) {
      console.error('Error loading reviewers/study/assignments:', err);
      setError(
        err.response?.data?.message || 'Failed to load study or reviewers'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReviewer = (id) => {
    if (alreadyAssignedIds.includes(id)) return;

    setSelectedReviewerIds((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredReviewers = getFilteredReviewers();
    const selectableIds = filteredReviewers
      .filter((r) => !alreadyAssignedIds.includes(r.id))
      .map((r) => r.id);

    if (selectedReviewerIds.length === selectableIds.length) {
      setSelectedReviewerIds([]);
    } else {
      setSelectedReviewerIds(selectableIds);
    }
  };

  const handleSubmit = async () => {
    const reviewerIdsToSend = selectedReviewerIds.filter(
      (id) => !alreadyAssignedIds.includes(id)
    );

    if (reviewerIdsToSend.length === 0) {
      setError('Please select at least one new reviewer');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        studyId: Number(studyId),
        reviewerIds: reviewerIdsToSend,
      };

      const res = await reviewerAssignmentService.assignReviewersToStudy(payload);
      
      setSelectedReviewerIds([]);

      setSnackbar({
        open: true,
        message: res.data.message || 'Reviewers assigned successfully',
        severity: 'success',
      });

      await loadData();
    } catch (err) {
      console.error('Error assigning reviewers:', err);
      const msg = err.response?.data?.message || 'Failed to assign reviewers to study';
      setError(msg);
      setSnackbar({
        open: true,
        message: msg,
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWithdrawDialog = (assignment) => {
    setWithdrawDialog({ open: true, assignment });
  };

  const handleCloseWithdrawDialog = () => {
    setWithdrawDialog({ open: false, assignment: null });
  };

  const handleWithdrawAssignment = async () => {
    if (!withdrawDialog.assignment) return;

    try {
      await reviewerAssignmentService.deleteAssignment(withdrawDialog.assignment.id);
      
      setSnackbar({
        open: true,
        message: 'Reviewer assignment withdrawn successfully',
        severity: 'success',
      });

      handleCloseWithdrawDialog();
      await loadData();
    } catch (err) {
      console.error('Error withdrawing assignment:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to withdraw assignment',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const getFilteredReviewers = () => {
    let filtered = reviewers;

    // Tab filter
    if (filterTab === 1) {
      filtered = filtered.filter((r) => alreadyAssignedIds.includes(r.id));
    } else if (filterTab === 2) {
      filtered = filtered.filter((r) => !alreadyAssignedIds.includes(r.id));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.fullName?.toLowerCase().includes(query) ||
          r.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  if (loading) {
    const loadingContent = (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: embedded ? '200px' : '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );

    if (embedded) return loadingContent;
    return <AppTheme>{loadingContent}</AppTheme>;
  }

  if (!study) {
    const errorContent = (
      <Container maxWidth="md" sx={{ mt: embedded ? 2 : 8 }}>
        <Alert severity="error">
          {error || 'Study not found or failed to load'}
        </Alert>
        {!embedded && (
          <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
            Go Back
          </Button>
        )}
      </Container>
    );

    if (embedded) return errorContent;
    return <AppTheme>{errorContent}</AppTheme>;
  }

  const filteredReviewers = getFilteredReviewers();

  // Main content that can be rendered standalone or embedded
  const mainContent = (
    <>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Study info - only show in standalone mode */}
        {!embedded && (
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Study Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                <strong>Title:</strong> {study.title}
              </Typography>
              {study.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Description:</strong> {study.description}
                </Typography>
              )}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip label={study.status} size="small" />
                {study.maxParticipants && (
                  <Chip
                    label={`Max Participants: ${study.maxParticipants}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

              {/* Reviewer selection */}
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GroupIcon />
                      <Typography variant="h6" fontWeight={600}>
                        Reviewers ({filteredReviewers.length})
                      </Typography>
                    </Stack>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleSelectAll}
                    >
                      {(() => {
                        const selectableCount = filteredReviewers.filter(
                          (r) => !alreadyAssignedIds.includes(r.id)
                        ).length;
                        return selectedReviewerIds.length === selectableCount
                          ? 'Deselect All'
                          : 'Select All';
                      })()}
                    </Button>
                  </Stack>

                  {/* Tabs for filtering */}
                  <Tabs
                    value={filterTab}
                    onChange={(e, newValue) => setFilterTab(newValue)}
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab label={`All (${reviewers.length})`} />
                    <Tab 
                      label={`Assigned (${alreadyAssignedIds.length})`}
                      icon={<CheckCircleIcon fontSize="small" />}
                      iconPosition="start"
                    />
                    <Tab 
                      label={`Not Assigned (${reviewers.length - alreadyAssignedIds.length})`}
                      icon={<PersonAddIcon fontSize="small" />}
                      iconPosition="start"
                    />
                  </Tabs>

                  {/* Search bar */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search reviewers by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Divider sx={{ mb: 2 }} />

                  {reviewers.length === 0 ? (
                    <Alert severity="info">No active reviewers found</Alert>
                  ) : filteredReviewers.length === 0 ? (
                    <Alert severity="info">No reviewers match your filter</Alert>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{ maxHeight: 400, overflow: 'auto' }}
                    >
                      <List>
                        {filteredReviewers.map((reviewer) => {
                          const isAlreadyAssigned = alreadyAssignedIds.includes(reviewer.id);
                          const isSelected = selectedReviewerIds.includes(reviewer.id);
                          const assignment = assignments.find(a => a.reviewerId === reviewer.id);

                          return (
                            <ListItem
                              key={reviewer.id}
                              button={!isAlreadyAssigned}
                              onClick={() => handleToggleReviewer(reviewer.id)}
                              selected={isSelected}
                              secondaryAction={
                                isAlreadyAssigned && assignment && (
                                  <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenWithdrawDialog(assignment);
                                    }}
                                    color="error"
                                    size="small"
                                  >
                                    <PersonRemoveIcon />
                                  </IconButton>
                                )
                              }
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={isAlreadyAssigned || isSelected}
                                  disabled={isAlreadyAssigned}
                                  tabIndex={-1}
                                  disableRipple
                                />
                              </ListItemIcon>
                              <ListItemIcon>
                                <PersonIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Typography>{reviewer.fullName}</Typography>
                                    {isAlreadyAssigned && (
                                      <Chip
                                        size="small"
                                        label="Assigned"
                                        color="success"
                                        variant="outlined"
                                      />
                                    )}
                                  </Stack>
                                }
                                secondary={reviewer.email}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Paper>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={
                    submitting ? <CircularProgress size={20} /> : <SendIcon />
                  }
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    selectedReviewerIds.filter(
                      (id) => !alreadyAssignedIds.includes(id)
                    ).length === 0
                  }
                >
                  {submitting ? 'Assigning...' : `Assign ${selectedReviewerIds.length} Reviewer(s)`}
                </Button>
              </Stack>
            </Stack>

      {/* Withdraw Assignment Dialog */}
      <Dialog open={withdrawDialog.open} onClose={handleCloseWithdrawDialog}>
        <DialogTitle>Withdraw Reviewer Assignment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to withdraw the assignment for{' '}
            <strong>{withdrawDialog.assignment?.reviewerName}</strong>?
            <br />
            <br />
            This action will remove their access to review this study.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdrawDialog}>Cancel</Button>
          <Button onClick={handleWithdrawAssignment} color="error" variant="contained">
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );

  // Return embedded or standalone version
  if (embedded) {
    return mainContent;
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(-1)}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Assign Reviewers to Study
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="lg">
            {mainContent}
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default AssignReviewers;
