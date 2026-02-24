import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline
} from '@mui/material';

import { ArrowBack, Visibility, PictureAsPdf, TableChart, Delete } from '@mui/icons-material';
import { researcherEvaluationService, studyService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const EvaluationTaskParticipants = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // From study branch
  const [availableParticipants, setAvailableParticipants] = useState([]);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [assignDueDate, setAssignDueDate] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [addingParticipants, setAddingParticipants] = useState(false);

  // From main branch
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [taskResponse, participantsResponse] = await Promise.all([
        researcherEvaluationService.getTask(id),
        researcherEvaluationService.getTaskParticipants(id)
      ]);

      const taskData = taskResponse.data;
      setTask(taskData);

      const assignmentData = participantsResponse.data || [];
      setAssignments(assignmentData);

      if (taskData?.studyId) {
        const enrollmentsResp = await studyService.getStudyEnrollments(taskData.studyId);
        const activeStatuses = new Set(['ENROLLED', 'IN_PROGRESS', 'COMPLETED']);
        const participantUsers = (enrollmentsResp.data || [])
          .filter((enrollment) => activeStatuses.has(enrollment.status))
          .map((enrollment) => {
            console.log('Participant level from API:', enrollment.participantLevel);
            return {
              id: enrollment.participantId,
              fullName: enrollment.participantName,
              email: enrollment.participantEmail,
              quizPassed: Boolean(enrollment.quizPassed),
              quizCompleted: Boolean(enrollment.quizCompleted),
              quizScore: enrollment.quizScore,
              participantLevel: enrollment.participantLevel,
            };
          });
        const assignedIds = new Set(assignmentData.map((a) => a.participantId));
        const available = participantUsers.filter((p) => !assignedIds.has(p.id));
        setAvailableParticipants(available);
      } else {
        setAvailableParticipants([]);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load participant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogError('');
    setSelectedParticipants([]);
    setAssignDueDate('');
    setParticipantDialogOpen(true);
  };

  const handleAddParticipants = async () => {
    if (selectedParticipants.length === 0) {
      setDialogError('Select at least one participant.');
      return;
    }

    const ineligibleSelection = selectedParticipants.some((id) => {
      const participant = availableParticipants.find((p) => p.id === id);
      return participant && !participant.quizPassed;
    });
    if (ineligibleSelection) {
      setDialogError('All selected participants must pass the study quiz before assignment.');
      return;
    }

    try {
      setAddingParticipants(true);
      await researcherEvaluationService.addTaskParticipants(id, {
        participantIds: selectedParticipants,
        dueDate: assignDueDate ? new Date(assignDueDate).toISOString() : null
      });

      setParticipantDialogOpen(false);
      setSelectedParticipants([]);
      setAssignDueDate('');

      await loadData();
    } catch (err) {
      console.error('Failed to add participants', err);
      setDialogError(err.response?.data?.message || 'Unable to add participants.');
    } finally {
      setAddingParticipants(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      const response = await researcherEvaluationService.exportTaskParticipantsAsPDF(id);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `task_participants_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const response = await researcherEvaluationService.exportTaskParticipantsAsExcel(id);

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `task_participants_${id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Failed to export Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleOpenDeleteDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedAssignment(null);
  };

  const handleDeleteParticipant = async () => {
    if (!selectedAssignment) return;

    try {
      setDeleting(true);
      await researcherEvaluationService.removeTaskParticipant(id, selectedAssignment.id);
      await loadData();
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Failed to remove participant', err);
      setError(err.response?.data?.message || 'Unable to remove participant.');
    } finally {
      setDeleting(false);
    }
  };

  const content = (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight={700}>Task Participants</Typography>
            {task && (
              <Chip
                label={task.status}
                color={task.status === 'ACTIVE' ? 'success' : task.status === 'DRAFT' ? 'default' : task.status === 'COMPLETED' ? 'primary' : 'default'}
                size="small"
              />
            )}
          </Box>
          {task && <Typography variant="body2" color="text.secondary">{task.title}</Typography>}
        </Box>

        <Stack direction="row" spacing={2}>
          {/* Study branch button */}
          <Button
            variant="contained"
            onClick={handleOpenDialog}
            disabled={availableParticipants.length === 0}
          >
            Add Participants
          </Button>

          {/* Main branch export buttons */}
          {assignments.length > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={exportingPDF ? <CircularProgress size={20} /> : <PictureAsPdf />}
                onClick={handleExportPDF}
                disabled={exportingPDF || exportingExcel}
                color="error"
              >
                {exportingPDF ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={exportingExcel ? <CircularProgress size={20} /> : <TableChart />}
                onClick={handleExportExcel}
                disabled={exportingPDF || exportingExcel}
                color="success"
              >
                {exportingExcel ? 'Exporting...' : 'Export Excel'}
              </Button>
            </>
          )}

          <Button variant="outlined" onClick={() => task?.studyId ? navigate(`/researcher/study/${task.studyId}/evaluation-tasks`) : navigate('/researcher/evaluation-tasks')}>
            Back to All Tasks
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Table */}
      {assignments.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No Participants Assigned</Typography>
          <Typography variant="body2" color="text.secondary">
            This task has no participants assigned yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>Participant</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Assigned</strong></TableCell>
                <TableCell align="center"><strong>Due Date</strong></TableCell>
                <TableCell align="center"><strong>Completed</strong></TableCell>
                <TableCell align="center"><strong>Progress</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{assignment.participantName}</Typography>
                  </TableCell>
                  <TableCell>{assignment.participantEmail}</TableCell>

                  <TableCell align="center">
                    <Chip
                      label={assignment.status}
                      size="small"
                      color={getStatusColor(assignment.status)}
                    />
                  </TableCell>

                  <TableCell align="center">{formatDate(assignment.assignedAt)}</TableCell>
                  <TableCell align="center">{formatDate(assignment.dueDate)}</TableCell>
                  <TableCell align="center">{formatDate(assignment.completedAt)}</TableCell>

                  <TableCell align="center">
                    {assignment.completedCount || 0} / {assignment.totalCount || 0}
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleOpenDeleteDialog(assignment)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Participants Dialog */}
      <Dialog open={participantDialogOpen} onClose={() => setParticipantDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Participants</DialogTitle>
        <DialogContent dividers>
          {availableParticipants.length === 0 ? (
            <Typography>No available participants.</Typography>
          ) : (
            <Stack spacing={2}>
              {availableParticipants.some((p) => !p.quizPassed) && (
                <Alert severity="warning">
                  Participants must complete and pass the study quiz before they can start evaluation tasks.
                </Alert>
              )}
              <FormControl fullWidth>
                <InputLabel>Select Participants</InputLabel>
                <Select
                  multiple
                  label="Select Participants"
                  value={selectedParticipants}
                  onChange={(e) => {
                    setDialogError('');
                    const { value } = e.target;
                    const parsed = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',') : []);
                    const normalized = parsed.map((val) => (typeof val === 'number' ? val : Number(val)));
                    setSelectedParticipants(normalized);
                  }}
                  renderValue={(selected) =>
                    selected
                      .map((id) => {
                        const p = availableParticipants.find((x) => x.id === id);
                        return p?.fullName || p?.email;
                      })
                      .join(', ')
                  }
                >
                  {availableParticipants.map((p) => (
                    <MenuItem key={p.id} value={p.id} disabled={!p.quizPassed}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ width: '100%' }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {p.fullName || p.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            size="small"
                            color={
                              p.quizPassed
                                ? 'success'
                                : p.quizCompleted
                                  ? 'error'
                                  : 'warning'
                            }
                            label={
                              p.quizPassed
                                ? 'Quiz Passed'
                                : p.quizCompleted
                                  ? `Failed ${p.quizScore ? p.quizScore.toFixed(1) : '0'}%`
                                  : 'Quiz Pending'
                            }
                          />
                          {p.quizPassed && (
                            <Chip
                              size="small"
                              variant="outlined"
                              color={
                                p.participantLevel === 'ADVANCED' ? 'success' :
                                p.participantLevel === 'INTERMEDIATE' ? 'warning' : 'info'
                              }
                              label={p.participantLevel ?? (p.quizPassed ? 'BEGINNER' : null)}
                            />
                          )}
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Only participants who passed the required study quiz can be added to this evaluation task.
                </FormHelperText>
              </FormControl>

              <TextField
                label="Due Date"
                type="datetime-local"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {dialogError && <Alert severity="error">{dialogError}</Alert>}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setParticipantDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddParticipants}
            disabled={availableParticipants.length === 0 || addingParticipants}
          >
            {addingParticipants ? 'Adding...' : 'Add Participants'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Remove Participant from Task?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{selectedAssignment?.participantName}</strong> from this task?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action will permanently delete all their submissions, answers, annotations, and scores. This cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteParticipant}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Removing...' : 'Remove Participant'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(`/researcher/evaluation-tasks/${id}`)} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Task Participants
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => task?.studyId ? navigate(`/researcher/study/${task.studyId}/evaluation-tasks`) : navigate('/researcher/evaluation-tasks')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Task Participants
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

export default EvaluationTaskParticipants;
