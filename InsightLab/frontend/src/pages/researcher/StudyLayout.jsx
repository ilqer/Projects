import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Outlet, NavLink } from 'react-router-dom';
import { studyService, reviewerAssignmentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ExportModal from '../../components/ExportModal';

const StudyLayout = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    loadStudy();
  }, [studyId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const basePath = `/researcher/study/${studyId}`;
      navigate(`${basePath}/${tabParam}`, { replace: true });
    }
  }, [location.search, studyId, navigate]);

  const loadStudy = async () => {
    try {
      setLoading(true);
      const response = await studyService.getStudyDetails(studyId);
      setStudy(response.data);
    } catch (err) {
      console.error('Error loading study:', err);
      setError(err.response?.data?.message || 'Failed to load study');
    } finally {
      setLoading(false);
    }
  };

  // Determine active tab from URL
  const getActiveTab = () => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    
    const path = location.pathname;
    if (path.endsWith('/edit')) return 'edit';
    if (path.includes('/evaluation-tasks')) return 'evaluation-tasks';
    if (path.endsWith('/participants')) return 'participants';
    if (path.endsWith('/reviewers')) return 'reviewers';
    if (path.endsWith('/quizzes')) return 'quizzes';
    return 'overview';
  };

  const handleTabChange = (_, value) => {
    const basePath = `/researcher/study/${studyId}`;
    switch (value) {
      case 'overview':
        navigate(basePath);
        break;
      case 'edit':
        navigate(`${basePath}/edit`);
        break;
      case 'evaluation-tasks':
        navigate(`${basePath}/evaluation-tasks`);
        break;
      case 'participants':
        navigate(`${basePath}/participants`);
        break;
      case 'reviewers':
        navigate(`${basePath}/reviewers`);
        break;
      case 'quizzes':
        navigate(`${basePath}/quizzes`);
        break;
      default:
        navigate(basePath);
    }
  };

  const handleDeleteClick = () => setDeleteDialogOpen(true);
  const handleDeleteCancel = () => setDeleteDialogOpen(false);

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await studyService.deleteStudy(studyId);
      alert('Study deleted successfully!');
      navigate('/dashboard?tab=Studies');
    } catch (err) {
      console.error('Error deleting study:', err);
      alert('Failed to delete study: ' + (err.response?.data?.message || err.message));
      setDeleting(false);
    }
  };

  const handleArchiveClick = () => setArchiveDialogOpen(true);
  const handleArchiveCancel = () => setArchiveDialogOpen(false);

  const handleArchiveConfirm = async () => {
    try {
      setArchiving(true);
      await studyService.archiveStudy(studyId);
      alert('Study archived successfully!');
      navigate('/dashboard?tab=Studies');
    } catch (err) {
      console.error('Error archiving study:', err);
      alert('Failed to archive study: ' + (err.response?.data?.message || err.message));
      setArchiving(false);
      setArchiveDialogOpen(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'warning',
      ACTIVE: 'success',
      PAUSED: 'default',
      COMPLETED: 'info',
      CANCELLED: 'error',
      ARCHIVED: 'secondary',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  if (error || !study) {
    return (
      <AppTheme>
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Alert severity="error">{error || 'Study not found'}</Alert>
          <Button onClick={() => navigate('/dashboard?tab=Studies')} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Container>
      </AppTheme>
    );
  }

  const isEditable = study.status !== 'ARCHIVED' && study.status !== 'COMPLETED' && study.status !== 'CANCELLED';

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard?tab=Studies')}
              sx={{ mr: 2 }}
            >
              Back to Studies
            </Button>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {study.title}
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="lg">
            <Paper sx={{ p: 3 }}>
              {/* Study Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h4" gutterBottom fontWeight={700}>
                    {study.title}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={study.status} color={getStatusColor(study.status)} />
                    {study.startDate && (
                      <Chip label={`Started: ${formatDate(study.startDate)}`} variant="outlined" size="small" />
                    )}
                    {study.endDate && (
                      <Chip
                        label={study.daysRemaining < 0 ? 'Ended' : `${study.daysRemaining} days left`}
                        color={study.daysRemaining < 7 ? 'error' : 'default'}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => setExportModalOpen(true)}
                  >
                    Export
                  </Button>
                  {study.status === 'COMPLETED' && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<ArchiveIcon />}
                      onClick={handleArchiveClick}
                    >
                      Archive
                    </Button>
                  )}
                  {study.status !== 'ARCHIVED' && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteClick}
                    >
                      Delete
                    </Button>
                  )}
                </Stack>
              </Stack>

              {/* Navigation Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={getActiveTab()}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                >
                  <Tab label="Overview" value="overview" />
                  {isEditable && <Tab label="Edit Study" value="edit" />}
                  <Tab label="Evaluation Tasks" value="evaluation-tasks" />
                  <Tab label="Participants" value="participants" />
                  <Tab label="Reviewers" value="reviewers" />
                  <Tab label="Quizzes" value="quizzes" />
                </Tabs>
              </Box>

              {/* Tab Content - Rendered via Outlet */}
              <Outlet context={{ study, loadStudy, studyId }} />
            </Paper>
          </Container>
        </Box>
      </Box>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        studyId={studyId}
        studyTitle={study?.title}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Study?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{study?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onClose={handleArchiveCancel}>
        <DialogTitle>Archive Study?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to archive "{study?.title}"? Archived studies cannot be edited.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleArchiveCancel} disabled={archiving}>Cancel</Button>
          <Button onClick={handleArchiveConfirm} color="secondary" variant="contained" disabled={archiving}>
            {archiving ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
};

export default StudyLayout;

