import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewerAssignmentService } from '../../../services/api';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Divider,
} from '@mui/material';
import { 
  Assignment, CheckCircle, Flag, Schedule, 
  Dashboard as DashboardIcon, History as HistoryIcon,
  RateReview as RateReviewIcon
} from '@mui/icons-material';
import AssignedReviews from '../AssignedReviews';
import ReviewHistory from '../ReviewHistory';

const ReviewerOverview = ({ user, initialTab = 0 }) => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(initialTab);
  
  // Update tab when initialTab changes
  React.useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  const [stats, setStats] = React.useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    flagged: 0,
    avgQuality: 0,
    totalIssues: 0,
  });

  const [recentReviews, setRecentReviews] = React.useState([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await reviewerAssignmentService.getMyAssignments();
        const assignments = res.data || [];

        const pending = assignments.filter((a) => a.status === 'PENDING').length;
        const inProgress = assignments.filter(
          (a) => a.status === 'IN_PROGRESS' || a.status === 'ACCEPTED'
        ).length;
        const completed = assignments.filter(
          (a) => a.status === 'COMPLETED'
        ).length;

        const flagged = assignments.filter(
          (a) => (a.flaggedEvaluations || 0) > 0
        ).length;

        const totalIssues = assignments.reduce(
          (sum, a) => sum + (a.flaggedEvaluations || 0),
          0
        );

        setStats({
          pending,
          inProgress,
          completed,
          flagged,
          avgQuality: 0,
          totalIssues,
        });

        const completedAssignments = assignments
          .filter((a) => a.status === 'COMPLETED')
          .sort((a, b) => {
            const d1 = a.completedAt || a.assignedAt;
            const d2 = b.completedAt || b.assignedAt;
            return new Date(d2) - new Date(d1);
          });

        setRecentReviews(
          completedAssignments.slice(0, 3).map((a) => ({
            id: a.id,
            study: a.studyTitle || 'Untitled study',
            participant: a.assignedByName || 'Study owner',
            status: 'completed',
            priority: 'medium',
            dueDate: new Date(a.completedAt || a.assignedAt).toLocaleDateString(),
          }))
        );
      } catch (err) {
        console.error('Error loading reviewer overview', err);
      }
    };

    load();
  }, []);

  return (
    <Container maxWidth="xl">
      {/* Tab Content */}
      {currentTab === 0 && renderOverviewTab()}
      {currentTab === 1 && <AssignedReviews embedded={true} />}
      {currentTab === 2 && <ReviewHistory embedded={true} />}
    </Container>
  );

  function renderOverviewTab() {
    return (
      <>
        {/* Top stats cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Pending Reviews', value: stats.pending, icon: Assignment, color: 'warning' },
          { label: 'In Progress', value: stats.inProgress, icon: Schedule, color: 'info' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'success' },
          { label: 'Flagged', value: stats.flagged, icon: Flag, color: 'error' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.3s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${stat.color}.50`,
                      display: 'flex',
                    }}
                  >
                    <stat.icon sx={{ fontSize: 28, color: `${stat.color}.main` }} />
                  </Box>
                </Stack>
                <Typography variant="h3" fontWeight={700} mb={0.5}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent reviews */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Reviews
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {recentReviews.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No completed reviews yet.
                  </Typography>
                ) : (
                  recentReviews.map((review) => (
                    <Box
                      key={review.id}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {review.study}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {review.participant}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.dueDate}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={review.status}
                            size="small"
                            color={review.status === 'pending' ? 'warning' : 'info'}
                          />
                          <Chip label={review.priority} size="small" variant="outlined" />
                        </Stack>
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/reviewer/reviews')}
              >
                View All Reviews
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Only Performance card (Quick Actions removed) */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Performance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Avg Quality Score
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {stats.avgQuality}/5.0
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(stats.avgQuality / 5) * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Issues Found
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {stats.totalIssues}
                  </Typography>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </>
    );
  }
};

export default ReviewerOverview;
