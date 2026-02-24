import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Slider,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ArtifactCard from '../../components/evaluation/ArtifactCard';
import AnnotationPanel from '../../components/evaluation/AnnotationPanel';
import { reviewerEvaluationService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const statusOptions = [
  { 
    value: 'VALID', 
    label: 'Valid Evaluation',
    description: 'Evaluation is complete and meets quality standards',
    color: 'success'
  },
  { 
    value: 'SUSPICIOUS', 
    label: 'Flagged as Suspicious',
    description: 'Mark this submission for review - may contain inconsistencies, rushed completion, or quality concerns',
    color: 'warning'
  },
  { 
    value: 'INCOMPLETE', 
    label: 'Incomplete Evaluation',
    description: 'Evaluation is missing required information or criteria',
    color: 'error'
  }
];

const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining.toString().padStart(2, '0')}s`;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const ReviewerEvaluationView = () => {
  const { studyId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [form, setForm] = useState({
    status: '',
    notes: '',
    quality: 3
  });

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId, assignmentId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reviewerEvaluationService.getEvaluationDetail(studyId, assignmentId);
      const data = response.data;
      setDetail(data);
      setForm({
        status: data.reviewerStatus || '',
        notes: data.reviewerNotes || '',
        quality: data.reviewerQualityScore || 3
      });
    } catch (err) {
      console.error('Failed to load evaluation detail', err);
      setError(err.response?.data?.message || 'Unable to load evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const criteriaMap = useMemo(() => {
    const map = new Map();
    (detail?.criteria || []).forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [detail]);

  const scoresWithCriteria = useMemo(() => {
    if (!detail) return [];
    return (detail.scores || []).map((score) => ({
      ...score,
      criteria: criteriaMap.get(score.criteriaItemId)
    }));
  }, [detail, criteriaMap]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDecision = async () => {
    if (!form.status) {
      setError('Please select a reviewer status.');
      return;
    }
    if (!form.quality) {
      setError('Please provide a quality score.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await reviewerEvaluationService.submitReviewerDecision(studyId, assignmentId, {
        reviewerStatus: form.status,
        reviewerNotes: form.notes,
        reviewerQualityScore: Number(form.quality)
      });
      setSnackbar('Reviewer decision saved.');
      await loadDetail();
    } catch (err) {
      console.error('Failed to save reviewer decision', err);
      setError(err.response?.data?.message || 'Unable to save reviewer decision.');
    } finally {
      setSaving(false);
    }
  };

  const renderScoreValue = (value) => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      if (value.value !== undefined) {
        return renderScoreValue(value.value);
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <CssBaseline />
          <AppBar
            position="fixed"
            sx={{
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
            }}
            elevation={0}
          >
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
                Reviewer Evaluation View
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              minHeight: '100vh',
              pt: 3,
              pb: 6,
              px: 3,
            }}
          >
            <Toolbar />
            <Container maxWidth="xl">
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            </Container>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  if (error && !detail) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <CssBaseline />
          <AppBar
            position="fixed"
            sx={{
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
            }}
            elevation={0}
          >
            <Toolbar>
              <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600, color: 'text.primary' }}>
                Reviewer Evaluation View
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              minHeight: '100vh',
              pt: 3,
              pb: 6,
              px: 3,
            }}
          >
            <Toolbar />
            <Container maxWidth="md">
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </Container>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  const assignment = detail?.assignment;
  const submission = detail?.submission;
  const annotationSnapshot = detail?.submission?.annotationsSnapshot;
  const snapshotAnnotations = Array.isArray(annotationSnapshot)
    ? annotationSnapshot
    : annotationSnapshot?.annotations;
  const annotations = (snapshotAnnotations && snapshotAnnotations.length)
    ? snapshotAnnotations
    : (detail?.annotations || []);
  const layoutMode = assignment?.layoutMode || detail?.task?.layoutMode || detail?.taskType?.layoutMode || 'SINGLE';
  const isBlindedTask = Boolean(detail?.task?.blindedMode);
  const viewerArtifacts = detail?.viewerArtifacts || [];
  const dynamicCriteria = detail?.dynamicCriteria || [];
  const answers = submission?.answers || {};
  const annotationArtifacts = viewerArtifacts.map((artifact) => ({
    ...artifact,
    id: artifact.artifactId || artifact.id
  }));

  const isSideBySide = layoutMode === 'SIDE_BY_SIDE';
  const isThreeWay = layoutMode === 'THREE_WAY';
  const isSingle = layoutMode === 'SINGLE';
  const pairCount = isSideBySide ? Math.ceil(viewerArtifacts.length / 2) : 0;
  const tripletCount = isThreeWay ? Math.ceil(viewerArtifacts.length / 3) : 0;
  const singleCount = isSingle ? viewerArtifacts.length : 0;
  const isGroupedMode = isSideBySide || isThreeWay || isSingle;
  const groupCount = isSingle ? singleCount : (isThreeWay ? tripletCount : pairCount);

  const renderDynamicAnswer = (criterion) => {
    if (isSingle && singleCount > 0) {
      // For single mode, collect answers for each artifact
      const singleAnswers = [];
      for (let i = 0; i < singleCount; i++) {
        const singleKey = `single_${i}_${criterion.id}`;
        const value = answers[singleKey];
        if (value !== null && value !== undefined) {
          let displayValue = value;
          if (Array.isArray(value)) {
            displayValue = value.length ? value.join(', ') : '—';
          } else if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
          } else {
            displayValue = String(value);
          }
          singleAnswers.push({ artifactIndex: i + 1, displayValue });
        }
      }
      return singleAnswers; // Return as array for structured display
    } else if (isThreeWay && tripletCount > 0) {
      // For three-way mode, collect answers for each triplet
      const tripletAnswers = [];
      for (let i = 0; i < tripletCount; i++) {
        const tripletKey = `triplet_${i}_${criterion.id}`;
        const value = answers[tripletKey];
        if (value !== null && value !== undefined) {
          let displayValue = value;
          if (Array.isArray(value)) {
            displayValue = value.length ? value.join(', ') : '—';
          } else if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
          } else {
            displayValue = String(value);
          }
          tripletAnswers.push({ tripletIndex: i + 1, displayValue });
        }
      }
      return tripletAnswers; // Return as array for structured display
    } else if (isSideBySide && pairCount > 0) {
      // For side-by-side mode, collect answers for each pair
      const pairAnswers = [];
      for (let i = 0; i < pairCount; i++) {
        const pairKey = `pair_${i}_${criterion.id}`;
        const value = answers[pairKey];
        if (value !== null && value !== undefined) {
          let displayValue = value;
          if (Array.isArray(value)) {
            displayValue = value.length ? value.join(', ') : '—';
          } else if (typeof value === 'boolean') {
            displayValue = value ? 'Yes' : 'No';
          } else {
            displayValue = String(value);
          }
          pairAnswers.push({ pairIndex: i + 1, displayValue });
        }
      }
      return pairAnswers; // Return as array for structured display
    } else {
      // Normal mode
      const value = answers[criterion.id];
      if (value === null || value === undefined) {
        return '—';
      }
      if (Array.isArray(value)) {
        return value.length ? value.join(', ') : '—';
      }
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      return String(value);
    }
  };

  const content = (
    <Container maxWidth="xl">
      {isBlindedTask && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Blinded Mode: Participant identity has been anonymized. Only aliases are shown to reviewers.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Artifacts
              </Typography>
              <Grid container spacing={2}>
                {viewerArtifacts.map((artifact) => (
                  <Grid
                    item
                    xs={12}
                    md={layoutMode === 'THREE_WAY' ? 4 : layoutMode === 'SIDE_BY_SIDE' ? 6 : 12}
                    key={(artifact.artifactId || '') + artifact.displayName}
                  >
                    <ArtifactCard
                      artifact={artifact}
                      annotations={annotations}
                      readOnly
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Participant Criteria Responses
                {isSingle && singleCount > 0 && (
                  <Chip label={`Single Mode (${singleCount} artifacts)`} size="small" color="info" sx={{ ml: 2 }} />
                )}
                {isThreeWay && tripletCount > 0 && (
                  <Chip label={`Three-Way Mode (${tripletCount} triplets)`} size="small" color="info" sx={{ ml: 2 }} />
                )}
                {isSideBySide && pairCount > 0 && (
                  <Chip label={`Side-by-Side Mode (${pairCount} pairs)`} size="small" color="info" sx={{ ml: 2 }} />
                )}
              </Typography>
              {dynamicCriteria.length > 0 ? (
                <Stack spacing={2}>
                  {dynamicCriteria.map((criterion) => {
                    if (isSingle && singleCount > 0) {
                      // Render single mode answers grouped by artifact
                      const singleAnswers = renderDynamicAnswer(criterion);
                      return (
                        <Card 
                          key={criterion.id} 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {criterion.description}
                            </Typography>
                          )}
                          {Array.isArray(singleAnswers) && singleAnswers.length > 0 ? (
                            <Stack spacing={1} sx={{ mt: 2 }}>
                              {singleAnswers.map(({ artifactIndex, displayValue }) => (
                                <Box key={artifactIndex} sx={{ pl: 2, borderLeft: 2, borderColor: 'info.main' }}>
                                  <Typography variant="body2">
                                    <strong>Artifact {artifactIndex}:</strong> {displayValue}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              No response provided
                            </Typography>
                          )}
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Card>
                      );
                    } else if (isThreeWay && tripletCount > 0) {
                      // Render three-way answers grouped by triplet
                      const tripletAnswers = renderDynamicAnswer(criterion);
                      return (
                        <Card 
                          key={criterion.id} 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {criterion.description}
                            </Typography>
                          )}
                          {Array.isArray(tripletAnswers) && tripletAnswers.length > 0 ? (
                            <Stack spacing={1} sx={{ mt: 2 }}>
                              {tripletAnswers.map(({ tripletIndex, displayValue }) => (
                                <Box key={tripletIndex} sx={{ pl: 2, borderLeft: 2, borderColor: 'secondary.main' }}>
                                  <Typography variant="body2">
                                    <strong>Triplet {tripletIndex}:</strong> {displayValue}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              No response provided
                            </Typography>
                          )}
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Card>
                      );
                    } else if (isSideBySide && pairCount > 0) {
                      // Render side-by-side answers grouped by pair
                      const pairAnswers = renderDynamicAnswer(criterion);
                      return (
                        <Card 
                          key={criterion.id} 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {criterion.description}
                            </Typography>
                          )}
                          {Array.isArray(pairAnswers) && pairAnswers.length > 0 ? (
                            <Stack spacing={1} sx={{ mt: 2 }}>
                              {pairAnswers.map(({ pairIndex, displayValue }) => (
                                <Box key={pairIndex} sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                                  <Typography variant="body2">
                                    <strong>Pair {pairIndex}:</strong> {displayValue}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              No response provided
                            </Typography>
                          )}
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Card>
                      );
                    } else {
                      // Normal mode
                      return (
                        <Card 
                          key={criterion.id} 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {criterion.description}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ mt: 1.5 }}>
                            <strong>Response:</strong> {renderDynamicAnswer(criterion)}
                          </Typography>
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Card>
                      );
                    }
                  })}
                </Stack>
              ) : scoresWithCriteria.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Criterion</strong></TableCell>
                        <TableCell><strong>Response</strong></TableCell>
                        <TableCell><strong>Notes</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scoresWithCriteria.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell sx={{ maxWidth: 240 }}>
                            <Typography variant="subtitle2">{score.criteria?.name || 'Criterion'}</Typography>
                            {score.criteria?.isRequired && (
                              <Chip label="Required" size="small" color="warning" sx={{ mt: 0.5 }} />
                            )}
                          </TableCell>
                          <TableCell>{renderScoreValue(score.value)}</TableCell>
                          <TableCell>{score.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No criteria responses were recorded.
                </Typography>
              )}
            </Paper>

            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Participant Notes & Metadata
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    title="Submitted At"
                    value={formatDateTime(submission?.submittedAt || assignment?.submittedAt)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    title="Time Spent"
                    value={formatDuration(submission?.timeSpentSeconds)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    title="Snapshot Decision"
                    value={submission?.snapshotDecision || '—'}
                    subtitle={submission?.snapshotExplanation}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    title="Bug Severity"
                    value={submission?.bugSeverity || '—'}
                    subtitle={submission?.bugNotes}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    title="Clone Relationship"
                    value={submission?.cloneRelationship || '—'}
                    subtitle={submission?.cloneNotes}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard
                    title="SOLID Violation"
                    value={submission?.solidViolatedPrinciple || '—'}
                    subtitle={submission?.solidExplanation}
                  />
                </Grid>
              </Grid>
            </Paper>

          </Stack>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card 
              variant="outlined" 
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Participant
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  {assignment?.participantName}
                  {assignment?.participantUsername ? ` (${assignment?.participantUsername})` : ''}
                </Typography>
                {isBlindedTask && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Identity hidden due to blinded mode
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Participant ID #{assignment?.participantId}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Task
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                  {detail?.task?.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Task ID #{detail?.task?.id} · {detail?.taskType?.artifactType}
                </Typography>
              </CardContent>
            </Card>

            <Card 
              variant="outlined" 
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Reviewer Controls
                </Typography>
                
                {form.status === 'SUSPICIOUS' && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Flagged Submission:</strong> This evaluation will be marked as suspicious and may require additional review or be excluded from final analysis.
                  </Alert>
                )}
                
                <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                    Evaluation Status
                  </FormLabel>
                  <RadioGroup
                    value={form.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <Box
                        key={option.value}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: form.status === option.value ? `${option.color}.main` : 'divider',
                          borderRadius: 1,
                          bgcolor: form.status === option.value ? `${option.color}.50` : 'transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <FormControlLabel
                          value={option.value}
                          control={<Radio color={option.color} />}
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                {option.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {option.description}
                              </Typography>
                            </Box>
                          }
                          sx={{ margin: 0 }}
                        />
                      </Box>
                    ))}
                  </RadioGroup>
                </FormControl>

                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    Evaluation Quality Score: <strong>{form.quality}</strong>
                  </Typography>
                  <Slider
                    value={form.quality}
                    onChange={(_, value) =>
                      handleFormChange('quality', Array.isArray(value) ? value[0] : value)
                    }
                    min={1}
                    max={5}
                    step={1}
                    valueLabelDisplay="auto"
                    marks
                    sx={{ mt: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    1 = Very Low Quality, 5 = Excellent Quality
                  </Typography>
                </Box>

                <TextField
                  label="Reviewer Notes (optional)"
                  fullWidth
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSaveDecision}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Review'}
                  </Button>
                  <Button variant="outlined" fullWidth onClick={loadDetail}>
                    Refresh
                  </Button>
                </Stack>

                {detail?.reviewedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Last reviewed at {formatDateTime(detail.reviewedAt)}
                    {detail.reviewedByName && ` by ${detail.reviewedByName}`}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Participant Annotations
                </Typography>
                <Chip label={`${annotations.length} annotations`} size="small" />
              </Stack>
              <AnnotationPanel
                annotations={annotations}
                artifacts={annotationArtifacts}
                readOnly
                allowTagging
              />
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Container>
  );

  return (
    <AppTheme>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
          elevation={0}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
                Reviewer Evaluation View
              </Typography>
              {detail && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {detail?.task?.title} — {assignment?.participantName || `Participant #${assignment?.participantId}`}
                </Typography>
              )}
            </Box>
            {assignment?.status && (
              <Chip
                label={assignment.status}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mr: 2 }}
              />
            )}
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: '100vh',
            pt: 3,
            pb: 6,
            px: 3,
          }}
        >
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

const InfoCard = ({ title, value, subtitle }) => (
  <Card 
    variant="outlined" 
    sx={{ 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      height: '100%'
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={600} sx={{ mb: subtitle ? 0.5 : 0 }}>
        {value || '—'}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default ReviewerEvaluationView;
