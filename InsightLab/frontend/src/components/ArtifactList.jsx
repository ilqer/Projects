// ArtifactList.jsx
import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Stack, Tooltip,
  Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  List, ListItem, ListItemText, ListItemButton, Checkbox, TextField, Alert, IconButton
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  Description as TextIcon,
  Fingerprint as FingerprintIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  DeleteOutline as DeleteIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneSpace } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { artifactService } from '../services/artifactService';
import { studyService } from '../services/api';

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

const ArtifactList = ({ artifacts, onDeleted }) => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState({});
  const [deleting, setDeleting] = useState({});
  const [localArtifacts, setLocalArtifacts] = useState(artifacts || []);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetArtifact, setTargetArtifact] = useState(null);

  // UC2-6: Assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningArtifact, setAssigningArtifact] = useState(null);
  const [myStudies, setMyStudies] = useState([]);
  const [assignedStudies, setAssignedStudies] = useState([]);
  const [loadingStudies, setLoadingStudies] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewingArtifact, setPreviewingArtifact] = useState(null);
  const [previewState, setPreviewState] = useState({
    kind: 'unsupported',
    content: '',
    url: '',
    error: '',
    loading: true
  });
  const previewUrlRef = useRef(null);

  // keep local copy in sync if parent changes list
  React.useEffect(() => setLocalArtifacts(artifacts || []), [artifacts]);

  const artifactCount = localArtifacts?.length || 0;

  const gridSizes = useMemo(() => {
    if (artifactCount >= 3) {
      return { sm: 6, md: 4, lg: 4, xl: 4 };
    }
    if (artifactCount === 2) {
      return { sm: 6, md: 6, lg: 6, xl: 6 };
    }
    return { sm: 12, md: 8, lg: 6, xl: 6 };
  }, [artifactCount]);

  const getFileIcon = (contentType) => {
    if (contentType?.startsWith('image/')) return <ImageIcon />;
    if (contentType === 'application/pdf') return <PdfIcon />;
    if (contentType?.includes('python') || contentType?.includes('text/x-python')) return <CodeIcon />;
    if (contentType?.startsWith('text/')) return <TextIcon />;
    return <FileIcon />;
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
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getFileTypeLabel = (contentType) => {
    if (contentType?.startsWith('image/')) return 'Image';
    if (contentType === 'application/pdf') return 'PDF';
    if (contentType?.includes('python')) return 'Python';
    if (contentType?.includes('csv')) return 'CSV';
    if (contentType?.startsWith('text/')) return 'Text';
    return 'File';
  };

  const getFilenameFromHeaders = (headers, fallback) => {
    const cd = headers?.['content-disposition'] || headers?.['Content-Disposition'];
    if (!cd) return fallback;
    const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
    const raw = match?.[1] || match?.[2];
    if (!raw) return fallback;
    try { return decodeURIComponent(raw); } catch { return raw; }
  };

  const handleDownload = async (artifact) => {
    setDownloading((s) => ({ ...s, [artifact.id]: true }));
    try {
      const res = await artifactService.download(artifact.id);
      const blob = new Blob(
        [res.data],
        { type: artifact.contentType || res.headers?.['content-type'] || 'application/octet-stream' }
      );
      const filename = getFilenameFromHeaders(res.headers, artifact.originalFilename || `artifact-${artifact.id}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
    } finally {
      setDownloading((s) => ({ ...s, [artifact.id]: false }));
    }
  };

  // OPEN confirm dialog
  const requestDelete = (artifact) => {
    setTargetArtifact(artifact);
    setConfirmOpen(true);
  };

  // PERFORM delete after user confirms
  const performDelete = async () => {
    if (!targetArtifact) return;
    const artifact = targetArtifact;
    setDeleting((s) => ({ ...s, [artifact.id]: true }));
    try {
      await artifactService.delete(artifact.id);
      if (typeof onDeleted === 'function') {
        onDeleted(artifact.id);
      } else {
        setLocalArtifacts((list) => list.filter((a) => a.id !== artifact.id));
      }
      setConfirmOpen(false);
      setTargetArtifact(null);
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeleting((s) => ({ ...s, [artifact.id]: false }));
    }
  };

  // UC2-6: Open assign dialog
  const handleAssignClick = async (artifact) => {
    setAssigningArtifact(artifact);
    setLoadingStudies(true);
    setAssignDialogOpen(true);

    try {
      // Load user's studies and currently assigned studies
      const [studiesRes, assignedRes] = await Promise.all([
        studyService.getMyStudies(),
        artifactService.getArtifactStudies(artifact.id)
      ]);
      setMyStudies(studiesRes.data);
      setAssignedStudies(assignedRes.data.map(s => s.id));
    } catch (error) {
      console.error('Error loading studies:', error);
    } finally {
      setLoadingStudies(false);
    }
  };

  // UC2-6: Toggle study assignment
  const handleToggleStudy = async (studyId) => {
    if (!assigningArtifact) return;

    setAssigning(true);
    try {
      const isAssigned = assignedStudies.includes(studyId);

      if (isAssigned) {
        await artifactService.unassignFromStudy(assigningArtifact.id, studyId);
        setAssignedStudies(prev => prev.filter(id => id !== studyId));
      } else {
        await artifactService.assignToStudy(assigningArtifact.id, studyId);
        setAssignedStudies(prev => [...prev, studyId]);
      }
    } catch (error) {
      console.error('Error toggling assignment:', error);
      alert('Failed to update assignment: ' + (error.response?.data?.message || error.message));
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setAssigningArtifact(null);
    setMyStudies([]);
    setAssignedStudies([]);
  };

  // Preview functions
  const getExtension = (filename) => {
    if (!filename) return '';
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
  };

  const prettyPrintJson = (text) => {
    try {
      const obj = JSON.parse(text);
      return JSON.stringify(obj, null, 2);
    } catch {
      return text;
    }
  };

  const handleOpenPreview = async (artifact) => {
    setPreviewingArtifact(artifact);
    setPreviewDialogOpen(true);
    
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewState({ kind: 'unsupported', content: '', url: '', error: '', loading: true });

    const ext = getExtension(artifact.originalFilename);
    const isCode = CODE_EXT.has(ext);
    const isJson = JSON_EXT.has(ext);
    const isText = TEXT_EXT.has(ext);
    const isImage = IMAGE_EXT.has(ext);
    const isPdf = PDF_EXT.has(ext);

    try {
      const response = await artifactService.download(artifact.id);
      const blob = response.data;

      if (isCode || isJson || isText) {
        const text = await blob.text();
        const formatted = isJson ? prettyPrintJson(text) : text;
        setPreviewState({ 
          kind: isCode ? 'code' : isJson ? 'json' : 'text', 
          content: formatted, 
          url: '', 
          error: '', 
          loading: false 
        });
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
      setPreviewState({
        kind: 'unsupported',
        content: '',
        url: '',
        error: 'Unable to generate preview for this artifact.',
        loading: false
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
    setPreviewingArtifact(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

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

    const ext = getExtension(previewingArtifact?.originalFilename);
    const language = languageMap[ext] || 'text';

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
            alt={previewingArtifact?.originalFilename}
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
        <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">No preview available for this file type.</Typography>
      </Box>
    );
  };

  if (!localArtifacts || localArtifacts.length === 0) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" mb={1}>
          No artifacts uploaded yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload your first artifact to get started
        </Typography>
      </Card>
    );
  }

  return (
    <>
      <Grid
        container
        spacing={2}
        justifyContent="flex-start"
      >
        {localArtifacts.map((artifact) => (
          <Grid
            item
            xs={12}
            sm={gridSizes.sm}
            md={gridSizes.md}
            lg={gridSizes.lg}
            xl={gridSizes.xl}
            key={artifact.id}
          >
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: 1, borderColor: 'divider',
                transition: 'all 0.3s',
                '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
                    {getFileIcon(artifact.contentType)}
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap title={artifact.originalFilename}>
                      {artifact.originalFilename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(artifact.sizeBytes)}
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={1} mb={2}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={getFileTypeLabel(artifact.contentType)} size="small" color="primary" variant="outlined" />
                    {artifact.width && artifact.height && (
                      <Chip label={`${artifact.width}×${artifact.height}`} size="small" variant="outlined" />
                    )}
                    {artifact.pageCount && (
                      <Chip label={`${artifact.pageCount} pages`} size="small" variant="outlined" />
                    )}
                  </Stack>
                </Stack>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Uploaded: {formatDate(artifact.createdAt)}
                  </Typography>
                </Box>

                {artifact.duplicate && (
                  <Box sx={{ mt: 2, p: 1, borderRadius: 1, bgcolor: 'warning.light' }}>
                    <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                      Possible duplicate file detected.
                    </Typography>
                  </Box>
                )}


                {/* Actions */}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleOpenPreview(artifact)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Preview
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/researcher/artifact/${artifact.id}`)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    View
                  </Button>

                  <Button
                    size="small"
                    startIcon={downloading[artifact.id] ? <CircularProgress size={16} /> : <DownloadIcon />}
                    disabled={!!downloading[artifact.id]}
                    onClick={() => handleDownload(artifact)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {downloading[artifact.id] ? 'Downloading…' : 'Download'}
                  </Button>

                  <Button
                    size="small"
                    color="primary"
                    variant="outlined"
                    startIcon={<AssignmentIcon />}
                    onClick={() => handleAssignClick(artifact)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Assign
                  </Button>

                  <Button
                    size="small"
                    color="error"
                    startIcon={deleting[artifact.id] ? <CircularProgress size={16} /> : <DeleteIcon />}
                    disabled={!!deleting[artifact.id]}
                    onClick={() => requestDelete(artifact)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {deleting[artifact.id] ? 'Deleting…' : 'Delete'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="delete-artifact-title"
      >
        <DialogTitle id="delete-artifact-title">Delete Artifact</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete “{targetArtifact?.originalFilename}”?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={performDelete}
            disabled={targetArtifact ? !!deleting[targetArtifact.id] : false}
            startIcon={targetArtifact && deleting[targetArtifact.id] ? <CircularProgress size={16} /> : null}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {targetArtifact && deleting[targetArtifact.id] ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* UC2-6: Assign to Study Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign to Studies
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {assigningArtifact?.originalFilename}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingStudies ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : myStudies.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                You don't have any studies yet. Create a study first to assign artifacts.
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {myStudies.map((study) => {
                const isAssigned = assignedStudies.includes(study.id);
                return (
                  <ListItem key={study.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleToggleStudy(study.id)}
                      disabled={assigning}
                      dense
                    >
                      <Checkbox
                        edge="start"
                        checked={isAssigned}
                        tabIndex={-1}
                        disableRipple
                        disabled={assigning}
                      />
                      <ListItemText
                        primary={study.title}
                        secondary={
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip
                              label={study.status}
                              size="small"
                              color={study.status === 'ACTIVE' ? 'success' : 'default'}
                            />
                            {study.comparisonType && (
                              <Chip
                                label={study.comparisonType.replace(/-/g, ' ')}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" component="div">
                Artifact Preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {previewingArtifact?.originalFilename}
              </Typography>
            </Box>
            <IconButton onClick={handleClosePreview} edge="end">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Automatic preview + metrics are generated based on file extension. Use this view to inspect the artifact without affecting any study flows.
          </Alert>
          {renderPreview()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ArtifactList;
