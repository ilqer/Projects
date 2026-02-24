import React from 'react';
import {
  Box, Paper, Typography, Stack, Chip, IconButton, Divider, Button
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Highlight as HighlightIcon,
  Note as NoteIcon,
  Label as LabelIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const AnnotationPanel = ({
  annotations,
  artifacts,
  onDelete,
  onEdit,
  onCreate,
  readOnly,
  allowTagging = true
}) => {
  const getArtifactTitle = (artifactId) => {
    if (!artifacts) {
      return `Artifact ${artifactId ?? ''}`;
    }

    const artifact = artifacts.find(a => a.id === artifactId || a.artifactId === artifactId);
    if (!artifact) return `Artifact ${artifactId}`;

    const typeLabels = {
      'BUG_REPORT': 'Bug Report',
      'CODE_CLONE': 'Code Clone',
      'SOLID_VIOLATION': 'SOLID Violation',
      'SNAPSHOT': 'Snapshot'
    };

    const displayName = artifact.displayLabel || artifact.displayName;
    if (displayName) {
      return displayName;
    }

    if (artifact.mimeType) {
      return artifact.mimeType;
    }

    return typeLabels[artifact.artifactType] || artifact.artifactType;
  };

  const getAnnotationTypeIcon = (type) => {
    const icons = {
      'HIGHLIGHT': <HighlightIcon fontSize="small" />,
      'NOTE': <NoteIcon fontSize="small" />,
      'TAG': <LabelIcon fontSize="small" />
    };
    return icons[type] || <NoteIcon fontSize="small" />;
  };

  const getAnnotationTypeLabel = (type) => {
    const labels = {
      'HIGHLIGHT': 'Highlight',
      'NOTE': 'Note',
      'TAG': 'Tag'
    };
    return labels[type] || type;
  };

  const getAnnotationTypeColor = (type) => {
    const colors = {
      'HIGHLIGHT': 'warning',
      'NOTE': 'info',
      'TAG': 'secondary'
    };
    return colors[type] || 'default';
  };

  if (!annotations || annotations.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <NoteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No annotations yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select text in the artifacts view to create annotations
        </Typography>
        {!readOnly && onCreate && (
          <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={onCreate}>
            New Annotation
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Annotations ({annotations.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All highlights, notes, and tags for this task
          </Typography>
        </Box>
        {!readOnly && onCreate && (
          <Button variant="outlined" size="small" onClick={onCreate}>
            New Annotation
          </Button>
        )}
      </Stack>

      <Stack spacing={2}>
        {annotations.map((annotation, index) => {
          const annotationType = annotation.annotationType
            || (annotation.region ? 'REGION' : 'HIGHLIGHT');
          const content = annotation.content || annotation.text || '';
          const tags = Array.isArray(annotation.tags)
            ? annotation.tags
            : annotation.tags
              ? String(annotation.tags).split(',').map((tag) => tag.trim()).filter(Boolean)
              : [];
          return (
            <Paper
            key={annotation.id || index}
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              p: 2,
              transition: 'all 0.2s',
              '&:hover': { boxShadow: 2 }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  icon={getAnnotationTypeIcon(annotationType)}
                  label={getAnnotationTypeLabel(annotationType)}
                  color={getAnnotationTypeColor(annotationType)}
                  size="small"
                />
                <Chip
                  label={getArtifactTitle(annotation.artifactId)}
                  size="small"
                  variant="outlined"
                />
                {annotation.panelNumber && (
                  <Chip
                    label={`Panel ${annotation.panelNumber}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {annotation.color && (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: annotation.color,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  />
                )}
              </Stack>

              {!readOnly && (
                <Stack direction="row" spacing={1}>
                  {onEdit && (
                    <IconButton
                      size="small"
                      onClick={() => onEdit(annotation)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete(annotation.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography
              variant="body2"
              sx={{
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
                fontStyle: 'italic',
                borderLeft: 3,
                borderColor: annotation.color || 'primary.main'
              }}
            >
              "{content}"
            </Typography>

            {annotation.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Notes:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {annotation.notes}
                </Typography>
              </Box>
            )}

            {allowTagging && tags.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
                {tags.map((tag, tagIndex) => (
                  <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            )}

            {(annotation.startLine || annotation.endLine) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Lines: {annotation.startLine || 0} - {annotation.endLine || 0}
              </Typography>
            )}

            {annotation.range && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Range: {annotation.range.start} - {annotation.range.end}
              </Typography>
            )}

            {annotation.region && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Region: x {Math.round(annotation.region.x * 100)}% · y {Math.round(annotation.region.y * 100)}% · w {Math.round(annotation.region.width * 100)}% · h {Math.round(annotation.region.height * 100)}%
              </Typography>
            )}

            {annotation.createdAt && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Created: {new Date(annotation.createdAt).toLocaleString()}
              </Typography>
            )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default AnnotationPanel;
