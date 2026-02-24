import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const AnnotationEditorDialog = ({
  open,
  annotation,
  artifacts = [],
  allowTagging = true,
  onCancel,
  onSave
}) => {
  const [form, setForm] = useState({
    artifactId: '',
    text: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const artifactOptions = useMemo(
    () => artifacts.map((item) => ({
      id: item.id || item.artifactId,
      label: item.displayLabel || item.displayName || `Artifact ${item.displayName ? '' : (item.id || '')}`
    })),
    [artifacts]
  );

  useEffect(() => {
    if (!annotation) return;
    setForm({
      artifactId: annotation.artifactId || artifactOptions[0]?.id || '',
      text: annotation.text || annotation.content || '',
      tags: Array.isArray(annotation.tags) ? annotation.tags : []
    });
    setTagInput('');
  }, [annotation, artifactOptions]);

  const handleTagAdd = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (form.tags.includes(value)) {
      setTagInput('');
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, value] }));
    setTagInput('');
  };

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleTagAdd();
    }
  };

  const handleTagDelete = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));
  };

  const handleSave = () => {
    if (!annotation) return;
    onSave?.({
      ...annotation,
      artifactId: form.artifactId,
      text: form.text,
      content: form.text,
      tags: form.tags
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {annotation?.id ? 'Edit Annotation' : 'New Annotation'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            select
            label="Artifact"
            value={form.artifactId}
            onChange={(event) => setForm((prev) => ({ ...prev, artifactId: event.target.value }))}
            fullWidth
          >
            {artifactOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label || option.id}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Annotation"
            multiline
            maxRows={8}
            fullWidth
            value={form.text}
            onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
            placeholder="Describe this highlight"
          />

          {annotation?.range && (
            <Typography variant="caption" color="text.secondary">
              Range: {annotation.range.start} – {annotation.range.end}
            </Typography>
          )}

          {annotation?.region && (
            <Typography variant="caption" color="text.secondary">
              Region: x {Math.round(annotation.region.x * 100)}%, y {Math.round(annotation.region.y * 100)}%, width {Math.round(annotation.region.width * 100)}%, height {Math.round(annotation.region.height * 100)}%
            </Typography>
          )}

          {allowTagging && (
            <Box>
              <TextField
                label="Tags"
                placeholder="Press Enter to add tag"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                fullWidth
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" gap={1}>
                {form.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleTagDelete(tag)}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Annotation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnnotationEditorDialog;
