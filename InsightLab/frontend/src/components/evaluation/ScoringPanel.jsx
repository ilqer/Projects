import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, FormControl, FormLabel, RadioGroup, Radio,
  FormControlLabel, Checkbox, FormGroup, Rating, Select, MenuItem, Stack, Chip, Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon, RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';

const ScoringPanel = ({ criteriaItems, scores, onScoreChange, readOnly }) => {
  const [expandedNotes, setExpandedNotes] = useState({});

  const handleValueChange = (criteriaItemId, value) => {
    if (readOnly) return;
    const currentScore = scores[criteriaItemId] || {};
    onScoreChange(criteriaItemId, value, currentScore.notes || '');
  };

  const handleNotesChange = (criteriaItemId, notes) => {
    if (readOnly) return;
    const currentScore = scores[criteriaItemId] || {};
    onScoreChange(criteriaItemId, currentScore.value, notes);
  };

  const renderCriteriaInput = (criteria) => {
    const currentScore = scores[criteria.id] || {};
    const value = currentScore.value;

    switch (criteria.criterionType) {
      case 'SELECTION':
        // Dropdown selection
        return (
          <FormControl fullWidth size="small">
            <Select
              value={value || ''}
              onChange={(e) => handleValueChange(criteria.id, e.target.value)}
              disabled={readOnly}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select an option</em>
              </MenuItem>
              {criteria.possibleValues && criteria.possibleValues.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'RATING':
        // Star rating (1-5 or 1-10)
        const maxRating = criteria.maxValue || 5;
        return (
          <Box>
            <Rating
              value={value ? parseFloat(value) : 0}
              max={maxRating}
              onChange={(e, newValue) => handleValueChange(criteria.id, newValue)}
              disabled={readOnly}
              size="large"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {value ? `${value} / ${maxRating}` : 'Not rated'}
            </Typography>
          </Box>
        );

      case 'TEXT_INPUT':
        // Free text input
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={value || ''}
            onChange={(e) => handleValueChange(criteria.id, e.target.value)}
            disabled={readOnly}
            placeholder="Enter your response..."
            variant="outlined"
            size="small"
          />
        );

      case 'MULTIPLE_CHOICE':
        // Radio buttons
        return (
          <RadioGroup
            value={value || ''}
            onChange={(e) => handleValueChange(criteria.id, e.target.value)}
          >
            {criteria.possibleValues && criteria.possibleValues.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio disabled={readOnly} />}
                label={option}
              />
            ))}
          </RadioGroup>
        );

      case 'BOOLEAN':
        // Yes/No or True/False
        return (
          <RadioGroup
            value={value !== undefined ? value.toString() : ''}
            onChange={(e) => handleValueChange(criteria.id, e.target.value === 'true')}
            row
          >
            <FormControlLabel
              value="true"
              control={<Radio disabled={readOnly} />}
              label="Yes"
            />
            <FormControlLabel
              value="false"
              control={<Radio disabled={readOnly} />}
              label="No"
            />
          </RadioGroup>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Unsupported criterion type: {criteria.criterionType}
          </Typography>
        );
    }
  };

  const getCriterionTypeLabel = (type) => {
    const labels = {
      'SELECTION': 'Selection',
      'RATING': 'Rating',
      'TEXT_INPUT': 'Text Input',
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'BOOLEAN': 'Yes/No'
    };
    return labels[type] || type;
  };

  const isCriteriaFilled = (criteriaId) => {
    const score = scores[criteriaId];
    return score && score.value !== undefined && score.value !== null && score.value !== '';
  };

  // Group criteria by required/optional
  const requiredCriteria = criteriaItems.filter(c => c.isRequired);
  const optionalCriteria = criteriaItems.filter(c => !c.isRequired);

  const requiredFilledCount = requiredCriteria.filter(c => isCriteriaFilled(c.id)).length;
  const optionalFilledCount = optionalCriteria.filter(c => isCriteriaFilled(c.id)).length;

  if (!criteriaItems || criteriaItems.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No evaluation criteria
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This task has no evaluation criteria to complete
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Evaluation Criteria
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Chip
            icon={requiredFilledCount === requiredCriteria.length ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
            label={`Required: ${requiredFilledCount}/${requiredCriteria.length}`}
            color={requiredFilledCount === requiredCriteria.length ? 'success' : 'default'}
          />
          {optionalCriteria.length > 0 && (
            <Chip
              label={`Optional: ${optionalFilledCount}/${optionalCriteria.length}`}
              color="info"
              variant="outlined"
            />
          )}
        </Stack>
      </Box>

      {/* Required Criteria */}
      {requiredCriteria.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="error">
            Required Fields *
          </Typography>
          <Stack spacing={3}>
            {requiredCriteria.map((criteria) => (
              <Paper
                key={criteria.id}
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: isCriteriaFilled(criteria.id) ? 'success.main' : 'divider',
                  p: 2,
                  position: 'relative'
                }}
              >
                {isCriteriaFilled(criteria.id) && (
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'success.main'
                    }}
                  />
                )}

                <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
                  <Chip
                    label="Required"
                    color="error"
                    size="small"
                  />
                  <Chip
                    label={getCriterionTypeLabel(criteria.criterionType)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {criteria.name}
                </Typography>

                {criteria.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {criteria.description}
                  </Typography>
                )}

                <Box sx={{ mb: 2 }}>
                  {renderCriteriaInput(criteria)}
                </Box>

                <Divider sx={{ my: 2 }} />

                <TextField
                  fullWidth
                  label="Notes"
                  value={scores[criteria.id]?.notes || ''}
                  onChange={(e) => handleNotesChange(criteria.id, e.target.value)}
                  disabled={readOnly}
                  placeholder="Provide any notes or observations."
                />
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* Optional Criteria */}
      {optionalCriteria.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="info.main">
            Optional Fields
          </Typography>
          <Stack spacing={3}>
            {optionalCriteria.map((criteria) => (
              <Paper
                key={criteria.id}
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: isCriteriaFilled(criteria.id) ? 'info.main' : 'divider',
                  p: 2,
                  position: 'relative'
                }}
              >
                {isCriteriaFilled(criteria.id) && (
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'info.main'
                    }}
                  />
                )}

                <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
                  <Chip
                    label="Optional"
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={getCriterionTypeLabel(criteria.criterionType)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {criteria.name}
                </Typography>

                {criteria.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {criteria.description}
                  </Typography>
                )}

                <Box sx={{ mb: 2 }}>
                  {renderCriteriaInput(criteria)}
                </Box>

                <Divider sx={{ my: 2 }} />

                <TextField
                  fullWidth
                  label="Notes"
                  value={scores[criteria.id]?.notes || ''}
                  onChange={(e) => handleNotesChange(criteria.id, e.target.value)}
                  disabled={readOnly}
                  placeholder="Provide any notes or observations."
                />
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ScoringPanel;
