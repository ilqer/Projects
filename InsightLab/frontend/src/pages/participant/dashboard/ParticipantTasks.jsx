import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent,
  Grid, Chip, Stack, Alert, CircularProgress, Divider, Button,
  Pagination, TextField, InputAdornment, Tabs, Tab, Paper, Skeleton,
  useTheme, alpha
} from '@mui/material';
import {
  Assignment as AssignmentIcon, ArrowForward as ArrowForwardIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon, PlayArrow as PlayArrowIcon,
  Description as DescriptionIcon, Search as SearchIcon
} from '@mui/icons-material';
import { evaluationService } from '../../../services/api';

const ParticipantTasks = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    loadTasks();
  }, [page, pageSize, activeTab]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await evaluationService.getMyTasks(page, pageSize, activeTab);
      setTasks(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error('Error loading evaluation tasks:', err);
      setError('Failed to load evaluation tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeLabel = (taskTypeName) => {
    if (!taskTypeName) return 'N/A';
    return taskTypeName;
  };

  const getTaskTypeColor = (taskTypeName) => {
    if (!taskTypeName) return 'default';
    const colorMap = {
      'Bug Report Evaluation': 'error',
      'Code Clone Detection': 'primary',
      'SOLID Violation Analysis': 'warning',
      'Snapshot Comparison': 'info'
    };
    return colorMap[taskTypeName] || 'secondary';
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'default',
      'IN_PROGRESS': 'warning',
      'SUBMITTED': 'success',
      'REVIEWED': 'info'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'PENDING': 'Not Started',
      'IN_PROGRESS': 'In Progress',
      'SUBMITTED': 'Submitted',
      'REVIEWED': 'Reviewed'
    };
    return statusLabels[status] || status;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No deadline';
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return 'text.secondary';
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'error.main';
    if (diffDays <= 3) return 'error.main';
    if (diffDays <= 7) return 'warning.main';
    return 'text.secondary';
  };

  const handleStartTask = async (assignmentId, e) => {
    e.stopPropagation();
    try {
      await evaluationService.startTask(assignmentId);
      navigate(`/participant/evaluation/${assignmentId}`);
    } catch (err) {
      console.error('Error starting task:', err);
      setError('Failed to start task. Please try again.');
    }
  };

  const handleViewTask = (assignmentId) => {
    navigate(`/participant/evaluation/${assignmentId}`);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = searchQuery === '' ||
      task.taskTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id?.toString().includes(searchQuery);
    return matchesSearch;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    submitted: tasks.filter(t => t.status === 'SUBMITTED').length
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon fontSize="inherit" />
          Evaluation Tasks
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and complete your assigned evaluation tasks.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            placeholder="Search tasks by title, description, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}

          />
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Tasks" value="ALL" />
            <Tab label="Pending" value="PENDING" />
            <Tab label="In Progress" value="IN_PROGRESS" />
            <Tab label="Submitted" value="SUBMITTED" />
          </Tabs>
        </Stack>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing <strong>{filteredTasks.length}</strong> of <strong>{stats.total}</strong> tasks
          {(searchQuery || activeTab !== 'ALL') && ' (filtered)'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Grid item xs={12} md={6} lg={4} key={n}>
              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredTasks.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 8, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <AssignmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.primary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || activeTab !== 'ALL'
              ? 'Try adjusting your search or tab selection.'
              : 'You have no assigned tasks at the moment.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredTasks.map((assignment) => (
              <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: 1,
                    borderColor: 'divider',
                    transition: 'all 0.3s',
                    '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewTask(assignment.id)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                      <Chip
                        label={getTaskTypeLabel(assignment.taskTypeName)}
                        color={getTaskTypeColor(assignment.taskTypeName)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={getStatusLabel(assignment.status)}
                        color={getStatusColor(assignment.status)}
                        size="small"
                        variant="outlined"
                      />
                      {assignment.status === 'SUBMITTED' && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Done"
                          color="success"
                          size="small"
                        />
                      )}
                    </Stack>

                    <Typography variant="h6" fontWeight={600} gutterBottom noWrap title={assignment.taskTitle}>
                      {assignment.taskTitle}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 2,
                        minHeight: 40
                      }}
                    >
                      {assignment.taskDescription || 'No description available'}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                          Assignment ID:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          #{assignment.id}
                        </Typography>
                      </Box>

                      {assignment.dueDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon sx={{ fontSize: 16, color: getDueDateColor(assignment.dueDate) }} />
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ color: getDueDateColor(assignment.dueDate) }}
                          >
                            {formatDueDate(assignment.dueDate)}
                          </Typography>
                        </Box>
                      )}

                      {assignment.assignedAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                            Assigned:
                          </Typography>
                          <Typography variant="body2">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}

                      {assignment.submittedAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                            Submitted:
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            {new Date(assignment.submittedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    {assignment.status === 'PENDING' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => handleStartTask(assignment.id, e)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Start Task
                      </Button>
                    ) : assignment.status === 'IN_PROGRESS' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTask(assignment.id);
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<DescriptionIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTask(assignment.id);
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        View Details
                      </Button>
                    )}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(e, value) => setPage(value - 1)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ParticipantTasks;