import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsightsIcon from '@mui/icons-material/Insights';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArticleIcon from '@mui/icons-material/Article';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneSpace } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import { artifactService } from '../../services/artifactService';

const CODE_EXT = new Set(['java', 'js', 'ts', 'py', 'cpp', 'c', 'cs', 'go']);
const JSON_EXT = new Set(['json', 'yaml', 'yml']);
const TEXT_EXT = new Set(['txt', 'md', 'log']);
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif']);
const PDF_EXT = new Set(['pdf']);

const languageMap = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  go: 'go',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml'
};

const ArtifactAnalyticsPage = () => {
  const { studyId, artifactId } = useParams();
  const navigate = useNavigate();
  const [artifact, setArtifact] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewState, setPreviewState] = useState({
    kind: 'unsupported',
    content: '',
    url: '',
    error: '',
    loading: true
  });
  const previewUrlRef = useRef(null);

  const extension = useMemo(() => {
    if (!artifact?.originalFilename) return '';
    const idx = artifact.originalFilename.lastIndexOf('.');
    return idx >= 0 ? artifact.originalFilename.slice(idx + 1).toLowerCase() : '';
  }, [artifact]);

  const detectedCategory = useMemo(() => {
    if (CODE_EXT.has(extension)) return 'Code';
    if (JSON_EXT.has(extension)) return 'JSON/YAML';
    if (TEXT_EXT.has(extension)) return 'Text';
    if (IMAGE_EXT.has(extension)) return 'Image';
    if (PDF_EXT.has(extension)) return 'PDF';
    return 'Binary/Other';
  }, [extension]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [artifactRes, analyticsRes] = await Promise.all([
        artifactService.getById(artifactId),
        artifactService.getAnalytics(artifactId)
      ]);
      setArtifact(artifactRes.data);
      setAnalytics(analyticsRes.data);
      await loadPreview(artifactRes.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
      setError(err.response?.data?.message || 'Unable to load artifact analytics.');
    } finally {
      setLoading(false);
    }
  }, [artifactId]);

  useEffect(() => {
    fetchData();
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [fetchData]);

  const loadPreview = async (artifactData) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewState(prev => ({ ...prev, loading: true, error: '', url: '' }));
    const ext = extension || detectExtension(artifactData?.originalFilename);
    const isCode = CODE_EXT.has(ext);
    const isJson = JSON_EXT.has(ext);
    const isText = TEXT_EXT.has(ext);
    const isImage = IMAGE_EXT.has(ext);
    const isPdf = PDF_EXT.has(ext);

    try {
      const response = await artifactService.download(artifactId);
      const blob = response.data;

      if (isCode || isJson || isText) {
        const text = await blob.text();
        const formatted = isJson ? prettyPrintJson(text) : text;
        setPreviewState(prev => ({ ...prev, kind: isCode ? 'code' : isJson ? 'json' : 'text', content: formatted, url: '', loading: false }));
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      if (isImage) {
        previewUrlRef.current = objectUrl;
        setPreviewState({ kind: 'image', content: '', url: objectUrl, error: '', loading: false });
      } else if (isPdf) {
        previewUrlRef.current = objectUrl;
        setPreviewState({ kind: 'pdf', content: '', url: objectUrl, error: '', loading: false });
      } else {
        URL.revokeObjectURL(objectUrl);
        setPreviewState({ kind: 'unsupported', content: '', url: '', error: '', loading: false });
      }
    } catch (err) {
      console.error('Preview load failed', err);
      setPreviewState(prev => ({
        ...prev,
        loading: false,
        error: 'Unable to generate preview for this artifact.'
      }));
    }
  };

  const detectExtension = (filename) => {
    if (!filename || !filename.includes('.')) return '';
    return filename.split('.').pop().toLowerCase();
  };

  const prettyPrintJson = (text) => {
    try {
      const obj = JSON.parse(text);
      return JSON.stringify(obj, null, 2);
    } catch {
      return text;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined) return 'Unknown';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exp);
    return `${value.toFixed(1)} ${units[exp]}`;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  const language = languageMap[extension] || 'text';

  const renderPreview = () => {
    if (previewState.loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (previewState.error) {
      return <Alert severity="warning">{previewState.error}</Alert>;
    }

    if (previewState.kind === 'code' || previewState.kind === 'json') {
      return (
        <SyntaxHighlighter
          language={language}
          style={duotoneSpace}
          customStyle={{ maxHeight: 520, borderRadius: 8, fontSize: '0.85rem' }}
          wrapLines
          showLineNumbers
        >
          {previewState.content}
        </SyntaxHighlighter>
      );
    }

    if (previewState.kind === 'text') {
      return (
        <Box
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            bgcolor: 'background.default',
            borderRadius: 2,
            p: 2,
            maxHeight: 520,
            overflow: 'auto'
          }}
          component="pre"
        >
          {previewState.content}
        </Box>
      );
    }

    if (previewState.kind === 'image') {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <img
            src={previewState.url}
            alt={artifact?.originalFilename}
            style={{ maxWidth: '100%', maxHeight: 520, borderRadius: 12 }}
          />
        </Box>
      );
    }

    if (previewState.kind === 'pdf') {
      return (
        <Box sx={{ height: 520 }}>
          <iframe
            src={previewState.url}
            title="Artifact PDF preview"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
          />
        </Box>
      );
    }

    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <InsertDriveFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">No preview available for this file type.</Typography>
      </Box>
    );
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

  const handleDownload = async () => {
    try {
      const res = await artifactService.download(artifactId);
      const blob = new Blob([res.data], {
        type: artifact?.contentType || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact?.originalFilename || 'artifact';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download artifact.');
    }
  };

  if (error) {
    return (
      <AppTheme>
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="outlined" onClick={() => navigate(-1)}>Go Back</Button>
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
            <IconButton edge="start" color="inherit" onClick={() => navigate(studyId ? `/researcher/study/${studyId}` : -1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Artifact Analytics
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="xl">
            <Paper elevation={0} sx={{ p: 4, mb: 3, border: 1, borderColor: 'divider', borderRadius: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {artifact?.originalFilename}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`Extension: .${extension || 'unknown'}`} size="small" />
                    <Chip label={`Detected: ${detectedCategory}`} color="primary" size="small" />
                    <Chip label={`Size: ${formatFileSize(artifact?.sizeBytes)}`} size="small" variant="outlined" />
                    <Chip label={`Uploaded: ${formatDate(artifact?.createdAt)}`} size="small" variant="outlined" />
                  </Stack>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<InsertDriveFileIcon />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<InsightsIcon />}
                    onClick={fetchData}
                  >
                    Refresh Metrics
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    {detectedCategory === 'Code' && <CodeIcon color="primary" />}
                    {detectedCategory === 'JSON/YAML' && <DescriptionIcon color="primary" />}
                    {detectedCategory === 'Text' && <ArticleIcon color="primary" />}
                    {detectedCategory === 'Image' && <ImageIcon color="primary" />}
                    {detectedCategory === 'PDF' && <PictureAsPdfIcon color="primary" />}
                    {(detectedCategory === 'Binary/Other') && <InsertDriveFileIcon color="primary" />}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Artifact Preview
                    </Typography>
                  </Stack>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Automatic preview + metrics are generated based on file extension. Use this view to inspect the artifact without affecting any study flows.
                  </Alert>
                  {renderPreview()}
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <InsightsIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Analytics
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Metrics are grouped by category. Only relevant cards appear for each file type.
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {(!analytics || !analytics.metricGroups || analytics.metricGroups.length === 0) ? (
                    <Alert severity="warning">No metrics available for this artifact.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {analytics.metricGroups.map((group) => (
                        <Paper key={group.key} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            {group.title}
                          </Typography>
                          <List dense disablePadding>
                            {group.metrics?.map((metric, idx) => (
                              <ListItem key={`${group.key}-${idx}`} sx={{ px: 0, alignItems: 'flex-start' }}>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {metric.label}: <Typography component="span" variant="body2" color="primary">{metric.value}</Typography>
                                    </Typography>
                                  }
                                  secondary={
                                    metric.description ? (
                                      <Typography variant="caption" color="text.secondary">
                                        {metric.description}
                                      </Typography>
                                    ) : null
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default ArtifactAnalyticsPage;
