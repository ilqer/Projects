import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studyService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import { useTheme } from '@mui/material/styles';
import {
  AppBar, Toolbar, CssBaseline, Box, Typography, Container, Paper, Button,
  IconButton, Grid, Card, CardContent, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Avatar, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const StudyStatistics = ({ embedded = false }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studies, setStudies] = useState([]);
  const [selectedStudyId, setSelectedStudyId] = useState('all');
  const [statistics, setStatistics] = useState(null);
  const [researcherStats, setResearcherStats] = useState(null);
  const overview = researcherStats?.overview || {};
  const participantStats = researcherStats?.participantStats || {};
  const evaluationStats = researcherStats?.evaluationStats || {};
  const artifactStats = researcherStats?.artifactStats || {};
  const topStudies = researcherStats?.topStudies || [];
  const recentActivity = researcherStats?.recentActivity || [];
  const participantBreakdown = [
    { key: 'invited', label: 'Invited' },
    { key: 'enrolled', label: 'Enrolled' },
    { key: 'inProgress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'dropped', label: 'Dropped' }
  ];
  const totalParticipantCount = participantBreakdown.reduce(
    (sum, item) => sum + (participantStats[item.key] || 0),
    0
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudyId && selectedStudyId !== 'all') {
      loadStudyStatistics(selectedStudyId);
    } else {
      setStatistics(null);
    }
  }, [selectedStudyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studiesRes, researcherStatsRes] = await Promise.all([
        studyService.getMyStudies(),
        studyService.getResearcherStatistics()
      ]);
      setStudies(studiesRes.data);
      setResearcherStats(researcherStatsRes.data);
      setSelectedStudyId('all');
      setStatistics(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load study data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudyStatistics = async (studyId) => {
    try {
      setLoading(true);
      const res = await studyService.getStudyStatistics(studyId);
      setStatistics(res.data);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Failed to load study statistics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => (
    <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} mt={1}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}.50`, display: 'flex' }}>
            <Icon sx={{ fontSize: 28, color: `${color}.main` }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const content = (
    <Container maxWidth="xl" sx={embedded ? { py: 3 } : undefined}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={1}>
          Study Statistics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track participant activity, completion rates, and study progress
        </Typography>
      </Box>

      {!embedded && (
        <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider', p: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Study</InputLabel>
            <Select
              value={selectedStudyId}
              onChange={(e) => setSelectedStudyId(e.target.value)}
              label="Select Study"
            >
              <MenuItem value="all">All Studies - Overview</MenuItem>
              <Divider />
              {studies.filter(s => s.status === 'ACTIVE').map((study) => (
                <MenuItem key={study.id} value={study.id}>
                  {study.title} - <Chip label={study.status} size="small" color="success" sx={{ ml: 1 }} />
                </MenuItem>
              ))}
              {studies.filter(s => s.status !== 'ACTIVE').length > 0 && <Divider />}
              {studies.filter(s => s.status !== 'ACTIVE').map((study) => (
                <MenuItem key={study.id} value={study.id}>
                  {study.title} - <Chip label={study.status} size="small" sx={{ ml: 1 }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : selectedStudyId === 'all' && researcherStats ? (
        <>
          {/* Overview Statistics */}
          <Typography variant="h5" fontWeight={600} mb={3}>
            Researcher Overview
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Studies"
                value={overview.totalStudies || 0}
                subtitle={`${overview.activeStudies || 0} active`}
                icon={AssessmentIcon}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Participants"
                value={overview.totalParticipants || 0}
                subtitle="Across all studies"
                icon={PeopleIcon}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Artifacts Managed"
                value={overview.totalArtifacts || 0}
                subtitle={`${overview.draftStudies || 0} drafts`}
                icon={FlagIcon}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Completion"
                value={`${(overview.averageCompletionRate || 0).toFixed(1)}%`}
                subtitle="Average across tasks"
                icon={CheckCircleIcon}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Rating"
                value={(overview.averageRating || 0).toFixed(1)}
                subtitle="Out of 5.0"
                icon={TrendingUpIcon}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed Studies"
                value={overview.completedStudies || 0}
                subtitle="Historical"
                icon={TimerIcon}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Participant & Evaluation Insights */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Participant Distribution
                </Typography>
                {totalParticipantCount > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <PieChart
                      height={260}
                      width={260}
                      colors={[
                        theme.palette.primary.light,
                        theme.palette.success.light,
                        theme.palette.info.light,
                        theme.palette.success.dark,
                        theme.palette.error.light
                      ]}
                      series={[
                        {
                          data: participantBreakdown
                            .map((item, idx) => ({
                              id: idx,
                              value: participantStats[item.key] || 0,
                              label: item.label
                            }))
                            .filter(item => item.value > 0),
                          innerRadius: 60,
                          outerRadius: 100,
                          paddingAngle: 2,
                          valueFormatter: (item) => `${item.value} ${item.label}`
                        }
                      ]}
                    />
                    <Stack spacing={1} flexGrow={1}>
                      <Typography variant="body2" color="text.secondary">
                        Total tracked: {totalParticipantCount}
                      </Typography>
                      {participantBreakdown.map(({ key, label }) => (
                        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', py: 0.5 }}>
                          <Typography>{label}</Typography>
                          <Typography fontWeight={600}>
                            {participantStats[key] || 0}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No participant activity recorded yet.
                  </Typography>
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Evaluation Pipeline
                </Typography>
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={6}>
                    <StatCard
                      title="Total Tasks"
                      value={evaluationStats.totalTasks || 0}
                      subtitle={`${evaluationStats.activeTasks || 0} active`}
                      icon={AssessmentIcon}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Assignments"
                      value={evaluationStats.totalAssignments || 0}
                      subtitle={`${evaluationStats.pendingAssignments || 0} awaiting`}
                      icon={TimerIcon}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Completed Tasks"
                      value={evaluationStats.completedTasks || 0}
                      subtitle={`${evaluationStats.draftTasks || 0} drafts`}
                      icon={CheckCircleIcon}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Reviewed"
                      value={evaluationStats.reviewedAssignments || 0}
                      subtitle={`${evaluationStats.submittedAssignments || 0} submitted`}
                      icon={TrendingUpIcon}
                      color="warning"
                    />
                  </Grid>
                </Grid>
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Assignment completion
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={evaluationStats.completionRate || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(evaluationStats.completionRate || 0).toFixed(1)}% of assignments submitted/reviewed
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Artifact & Activity Insights */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Artifact Insights
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {artifactStats.totalStudyArtifacts || 0} total study artifacts • {artifactStats.uniqueArtifacts || 0} unique files
                </Typography>
                {artifactStats.topTypes && artifactStats.topTypes.length > 0 ? (
                  <BarChart
                    height={280}
                    colors={[theme.palette.primary.main]}
                    xAxis={[{ scaleType: 'band', data: artifactStats.topTypes.map(item => item.label), height: 40 }]}
                    series={[{ data: artifactStats.topTypes.map(item => item.value) }]}
                    margin={{ top: 20, left: 40, right: 10, bottom: 30 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Upload artifacts to see type distribution.
                  </Typography>
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Recent Activity
                </Typography>
                {recentActivity.length > 0 ? (
                  <List dense disablePadding>
                    {recentActivity.map((activity, index) => {
                      const isStudy = activity.type === 'Study';
                      return (
                        <ListItem key={`${index}-${activity.timestamp || activity.title || 'activity'}`} alignItems="flex-start" sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: isStudy ? theme.palette.primary.light : theme.palette.info.light,
                                color: isStudy ? theme.palette.primary.main : theme.palette.info.main
                              }}
                            >
                              {isStudy ? <AssessmentIcon fontSize="small" /> : <TrendingUpIcon fontSize="small" />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography fontWeight={600}>
                                {activity.title}
                              </Typography>
                            }
                            secondary={
                              <Typography component="span" variant="body2" color="text.secondary">
                                {(activity.description && activity.description.trim().length > 0)
                                  ? activity.description
                                  : 'No additional details'} •{' '}
                                {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Activity will appear here as your studies evolve.
                  </Typography>
                )}
              </Card>
            </Grid>
          </Grid>

          {/* Study Breakdown Table */}
          <Typography variant="h5" fontWeight={600} mb={3}>
            Study Performance
          </Typography>
          {topStudies.length > 0 ? (
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Study Title</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Participants</strong></TableCell>
                    <TableCell align="center"><strong>Completion %</strong></TableCell>
                    <TableCell align="center"><strong>Avg Rating</strong></TableCell>
                    <TableCell align="center"><strong>Active Tasks</strong></TableCell>
                    <TableCell align="center"><strong>Artifacts</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topStudies.map((stat) => (
                    <TableRow key={stat.studyId} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedStudyId(stat.studyId)}>
                      <TableCell>{stat.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={stat.status}
                          size="small"
                          color={
                            stat.status === 'ACTIVE'
                              ? 'success'
                              : stat.status === 'DRAFT'
                                ? 'warning'
                                : stat.status === 'COMPLETED'
                                  ? 'primary'
                                  : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="center">{stat.participants}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stat.completionRate || 0}
                            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="body2">{(stat.completionRate || 0).toFixed(0)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {stat.averageRating > 0 ? stat.averageRating.toFixed(1) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">{stat.activeTasks}</TableCell>
                      <TableCell align="center">{stat.artifactCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
              <Typography variant="body1" color="text.secondary">
                Start a study to see comparative performance metrics.
              </Typography>
            </Paper>
          )}
        </>
      ) : statistics ? (
        <>
          {/* Detailed Study Statistics */}
          <Typography variant="h5" fontWeight={600} mb={3}>
            {statistics.studyTitle} - Detailed Statistics
          </Typography>

          {/* Participant Stats */}
          <Typography variant="h6" fontWeight={600} mb={2}>
            Participant Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Enrolled"
                value={statistics.totalEnrolled}
                icon={PeopleIcon}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active"
                value={statistics.activeParticipants}
                subtitle="In progress"
                icon={TrendingUpIcon}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed"
                value={statistics.completedParticipants}
                subtitle={`${statistics.completionRate}%`}
                icon={CheckCircleIcon}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Dropped"
                value={statistics.droppedParticipants}
                icon={CancelIcon}
                color="error"
              />
            </Grid>
          </Grid>

          {/* Evaluation Stats */}
          <Typography variant="h6" fontWeight={600} mb={2}>
            Evaluation Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Evaluations"
                value={statistics.totalEvaluations}
                subtitle={`${statistics.completedEvaluations} completed`}
                icon={AssessmentIcon}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Quality Rating"
                value={statistics.averageQualityRating.toFixed(1)}
                subtitle="Out of 5.0"
                icon={TrendingUpIcon}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Consistency Rating"
                value={statistics.averageConsistencyRating.toFixed(1)}
                subtitle="Out of 5.0"
                icon={TrendingUpIcon}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completeness Rating"
                value={statistics.averageCompletenessRating.toFixed(1)}
                subtitle="Out of 5.0"
                icon={TrendingUpIcon}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Review Stats */}
          <Typography variant="h6" fontWeight={600} mb={2}>
            Review Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Accepted"
                value={statistics.acceptedReviews}
                icon={CheckCircleIcon}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Rejected"
                value={statistics.rejectedReviews}
                icon={CancelIcon}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Flagged"
                value={statistics.flaggedReviews}
                icon={FlagIcon}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending"
                value={statistics.pendingReviews}
                icon={TimerIcon}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Additional Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Overall Average Rating
                </Typography>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {statistics.overallAverageRating.toFixed(2)} / 5.0
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(statistics.overallAverageRating / 5) * 100}
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                />
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Average Evaluation Time
                </Typography>
                <Typography variant="h3" fontWeight={700} color="info.main">
                  {statistics.averageEvaluationTimeMinutes} min
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Time per evaluation
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {statistics.lastActivityAt && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Last activity: {new Date(statistics.lastActivityAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
          <Typography variant="body1" color="text.secondary">
            Select a study to view detailed statistics
          </Typography>
        </Paper>
      )}

      {!embedded && (
        <Box sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Box>
      )}
    </Container>
  );

  if (embedded) {
    return content;
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
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>Study Statistics</Typography>
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

export default StudyStatistics;
