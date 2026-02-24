import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import QuizIcon from '@mui/icons-material/Quiz';
import AppTheme from '../../shared-theme/AppTheme';
import { studyService } from '../../services/api';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const getSectionCardSx = (theme) => ({
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  backgroundColor: theme.palette.background.paper,
});

const AssignedStudyDetail = (props) => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudyDetails();
  }, [studyId]);

  const loadStudyDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load study details
      const studyResponse = await studyService.getStudyById(studyId);
      setStudy(studyResponse.data);

      // Try to load enrollment info (might not exist if not enrolled yet)
      try {
        const invitationsResponse = await studyService.getMyInvitations();
        const myInvitation = invitationsResponse.data.find(inv => inv.studyId === parseInt(studyId));
        if (myInvitation) {
          setEnrollment(myInvitation);
        }
      } catch (err) {
        console.log('No enrollment found, user might not be enrolled yet');
      }
    } catch (err) {
      console.error('Failed to load study details', err);
      setError('Unable to load study details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!enrollment) return;
    
    try {
      await studyService.acceptInvitation(enrollment.id);
      alert('Study invitation accepted!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to accept invitation', err);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  const handleDecline = async () => {
    if (!enrollment) return;
    
    try {
      await studyService.declineInvitation(enrollment.id);
      alert('Study invitation declined.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to decline invitation', err);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
            Loading study details...
          </Typography>
        </Box>
      );
    }

    if (error || !study) {
      return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 6 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Study not found'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      );
    }

    const isInvited = enrollment?.status === 'INVITED';
    const isEnrolled = enrollment?.status === 'ACTIVE' || enrollment?.status === 'COMPLETED';

    return (
      <Stack spacing={3}>
        {/* Header */}
        <Paper
          elevation={1}
          sx={(theme) => ({
            px: { xs: 2.5, md: 3.5 },
            py: { xs: 2.5, md: 3 },
            borderRadius: 0,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          })}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={() => navigate('/dashboard')}
                size="large"
                sx={{
                  border: 1,
                  borderColor: alpha('#000', 0.08),
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
                <AssignmentIcon color="primary" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {study.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Study #{studyId}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {isInvited && (
                  <Chip label="Invited" color="warning" sx={{ fontWeight: 600 }} />
                )}
                {isEnrolled && (
                  <Chip label="Enrolled" color="success" icon={<CheckCircleIcon />} sx={{ fontWeight: 600 }} />
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <Grid container spacing={3} alignItems="stretch">
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Description */}
              <Card elevation={0} sx={(theme) => getSectionCardSx(theme)}>
                <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="h6" fontWeight={700} letterSpacing={0.2}>
                      Description
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7 }}>
                    {study.description || 'No description provided.'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Study Information */}
              <Card elevation={0} sx={(theme) => getSectionCardSx(theme)}>
                <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Study Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List dense disablePadding>
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 42 }}>
                        <CalendarTodayIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Start Date"
                        secondary={study.startDate ? new Date(study.startDate).toLocaleDateString() : 'Not specified'}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 42 }}>
                        <CalendarTodayIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="End Date"
                        secondary={study.endDate ? new Date(study.endDate).toLocaleDateString() : 'Not specified'}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 42 }}>
                        <PeopleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Researcher"
                        secondary={study.researcherName || 'Unknown'}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 42 }}>
                        <AssignmentIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Study Status"
                        secondary={
                          <Chip
                            label={study.status || 'ACTIVE'}
                            size="small"
                            color={study.status === 'ACTIVE' ? 'success' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                        }
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* Enrollment Progress (if enrolled) */}
              {isEnrolled && enrollment && (
                <Card elevation={0} sx={(theme) => getSectionCardSx(theme)}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Your Progress
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Overall Progress
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {enrollment.progress || 0}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={enrollment.progress || 0}
                        sx={{ height: 10, borderRadius: 0 }}
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                          Enrolled On
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                          {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                          Days Remaining
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                          {enrollment.daysRemaining !== undefined ? `${enrollment.daysRemaining} days` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Action Card for Invited */}
              {isInvited && (
                <Card
                  elevation={0}
                  sx={(theme) => ({
                    ...getSectionCardSx(theme),
                    borderColor: 'warning.main',
                    boxShadow: theme.shadows[2],
                  })}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom color="warning.main">
                      You're Invited!
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" paragraph>
                      You have been invited to participate in this study. Review the details and decide whether to accept
                      or decline.
                    </Typography>
                    <Stack spacing={1.5}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        startIcon={<ThumbUpIcon />}
                        onClick={handleAccept}
                        size="large"
                      >
                        Accept Invitation
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        startIcon={<ThumbDownIcon />}
                        onClick={handleDecline}
                        size="large"
                      >
                        Decline
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions for Enrolled */}
              {isEnrolled && (
                <Card elevation={0} sx={(theme) => getSectionCardSx(theme)}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Quick Actions
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1.5}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<QuizIcon />}
                        onClick={() => navigate(`/participant/quiz/${studyId}`)}
                        size="large"
                      >
                        Take Quiz
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssignmentIcon />}
                        onClick={() => navigate('/dashboard?tab=Tasks')}
                        size="large"
                      >
                        View Tasks
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Study Stats */}
              <Card elevation={0} sx={(theme) => getSectionCardSx(theme)}>
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Study Statistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {study.startDate && study.endDate
                          ? `${Math.ceil(
                              (new Date(study.endDate) - new Date(study.startDate)) /
                                (1000 * 60 * 60 * 24),
                            )} days`
                          : 'Not specified'}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                        Created On
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {study.createdAt ? new Date(study.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    );
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box
        sx={(theme) => ({
          minHeight: '100vh',
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
        })}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 }, px: { xs: 2, md: 4 } }}>
          {renderContent()}
        </Container>
      </Box>
    </AppTheme>
  );
};

export default AssignedStudyDetail;
