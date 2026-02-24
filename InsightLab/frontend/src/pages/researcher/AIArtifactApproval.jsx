import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import { aiArtifactService } from '../../services/aiArtifactService';
import { Edit, Check, Close, Code } from '@mui/icons-material';

function AIArtifactApproval({ embedded = false }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await aiArtifactService.getPendingDrafts();
      setDrafts(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draftId) => {
    if (!window.confirm('Approve this artifact and add it to your artifacts?')) {
      return;
    }

    try {
      setProcessing(true);
      await aiArtifactService.approveDraft(draftId);
      setMessage('Artifact approved and added to your artifacts!');
      loadDrafts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve artifact');
    } finally {
      setProcessing(false);
    }
  };

  const handleDiscard = async (draftId) => {
    if (!window.confirm('Discard this artifact? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);
      await aiArtifactService.discardDraft(draftId);
      loadDrafts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to discard artifact');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (draft) => {
    setEditingDraft(draft);
    setEditFormData({
      name: draft.name,
      content: draft.content,
      description: draft.description || '',
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      setProcessing(true);
      await aiArtifactService.updateDraft(editingDraft.id, editFormData);
      setEditDialog(false);
      setEditingDraft(null);
      loadDrafts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update artifact');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !drafts.length) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: embedded ? '100%' : 1200, mx: 'auto', p: embedded ? 0 : 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Artifact Approval
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review, edit, approve, or discard AI-generated code artifacts before adding them to your artifacts collection.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {drafts.length === 0 ? (
        <Alert severity="info">No pending artifacts for review.</Alert>
      ) : (
        <Grid container spacing={2}>
          {drafts.map((draft) => (
            <Grid item xs={12} key={draft.id}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box flex={1}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                          <Code />
                          <Typography variant="h6">{draft.name}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} mb={1}>
                          <Chip label={draft.programmingLanguage} size="small" color="primary" />
                          <Chip label={draft.status} size="small" variant="outlined" />
                        </Stack>
                        {draft.description && (
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {draft.description}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            bgcolor: 'grey.900',
                            color: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            maxHeight: 300,
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {draft.content}
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={1} ml={2}>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(draft)}
                          disabled={processing}
                          title="Edit"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="success"
                          onClick={() => handleApprove(draft.id)}
                          disabled={processing}
                          title="Approve"
                        >
                          <Check />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDiscard(draft.id)}
                          disabled={processing}
                          title="Discard"
                        >
                          <Close />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Artifact</DialogTitle>
        <DialogContent>
          {editFormData && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="File Name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Code Content"
                value={editFormData.content}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, content: e.target.value })
                }
                fullWidth
                multiline
                rows={15}
                sx={{ fontFamily: 'monospace' }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={processing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AIArtifactApproval;
