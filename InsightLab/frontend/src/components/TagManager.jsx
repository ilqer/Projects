// TagManager.jsx - Component for managing tags (UC2-5)
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Chip, Stack, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Typography, Alert, CircularProgress, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { tagService } from '../services/tagService';

const TagManager = ({ open, onClose, onTagsUpdated }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#3f51b5',
    description: ''
  });

  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open]);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await tagService.getAllTags();
      setTags(res.data);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setEditing(null);
    setFormData({ name: '', color: '#3f51b5', description: '' });
  };

  const handleEdit = (tag) => {
    setEditing(tag);
    setCreating(false);
    setFormData({
      name: tag.name,
      color: tag.color || '#3f51b5',
      description: tag.description || ''
    });
  };

  const handleCancelForm = () => {
    setCreating(false);
    setEditing(null);
    setFormData({ name: '', color: '#3f51b5', description: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Tag name is required');
      return;
    }

    try {
      setError('');
      if (editing) {
        await tagService.updateTag(editing.id, formData);
      } else {
        await tagService.createTag(formData);
      }
      await loadTags();
      handleCancelForm();
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      console.error('Error saving tag:', err);
      setError(err.response?.data?.message || 'Failed to save tag');
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? It will be removed from all artifacts.')) {
      return;
    }

    try {
      setError('');
      await tagService.deleteTag(tagId);
      await loadTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError(err.response?.data?.message || 'Failed to delete tag');
    }
  };

  const handleClose = () => {
    handleCancelForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <LabelIcon color="primary" />
            <Typography variant="h6">Manage Tags</Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {(creating || editing) && (
          <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              {editing ? 'Edit Tag' : 'Create New Tag'}
            </Typography>
            <TextField
              fullWidth
              label="Tag Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              size="small"
              required
            />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <TextField
                type="color"
                label="Color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                sx={{ width: 100 }}
                size="small"
              />
              <Box sx={{ flex: 1 }}>
                <Chip
                  label={formData.name || 'Preview'}
                  sx={{
                    bgcolor: formData.color,
                    color: '#fff',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Stack>
            <TextField
              fullWidth
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              size="small"
              multiline
              rows={2}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancelForm}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        )}

        {!creating && !editing && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            fullWidth
            sx={{ mb: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Create New Tag
          </Button>
        )}

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : tags.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No tags created yet
            </Typography>
          </Box>
        ) : (
          <List dense>
            {tags.map((tag) => (
              <ListItem
                key={tag.id}
                sx={{
                  mb: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={tag.name}
                        size="small"
                        sx={{
                          bgcolor: tag.color || '#3f51b5',
                          color: '#fff',
                          fontWeight: 600
                        }}
                      />
                      {tag.artifactCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          ({tag.artifactCount} artifact{tag.artifactCount !== 1 ? 's' : ''})
                        </Typography>
                      )}
                    </Stack>
                  }
                  secondary={tag.description}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleEdit(tag)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    size="small"
                    color="error"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagManager;