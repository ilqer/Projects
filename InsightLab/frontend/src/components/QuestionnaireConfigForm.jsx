import React from 'react';
import {
  Card, CardContent, Typography, Divider, TextField, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Switch, Stack,
  InputAdornment, Alert, Box
} from '@mui/material';
import { Timer as TimerIcon, Grade as GradeIcon } from '@mui/icons-material';

const QuestionnaireConfigForm = ({ config, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Scoring & Configuration
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          {/* Passing Threshold */}
          <TextField
            label="Passing Threshold"
            type="number"
            required={config.type === 'COMPETENCY'}
            disabled={config.type === 'BACKGROUND'}
            value={config.type === 'BACKGROUND' ? '' : (config.passingThreshold ?? '')}
            onChange={(e) => {
              const { value } = e.target;
              if (value === '') {
                handleChange('passingThreshold', null);
                return;
              }
              const parsed = parseFloat(value);
              handleChange('passingThreshold', Number.isNaN(parsed) ? null : parsed);
            }}
            placeholder="e.g., 70"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <GradeIcon />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{
              min: 1,
              max: 100,
              step: 0.1
            }}
            helperText={config.type === 'COMPETENCY' ? "Required. Minimum passing percentage between 1 and 100." : "Not applicable for background quizzes."}
            fullWidth
          />

          {/* Level Thresholds - Only for COMPETENCY quizzes */}
          {config.type === 'COMPETENCY' && (
            <>
              <TextField
                label="Intermediate Level Threshold"
                type="number"
                value={config.intermediateThreshold ?? ''}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === '') {
                    handleChange('intermediateThreshold', null);
                    return;
                  }
                  const parsed = parseFloat(value);
                  handleChange('intermediateThreshold', Number.isNaN(parsed) ? null : parsed);
                }}
                placeholder="e.g., 80"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GradeIcon />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: config.passingThreshold || 1,
                  max: 100,
                  step: 0.1
                }}
                helperText="Optional. Minimum score for intermediate level classification."
                fullWidth
              />

              <TextField
                label="Advanced Level Threshold"
                type="number"
                value={config.advancedThreshold ?? ''}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === '') {
                    handleChange('advancedThreshold', null);
                    return;
                  }
                  const parsed = parseFloat(value);
                  handleChange('advancedThreshold', Number.isNaN(parsed) ? null : parsed);
                }}
                placeholder="e.g., 90"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GradeIcon />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: config.intermediateThreshold || config.passingThreshold || 1,
                  max: 100,
                  step: 0.1
                }}
                helperText="Optional. Minimum score for advanced level classification."
                fullWidth
              />
            </>
          )}

          {/* Time Limit */}
          <TextField
            label="Time Limit"
            type="number"
            value={config.timeLimitMinutes || ''}
            onChange={(e) => handleChange('timeLimitMinutes', parseInt(e.target.value) || null)}
            placeholder="e.g., 30"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TimerIcon />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
            }}
            inputProps={{
              min: 1
            }}
            helperText="Maximum time allowed to complete. Leave empty for no time limit."
            fullWidth
          />

          {/* Grading Method */}
          <FormControl fullWidth>
            <InputLabel>Grading Method</InputLabel>
            <Select
              value={config.gradingMethod || 'AUTOMATIC'}
              label="Grading Method"
              onChange={(e) => handleChange('gradingMethod', e.target.value)}
            >
              <MenuItem value="AUTOMATIC">Automatic - Auto-grade based on correct answers</MenuItem>
              <MenuItem value="MANUAL">Manual - Researcher manually grades</MenuItem>
              <MenuItem value="PARTIAL_CREDIT">Partial Credit - Allow partial points</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Display Options */}
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            Display Options
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={config.showCorrectAnswers !== false}
                onChange={(e) => handleChange('showCorrectAnswers', e.target.checked)}
              />
            }
            label="Show correct answers after submission"
          />

          <FormControlLabel
            control={
              <Switch
                checked={config.allowReview || false}
                onChange={(e) => handleChange('allowReview', e.target.checked)}
              />
            }
            label="Allow participants to review answers before submitting"
          />

          <Divider />

          {/* Randomization Options */}
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            Randomization Options
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={config.randomizeQuestions || false}
                onChange={(e) => handleChange('randomizeQuestions', e.target.checked)}
              />
            }
            label="Randomize question order for each participant"
          />

          <FormControlLabel
            control={
              <Switch
                checked={config.randomizeOptions || false}
                onChange={(e) => handleChange('randomizeOptions', e.target.checked)}
              />
            }
            label="Randomize option order for multiple choice questions"
          />

          {/* Info Alert */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Total Points:</strong> Automatically calculated from all questions. 
              {config.passingThreshold && (
                <> Passing score: <strong>{config.totalPoints ? Math.ceil((config.totalPoints * config.passingThreshold) / 100) : 'N/A'}</strong> points.</>
              )}
            </Typography>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireConfigForm;
