import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const RATING_FORMATS = [
  { value: 'FIVE_STAR', label: '5-Star Rating' },
  { value: 'TEN_POINT', label: '10-Point Scale' },
  { value: 'BINARY', label: 'Binary (Yes/No)' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TEXT', label: 'Text Response' },
];

const CustomCriteriaBuilder = ({ criteria, onChange, disabled }) => {
  const handleAddCriterion = () => {
    const newCriterion = {
      name: '',
      description: '',
      ratingFormat: 'FIVE_STAR',
      ratingOptions: '',
      displayOrder: criteria.length,
    };
    onChange([...criteria, newCriterion]);
  };

  const handleRemoveCriterion = (index) => {
    const updated = criteria.filter((_, i) => i !== index);
    // Update display orders
    const reordered = updated.map((criterion, i) => ({
      ...criterion,
      displayOrder: i,
    }));
    onChange(reordered);
  };

  const handleCriterionChange = (index, field, value) => {
    const updated = criteria.map((criterion, i) => {
      if (i === index) {
        return { ...criterion, [field]: value };
      }
      return criterion;
    });
    onChange(updated);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...criteria];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Update display orders
    const reordered = updated.map((criterion, i) => ({
      ...criterion,
      displayOrder: i,
    }));
    onChange(reordered);
  };

  const handleMoveDown = (index) => {
    if (index === criteria.length - 1) return;
    const updated = [...criteria];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Update display orders
    const reordered = updated.map((criterion, i) => ({
      ...criterion,
      displayOrder: i,
    }));
    onChange(reordered);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Custom Evaluation Criteria
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddCriterion}
          disabled={disabled}
        >
          Add Criterion
        </Button>
      </Box>

      {criteria.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
          <Typography variant="body2" color="text.secondary">
            No custom criteria added yet. Click "Add Criterion" to create evaluation criteria for participants.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {criteria.map((criterion, index) => (
            <Paper key={index} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUp(index)}
                        disabled={disabled || index === 0}
                      >
                        <DragIndicatorIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <Stack spacing={2} sx={{ flex: 1 }}>
                  <TextField
                    label="Criterion Name"
                    value={criterion.name}
                    onChange={(e) => handleCriterionChange(index, 'name', e.target.value)}
                    fullWidth
                    required
                    size="small"
                    disabled={disabled}
                    placeholder="e.g., Code Readability"
                  />

                  <TextField
                    label="Description"
                    value={criterion.description}
                    onChange={(e) => handleCriterionChange(index, 'description', e.target.value)}
                    fullWidth
                    size="small"
                    disabled={disabled}
                    placeholder="Describe what participants should evaluate"
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth size="small" disabled={disabled}>
                      <InputLabel>Rating Format</InputLabel>
                      <Select
                        value={criterion.ratingFormat}
                        label="Rating Format"
                        onChange={(e) => handleCriterionChange(index, 'ratingFormat', e.target.value)}
                      >
                        {RATING_FORMATS.map((format) => (
                          <MenuItem key={format.value} value={format.value}>
                            {format.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {criterion.ratingFormat === 'MULTIPLE_CHOICE' && (
                      <TextField
                        label="Options (comma-separated)"
                        value={criterion.ratingOptions}
                        onChange={(e) => handleCriterionChange(index, 'ratingOptions', e.target.value)}
                        fullWidth
                        size="small"
                        disabled={disabled}
                        placeholder="e.g., Excellent, Good, Fair, Poor"
                      />
                    )}
                  </Box>
                </Stack>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Tooltip title="Remove criterion">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveCriterion(index)}
                      disabled={disabled}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default CustomCriteriaBuilder;
