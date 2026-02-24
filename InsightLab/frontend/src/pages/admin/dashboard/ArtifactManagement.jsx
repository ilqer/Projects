import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Paper,
  InputAdornment,
} from '@mui/material';

import {
  Search,
  Visibility,
  Refresh,
  Download,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  Description as TextIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';

import { artifactService } from '../../../services/api';

const ArtifactManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View dialog state
  const [openView, setOpenView] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

  const fetchArtifacts = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await artifactService.getAllArtifacts();
      setArtifacts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to load artifacts.';
      setError(status ? `(${status}) ${msg}` : msg);
      setArtifacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const filteredArtifacts = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return artifacts;

    return artifacts.filter((a) =>
      (a.originalFilename || '').toLowerCase().includes(s)
    );
  }, [artifacts, searchTerm]);

  const totalCount = filteredArtifacts.length;

  const handleView = async (id) => {
    try {
      setOpenView(true);
      setSelectedId(id);
      setSelectedArtifact(null);
      setViewError('');
      setViewLoading(true);

      const res = await artifactService.getArtifactById(id);
      setSelectedArtifact(res.data);
    } catch (e) {
      setViewError(
        e?.response?.data?.message || 'Failed to load artifact details.'
      );
    } finally {
      setViewLoading(false);
    }
  };

  const handleDownload = async (id, filenameHint) => {
    try {
      const res = await artifactService.downloadArtifact(id);

      const contentType =
        res.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;

      const cd = res.headers?.['content-disposition'];
      let filename = filenameHint || `artifact-${id}`;

      if (cd) {
        const matchStar = cd.match(/filename\*\=UTF-8''([^;]+)/i);
        const matchPlain = cd.match(/filename\=\"?([^\";]+)\"?/i);
        if (matchStar?.[1]) filename = decodeURIComponent(matchStar[1]);
        else if (matchPlain?.[1]) filename = matchPlain[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message || e?.message || 'Download failed.';
      alert(status ? `(${status}) ${msg}` : msg);
    }
  };

  const closeView = () => {
    setOpenView(false);
    setSelectedId(null);
    setSelectedArtifact(null);
    setViewError('');
  };

  const formatBytes = (bytes) => {
    if (typeof bytes !== 'number') return '-';
    // sizeBytes 0 geliyorsa UI "0 B" yazabilir; istersen "-" gösterelim:
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const getFileIcon = (contentType) => {
    if (!contentType) return <FileIcon sx={{ fontSize: 48 }} />;
    if (contentType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 48 }} />;
    if (contentType === 'application/pdf') return <PdfIcon sx={{ fontSize: 48 }} />;
    if (contentType.startsWith('text/')) return <TextIcon sx={{ fontSize: 48 }} />;
    if (
      contentType.includes('java') ||
      contentType.includes('python') ||
      contentType.includes('javascript')
    )
      return <CodeIcon sx={{ fontSize: 48 }} />;
    return <FileIcon sx={{ fontSize: 48 }} />;
  };

  const getFileTypeLabel = (contentType) => {
    if (!contentType) return 'Unknown';
    if (contentType.startsWith('image/')) return 'Image';
    if (contentType === 'application/pdf') return 'PDF';
    if (contentType.startsWith('text/')) return 'Text';
    return contentType;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Artifacts
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View stored artifacts
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchArtifacts}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Total */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700}>
                {totalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            placeholder="Search artifacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Artifact</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredArtifacts.map((artifact) => (
                    <TableRow key={artifact.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {artifact.originalFilename || 'Unnamed file'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="flex-end"
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleView(artifact.id)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDownload(artifact.id, artifact.originalFilename)
                            }
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredArtifacts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Box
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            color: 'text.secondary',
                          }}
                        >
                          No artifacts found.
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* View Dialog (NO download inside) */}
      <Dialog open={openView} onClose={closeView} fullWidth maxWidth="md">
        <DialogTitle>Artifact Details</DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : viewError ? (
            <Alert severity="error">{viewError}</Alert>
          ) : selectedArtifact ? (
            <Box>
              {/* Header card */}
              <Paper
                elevation={0}
                sx={{ p: 3, mb: 2, border: 1, borderColor: 'divider' }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid
                    item
                    xs={12}
                    sm={2}
                    sx={{ display: 'flex', justifyContent: 'center' }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'primary.50',
                        color: 'primary.main',
                      }}
                    >
                      {getFileIcon(selectedArtifact.contentType)}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={10}>
                    <Typography variant="h6" fontWeight={800}>
                      {selectedArtifact.originalFilename || 'Unnamed file'}
                    </Typography>

                    {selectedArtifact.displayLabel && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Display label: {selectedArtifact.displayLabel}
                      </Typography>
                    )}

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1 }}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        label={getFileTypeLabel(selectedArtifact.contentType)}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={formatBytes(selectedArtifact.sizeBytes)}
                        size="small"
                        variant="outlined"
                      />
                      {selectedArtifact.pageCount ? (
                        <Chip
                          label={`${selectedArtifact.pageCount} pages`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                      {selectedArtifact.width && selectedArtifact.height ? (
                        <Chip
                          label={`${selectedArtifact.width}×${selectedArtifact.height}`}
                          size="small"
                          variant="outlined"
                        />
                      ) : null}
                      {selectedArtifact.duplicate === true ? (
                        <Chip
                          label="Duplicate"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      ) : null}
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              {/* Metadata */}
              <Typography variant="subtitle1" fontWeight={700}>
                Metadata
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedArtifact.id || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedArtifact.createdAt
                      ? new Date(selectedArtifact.createdAt).toLocaleString()
                      : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Content Type
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedArtifact.contentType || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatBytes(selectedArtifact.sizeBytes)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Pages
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedArtifact.pageCount ?? '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Dimensions
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedArtifact.width && selectedArtifact.height
                      ? `${selectedArtifact.width} × ${selectedArtifact.height}`
                      : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Tags
                  </Typography>
                  {Array.isArray(selectedArtifact.tags) &&
                  selectedArtifact.tags.length > 0 ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mt: 0.75 }}
                      useFlexGap
                    >
                      {selectedArtifact.tags.map((t) => (
                        <Chip
                          key={t.id || t.name}
                          label={t.name || t.label || `Tag #${t.id}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" fontWeight={600}>
                      -
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeView}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ArtifactManagement;
