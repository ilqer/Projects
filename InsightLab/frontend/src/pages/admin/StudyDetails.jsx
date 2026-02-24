import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studyService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Box,
  Typography,
  Container,
  Paper,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArticleIcon from '@mui/icons-material/Article';
import RateReviewIcon from '@mui/icons-material/RateReview';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PeopleIcon from '@mui/icons-material/People';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningIcon from '@mui/icons-material/Warning';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`study-tabpanel-${index}`}
      aria-labelledby={`study-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminStudyDetails = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');


  useEffect(() => {
    loadStudyDetails();
  }, [studyId]);

  const loadStudyDetails = async () => {
    try {
      setLoading(true);
      const response = await studyService.getStudyById(studyId);
      setStudy(response.data);
    } catch (err) {
      console.error('Error loading study details:', err);
      setError('Failed to load study details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 3) loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, studyId]);

  const loadEnrollments = async () => {
    try {
      setEnrollLoading(true);
      setEnrollError('');
      const res = await studyService.getStudyEnrollments(studyId);
      setEnrollments(res.data || []);
    } catch (err) {
      console.error('Error loading enrollments:', err);
      setEnrollError(err.response?.data?.message || err.message || 'Failed to load participants');
    } finally {
      setEnrollLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'warning';
      case 'ACTIVE': return 'success';
      case 'PAUSED': return 'default';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setDeleteConfirmText('');
    setDeleteError('');
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmText('');
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError('');
      await studyService.deleteStudy(studyId);
      // Success - navigate back to studies list
      navigate('/admin/studies', { 
        state: { 
          message: `Study "${study.title}" has been permanently deleted.`,
          severity: 'success'
        }
      });
    } catch (err) {
      console.error('Error deleting study:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete study. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
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
          <IconButton onClick={() => navigate(-1)} sx={{ mt: 2 }}>
            <ArrowBackIcon /> Go Back
          </IconButton>
        </Container>
      </AppTheme>
    );
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
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Study Details (Admin View - Read Only)
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleDeleteClick}
              sx={{ mr: 2 }}
            >
              Delete Study
            </Button>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
          <Toolbar />
          <Container maxWidth="lg">
            {/* Header Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" gutterBottom fontWeight={700}>
                    {study.title}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip 
                      label={study.status} 
                      color={getStatusColor(study.status)} 
                      size="small" 
                    />
                    {study.blindedMode && (
                      <Chip 
                        icon={<VisibilityOffIcon />}
                        label="Blinded Mode" 
                        color="info" 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                    {study.daysRemaining !== null && study.daysRemaining !== undefined && (
                      <Chip 
                        label={study.daysRemaining < 0 ? 'Ended' : `${study.daysRemaining} days remaining`} 
                        color={study.daysRemaining < 7 ? 'error' : 'default'}
                        variant="outlined"
                        size="small" 
                      />
                    )}
                    <Chip 
                      label={`Study ID: ${study.id}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Stack>
                </Box>
              </Stack>

              {/* Key Stats Cards */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <PersonIcon color="primary" />
                        <Typography variant="caption" color="text.secondary">
                          Researcher
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={600}>
                        {study.researcherName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {study.researcherId}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <PeopleIcon color="success" />
                        <Typography variant="caption" color="text.secondary">
                          Participants
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={600}>
                        {study.maxParticipants || 'Unlimited'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Max allowed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <ArticleIcon color="info" />
                        <Typography variant="caption" color="text.secondary">
                          Artifacts
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={600}>
                        {study.artifacts?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total files
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <RateReviewIcon color="warning" />
                        <Typography variant="caption" color="text.secondary">
                          Criteria
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={600}>
                        {study.customCriteria?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Evaluation metrics
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Overview" />
                <Tab label="Artifacts" />
                <Tab label="Evaluation Criteria" />
                <Tab label="Participants" />
              </Tabs>

              {/* Overview Tab */}
              <TabPanel value={activeTab} index={0}>
                <Stack spacing={3}>
                  {study.description && (
                    <Box>
                      <Typography variant="h6" gutterBottom fontWeight={600}>
                        Description
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {study.description}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Objective
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {study.objective}
                    </Typography>
                  </Box>

                  <Divider />

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <List>
                        <ListItem>
                          <ListItemText 
                            primary="Start Date" 
                            secondary={formatDate(study.startDate)}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                        {study.endDate && (
                          <ListItem>
                            <ListItemText 
                              primary="End Date (Deadline)" 
                              secondary={formatDate(study.endDate)}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                          </ListItem>
                        )}
                        {study.comparisonType && (
                          <ListItem>
                            <ListItemText 
                              primary="Comparison Type" 
                              secondary={study.comparisonType.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <List>
                        <ListItem>
                          <ListItemText 
                            primary="Created At" 
                            secondary={formatDateTime(study.createdAt)}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Last Updated" 
                            secondary={formatDateTime(study.updatedAt)}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Blinded Mode" 
                            secondary={study.blindedMode ? 'Enabled (artifact metadata hidden)' : 'Disabled'}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </Stack>
              </TabPanel>

              {/* Artifacts Tab */}
              <TabPanel value={activeTab} index={1}>
                {study.artifacts && study.artifacts.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order</TableCell>
                          <TableCell>Display Label</TableCell>
                          <TableCell>Original Filename</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {study.artifacts.map((artifact, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Chip label={artifact.displayOrder + 1} size="small" color="primary" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {artifact.displayLabel || artifact.originalFilename}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {artifact.originalFilename}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={artifact.contentType} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatFileSize(artifact.sizeBytes)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No artifacts have been added to this study yet.</Alert>
                )}
              </TabPanel>

              {/* Evaluation Criteria Tab */}
              <TabPanel value={activeTab} index={2}>
                {study.customCriteria && study.customCriteria.length > 0 ? (
                  <Stack spacing={2}>
                    {study.customCriteria.map((criterion, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Chip 
                            label={criterion.displayOrder + 1} 
                            size="small" 
                            color="primary" 
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                              <Typography variant="h6" fontWeight={600}>
                                {criterion.name}
                              </Typography>
                              <Chip 
                                label={criterion.ratingFormat.replace(/_/g, ' ')} 
                                size="small" 
                                color="secondary" 
                              />
                            </Stack>
                            {criterion.description && (
                              <Typography variant="body2" color="text.secondary" mb={1}>
                                {criterion.description}
                              </Typography>
                            )}
                            {criterion.ratingOptions && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Rating Options:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {criterion.ratingOptions}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">No custom evaluation criteria have been defined for this study.</Alert>
                )}
              </TabPanel>

              {/* Participants Tab */}
              <TabPanel value={activeTab} index={3}>
                {enrollLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : enrollError ? (
                  <Alert severity="error">{enrollError}</Alert>
                ) : enrollments.length === 0 ? (
                  <Alert severity="info">No participants enrolled in this study.</Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Participant</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Enrolled At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {enrollments.map((e) => (
                          <TableRow key={e.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {e.participantName || e.participant?.name || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {e.participantEmail || e.participant?.email || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip label={e.status || 'N/A'} size="small" />
                            </TableCell>
                            <TableCell>
                              {formatDateTime(e.createdAt || e.enrolledAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            </Paper>

            {/* Admin Note */}
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                Admin Read-Only Access
              </Typography>
              <Typography variant="body2">
                You are viewing this study as an administrator. You cannot edit or modify study details. 
                Only the study owner (researcher) can make changes.
              </Typography>
            </Alert>
          </Container>
        </Box>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            <Typography variant="h6" fontWeight={700}>
              Permanently Delete Study?
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                ⚠️ This action is IRREVERSIBLE!
              </Typography>
              <Typography variant="body2">
                This will permanently delete:
              </Typography>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>All study configuration and settings</li>
                <li>All evaluation criteria</li>
                <li>All associated artifacts and data</li>
                <li>All participant assignments and collected data</li>
              </ul>
            </Alert>

            <DialogContentText sx={{ mb: 2 }}>
              You are about to permanently delete the study:
            </DialogContentText>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {study?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Study ID: {study?.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Researcher: {study?.researcherName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {study?.status}
              </Typography>
            </Paper>

            <DialogContentText sx={{ mb: 2 }}>
              To confirm deletion, please type <strong>DELETE</strong> in the box below:
            </DialogContentText>

            <TextField
              autoFocus
              fullWidth
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              error={!!deleteError}
              helperText={deleteError}
              disabled={deleteLoading}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button 
              onClick={handleDeleteCancel}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
              startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteForeverIcon />}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppTheme>
  );
};

export default AdminStudyDetails;
