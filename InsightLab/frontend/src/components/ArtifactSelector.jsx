import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { artifactService } from '../services/api';

const ArtifactSelector = ({ selectedArtifacts, onChange, disabled }) => {
  const [availableArtifacts, setAvailableArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAvailableArtifacts();
  }, []);

  const loadAvailableArtifacts = async () => {
    try {
      setLoading(true);
      const response = await artifactService.getMyArtifacts();
      setAvailableArtifacts(response.data || []);
    } catch (err) {
      console.error('Failed to load artifacts:', err);
      setError('Failed to load available artifacts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setError('');
      const response = await artifactService.uploadArtifacts(selectedFiles);
      const uploadedArtifacts = response.data || [];
      
      // Add newly uploaded artifacts to available list
      setAvailableArtifacts(prev => [...prev, ...uploadedArtifacts]);
      
      // Automatically select the uploaded artifacts
      const newlySelected = uploadedArtifacts.map((artifact, index) => ({
        artifactId: artifact.id,
        displayLabel: artifact.originalFilename,
        displayOrder: selectedArtifacts.length + index,
        originalFilename: artifact.originalFilename,
        contentType: artifact.contentType,
        sizeBytes: artifact.sizeBytes,
      }));
      
      onChange([...selectedArtifacts, ...newlySelected]);
      
      setSelectedFiles([]);
      setUploadDialogOpen(false);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload artifacts: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSelectExisting = (artifact) => {
    // Check if already selected
    if (selectedArtifacts.some(a => a.artifactId === artifact.id)) {
      return;
    }

    const newArtifact = {
      artifactId: artifact.id,
      displayLabel: artifact.originalFilename,
      displayOrder: selectedArtifacts.length,
      originalFilename: artifact.originalFilename,
      contentType: artifact.contentType,
      sizeBytes: artifact.sizeBytes,
    };

    onChange([...selectedArtifacts, newArtifact]);
  };

  const handleRemoveArtifact = (index) => {
    const updated = selectedArtifacts.filter((_, i) => i !== index);
    // Update display orders
    const reordered = updated.map((artifact, i) => ({
      ...artifact,
      displayOrder: i,
    }));
    onChange(reordered);
  };

  const handleUpdateDisplayLabel = (index, label) => {
    const updated = selectedArtifacts.map((artifact, i) => {
      if (i === index) {
        return { ...artifact, displayLabel: label };
      }
      return artifact;
    });
    onChange(updated);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Study Artifacts
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
            disabled={disabled}
          >
            Upload New
          </Button>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setSelectDialogOpen(true)}
            disabled={disabled}
          >
            Select Existing
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {selectedArtifacts.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary">
            No artifacts selected. Upload new artifacts or select from existing ones.
          </Typography>
        </Paper>
      ) : (
        <List>
          {selectedArtifacts.map((artifact, index) => (
            <Paper key={index} sx={{ mb: 1 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <TextField
                      value={artifact.displayLabel}
                      onChange={(e) => handleUpdateDisplayLabel(index, e.target.value)}
                      size="small"
                      fullWidth
                      disabled={disabled}
                      label="Display Label"
                      sx={{ mb: 1 }}
                    />
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Original: {artifact.originalFilename}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip label={artifact.contentType} size="small" />
                        <Chip label={formatFileSize(artifact.sizeBytes)} size="small" />
                        <Chip label={`Order: ${index + 1}`} size="small" color="primary" />
                      </Stack>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Remove artifact">
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleRemoveArtifact(index)}
                      disabled={disabled}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Artifacts</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="artifact-upload-input"
              // Backend ile uyumlu olacak şekilde yeni uzantılar
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.zip,.json,.md,.diff,.pkl,.java,.js,.jsx,.ts,.tsx,.py,.rb,.go,.c,.cpp,.h,.hpp,.cs,.kt,.swift,.scala,.rs,.sh"
            />
            <label htmlFor="artifact-upload-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFileIcon />}
                fullWidth
              >
                Select Files
              </Button>
            </label>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Supported: PDF, images (JPG, PNG, WEBP), JSON, Markdown (.md), CSV,
              ZIP, PKL, DIFF, and code/text files (.txt, .java, .js, .jsx, .ts,
              .tsx, .py, .rb, .go, .c, .cpp, .h, .hpp, .cs, .kt, .swift, .scala,
              .rs, .sh)
            </Typography>

            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files:
                </Typography>
                <List dense>
                  {selectedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || selectedFiles.length === 0}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Select Existing Dialog */}
      <Dialog open={selectDialogOpen} onClose={() => setSelectDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Existing Artifacts</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : availableArtifacts.length === 0 ? (
            <Alert severity="info">
              No artifacts available. Upload some artifacts first.
            </Alert>
          ) : (
            <List>
              {availableArtifacts.map((artifact) => {
                const isSelected = selectedArtifacts.some(a => a.artifactId === artifact.id);
                return (
                  <ListItem
                    key={artifact.id}
                    button
                    onClick={() => !isSelected && handleSelectExisting(artifact)}
                    disabled={isSelected}
                    sx={{
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={artifact.originalFilename}
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip label={artifact.contentType} size="small" />
                          <Chip label={formatFileSize(artifact.sizeBytes)} size="small" />
                          {isSelected && <Chip label="Selected" size="small" color="primary" />}
                        </Stack>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArtifactSelector;
