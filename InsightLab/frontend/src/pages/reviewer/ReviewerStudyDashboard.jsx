import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { BarChart } from '@mui/x-charts';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SpeedIcon from '@mui/icons-material/Speed';
import StarIcon from '@mui/icons-material/Star';
import AppNavbar from '../components/AppNavbar';
import AppTheme from '../../shared-theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../theme/customizations';
import { reviewerEvaluationService } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const initialFilters = {
  participantId: '',
  status: '',
  taskId: '',
  taskType: '',
  submittedFrom: '',
  submittedTo: '',
  qualityScore: '',
  minQualityScore: '',
  maxQualityScore: '',
  minTimeSeconds: '',
  maxTimeSeconds: ''
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

const ReviewerStudyDashboard = (props) => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [fastThreshold, setFastThreshold] = useState(20);
  const [applyingFilters, setApplyingFilters] = useState(false);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const loadDashboard = async (overrideFilters = filters, overrideThreshold = fastThreshold) => {
    try {
      setLoading(true);
      setError('');
      const params = buildQueryParams(overrideFilters);
      if (overrideThreshold) {
        params.fastThresholdSeconds = overrideThreshold;
      }
      const response = await reviewerEvaluationService.getDashboard(studyId, params);
      setDashboard(response.data);
      if (response.data?.fastThresholdSeconds) {
        setFastThreshold(response.data.fastThresholdSeconds);
      }
    } catch (err) {
      console.error('Failed to load reviewer dashboard', err);
      setError(err.response?.data?.message || 'Unable to load reviewer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const buildQueryParams = (currentFilters) => {
    const params = {};
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value;
      }
    });
    return params;
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = async () => {
    setApplyingFilters(true);
    await loadDashboard(filters, fastThreshold);
    setApplyingFilters(false);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    loadDashboard(initialFilters, fastThreshold);
  };

  const qualitySeries = useMemo(() => {
    if (!dashboard?.qualityDistribution) return [];
    return Object.entries(dashboard.qualityDistribution).map(([score, count]) => ({
      score,
      count
    }));
  }, [dashboard]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      );
    }

    if (error && !dashboard) {
      return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 6 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => loadDashboard()}>
            Retry
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, pt: 3 }}>
        {/* Header Section */}
        <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => navigate('/dashboard')} size="large">
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {dashboard?.studyTitle || 'Study Review Dashboard'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Study #{studyId} • Review and analyze participant evaluations
                </Typography>
              </Box>
              <IconButton onClick={() => loadDashboard()} color="primary">
                <RefreshIcon />
              </IconButton>
            </Stack>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Stats Cards Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.50', display: 'flex' }}>
                    <AssignmentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Total Evaluations
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {dashboard?.stats?.totalEvaluations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'success.50', display: 'flex' }}>
                    <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Valid
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {dashboard?.stats?.validEvaluations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'warning.50', display: 'flex' }}>
                    <WarningIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Suspicious
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {dashboard?.stats?.suspiciousEvaluations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'error.50', display: 'flex' }}>
                    <ErrorIcon sx={{ fontSize: 20, color: 'error.main' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Incomplete
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {dashboard?.stats?.incompleteEvaluations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'info.50', display: 'flex' }}>
                    <SpeedIcon sx={{ fontSize: 20, color: 'info.main' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Fast Evals
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700} color="info.main">
                  {dashboard?.stats?.fastEvaluations || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'warning.50', display: 'flex' }}>
                    <StarIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Avg. Quality
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {dashboard?.stats?.averageQualityScore
                    ? dashboard.stats.averageQualityScore.toFixed(2)
                    : '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters Section */}
        <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Filters
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Participant</InputLabel>
                  <Select
                    label="Participant"
                    value={filters.participantId}
                    onChange={(e) => handleFilterChange('participantId', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {(dashboard?.filterOptions?.participants || []).map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {(dashboard?.filterOptions?.statuses || []).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Task</InputLabel>
                  <Select
                    label="Task"
                    value={filters.taskId}
                    onChange={(e) => handleFilterChange('taskId', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {(dashboard?.filterOptions?.tasks || []).map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Task Type</InputLabel>
                  <Select
                    label="Task Type"
                    value={filters.taskType}
                    onChange={(e) => handleFilterChange('taskType', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {(dashboard?.filterOptions?.taskTypes || []).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Submitted From"
                  type="datetime-local"
                  size="small"
                  fullWidth
                  value={filters.submittedFrom}
                  onChange={(e) => handleFilterChange('submittedFrom', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Submitted To"
                  type="datetime-local"
                  size="small"
                  fullWidth
                  value={filters.submittedTo}
                  onChange={(e) => handleFilterChange('submittedTo', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label="Quality Score"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.qualityScore}
                  onChange={(e) => handleFilterChange('qualityScore', e.target.value)}
                  inputProps={{ min: 1, max: 5 }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label="Min Quality"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.minQualityScore}
                  onChange={(e) => handleFilterChange('minQualityScore', e.target.value)}
                  inputProps={{ min: 1, max: 5 }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label="Max Quality"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.maxQualityScore}
                  onChange={(e) => handleFilterChange('maxQualityScore', e.target.value)}
                  inputProps={{ min: 1, max: 5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Min Time (sec)"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.minTimeSeconds}
                  onChange={(e) => handleFilterChange('minTimeSeconds', e.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Max Time (sec)"
                  type="number"
                  size="small"
                  fullWidth
                  value={filters.maxTimeSeconds}
                  onChange={(e) => handleFilterChange('maxTimeSeconds', e.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Fast Threshold (sec)"
                  type="number"
                  size="small"
                  fullWidth
                  value={fastThreshold}
                  onChange={(e) => setFastThreshold(e.target.value)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                disabled={applyingFilters}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {applyingFilters ? 'Applying...' : 'Apply Filters'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Clear Filters
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Alert Lists */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'warning.main', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <WarningIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Suspicious Evaluations
                  </Typography>
                  <Chip 
                    label={dashboard?.suspiciousEvaluations?.length || 0} 
                    size="small" 
                    color="warning" 
                  />
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <EvaluationList
                  evaluations={dashboard?.suspiciousEvaluations || []}
                  emptyMessage="No suspicious evaluations."
                  onOpen={(assignmentId) => navigate(`/reviewer/studies/${studyId}/evaluations/${assignmentId}`)}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'error.main', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <ErrorIcon sx={{ color: 'error.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Incomplete Evaluations
                  </Typography>
                  <Chip 
                    label={dashboard?.incompleteEvaluations?.length || 0} 
                    size="small" 
                    color="error" 
                  />
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <EvaluationList
                  evaluations={dashboard?.incompleteEvaluations || []}
                  emptyMessage="No incomplete evaluations."
                  onOpen={(assignmentId) => navigate(`/reviewer/studies/${studyId}/evaluations/${assignmentId}`)}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'info.main', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <SpeedIcon sx={{ color: 'info.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Unusually Fast
                  </Typography>
                  <Chip 
                    label={dashboard?.fastEvaluations?.length || 0} 
                    size="small" 
                    color="info" 
                  />
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <EvaluationList
                  evaluations={dashboard?.fastEvaluations || []}
                  emptyMessage="No unusually fast evaluations."
                  onOpen={(assignmentId) => navigate(`/reviewer/studies/${studyId}/evaluations/${assignmentId}`)}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Evaluations Table */}
          <Grid item xs={12} lg={8}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight={600}>
                    All Evaluations ({dashboard?.evaluations?.length || 0})
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/reviewer/studies/${studyId}/comparison`)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Compare by Task
                  </Button>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Participant</strong></TableCell>
                        <TableCell><strong>Task</strong></TableCell>
                        <TableCell><strong>Submitted</strong></TableCell>
                        <TableCell><strong>Time Spent</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Quality</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(dashboard?.evaluations || []).map((item) => (
                        <TableRow key={item.assignmentId} hover>
                          <TableCell>{item.participantName}</TableCell>
                          <TableCell>{item.taskTitle}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDateTime(item.submittedAt)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.submittedAt ? dayjs(item.submittedAt).fromNow() : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDuration(item.timeSpentSeconds)}</TableCell>
                          <TableCell>
                            {item.reviewerStatus ? (
                              <Chip
                                label={item.reviewerStatus}
                                color={
                                  item.reviewerStatus === 'VALID'
                                    ? 'success'
                                    : item.reviewerStatus === 'SUSPICIOUS'
                                      ? 'warning'
                                      : 'default'
                                }
                                size="small"
                              />
                            ) : (
                              <Chip label="UNREVIEWED" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>
                            {item.reviewerQualityScore ? (
                              <Chip 
                                label={item.reviewerQualityScore} 
                                size="small" 
                                icon={<StarIcon />}
                                color="warning"
                              />
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                navigate(`/reviewer/studies/${studyId}/evaluations/${item.assignmentId}`)
                              }
                              sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Quality Distribution Chart */}
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Quality Score Distribution
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  {qualitySeries.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <StarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No quality scores recorded yet.
                      </Typography>
                    </Box>
                  ) : (
                    <BarChart
                      height={250}
                      series={[{ data: qualitySeries.map((item) => item.count), label: 'Evaluations' }]}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: qualitySeries.map((item) => item.score),
                          label: 'Score'
                        }
                      ]}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Participant Summary */}
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Participant Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Participant</strong></TableCell>
                          <TableCell align="right"><strong>Count</strong></TableCell>
                          <TableCell align="right"><strong>Avg</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(dashboard?.participantSummaries || []).map((summary) => (
                          <TableRow key={summary.participantId} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {summary.participantName}
                              </Typography>
                              <Stack direction="row" spacing={0.5} mt={0.5}>
                                {summary.suspiciousCount > 0 && (
                                  <Chip 
                                    label={`⚠ ${summary.suspiciousCount}`} 
                                    size="small" 
                                    color="warning"
                                    sx={{ height: 18, fontSize: '0.7rem' }}
                                  />
                                )}
                                {summary.incompleteCount > 0 && (
                                  <Chip 
                                    label={`✕ ${summary.incompleteCount}`} 
                                    size="small" 
                                    color="error"
                                    sx={{ height: 18, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                {summary.evaluationCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={summary.averageQualityScore ? summary.averageQualityScore.toFixed(2) : '—'}
                                size="small"
                                icon={<StarIcon />}
                                color={summary.averageQualityScore >= 4 ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
            minHeight: '100vh',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            {renderContent()}
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
};

const EvaluationList = ({ evaluations, emptyMessage, onOpen }) => {
  if (!evaluations || evaluations.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
      {evaluations.slice(0, 5).map((item) => (
        <ListItem
          key={item.assignmentId}
          divider
          sx={{
            px: 0,
            '&:hover': { bgcolor: 'action.hover' },
            borderRadius: 1,
          }}
          secondaryAction={
            <Button 
              variant="text" 
              size="small" 
              onClick={() => onOpen(item.assignmentId)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              View
            </Button>
          }
        >
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight={600}>
                {item.participantName} • {item.taskTitle}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(item.submittedAt)} • {formatDuration(item.timeSpentSeconds)}
              </Typography>
            }
          />
        </ListItem>
      ))}
      {evaluations.length > 5 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          + {evaluations.length - 5} more
        </Typography>
      )}
    </List>
  );
};

export default ReviewerStudyDashboard;
