import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import {
  AppBar, Toolbar, CssBaseline, Box, Typography, Container, Paper,
  Button, IconButton, CircularProgress, Alert, Divider, Stack, Chip,
  Grid, Card, CardContent, List, ListItem, ListItemText, Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  Description as TextIcon,
  InsertDriveFile as FileIcon,
  Fingerprint as FingerprintIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Storage as StorageIcon,
  Label as LabelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { artifactService } from '../../services/artifactService';

const ArtifactDetails = () => {
  const { artifactId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const returnTo = location.state?.returnTo;
  const [artifact, setArtifact] = useState(null);
  const [assignedStudies, setAssignedStudies] = useState([]);
  const [contentPreview, setContentPreview] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadArtifactDetails();
  }, [artifactId]);

  const loadArtifactDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const [artifactRes, studiesRes] = await Promise.all([
        artifactService.getById(artifactId),
        artifactService.getArtifactStudies(artifactId)
      ]);

      setArtifact(artifactRes.data);
      setAssignedStudies(studiesRes.data);

      if (artifactRes.data.contentType?.startsWith('text/')) {
        loadContentPreview();
      }
    } catch (err) {
      console.error('Error loading artifact:', err);
      setError(err.response?.data?.message || 'Failed to load artifact details');
    } finally {
      setLoading(false);
    }
  };

  const loadContentPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await artifactService.download(artifactId);
      const blob = res.data;
      const text = await blob.text();
      const lines = text.split('\n').slice(0, 100);
      const preview = lines.join('\n');
      setContentPreview(preview + (text.split('\n').length > 100 ? '\n\n... (truncated)' : ''));
    } catch (err) {
      console.error('Failed to load content preview:', err);
      setContentPreview('Unable to load content preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!artifact) return;
    setDownloading(true);
    try {
      const res = await artifactService.download(artifactId);
      const blob = new Blob([res.data], {
        type: artifact.contentType || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.originalFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download artifact: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloading(false);
    }
  };

  const getFileIcon = (contentType) => {
    if (!contentType) return <FileIcon sx={{ fontSize: 60 }} />;
    if (contentType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 60 }} />;
    if (contentType === 'application/pdf') return <PdfIcon sx={{ fontSize: 60 }} />;
    if (contentType.includes('python') || contentType.includes('text/x-python'))
      return <CodeIcon sx={{ fontSize: 60 }} />;
    if (contentType.startsWith('text/')) return <TextIcon sx={{ fontSize: 60 }} />;
    return <FileIcon sx={{ fontSize: 60 }} />;
  };

  const getFileTypeLabel = (contentType) => {
    if (!contentType) return 'Unknown';
    if (contentType.startsWith('image/')) return 'Image';
    if (contentType === 'application/pdf') return 'PDF Document';
    if (contentType.includes('python')) return 'Python Code';
    if (contentType.includes('csv')) return 'CSV File';
    if (contentType.startsWith('text/')) return 'Text File';
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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

  if (error || !artifact) {
    return (
      <AppTheme>
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Alert severity="error">{error || 'Artifact not found'}</Alert>
          <Button onClick={() => navigate(returnTo || '/dashboard?tab=Artifacts')} sx={{ mt: 2 }}>Go Back</Button>
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
            <IconButton edge="start" color="inherit" onClick={() => navigate(returnTo || '/dashboard?tab=Artifacts')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Artifact Details
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="lg">
            {/* Header Section */}
            <Paper elevation={0} sx={{ p: 4, mb: 3, border: 1, borderColor: 'divider' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Box sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getFileIcon(artifact.contentType)}
                  </Box>
                </Grid>
                <Grid item xs={12} md={10}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                    {artifact.originalFilename}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={getFileTypeLabel(artifact.contentType)}
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label={formatFileSize(artifact.sizeBytes)}
                      variant="outlined"
                      size="small"
                    />
                    {artifact.width && artifact.height && (
                      <Chip
                        label={`${artifact.width}×${artifact.height}`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {artifact.pageCount && (
                      <Chip
                        label={`${artifact.pageCount} pages`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                      onClick={handleDownload}
                      disabled={downloading}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {downloading ? 'Downloading...' : 'Download File'}
                    </Button>
                    {user?.role === 'RESEARCHER' && (
                      <Button
                        variant="outlined"
                        startIcon={<AnalyticsIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        onClick={() => navigate(`/researcher/artifact/${artifactId}/analytics`)}
                      >
                        Open Analytics
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={3}>
              {/* Metadata Section */}
              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon color="primary" />
                    Metadata
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <FileIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>
                              File Name
                            </Typography>
                          </Stack>
                        }
                        secondary={artifact.originalFilename}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <StorageIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>
                              Content Type
                            </Typography>
                          </Stack>
                        }
                        secondary={artifact.contentType}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <StorageIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>
                              File Size
                            </Typography>
                          </Stack>
                        }
                        secondary={formatFileSize(artifact.sizeBytes)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>
                              Uploaded At
                            </Typography>
                          </Stack>
                        }
                        secondary={formatDate(artifact.createdAt)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>
                              Uploaded By
                            </Typography>
                          </Stack>
                        }
                        secondary={user?.fullName || user?.username}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <FingerprintIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={600}>
                              SHA-256 Hash
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Tooltip title="Click to copy" arrow>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main' }
                              }}
                              onClick={() => {
                                navigator.clipboard.writeText(artifact.sha256);
                                alert('Hash copied to clipboard!');
                              }}
                            >
                              {artifact.sha256}
                            </Typography>
                          </Tooltip>
                        }
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Assigned Studies Section */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color="primary" />
                    Assigned Studies
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {assignedStudies.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Not assigned to any studies yet
                      </Typography>
                    </Box>
                  ) : (
                    <List dense>
                      {assignedStudies.map((study) => (
                        <ListItem
                          key={study.id}
                          sx={{
                            mb: 1,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                          onClick={() => navigate(`/researcher/study/${study.id}`)}
                        >
                          <ListItemText
                            primary={study.title}
                            secondary={
                              <Chip
                                label={study.status}
                                size="small"
                                color={study.status === 'ACTIVE' ? 'success' : 'default'}
                                sx={{ mt: 0.5 }}
                              />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grid>

              {/* UC2-5: Tags Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LabelIcon color="primary" />
                      Tags
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  {artifact.tags && artifact.tags.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {artifact.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        sx={{
                          bgcolor: tag.color || '#3f51b5',
                          color: '#fff',
                          fontWeight: 600
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Tags are assigned automatically.
                  </Typography>
                )}
                </Paper>
              </Grid>

              {/* Content Preview Section for Text-based Files */}
              {artifact.contentType?.startsWith('text/') && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VisibilityIcon color="primary" />
                      Content Preview
                      <Chip label="First 100 lines" size="small" variant="outlined" sx={{ ml: 1 }} />
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {loadingPreview ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={30} />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          bgcolor: '#f5f5f5',
                          p: 2,
                          borderRadius: 1,
                          maxHeight: 500,
                          overflow: 'auto',
                          border: 1,
                          borderColor: 'divider'
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {contentPreview || 'No content available'}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Additional Information Card */}
              {(artifact.width || artifact.height || artifact.pageCount) && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Additional Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {artifact.width && artifact.height && (
                        <Grid item xs={12} sm={4}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Dimensions
                              </Typography>
                              <Typography variant="h6">
                                {artifact.width} × {artifact.height}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                pixels
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                      {artifact.pageCount && (
                        <Grid item xs={12} sm={4}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Page Count
                              </Typography>
                              <Typography variant="h6">
                                {artifact.pageCount}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                pages
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>

          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default ArtifactDetails;
