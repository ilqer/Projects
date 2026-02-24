import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Button, Alert, CircularProgress, Tooltip,
  AppBar, Toolbar, CssBaseline
} from '@mui/material';
import { ArrowBack, Visibility, Delete, People, Assessment } from '@mui/icons-material';
import { researcherEvaluationService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const ResearcherEvaluationTasks = ({ embedded = false, studyIdProp = null }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studyId = studyIdProp || searchParams.get('studyId');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, [studyId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await researcherEvaluationService.getMyTasks();
      let allTasks = response.data || [];

      // Filter by studyId if provided
      if (studyId) {
        allTasks = allTasks.filter(task => task.studyId === parseInt(studyId));
      }

      setTasks(allTasks);
    } catch (err) {
      console.error('Error loading evaluation tasks:', err);
      setError('Failed to load evaluation tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this evaluation task? This action cannot be undone.')) {
      try {
        await researcherEvaluationService.deleteTask(taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'COMPLETED':
        return 'primary';
      case 'ARCHIVED':
        return 'error';
      default:
        return 'default';
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

  const content = (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {studyId ? 'Study Evaluation Tasks' : 'My Evaluation Tasks'}
          </Typography>
          {studyId && (
            <Typography variant="body2" color="text.secondary">
              Showing tasks for Study #{studyId}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          onClick={() => studyId ? navigate(`/researcher/studies/${studyId}/create-evaluation-task`) : navigate('/researcher/create-evaluation-task')}
        >
          Create New Task
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Evaluation Tasks Found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            You haven't created any evaluation tasks yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>Task Title</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Due Date</strong></TableCell>
                <TableCell align="center"><strong>Created</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                      {task.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDate(task.dueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(task.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/researcher/evaluation-tasks/${task.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Review Submissions">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => navigate(`/researcher/evaluation-tasks/${task.id}/submissions`)}
                        >
                          <Assessment />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Participants">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/researcher/evaluation-tasks/${task.id}/participants`)}
                        >
                          <People />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Task">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tasks.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Container>
  );

  // Return embedded version without AppTheme and AppBar
  if (embedded) {
    return <Box sx={{ mx: -3, mt: -2 }}>{content}</Box>;
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => studyId ? navigate(`/researcher/study/${studyId}`) : navigate('/dashboard')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {studyId ? 'Study Evaluation Tasks' : 'My Evaluation Tasks'}
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

export default ResearcherEvaluationTasks;
