import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Button,
  AppBar,
  Toolbar,
  CssBaseline,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { researcherEvaluationService } from '../../services/api';
import AnnotationPanel from '../../components/evaluation/AnnotationPanel';
import ArtifactCard from '../../components/evaluation/ArtifactCard';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const statusColor = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'PENDING':
      return 'default';
    case 'REVIEWED':
      return 'primary';
    default:
      return 'default';
  }
};

const decisionLabels = {
  BUG: 'Yes — Real bug',
  EXPECTED_CHANGE: 'No — Expected change'
};

const cloneRelationshipLabels = {
  EXACT_COPY: 'Exact Copy',
  RENAMED_COPY: 'Renamed Copy',
  RESTRUCTURED_COPY: 'Restructured Copy',
  DIFFERENT_IMPLEMENTATION: 'Different Implementation',
  NO_RELATION: 'No Relation'
};

const bugReproLabels = {
  YES: 'Yes',
  NO: 'No',
  UNCLEAR: 'Unclear'
};

const reviewerStatusLabels = {
  VALID: 'Valid Evaluation',
  SUSPICIOUS: 'Suspicious Evaluation',
  INCOMPLETE: 'Incomplete Evaluation'
};

const SubmissionReviewDetail = () => {
  const { taskId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDetail();
  }, [taskId, assignmentId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await researcherEvaluationService.getSubmissionDetail(taskId, assignmentId);
      setDetail(response.data);
    } catch (err) {
      console.error('Failed to load submission detail', err);
      setError('Unable to load this submission. It may not exist or you may not have access.');
    } finally {
      setLoading(false);
    }
  };

  const isSnapshotTask = detail?.taskType?.artifactType === 'SNAPSHOT';
  const isCloneTask = detail?.taskType?.artifactType === 'CODE_CLONE';
  const isBugTask = detail?.taskType?.artifactType === 'BUG_REPORT';
  const isSolidTask = detail?.taskType?.artifactType === 'SOLID_VIOLATION';
  const layoutMode = detail?.assignment?.layoutMode || detail?.taskType?.layoutMode || 'SINGLE_PANEL';
  const criteriaMap = useMemo(() => {
    const map = new Map();
    (detail?.criteria || []).forEach((criteria) => {
      map.set(criteria.id, criteria);
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

  const formatScoreValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      if (value.value !== undefined) {
        return formatScoreValue(value.value);
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(`/researcher/evaluation-tasks/${taskId}/submissions`)} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Submission Review
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Container maxWidth="xl" sx={{ py: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            </Container>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  if (error || !detail) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(`/researcher/evaluation-tasks/${taskId}/submissions`)} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Submission Review
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Container maxWidth="xl" sx={{ py: 4 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || 'Submission not found.'}
              </Alert>
              <Button variant="outlined" onClick={() => navigate(`/researcher/evaluation-tasks/${taskId}/submissions`)}>
                Back to submissions
              </Button>
            </Container>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  const { assignment, submission } = detail;
  const annotationSnapshot = submission?.annotationsSnapshot;
  const snapshotAnnotations = Array.isArray(annotationSnapshot)
    ? annotationSnapshot
    : annotationSnapshot?.annotations;
  const combinedAnnotations = (snapshotAnnotations && snapshotAnnotations.length)
    ? snapshotAnnotations
    : (detail.annotations || []);
  const dynamicCriteria = detail?.dynamicCriteria || [];
  const answers = submission?.answers || {};
  const isSideBySide = layoutMode === 'SIDE_BY_SIDE' || detail?.task?.layoutMode === 'SIDE_BY_SIDE';
  const isThreeWay = layoutMode === 'THREE_WAY' || detail?.task?.layoutMode === 'THREE_WAY';
  const isSingle = layoutMode === 'SINGLE' || detail?.task?.layoutMode === 'SINGLE';
  const viewerArtifacts = detail?.viewerArtifacts || detail?.artifacts || [];
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
          tripletAnswers.push(`Triplet ${i + 1}: ${displayValue}`);
        }
      }
      return tripletAnswers.length > 0 ? tripletAnswers.join(' | ') : '—';
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
          pairAnswers.push(`Pair ${i + 1}: ${displayValue}`);
        }
      }
      return pairAnswers.length > 0 ? pairAnswers.join(' | ') : '—';
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

  const annotationArtifacts = viewerArtifacts.map((artifact) => ({
    ...artifact,
    id: artifact.artifactId || artifact.id
  }));

  const content = (
    <Container maxWidth="lg" sx={{ py: 4, mx: 'auto' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Submission Review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {detail.task?.title} — {assignment?.participantName || `Participant #${assignment?.participantId}`}
          </Typography>
        </Box>
        <Chip
          label={assignment?.status}
          color={statusColor(assignment?.status)}
          variant="outlined"
          sx={{ ml: 'auto' }}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Card variant="outlined" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Participant
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {assignment?.participantName}
                {assignment?.participantUsername ? ` (${assignment?.participantUsername})` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Participant ID #{assignment?.participantId}
              </Typography>
              {detail.participantEmail && (
                <Typography variant="body2" color="text.secondary">
                  {detail.participantEmail}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
          <Card variant="outlined" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Task
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {detail?.task?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Task ID #{detail?.task?.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {detail?.taskType?.artifactType}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {detail.studyTitle && (
          <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
            <Card variant="outlined" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Study
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {detail.studyTitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {detail.task?.instructions && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Task Instructions
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {detail.task.instructions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} lg={8} sx={{ maxWidth: '100%' }}>
          <Stack spacing={3}>
            <Paper sx={{ p: 2 }} elevation={0}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Participant Notes & Metadata
              </Typography>
              <Grid container spacing={2}>
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
              </Grid>
            </Paper>

            <Paper sx={{ p: 2 }} elevation={0}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Artifacts
              </Typography>
              {isSideBySide && pairCount > 0 ? (
                <Stack spacing={3}>
                  {Array.from({ length: pairCount }).map((_, pairIndex) => {
                    const startIdx = pairIndex * 2;
                    const pairArtifacts = viewerArtifacts.slice(startIdx, startIdx + 2);
                    return (
                      <Box key={`pair-${pairIndex}`}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
                          Pair {pairIndex + 1}
                        </Typography>
                        <Grid container spacing={2}>
                          {pairArtifacts.map((artifact) => (
                            <Grid
                              item
                              xs={12}
                              md={6}
                              key={(artifact.artifactId || '') + artifact.displayName || artifact.id}
                            >
                              <ArtifactCard
                                artifact={artifact}
                                annotations={combinedAnnotations}
                                readOnly
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>
              ) : isThreeWay && tripletCount > 0 ? (
                <Stack spacing={3}>
                  {Array.from({ length: tripletCount }).map((_, tripletIndex) => {
                    const startIdx = tripletIndex * 3;
                    const tripletArtifacts = viewerArtifacts.slice(startIdx, startIdx + 3);
                    return (
                      <Box key={`triplet-${tripletIndex}`}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
                          Pair {tripletIndex + 1}
                        </Typography>
                        <Grid container spacing={2}>
                          {tripletArtifacts.map((artifact) => (
                            <Grid
                              item
                              xs={12}
                              md={4}
                              key={(artifact.artifactId || '') + artifact.displayName || artifact.id}
                            >
                              <ArtifactCard
                                artifact={artifact}
                                annotations={combinedAnnotations}
                                readOnly
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Grid container spacing={2}>
                  {viewerArtifacts.map((artifact) => (
                    <Grid
                      item
                      xs={12}
                      key={(artifact.artifactId || '') + artifact.displayName || artifact.id}
                    >
                      <ArtifactCard
                        artifact={artifact}
                        annotations={combinedAnnotations}
                        readOnly
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>

            <Paper sx={{ p: 2 }} elevation={0}>
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
                      const singleAnswers = [];
                      for (let i = 0; i < singleCount; i++) {
                        const singleKey = `single_${i}_${criterion.id}`;
                        const value = answers[singleKey];
                        if (value !== null && value !== undefined) {
                          singleAnswers.push({ artifactIndex: i + 1, value });
                        }
                      }
                      
                      return (
                        <Paper key={criterion.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary">
                              {criterion.description}
                            </Typography>
                          )}
                          {singleAnswers.length > 0 ? (
                            <Stack spacing={1} sx={{ mt: 2 }}>
                              {singleAnswers.map(({ artifactIndex, value }) => {
                                let displayValue = value;
                                if (Array.isArray(value)) {
                                  displayValue = value.length ? value.join(', ') : '—';
                                } else if (typeof value === 'boolean') {
                                  displayValue = value ? 'Yes' : 'No';
                                } else {
                                  displayValue = String(value);
                                }
                                return (
                                  <Box key={artifactIndex} sx={{ pl: 2, borderLeft: 2, borderColor: 'info.main' }}>
                                    <Typography variant="body2">
                                      <strong>Artifact {artifactIndex}:</strong> {displayValue}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              No response provided
                            </Typography>
                          )}
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Paper>
                      );
                    } else if (isThreeWay && tripletCount > 0) {
                      // Render three-way answers grouped by triplet
                      const tripletAnswers = [];
                      for (let i = 0; i < tripletCount; i++) {
                        const tripletKey = `triplet_${i}_${criterion.id}`;
                        const value = answers[tripletKey];
                        if (value !== null && value !== undefined) {
                          tripletAnswers.push({ tripletIndex: i + 1, value });
                        }
                      }
                      
                      return (
                        <Paper key={criterion.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary">
                              {criterion.description}
                            </Typography>
                          )}
                          {tripletAnswers.length > 0 ? (
                            <Stack spacing={1} sx={{ mt: 2 }}>
                              {tripletAnswers.map(({ tripletIndex, value }) => {
                                let displayValue = value;
                                if (Array.isArray(value)) {
                                  displayValue = value.length ? value.join(', ') : '—';
                                } else if (typeof value === 'boolean') {
                                  displayValue = value ? 'Yes' : 'No';
                                } else {
                                  displayValue = String(value);
                                }
                                return (
                                  <Box key={tripletIndex} sx={{ pl: 2, borderLeft: 2, borderColor: 'secondary.main' }}>
                                    <Typography variant="body2">
                                      <strong>Triplet {tripletIndex}:</strong> {displayValue}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              No response provided
                            </Typography>
                          )}
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Paper>
                      );
                    } else if (isSideBySide && pairCount > 0) {
                      // Render side-by-side answers grouped by pair
                      const pairAnswers = [];
                      for (let i = 0; i < pairCount; i++) {
                        const pairKey = `pair_${i}_${criterion.id}`;
                        const value = answers[pairKey];
                        if (value !== null && value !== undefined) {
                          pairAnswers.push({ pairIndex: i + 1, value });
                        }
                      }
                      
                      return (
                        <Paper key={criterion.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary">
                              {criterion.description}
                            </Typography>
                          )}
                          {pairAnswers.length > 0 ? (
                            <Stack spacing={1} sx={{ mt: 2 }}>
                              {pairAnswers.map(({ pairIndex, value }) => {
                                let displayValue = value;
                                if (Array.isArray(value)) {
                                  displayValue = value.length ? value.join(', ') : '—';
                                } else if (typeof value === 'boolean') {
                                  displayValue = value ? 'Yes' : 'No';
                                } else {
                                  displayValue = String(value);
                                }
                                return (
                                  <Box key={pairIndex} sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                                    <Typography variant="body2">
                                      <strong>Pair {pairIndex}:</strong> {displayValue}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              No response provided
                            </Typography>
                          )}
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Paper>
                      );
                    } else {
                      // Normal mode
                      return (
                        <Paper key={criterion.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {criterion.name || 'Criterion'}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="text.secondary">
                              {criterion.description}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Response:</strong> {renderDynamicAnswer(criterion)}
                          </Typography>
                          {criterion.required && (
                            <Chip label="Required" size="small" color="warning" sx={{ mt: 1 }} />
                          )}
                        </Paper>
                      );
                    }
                  })}
                </Stack>
              ) : scoresWithCriteria.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Criterion</TableCell>
                      <TableCell>Response</TableCell>
                      <TableCell>Notes</TableCell>
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
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No criteria responses were recorded.
                </Typography>
              )}
            </Paper>

            <Paper sx={{ p: 2 }} elevation={0}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Participant Annotations
                </Typography>
                <Chip label={`${combinedAnnotations.length} annotations`} size="small" />
              </Stack>
              <AnnotationPanel
                annotations={combinedAnnotations}
                artifacts={annotationArtifacts}
                readOnly
                allowTagging
              />
            </Paper>

            {(detail.reviewerStatus || detail.reviewerNotes || detail.reviewerQualityScore) && (
              <Paper sx={{ p: 2 }} elevation={0}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Reviewer Evaluation
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <InfoCard
                      title="Review Status"
                      value={detail.reviewerStatus ? (reviewerStatusLabels[detail.reviewerStatus] || detail.reviewerStatus) : '—'}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <InfoCard
                      title="Quality Score"
                      value={detail.reviewerQualityScore ? `${detail.reviewerQualityScore}/5` : '—'}
                    />
                  </Grid>
                  {detail.reviewerNotes && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            Reviewer Notes
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                            {detail.reviewerNotes}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  {(detail.reviewedAt || detail.reviewedByName) && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            Reviewed By
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {detail.reviewedByName || '—'}
                            {detail.reviewedAt && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {formatDateTime(detail.reviewedAt)}
                              </Typography>
                            )}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(`/researcher/evaluation-tasks/${taskId}/submissions`)} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Submission Review
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

const InfoCard = ({ title, value, subtitle }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={600}>
        {value || '—'}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default SubmissionReviewDetail;
