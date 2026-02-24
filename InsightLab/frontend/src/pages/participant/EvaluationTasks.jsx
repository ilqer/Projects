import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Card, CardContent, CardActions,
  Grid, Chip, Stack, IconButton, Alert, CircularProgress, Divider, Button,
  Pagination, Tabs, Tab, Paper, Skeleton,
  Avatar, useTheme, alpha
} from '@mui/material';
import {
  Assignment as AssignmentIcon, ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon, AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon, PlayArrow as PlayArrowIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { evaluationService } from '../../services/api';

const EvaluationTasks = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(20);

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

    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
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

  const handleViewTask = (assignmentId, status) => {
    navigate(`/participant/evaluation/${assignmentId}`);
  };

  // Filter tasks based on tab
  const filteredTasks = tasks;

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    submitted: tasks.filter(t => t.status === 'SUBMITTED').length
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header with Stats */}
      <Box sx={{ 
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95), 
        borderBottom: 1, 
        borderColor: 'divider', 
        pt: 4, 
        pb: 4, 
        mb: 4 
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                fontWeight: 600
              }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                My Evaluation Tasks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View and complete your assigned evaluation tasks
              </Typography>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3}>
            {[
              { label: 'Total Tasks', value: stats.total, icon: <AssignmentIcon />, color: 'text.primary', bg: 'grey.100' },
              { label: 'In Progress', value: stats.inProgress, icon: <PlayArrowIcon />, color: 'primary.main', bg: 'primary.light' },
              { label: 'Pending', value: stats.pending, icon: <AccessTimeIcon />, color: 'text.secondary', bg: 'grey.100' },
              { label: 'Submitted', value: stats.submitted, icon: <CheckCircleIcon />, color: 'success.main', bg: 'success.light' }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card variant="outlined" sx={{ borderRadius: 2, transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[2] } }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>{stat.label}</Typography>
                      <Typography variant="h4" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 48, height: 48 }}>
                      {stat.icon}
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Tabs */}
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="All Tasks" value="ALL" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Pending" value="PENDING" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="In Progress" value="IN_PROGRESS" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Submitted" value="SUBMITTED" sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
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
              {activeTab !== 'ALL'
                ? 'Try adjusting your tab selection.'
                : 'You have no assigned tasks at the moment.'}
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {filteredTasks.map((assignment) => (
              <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': { boxShadow: theme.shadows[4], transform: 'translateY(-2px)' },
                    cursor: 'pointer',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper'
                  }}
                  onClick={() => handleViewTask(assignment.id, assignment.status)}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
                      <Chip
                        label={getTaskTypeLabel(assignment.taskTypeName)}
                        color={getTaskTypeColor(assignment.taskTypeName)}
                        size="small"
                        sx={{ fontWeight: 600 }}
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

                  <Divider />

                  <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                    {assignment.status === 'PENDING' ? (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => handleStartTask(assignment.id, e)}
                      >
                        Start Task
                      </Button>
                    ) : assignment.status === 'IN_PROGRESS' ? (
                      <Button
                        size="small"
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTask(assignment.id, assignment.status);
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        endIcon={<DescriptionIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTask(assignment.id, assignment.status);
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
            </Grid>

            {/* Pagination */}
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
      </Container>
    </Box>
  );
};

export default EvaluationTasks;