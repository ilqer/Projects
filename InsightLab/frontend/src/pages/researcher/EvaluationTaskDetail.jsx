import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, IconButton, Button, Alert, CircularProgress,
  Chip, Grid, Divider, Card, CardContent, AppBar, Toolbar, CssBaseline,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack
} from '@mui/material';
import { ArrowBack, People, Edit, Delete, Assessment, InsertDriveFile, Visibility } from '@mui/icons-material';
import { researcherEvaluationService, artifactService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const EvaluationTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [artifacts, setArtifacts] = useState([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await researcherEvaluationService.getTask(id);
      setTask(response.data);
      
      // Load artifact details if artifacts exist
      if (response.data.artifacts && response.data.artifacts.length > 0) {
        loadArtifactDetails(response.data.artifacts);
      }
    } catch (err) {
      console.error('Error loading task:', err);
      setError('Failed to load task details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadArtifactDetails = async (artifactReferences) => {
    try {
      setLoadingArtifacts(true);
      const artifactDetails = await Promise.all(
        artifactReferences.map(async (ref) => {
          try {
            if (ref.artifactId) {
              const artifactRes = await artifactService.getArtifactById(ref.artifactId);
              return {
                ...ref,
                artifactDetails: artifactRes.data
              };
            }
            return ref;
          } catch (err) {
            console.error(`Error loading artifact ${ref.artifactId}:`, err);
            return ref; // Return reference even if details fail to load
          }
        })
      );
      setArtifacts(artifactDetails);
    } catch (err) {
      console.error('Error loading artifact details:', err);
    } finally {
      setLoadingArtifacts(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this evaluation task? This action cannot be undone.')) {
      try {
        await researcherEvaluationService.deleteTask(id);
        navigate('/researcher/evaluation-tasks');
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'COMPLETED':
        return 'primary';
      case 'ARCHIVED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate('/researcher/evaluation-tasks')} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Task Details
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  if (error || !task) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate('/researcher/evaluation-tasks')} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Task Details
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Container maxWidth="lg">
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || 'Task not found'}
              </Alert>
              <Button onClick={() => task?.studyId ? navigate(`/researcher/study/${task.studyId}/evaluation-tasks`) : navigate('/researcher/evaluation-tasks')}>
                Back to Tasks
              </Button>
            </Container>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  const content = (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          Task Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<People />}
            onClick={() => navigate(`/researcher/evaluation-tasks/${id}/participants`)}
          >
            View Participants
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Assessment />}
            onClick={() => navigate(`/researcher/evaluation-tasks/${id}/submissions`)}
          >
            Review Submissions
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {task.title}
            </Typography>
            <Chip
              label={task.status}
              color={getStatusColor(task.status)}
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {task.description || 'No description provided'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Instructions
            </Typography>
            <Typography variant="body1" paragraph>
              {task.instructions || 'No instructions provided'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Created By
            </Typography>
            <Typography variant="body1">
              {task.createdByName}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Created At
            </Typography>
            <Typography variant="body1">
              {formatDate(task.createdAt)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Due Date
            </Typography>
            <Typography variant="body1">
              {formatDate(task.dueDate)}
            </Typography>
          </Grid>

          {task.updatedAt && (
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body1">
                {formatDate(task.updatedAt)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Artifact Details Section */}
      {task.artifacts && task.artifacts.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InsertDriveFile color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Artifact Details
            </Typography>
            <Chip label={`${task.artifacts.length} artifact${task.artifacts.length > 1 ? 's' : ''}`} size="small" color="primary" />
          </Box>
          
          {loadingArtifacts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Order</strong></TableCell>
                    <TableCell><strong>Display Label</strong></TableCell>
                    <TableCell><strong>Filename</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Size</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {artifacts.map((artifact, index) => (
                    <TableRow key={artifact.id || index} hover>
                      <TableCell>
                        {artifact.displayOrder !== null && artifact.displayOrder !== undefined
                          ? artifact.displayOrder + 1
                          : index + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={artifact.displayLabel ? 500 : 400}>
                          {artifact.displayLabel || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <InsertDriveFile fontSize="small" color="action" />
                          <Typography variant="body2">
                            {artifact.artifactDetails?.originalFilename || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={artifact.artifactDetails?.contentType?.split('/')[1]?.toUpperCase() || artifact.type || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(artifact.artifactDetails?.sizeBytes)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {artifact.blinded ? (
                          <Chip label="Blinded" size="small" color="warning" />
                        ) : (
                          <Chip label="Visible" size="small" color="success" />
                        )}
                      </TableCell>
                      <TableCell>
                        {artifact.artifactId && (
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/researcher/artifact/${artifact.artifactId}`, {
                              state: { returnTo: `/researcher/evaluation-tasks/${id}` }
                            })}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {artifacts.length === 0 && !loadingArtifacts && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No artifact details available
            </Typography>
          )}
        </Paper>
      )}
    </Container>
  );

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => task?.studyId ? navigate(`/researcher/study/${task.studyId}/evaluation-tasks`) : navigate('/researcher/evaluation-tasks')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Task Details
            </Typography>
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

export default EvaluationTaskDetail;
