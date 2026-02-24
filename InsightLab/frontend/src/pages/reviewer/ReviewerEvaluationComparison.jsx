import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  CssBaseline,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Toolbar,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { reviewerEvaluationService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const ReviewerEvaluationComparison = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const loadTasks = async () => {
    try {
      setInitialLoading(true);
      const response = await reviewerEvaluationService.getDashboard(studyId);
      setTasks(response.data?.filterOptions?.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks for comparison', err);
      setError(err.response?.data?.message || 'Unable to load tasks.');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadComparison = async (taskId) => {
    if (!taskId) {
      setComparison(null);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await reviewerEvaluationService.getComparison(studyId, taskId);
      setComparison(response.data);
    } catch (err) {
      console.error('Failed to load comparison data', err);
      setError(err.response?.data?.message || 'Unable to load comparison information.');
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (value) => {
    setSelectedTask(value);
    loadComparison(value);
  };

  if (initialLoading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <CssBaseline />
          <AppBar
            position="fixed"
            sx={{
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
            }}
            elevation={0}
          >
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                  Evaluation Comparison
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  Select a task to compare participant evaluations.
                </Typography>
              </Box>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              minHeight: '100vh',
              pt: 3,
              pb: 6,
              px: 3,
            }}
          >
            <Toolbar />
            <Container maxWidth="xl">
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            </Container>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  const content = (
    <Container maxWidth="xl">

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Task</InputLabel>
              <Select
                label="Select Task"
                value={selectedTask}
                onChange={(e) => handleTaskChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>Choose a task</em>
                </MenuItem>
                {tasks.map((task) => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && comparison && (
        <Box sx={{ mt: 3 }}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Task: {comparison.taskTitle}{' '}
              <Typography component="span" variant="body2" color="text.secondary">
                · {comparison.artifactType}
              </Typography>
            </Typography>
          </Paper>

          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Participant</strong></TableCell>
                  <TableCell><strong>Submitted</strong></TableCell>
                  <TableCell><strong>Time Spent</strong></TableCell>
                  <TableCell><strong>Annotations</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Quality</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(comparison.rows || []).map((row) => (
                  <TableRow key={row.assignmentId}>
                    <TableCell>{row.participantName}</TableCell>
                    <TableCell>{formatDateTime(row.submittedAt)}</TableCell>
                    <TableCell>{formatDuration(row.timeSpentSeconds)}</TableCell>
                    <TableCell>{row.annotationCount || 0}</TableCell>
                    <TableCell>
                      {row.reviewerStatus ? (
                        <Chip
                          label={row.reviewerStatus}
                          color={
                            row.reviewerStatus === 'VALID'
                              ? 'success'
                              : row.reviewerStatus === 'SUSPICIOUS'
                                ? 'warning'
                                : 'default'
                          }
                          size="small"
                        />
                      ) : (
                        <Chip label="UNREVIEWED" size="small" />
                      )}
                    </TableCell>
                    <TableCell>{row.reviewerQualityScore || '—'}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          navigate(`/reviewer/studies/${studyId}/evaluations/${row.assignmentId}`)
                        }
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={2}>
            {(comparison.rows || []).map((row) => (
              <Accordion key={`detail-${row.assignmentId}`} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {row.participantName} — Submission Snapshot
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {row.submissionData ? (
                    <Paper
                      variant="outlined"
                      sx={{ 
                        p: 2, 
                        bgcolor: 'background.default', 
                        maxHeight: 320, 
                        overflow: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2
                      }}
                    >
                      <Typography
                        component="pre"
                        sx={{ fontFamily: 'monospace', fontSize: '0.85rem', mb: 0 }}
                      >
                        {JSON.stringify(row.submissionData, null, 2)}
                      </Typography>
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Submission data is not available.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      )}
    </Container>
  );

  return (
    <AppTheme>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
          elevation={0}
        >
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
              Evaluation Comparison
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: '100vh',
            pt: 3,
            pb: 6,
            px: 3,
          }}
        >
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining.toString().padStart(2, '0')}s`;
};

export default ReviewerEvaluationComparison;
