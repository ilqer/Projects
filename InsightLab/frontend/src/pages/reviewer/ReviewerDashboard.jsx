import * as React from 'react';
import { reviewerAssignmentService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from '../components/AppNavbar';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import AppTheme from '../../shared-theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../theme/customizations';

// Import MUI components
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// Icons
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FolderIcon from '@mui/icons-material/Folder';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function ReviewerDashboard(props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [currentTab, setCurrentTab] = React.useState('Reviewer Dashboard');
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reviewerAssignmentService.getMyAssignments();

        const mapped = (res.data || []).map((a) => {
          let status;
          switch (a.status) {
            case 'PENDING':
              status = 'pending';
              break;
            case 'COMPLETED':
              status = 'completed';
              break;
            case 'IN_PROGRESS':
            case 'ACCEPTED':
            default:
              status = 'pending';
              break;
          }

          const flaggedCount = a.flaggedEvaluations ?? 0;
          if (flaggedCount > 0 && status !== 'completed') {
            status = 'flagged';
          }

          return {
            studyId: a.studyId,
            id: a.id,
            studyName: a.studyTitle || 'Untitled study',
            assignedBy: a.assignedByName || 'Study owner',
            assignedAt: a.assignedAt,
            status,
            progress: a.progressPercentage ?? 0,
            totalEvaluations: a.totalEvaluations ?? 0,
            reviewedEvaluations: a.reviewedEvaluations ?? 0,
            flaggedCount,
          };
        });

        setReviews(mapped);
      } catch (err) {
        console.error('Error loading reviewer dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const completedReviews = reviews.filter(r => r.status === 'completed');
  const flaggedReviews = reviews.filter(r => r.status === 'flagged');

  const stats = {
    total: reviews.length,
    pending: pendingReviews.length,
    completed: completedReviews.length,
    flagged: flaggedReviews.length,
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleProfileClick = () => {
    navigate('/dashboard');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'flagged': return 'error';
      default: return 'default';
    }
  };

  const renderReviewerContent = () => (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, pt: 3 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', display: 'flex' }}>
                  <AssignmentIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Box>
                <Chip label="All" size="small" color="default" variant="outlined" />
              </Stack>
              <Typography variant="h3" fontWeight={700} mb={0.5}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Total Assignments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.50', display: 'flex' }}>
                  <PendingIcon sx={{ fontSize: 28, color: 'warning.main' }} />
                </Box>
                <Chip label="Active" size="small" color="warning" variant="outlined" />
              </Stack>
              <Typography variant="h3" fontWeight={700} mb={0.5}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Pending Reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50', display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 28, color: 'success.main' }} />
                </Box>
                <Chip label="Done" size="small" color="success" variant="outlined" />
              </Stack>
              <Typography variant="h3" fontWeight={700} mb={0.5}>
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.50', display: 'flex' }}>
                  <WarningIcon sx={{ fontSize: 28, color: 'error.main' }} />
                </Box>
                <Chip label="Flagged" size="small" color="error" variant="outlined" />
              </Stack>
              <Typography variant="h3" fontWeight={700} mb={0.5}>
                {stats.flagged}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Flagged Reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              size="large"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/reviewer/reviews')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              View All Reviews
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<TrendingUpIcon />}
              onClick={() => navigate('/reviewer/history')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              View History
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="error"
              startIcon={<WarningIcon />}
              onClick={() => {
                const flagged = reviews.filter(r => r.status === 'flagged');
                if (flagged.length > 0) {
                  navigate(`/reviewer/studies/${flagged[0].studyId}/reviewer-dashboard`);
                }
              }}
              disabled={flaggedReviews.length === 0}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Review Flagged ({flaggedReviews.length})
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Pending Reviews */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Pending Reviews ({pendingReviews.length})
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/reviewer/reviews')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  View All
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading reviews...
                  </Typography>
                </Box>
              ) : pendingReviews.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    All Caught Up!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No pending reviews at the moment.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {pendingReviews.map((review) => (
                    <Card key={review.id} variant="outlined" sx={{ transition: 'all 0.2s', '&:hover': { boxShadow: 2 } }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                              <Typography variant="h6" fontWeight={600}>
                                {review.studyName}
                              </Typography>
                              <Chip
                                label={review.status}
                                size="small"
                                color={getStatusColor(review.status)}
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              Assigned by: {review.assignedBy}
                            </Typography>

                            <Grid container spacing={2}>
                              <Grid item xs={6} sm={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Total Evaluations
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {review.totalEvaluations}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Reviewed
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {review.reviewedEvaluations}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Progress
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {review.progress}%
                                </Typography>
                              </Grid>
                            </Grid>

                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Review Progress
                                </Typography>
                                <Typography variant="caption" fontWeight={600}>
                                  {review.progress}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={review.progress}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>

                            {review.flaggedCount > 0 && (
                              <Alert severity="warning" sx={{ mt: 2 }}>
                                {review.flaggedCount} evaluation(s) flagged for review
                              </Alert>
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          disabled={!review.studyId}
                          onClick={() =>
                            navigate(`/reviewer/studies/${review.studyId}/reviewer-dashboard`)
                          }
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Open Workspace
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar - Stats & Quick Info */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Flagged Reviews */}
            {flaggedReviews.length > 0 && (
              <Card elevation={0} sx={{ border: 1, borderColor: 'error.main' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" color="error" gutterBottom fontWeight={600}>
                    Flagged Reviews
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    {flaggedReviews.map((review) => (
                      <Card key={review.id} variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                            {review.studyName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            {review.assignedBy}
                          </Typography>
                          <Chip
                            label={`${review.flaggedCount} flagged`}
                            size="small"
                            color="error"
                            sx={{ mr: 1 }}
                          />
                          <Button
                            size="small"
                            color="error"
                            disabled={!review.studyId}
                            onClick={() =>
                              navigate(`/reviewer/studies/${review.studyId}/reviewer-dashboard`)
                            }
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Review
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Recent Completions */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Recent Completions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {completedReviews.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No completed reviews yet.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {completedReviews.slice(0, 3).map((review) => (
                      <ListItem key={review.id} disablePadding sx={{ mb: 1.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                            <CheckCircleIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600}>
                                {review.studyName}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {review.assignedBy}
                              </Typography>
                            }
                          />
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate('/reviewer/history')}
                  fullWidth
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  View All History
                </Button>
              </CardActions>
            </Card>

            {/* Performance Stats */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Your Performance
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Reviews Completed
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {completedReviews.length}/{reviews.length}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={reviews.length > 0 ? (completedReviews.length / reviews.length) * 100 : 0}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Flagged Issues
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        {flaggedReviews.length}/{reviews.length}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={reviews.length > 0 ? (flaggedReviews.length / reviews.length) * 100 : 0}
                      color="error"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Overall Progress
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {reviews.length > 0
                          ? Math.round(
                              reviews.reduce((sum, r) => sum + r.progress, 0) / reviews.length
                            )
                          : 0}
                        %
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        reviews.length > 0
                          ? reviews.reduce((sum, r) => sum + r.progress, 0) / reviews.length
                          : 0
                      }
                      color="success"
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onLogout={handleLogout}
          onProfileClick={handleProfileClick}
          user={user}
        />
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
            <Header currentTab={currentTab} />
            {renderReviewerContent()}
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
