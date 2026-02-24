import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, List, ListItem, ListItemIcon,
  ListItemText, IconButton, LinearProgress, Alert, Chip, Stack
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { artifactService } from '../services/artifactService';

const ArtifactUploader = ({
  open,
  onClose,
  onUploaded,
  studyId = null,
  existingArtifacts = [], // ✅ NEW: parent'tan mevcut artifact listesi
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState('');

  // ✅ NEW: mevcut isimleri hızlı kontrol için set'e çevir
  const existingNames = useMemo(() => {
    return new Set((existingArtifacts || []).map(a => a.originalFilename));
  }, [existingArtifacts]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setUploadResults([]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // ✅ NEW: Aynı isim kontrolü (backend'e gitmeden)
    const nameConflicts = selectedFiles.filter(f => existingNames.has(f.name));
    if (nameConflicts.length > 0) {
      setError(
        `Bu isimde artifact zaten var: ${nameConflicts.map(f => f.name).join(', ')}. Yükleme iptal edildi.`
      );
      return; // ❌ upload çağrısı yok
    }

    try {
      setUploading(true);
      setError('');

      const response = await artifactService.upload(selectedFiles, studyId);

      // Process results to separate duplicates (SHA-256 duplicate)
      const results = (response.data || []).map(artifact => ({
        ...artifact,
        isDuplicate: artifact.duplicate === true,
      }));

      setUploadResults(results);

      // If there are any successful uploads (non-duplicates), notify parent
      const successfulUploads = results.filter(r => !r.isDuplicate);
      if (successfulUploads.length > 0) {
        onUploaded?.();
      }

      // Clear selected files after showing results
      setTimeout(() => {
        if (results.every(r => r.isDuplicate)) {
          // If all are duplicates, keep the dialog open
          setSelectedFiles([]);
        } else {
          // If some succeeded, close after a delay
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);

      const status = err?.response?.status;
      if (status === 409) {
        setError('Bu isimde artifact zaten var. Yükleme iptal edildi.');
      } else {
        setError(err.response?.data?.message || 'Failed to upload files');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setError('');
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const duplicateCount = uploadResults.filter(r => r.isDuplicate).length;
  const successCount = uploadResults.filter(r => !r.isDuplicate).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Upload Artifacts
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {uploadResults.length > 0 && (
          <Alert
            severity={duplicateCount > 0 ? "warning" : "success"}
            sx={{ mb: 2 }}
            icon={duplicateCount > 0 ? <WarningIcon /> : <CheckCircleIcon />}
          >
            <Stack spacing={0.5}>
              {successCount > 0 && (
                <Typography variant="body2" fontWeight={600}>
                  ✓ {successCount} file{successCount > 1 ? 's' : ''} uploaded successfully
                </Typography>
              )}
              {duplicateCount > 0 && (
                <Typography variant="body2" fontWeight={600}>
                  ⚠ {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''} detected (already exists in system)
                </Typography>
              )}
            </Stack>
          </Alert>
        )}

        <Box
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.selected'
            }
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            hidden
            onChange={handleFileSelect}
            // 🔹 Yeni desteklenen uzantılar
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.zip,.json,.md,.diff,.pkl,.java,.js,.jsx,.ts,.tsx,.py,.rb,.go,.c,.cpp,.h,.hpp,.cs,.kt,.swift,.scala,.rs,.sh"
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drop files here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported: PDF, images (JPG, PNG, WEBP), JSON, Markdown (.md), CSV,
            ZIP, PKL, DIFF, and common code/text files (.txt, .java, .js, .jsx,
            .ts, .tsx, .py, .rb, .go, .c, .cpp, .h, .hpp, .cs, .kt, .swift,
            .scala, .rs, .sh)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Maximum file size: 10MB
          </Typography>
        </Box>

        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Selected Files ({selectedFiles.length})
            </Typography>
            <List>
              {selectedFiles.map((file, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                  secondaryAction={
                    !uploading && (
                      <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                        <CloseIcon />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>
                    <FileIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {uploadResults.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Upload Results
            </Typography>
            <List>
              {uploadResults.map((result, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: result.isDuplicate ? 'warning.main' : 'success.main',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: result.isDuplicate ? 'warning.50' : 'success.50'
                  }}
                >
                  <ListItemIcon>
                    {result.isDuplicate ? (
                      <WarningIcon color="warning" />
                    ) : (
                      <CheckCircleIcon color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {result.originalFilename}
                        </Typography>
                        {result.isDuplicate && (
                          <Chip
                            label="Duplicate"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      result.isDuplicate
                        ? `This file already exists in the system.`
                        : `Uploaded successfully • ${formatFileSize(result.sizeBytes)}`
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
              Uploading and verifying files...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>
          {uploadResults.length > 0 ? 'Close' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          startIcon={<CloudUploadIcon />}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArtifactUploader;
