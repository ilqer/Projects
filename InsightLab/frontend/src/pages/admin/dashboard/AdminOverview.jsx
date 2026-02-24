import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
  Alert,
  Paper,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

import { userService, studyService } from '../../../services/api';

import UserManagement from './UserManagement';
import MonitorStudies from '../MonitorStudies';
import SystemSettings from './SystemSettings';
import ArtifactManagement from './ArtifactManagement'; 


const AdminOverview = ({ user, initialTab = 0, onNavigate }) => {
  const [currentTab, setCurrentTab] = useState(initialTab);

  const tabTitles = ['Overview', 'Users', 'Studies', 'Artifacts', 'Settings'];
  const tabSubtitles = [
    'System summary and pending approvals',
    'Manage users and requests',
    'Monitor studies and progress',
    'Manage all artifacts',
    'System configuration',
  ];

  // Stats
  const [stats, setStats] = useState([
    { title: 'Total Users', value: '-', color: 'primary' },
    { title: 'Total Studies', value: '-', color: 'success' },
    { title: 'Total Artifacts', value: '-', color: 'warning' },
  ]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  // Pending counts
  const [pending, setPending] = useState({
    researcherRequests: 0,
    reactivationRequests: 0,
  });
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');

  // Update tab when initialTab changes
  React.useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  // Load overview data when Overview tab is active
  React.useEffect(() => {
    if (currentTab === 0) loadOverviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab]);

  const loadOverviewData = async () => {
    try {
      setLoadingStats(true);
      setStatsError('');
      setPendingLoading(true);
      setPendingError('');

      const [usersRes, allStudiesRes, researcherReqRes, reactivationReqRes] =
        await Promise.all([
          userService.getAllUsers(),
          studyService.getAllStudies(),
          userService.getResearcherRequests(),
          userService.getReactivationRequests(),
        ]);

      // --- Stats ---
      const totalUsers = (usersRes.data || []).length;

      const studies = allStudiesRes.data || [];
      const totalStudies = studies.length;

      const totalArtifacts = studies.reduce(
        (sum, s) => sum + ((s.artifacts || []).length),
        0
      );

      setStats([
        {
          title: 'Total Users',
          value: totalUsers.toLocaleString(),
          color: 'primary',
        },
        {
          title: 'Total Studies',
          value: totalStudies.toLocaleString(),
          color: 'success',
        },
        {
          title: 'Total Artifacts',
          value: totalArtifacts.toLocaleString(),
          color: 'warning',
        },
      ]);

      // --- Pending ---
      const researcherRequests = (researcherReqRes.data || []).length;
      const reactivationRequests = (reactivationReqRes.data || []).length;

      setPending({ researcherRequests, reactivationRequests });
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to load overview data';

      setStatsError(msg);
      setPendingError(msg);
    } finally {
      setLoadingStats(false);
      setPendingLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Tab Content */}
      {currentTab === 0 && renderOverviewTab()}
      {currentTab === 1 && <UserManagement />}
      {currentTab === 2 && <MonitorStudies embedded={true} />}
      {currentTab === 3 && <ArtifactManagement />}
      {currentTab === 4 && <SystemSettings />}

    </Container>
  );

  function renderOverviewTab() {
    return (
      <>
        {statsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {statsError}
          </Alert>
        )}
        {(loadingStats || pendingLoading) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loading dashboard data...
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card
                elevation={0}
                sx={{ height: '100%', border: 1, borderColor: 'divider' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${stat.color}.50`,
                      }}
                    >
                      <TrendingUpIcon
                        sx={{ fontSize: 24, color: `${stat.color}.main` }}
                      />
                    </Box>
                  </Stack>

                  <Typography variant="h4" fontWeight={700} mb={0.5}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pending Actions */}
        <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Pending Actions
            </Typography>

            {pendingError ? (
              <Alert severity="error">{pendingError}</Alert>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => onNavigate?.('Researcher Requests')}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Researcher Requests
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                      {pending.researcherRequests}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Awaiting approval
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => onNavigate?.('Reactivation Requests')}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Reactivation Requests
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                      {pending.reactivationRequests}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Awaiting review
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </>
    );
  }
};

export default AdminOverview;
