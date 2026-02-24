import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Button, IconButton, Alert, CircularProgress,
  Tabs, Tab, Divider, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, List, ListItem, ListItemIcon, ListItemText, TextField, FormControl,
  FormLabel, RadioGroup, Radio, FormControlLabel, MenuItem, FormHelperText, Slider, Checkbox,
  Card, CardContent, LinearProgress, Collapse, CssBaseline, AppBar, Toolbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Save as SaveIcon, Send as SendIcon,
  CheckCircle as CheckCircleIcon, Info as InfoIcon,
  Collections as CollectionsIcon, Checklist as ChecklistIcon,
  RateReview as RateReviewIcon, AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  Assessment as AssessmentIcon, Close as CloseIcon
} from '@mui/icons-material';
import { evaluationService } from '../../services/api';
import ArtifactViewer from '../../components/evaluation/ArtifactViewer';
import AnnotationPanel from '../../components/evaluation/AnnotationPanel';
import ScoringPanel from '../../components/evaluation/ScoringPanel';
import ArtifactCard from '../../components/evaluation/ArtifactCard';
import AnnotationEditorDialog from '../../components/evaluation/AnnotationEditorDialog';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const EvaluationTaskDetail = (props) => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskData, setTaskData] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [scores, setScores] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [startTime] = useState(Date.now());
  const [snapshotDecision, setSnapshotDecision] = useState('');
  const [snapshotExplanation, setSnapshotExplanation] = useState('');
  const [snapshotConfidence, setSnapshotConfidence] = useState('');
  const [snapshotError, setSnapshotError] = useState('');
  const [cloneRelationship, setCloneRelationship] = useState('');
  const [cloneSimilarity, setCloneSimilarity] = useState(null);
  const [cloneNotes, setCloneNotes] = useState('');
  const [cloneError, setCloneError] = useState('');
  const [bugSeverity, setBugSeverity] = useState('');
  const [bugReproducible, setBugReproducible] = useState('');
  const [bugCategory, setBugCategory] = useState('');
  const [bugNotes, setBugNotes] = useState('');
  const [bugSeverityError, setBugSeverityError] = useState('');
  const [bugReproError, setBugReproError] = useState('');
  const [solidPrinciple, setSolidPrinciple] = useState('');
  const [solidSeverity, setSolidSeverity] = useState('');
  const [solidExplanation, setSolidExplanation] = useState('');
  const [solidSuggestedFix, setSolidSuggestedFix] = useState('');
  const [solidPrincipleError, setSolidPrincipleError] = useState('');
  const [dynamicAnswers, setDynamicAnswers] = useState({});

  const formatDuration = (seconds) => {
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

  const getDaysRemaining = (dueDateString) => {
    if (!dueDateString) return null;
    const due = new Date(dueDateString);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isSnapshotTask = taskData?.artifacts?.some(
    (artifact) => artifact.artifactType === 'SNAPSHOT'
  );
  const isCloneTask = taskData?.taskType?.artifactType === 'CODE_CLONE';
  const isBugTask = taskData?.taskType?.artifactType === 'BUG_REPORT';
  const isSolidTask = taskData?.taskType?.artifactType === 'SOLID_VIOLATION';
  const isBlindedTask = Boolean(taskData?.task?.blindedMode ?? taskData?.blindedMode);

  const snapshotImageCount = isSnapshotTask
    ? (() => {
        const artifact = taskData?.artifacts?.[0];
        if (!artifact) return 0;
        const ids = [artifact.referenceImageId, artifact.failureImageId, artifact.diffImageId];
        return ids.filter(Boolean).length || 3;
      })()
    : 0;

  // Load task details
  useEffect(() => {
    loadTaskData();
  }, [assignmentId]);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!taskData || taskData.status === 'SUBMITTED') return;

    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [annotations, scores, taskData]);

  useEffect(() => {
    if (!isSnapshotTask) {
      setSnapshotDecision('');
      setSnapshotExplanation('');
      setSnapshotConfidence('');
      setSnapshotError('');
    }
  }, [isSnapshotTask]);

  useEffect(() => {
    if (!isCloneTask) {
      setCloneRelationship('');
      setCloneSimilarity(null);
      setCloneNotes('');
      setCloneError('');
    }
  }, [isCloneTask]);

  useEffect(() => {
    if (!isBugTask) {
      setBugSeverity('');
      setBugReproducible('');
      setBugCategory('');
      setBugNotes('');
      setBugSeverityError('');
      setBugReproError('');
    }
  }, [isBugTask]);

  useEffect(() => {
    if (!isSolidTask) {
      setSolidPrinciple('');
      setSolidSeverity('');
      setSolidExplanation('');
      setSolidSuggestedFix('');
      setSolidPrincipleError('');
    }
  }, [isSolidTask]);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load task details
      const taskResponse = await evaluationService.getTaskDetails(assignmentId);
      setTaskData(taskResponse.data);

      // Load annotations
      const annotationsResponse = await evaluationService.getAnnotations(assignmentId);
      setAnnotations(annotationsResponse.data || []);

      // Load scores
      const scoresResponse = await evaluationService.getScores(assignmentId);
      const scoresMap = {};
      (scoresResponse.data || []).forEach(score => {
        scoresMap[score.criteriaItemId] = score;
      });
      setScores(scoresMap);

      // Load draft if exists
      try {
        const draftResponse = await evaluationService.getDraft(assignmentId);
        if (draftResponse.data && draftResponse.data.draftData) {
          const draft = draftResponse.data.draftData;
          if (draft.scores) {
            setScores(draft.scores);
          }
          if (draft.annotations) {
            setAnnotations(draft.annotations);
          }
        }
      } catch (err) {
        // Draft might not exist yet, that's okay
        console.log('No draft found, starting fresh');
      }
      await loadSubmissionData();

    } catch (err) {
      console.error('Error loading task data:', err);
      setError('Failed to load task data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionData = async () => {
    try {
      const submissionResponse = await evaluationService.getSubmission(assignmentId);
      if (submissionResponse.data) {
        const submission = submissionResponse.data;
        if (submission.snapshotDecision) setSnapshotDecision(submission.snapshotDecision);
        if (submission.snapshotExplanation) setSnapshotExplanation(submission.snapshotExplanation);
        if (submission.snapshotConfidence) setSnapshotConfidence(submission.snapshotConfidence);
        if (submission.cloneRelationship) setCloneRelationship(submission.cloneRelationship);
        if (submission.cloneSimilarity !== null && submission.cloneSimilarity !== undefined) {
          setCloneSimilarity(submission.cloneSimilarity);
        }
        if (submission.cloneNotes) setCloneNotes(submission.cloneNotes);
        if (submission.bugSeverity) setBugSeverity(submission.bugSeverity);
        if (submission.bugReproducible) setBugReproducible(submission.bugReproducible);
        if (submission.bugCategory) setBugCategory(submission.bugCategory);
        if (submission.bugNotes) setBugNotes(submission.bugNotes);
        if (submission.solidViolatedPrinciple) setSolidPrinciple(submission.solidViolatedPrinciple);
        if (submission.solidViolationSeverity) setSolidSeverity(submission.solidViolationSeverity);
        if (submission.solidExplanation) setSolidExplanation(submission.solidExplanation);
        if (submission.solidSuggestedFix) setSolidSuggestedFix(submission.solidSuggestedFix);
        if (submission.answers) setDynamicAnswers(submission.answers);
        if (submission.annotationsSnapshot) {
          const snapshotAnnotations = Array.isArray(submission.annotationsSnapshot)
            ? submission.annotationsSnapshot
            : submission.annotationsSnapshot.annotations;
          if (snapshotAnnotations) {
            setAnnotations(snapshotAnnotations);
          }
        }
      }
    } catch (err) {
      // No submission yet; ignore
    }
  };

  const saveDraft = useCallback(async () => {
    if (!taskData || taskData.status === 'SUBMITTED') return;

    try {
      setSaving(true);
      const draftData = {
        scores,
        annotations,
        lastSavedAt: new Date().toISOString()
      };
      await evaluationService.saveDraft(assignmentId, draftData);
      setLastSavedAt(new Date());
    } catch (err) {
      console.error('Error saving draft:', err);
      // Don't show error to user for auto-save failures
    } finally {
      setSaving(false);
    }
  }, [assignmentId, scores, annotations, taskData]);

  const handleAnnotationCreate = async (annotationData) => {
    try {
      const response = await evaluationService.createAnnotation(assignmentId, annotationData);
      setAnnotations([...annotations, response.data]);
    } catch (err) {
      console.error('Error creating annotation:', err);
      setError('Failed to create annotation. Please try again.');
    }
  };

  const handleAnnotationDelete = async (annotationId) => {
    try {
      await evaluationService.deleteAnnotation(annotationId);
      setAnnotations(annotations.filter(a => a.id !== annotationId));
    } catch (err) {
      console.error('Error deleting annotation:', err);
      setError('Failed to delete annotation. Please try again.');
    }
  };

  const handleScoreChange = async (criteriaItemId, value, notes) => {
    try {
      const scoreData = {
        criteriaItemId,
        value,
        notes
      };
      const response = await evaluationService.saveScore(assignmentId, scoreData);
      setScores({
        ...scores,
        [criteriaItemId]: response.data
      });
    } catch (err) {
      console.error('Error saving score:', err);
      setError('Failed to save score. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      if (isSnapshotTask && !snapshotDecision) {
        setSnapshotError('Please select whether this is a real bug or an expected change.');
        setSubmitting(false);
        return;
      }

      setSnapshotError('');
      if (isCloneTask && !cloneRelationship) {
        setCloneError('Select a relationship between the two code fragments.');
        setSubmitting(false);
        return;
      }
      setCloneError('');

      if (isBugTask && !bugSeverity) {
        setBugSeverityError('Select a severity option.');
        setSubmitting(false);
        return;
      }
      setBugSeverityError('');

      if (isBugTask && !bugReproducible) {
        setBugReproError('Select whether the bug is reproducible.');
        setSubmitting(false);
        return;
      }
      setBugReproError('');

      if (isSolidTask && !solidPrinciple) {
        setSolidPrincipleError('Select a SOLID principle.');
        setSubmitting(false);
        return;
      }
      setSolidPrincipleError('');

      const submissionData = {
        timeSpentSeconds: timeSpent,
        snapshotDecision: isSnapshotTask ? snapshotDecision : null,
        snapshotExplanation: isSnapshotTask ? snapshotExplanation : null,
        snapshotConfidence: isSnapshotTask ? snapshotConfidence : null,
        cloneRelationship: isCloneTask ? cloneRelationship : null,
        cloneSimilarity: isCloneTask && typeof cloneSimilarity === 'number' ? cloneSimilarity : null,
        cloneNotes: isCloneTask ? cloneNotes : null,
        bugSeverity: isBugTask ? bugSeverity : null,
        bugReproducible: isBugTask ? bugReproducible : null,
        bugCategory: isBugTask ? bugCategory : null,
        bugNotes: isBugTask ? bugNotes : null,
        solidViolatedPrinciple: isSolidTask ? solidPrinciple : null,
        solidViolationSeverity: isSolidTask ? solidSeverity : null,
        solidExplanation: isSolidTask ? solidExplanation : null,
        solidSuggestedFix: isSolidTask ? solidSuggestedFix : null,
        annotations
      };

      await evaluationService.submitEvaluation(assignmentId, submissionData);
      navigate('/dashboard?tab=Tasks');

      setSubmitDialogOpen(false);

    } catch (err) {
      console.error('Error submitting evaluation:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit evaluation. Please check that all required fields are filled.');
      }
      setSubmitDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = taskData?.status === 'SUBMITTED' || taskData?.status === 'REVIEWED';
  const dueDate = taskData?.assignment?.dueDate || taskData?.task?.dueDate || taskData?.dueDate || null;
  const daysRemaining = getDaysRemaining(dueDate);
  const layoutMode = taskData?.assignment?.layoutMode || taskData?.layoutMode || 'SINGLE_PANEL';
  const comparisonMode = taskData?.assignment?.comparisonMode || taskData?.comparisonMode || 'TEXTUAL';
  const actualArtifactsCount = taskData?.artifacts?.length || 0;
  const totalCriteriaCount = isSnapshotTask
    ? 3
    : isCloneTask
      ? 3
      : isBugTask
        ? 4
        : (taskData?.criteriaItems?.length || 0);
  const requiredCriteriaCount = isSnapshotTask
    ? 1
    : isCloneTask
      ? 1
      : isBugTask
        ? 2
        : (taskData?.criteriaItems?.filter(c => c.isRequired).length || 0);
  const optionalCriteriaCount = isSnapshotTask
    ? 2
    : isCloneTask
      ? 2
      : isBugTask
        ? 2
        : Math.max(totalCriteriaCount - requiredCriteriaCount, 0);
  const descriptionText = taskData?.taskDescription || taskData?.task?.description || '';
  const defaultInstructions = taskData?.task?.instructions || 'Review the artifacts, capture the key differences, and then complete the scoring criteria before submitting.';
  const snapshotGuideContent = [
    'Snapshot Evaluation Task',
    'Compare the Reference, Failure, and Diff images.',
    'Your goal is to decide whether the Failure image shows a real UI regression (bug) or an expected UI change.',
    'Use zoom/fullscreen to examine details, and use annotations if needed. After reviewing the images, fill in the required evaluation criteria.'
  ];
  const cloneGuideContent = [
    'Clone Type Evaluation Task',
    'Use the two code panels to compare syntax, structure, and behavior.',
    'Determine the relationship between the pair, then optionally score similarity and leave notes.'
  ];
  const bugGuideContent = [
    'Bug Report Evaluation Task',
    'Review the provided bug report JSON, focusing on severity, steps, environment, and reproducibility clues.',
    'Assess the severity and determine if the bug is reproducible, then add optional category and notes.'
  ];
  const solidGuideContent = [
    'SOLID Code Evaluation Task',
    'Review the code snippet and accompanying metadata describing its context.',
    'Identify which SOLID principle is violated, rate the severity, and optionally explain your reasoning and fix.'
  ];
const cloneRelationshipOptions = [
  { value: 'EXACT_COPY', label: 'Exact Copy' },
  { value: 'RENAMED_COPY', label: 'Renamed Copy' },
  { value: 'RESTRUCTURED_COPY', label: 'Restructured Copy' },
  { value: 'DIFFERENT_IMPLEMENTATION', label: 'Different Implementation' },
  { value: 'NO_RELATION', label: 'No Relation' }
];
const bugSeverityOptions = ['Critical', 'Major', 'Moderate', 'Minor', 'Trivial'];
const bugReproducibleOptions = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
  { value: 'UNCLEAR', label: 'Unclear' }
];
const bugCategoryOptions = [
  'UI Bug',
  'Functional Bug',
  'Performance Issue',
  'Security Issue',
  'Compatibility Issue',
  'Other'
];
const solidPrincipleOptions = [
  'Single Responsibility Principle (SRP)',
  'Open/Closed Principle (OCP)',
  'Liskov Substitution Principle (LSP)',
  'Interface Segregation Principle (ISP)',
  'Dependency Inversion Principle (DIP)',
  'None / No Violation'
];
const solidSeverityOptions = ['Critical', 'Major', 'Moderate', 'Minor', 'Very Minor'];
  const instructionsText = isSnapshotTask
    ? snapshotGuideContent
    : isCloneTask
      ? cloneGuideContent
      : isBugTask
        ? bugGuideContent
        : isSolidTask
          ? solidGuideContent
          : [defaultInstructions];
  const artifactSummaryText = isSnapshotTask
    ? `Snapshot Set (${snapshotImageCount || 3} images)`
    : isCloneTask
      ? 'Clone Pair (Original vs Clone)'
      : isBugTask
        ? 'Bug Report JSON'
        : isSolidTask
          ? 'SOLID Code Artifact'
          : `Artifacts: ${actualArtifactsCount}`;
  const criteriaSummaryText = isSnapshotTask || isCloneTask
    ? 'Criteria: 1 required, 2 optional'
    : isBugTask
      ? 'Criteria: 2 required, 2 optional'
      : isSolidTask
        ? 'Criteria: 1 required, 3 optional'
        : `Criteria: ${requiredCriteriaCount} required${optionalCriteriaCount > 0 ? `, ${optionalCriteriaCount} optional` : ''}`;
  const confidenceOptions = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const criteriaTabLabel = isSnapshotTask
    ? 'Evaluation Criteria (1 required, 2 optional)'
    : isCloneTask
      ? 'Clone Evaluation (1 required, 2 optional)'
      : isBugTask
        ? 'Bug Report Evaluation (2 required, 2 optional)'
        : isSolidTask
          ? 'SOLID Evaluation (1 required, 3 optional)'
          : `Evaluation Criteria (${Object.keys(scores).length}/${requiredCriteriaCount || 0})`;
  const bugRequiredAnswered = (bugSeverity ? 1 : 0) + (bugReproducible ? 1 : 0);
  const solidRequiredAnswered = solidPrinciple ? 1 : 0;
  const answeredCount = isSnapshotTask
    ? (snapshotDecision ? 1 : 0)
    : isCloneTask
      ? (cloneRelationship ? 1 : 0)
      : isBugTask
        ? bugRequiredAnswered
        : isSolidTask
          ? solidRequiredAnswered
          : Object.keys(scores).length;
  
  const completionPercentage = requiredCriteriaCount > 0
    ? Math.min(100, Math.round((answeredCount / requiredCriteriaCount) * 100))
    : 0;

  const dialogCriteriaSummary = `${answeredCount} / ${requiredCriteriaCount} required answered`;

const renderSnapshotCriteria = () => (
  <Stack spacing={3}>
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <FormControl component="fieldset" error={Boolean(snapshotError)} disabled={isSubmitted}>
        <FormLabel required>Is this a real bug?</FormLabel>
        <RadioGroup
          value={snapshotDecision}
          onChange={(e) => setSnapshotDecision(e.target.value)}
        >
          <FormControlLabel
            value="BUG"
            control={<Radio disabled={isSubmitted} />}
            label="Yes — This is a real bug"
          />
          <FormControlLabel
            value="EXPECTED_CHANGE"
            control={<Radio disabled={isSubmitted} />}
            label="No — This is an expected UI change"
          />
        </RadioGroup>
        <FormHelperText>
          {snapshotError || 'Select one option before submitting'}
        </FormHelperText>
      </FormControl>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        label="Explanation (optional): Why did you choose this answer?"
        multiline
        minRows={4}
        value={snapshotExplanation}
        onChange={(e) => setSnapshotExplanation(e.target.value)}
        disabled={isSubmitted}
      />
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        select
        label="Confidence Level (optional)"
        value={snapshotConfidence}
        onChange={(e) => setSnapshotConfidence(e.target.value)}
        disabled={isSubmitted}
      >
        <MenuItem value="">
          <em>Select confidence</em>
        </MenuItem>
        {confidenceOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </Paper>
  </Stack>
);

const renderBugCriteria = () => (
  <Stack spacing={3}>
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <FormControl component="fieldset" error={Boolean(bugSeverityError)} disabled={isSubmitted}>
        <FormLabel required>How severe is this bug?</FormLabel>
        <RadioGroup
          value={bugSeverity}
          onChange={(e) => setBugSeverity(e.target.value)}
        >
          {bugSeverityOptions.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio disabled={isSubmitted} />}
              label={option}
            />
          ))}
        </RadioGroup>
        <FormHelperText>{bugSeverityError || 'Select one option'}</FormHelperText>
      </FormControl>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <FormControl component="fieldset" error={Boolean(bugReproError)} disabled={isSubmitted}>
        <FormLabel required>Is this bug reproducible based on the report?</FormLabel>
        <RadioGroup
          value={bugReproducible}
          onChange={(e) => setBugReproducible(e.target.value)}
        >
          {bugReproducibleOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio disabled={isSubmitted} />}
              label={option.label}
            />
          ))}
        </RadioGroup>
        <FormHelperText>{bugReproError || 'Select one option'}</FormHelperText>
      </FormControl>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        select
        label="Bug Category (optional)"
        value={bugCategory}
        onChange={(e) => setBugCategory(e.target.value)}
        disabled={isSubmitted}
      >
        <MenuItem value="">
          <em>Not specified</em>
        </MenuItem>
        {bugCategoryOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        multiline
        minRows={4}
        label="Notes / additional analysis (optional)"
        value={bugNotes}
        onChange={(e) => setBugNotes(e.target.value)}
        disabled={isSubmitted}
      />
    </Paper>
  </Stack>
);
const renderCloneCriteria = () => (
  <Stack spacing={3}>
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <FormControl component="fieldset" error={Boolean(cloneError)} disabled={isSubmitted}>
        <FormLabel required>What kind of relationship do these two code fragments have?</FormLabel>
        <RadioGroup
          value={cloneRelationship}
          onChange={(e) => setCloneRelationship(e.target.value)}
        >
          {cloneRelationshipOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio disabled={isSubmitted} />}
              label={option.label}
            />
          ))}
        </RadioGroup>
        <FormHelperText>
          {cloneError || 'Select one option before submitting'}
        </FormHelperText>
      </FormControl>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" fontWeight={600}>
          How similar are the two code fragments? (optional)
        </Typography>
        <Slider
          value={typeof cloneSimilarity === 'number' ? cloneSimilarity : 0}
          min={0}
          max={100}
          step={1}
          valueLabelDisplay="auto"
          color="primary"
          onChange={(_, value) => {
            const nextValue = Array.isArray(value) ? value[0] : value;
            setCloneSimilarity(nextValue);
          }}
          disabled={isSubmitted}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {cloneSimilarity === null ? 'Not provided' : `${cloneSimilarity}% similarity`}
          </Typography>
          {cloneSimilarity !== null && (
            <Button size="small" onClick={() => setCloneSimilarity(null)} disabled={isSubmitted}>
              Clear
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        label="Additional notes (optional)"
        multiline
        minRows={4}
        value={cloneNotes}
        onChange={(e) => setCloneNotes(e.target.value)}
        disabled={isSubmitted}
      />
    </Paper>
  </Stack>
);

const renderSolidCriteria = () => (
  <Stack spacing={3}>
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <FormControl component="fieldset" error={Boolean(solidPrincipleError)} disabled={isSubmitted}>
        <FormLabel required>Which SOLID principle does this code violate?</FormLabel>
        <RadioGroup
          value={solidPrinciple}
          onChange={(e) => setSolidPrinciple(e.target.value)}
        >
          {solidPrincipleOptions.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio disabled={isSubmitted} />}
              label={option}
            />
          ))}
        </RadioGroup>
        <FormHelperText>{solidPrincipleError || 'Select one option'}</FormHelperText>
      </FormControl>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        select
        label="How severe is the violation? (optional)"
        value={solidSeverity}
        onChange={(e) => setSolidSeverity(e.target.value)}
        disabled={isSubmitted}
      >
        <MenuItem value="">
          <em>Not specified</em>
        </MenuItem>
        {solidSeverityOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        multiline
        minRows={4}
        label="Explain your reasoning (optional)"
        value={solidExplanation}
        onChange={(e) => setSolidExplanation(e.target.value)}
        disabled={isSubmitted}
      />
    </Paper>

    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="How would you fix this issue? (optional)"
        value={solidSuggestedFix}
        onChange={(e) => setSolidSuggestedFix(e.target.value)}
        disabled={isSubmitted}
      />
    </Paper>
  </Stack>
);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!taskData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Task not found</Alert>
        <Button onClick={() => navigate('/dashboard?tab=Tasks')} sx={{ mt: 2 }}>
          Back to Tasks
        </Button>
      </Container>
    );
  }

  const isDynamicTask = Array.isArray(taskData?.artifactReferences) && taskData.artifactReferences.length > 0;

  if (isDynamicTask) {
    return (
      <DynamicEvaluationTaskView
        assignmentId={assignmentId}
        taskData={taskData}
        initialAnswers={dynamicAnswers}
        initialAnnotations={annotations}
        onAnswersChange={setDynamicAnswers}
        onAnnotationsChange={setAnnotations}
        reload={loadTaskData}
        isSubmitted={isSubmitted}
      />
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AppBar position="fixed" color="default" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/dashboard?tab=Tasks')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {taskData.taskTitle || 'Evaluation Task'}
          </Typography>
          <ColorModeSelect size="small" />
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
        <Toolbar />
        <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1}>
          <Chip label={taskData.taskTypeName} color="primary" size="small" />
          <Chip
            label={taskData.status === 'SUBMITTED' ? 'Submitted' : 'In Progress'}
            color={taskData.status === 'SUBMITTED' ? 'success' : 'warning'}
            size="small"
          />
          {saving && <Chip label="Saving..." size="small" variant="outlined" />}
        </Stack>

        {!isSubmitted && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={saveDraft}
              disabled={saving}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={() => setSubmitDialogOpen(true)}
              disabled={submitting}
            >
              Submit Evaluation
            </Button>
          </Stack>
        )}

        {isSubmitted && (
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={() => setResultDialogOpen(true)}
          >
            View Results
          </Button>
        )}
      </Box>

      {isBlindedTask && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Blinded Mode: Artifact origins are hidden for fairness. Document labels have been anonymized.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Task Guide
                </Typography>
              </Stack>
              <IconButton size="small" onClick={() => setGuideExpanded(!guideExpanded)}>
                {guideExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
            <Collapse in={guideExpanded}>
              {descriptionText && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {descriptionText}
                </Typography>
              )}
              {instructionsText.map((text, idx) => (
                <Typography
                  key={idx}
                  variant={isSnapshotTask && idx === 0 ? 'subtitle1' : 'body1'}
                  fontWeight={isSnapshotTask && idx === 0 ? 700 : undefined}
                  sx={{ mb: idx === instructionsText.length - 1 ? 2 : 1 }}
                >
                  {text}
                </Typography>
              ))}
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CollectionsIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Inspect each artifact panel carefully"
                    secondary="Use the zoom controls and fullscreen buttons when needed."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <RateReviewIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Capture annotations as you go"
                    secondary="Highlight differences or issues so you can reference them later."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ChecklistIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Complete the scoring criteria"
                    secondary="Each required criterion must be filled before submitting."
                  />
                </ListItem>
              </List>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => setActiveTab(0)}>
                  Go to Artifacts
                </Button>
                <Button variant="outlined" onClick={() => setActiveTab(1)}>
                  Go to Criteria
                </Button>
                <Button variant="outlined" onClick={() => setActiveTab(2)}>
                  Review Annotations
                </Button>
              </Stack>
            </Collapse>
            {!guideExpanded && <Typography variant="body2" color="text.secondary">Expand to view instructions.</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Progress & Context
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Due Date
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{formatDateTime(dueDate)}</Typography>
                  {dueDate && (
                    <Chip
                      label={daysRemaining >= 0 ? `${daysRemaining} days left` : 'Overdue'}
                      size="small"
                      color={daysRemaining < 3 ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
              <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" fontWeight={600}>Required Criteria</Typography>
                  <Typography variant="caption">{answeredCount} / {requiredCriteriaCount}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={completionPercentage} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                  Layout / Comparison
                </Typography>
                <Typography variant="body1">
                  {layoutMode.replace('_', ' ')} &bull; {comparisonMode.replace('_', ' ')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    Artifacts
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {artifactSummaryText}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    Criteria
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {criteriaSummaryText}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    Annotations
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {annotations.length}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Time in Task
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={600}>{formatDuration(timeSpent)}</Typography>
                </Stack>
              </Box>
              {lastSavedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                    Last Draft Save
                  </Typography>
                  <Typography variant="body2">{formatDateTime(lastSavedAt)}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
      </Grid>
    </Grid>

      {isSubmitted && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This evaluation has been submitted and is locked. You may review your answers but cannot edit them.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Artifacts" />
          <Tab label={criteriaTabLabel} />
          <Tab label={`Annotations (${annotations.length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Artifacts Tab */}
          {activeTab === 0 && (
            <ArtifactViewer
              artifacts={taskData.artifacts || []}
              layoutMode={taskData.taskType?.layoutMode || 'TWO_PANEL'}
              onAnnotationCreate={handleAnnotationCreate}
              annotations={annotations}
              readOnly={isSubmitted}
            />
          )}

          {/* Evaluation Criteria Tab */}
          {activeTab === 1 && (
            isSnapshotTask
              ? renderSnapshotCriteria()
              : isCloneTask
                ? renderCloneCriteria()
                : isBugTask
                  ? renderBugCriteria()
                  : isSolidTask
                    ? renderSolidCriteria()
                    : (
                      <ScoringPanel
                        criteriaItems={taskData.criteriaItems || []}
                        scores={scores}
                        onScoreChange={handleScoreChange}
                        readOnly={isSubmitted}
                      />
                    )
          )}

          {/* Annotations Tab */}
          {activeTab === 2 && (
            <AnnotationPanel
              annotations={annotations}
              artifacts={taskData.artifacts || []}
              onDelete={handleAnnotationDelete}
              readOnly={isSubmitted}
            />
          )}
        </Box>
      </Paper>

      {/* View Results Modal */}
      <Dialog open={resultDialogOpen} onClose={() => setResultDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Evaluation Results</Typography>
            <IconButton onClick={() => setResultDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
              <Chip label={taskData?.status} color={taskData?.status === 'REVIEWED' ? 'success' : 'default'} />
            </Box>
            {taskData?.score !== undefined && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Score</Typography>
                <Typography variant="h5" color="success.main">{taskData.score}</Typography>
              </Box>
            )}
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>Your Submission</Typography>
              <Typography variant="body2" color="text.secondary">
                {isSnapshotTask && `Decision: ${snapshotDecision}`}
                {isCloneTask && `Relationship: ${cloneRelationship}`}
                {isBugTask && `Severity: ${bugSeverity}`}
                {isSolidTask && `Violation: ${solidPrinciple}`}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>Submit Evaluation?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to submit your evaluation? Once submitted, you cannot make any changes.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Time spent:</strong> {Math.floor(timeSpent / 60)} minutes {timeSpent % 60} seconds
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Annotations:</strong> {annotations.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Criteria filled:</strong> {dialogCriteriaSummary}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="success"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
      </Box>
    </AppTheme>
  );
};

function DynamicEvaluationTaskView({
  assignmentId,
  taskData,
  initialAnswers,
  initialAnnotations,
  onAnswersChange,
  onAnnotationsChange,
  reload,
  isSubmitted
}) {
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [annotationsState, setAnnotationsState] = useState(initialAnnotations || []);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [editorState, setEditorState] = useState({ open: false, annotation: null });

  const navigate = useNavigate();
  const criteria = taskData?.dynamicCriteria || [];
  const viewerArtifacts = taskData?.viewerArtifacts || [];
  const allowHighlight = Boolean(taskData?.task?.allowHighlight);
  const allowAnnotation = Boolean(taskData?.task?.allowAnnotation);
  const allowTagging = Boolean(taskData?.task?.allowTagging);
  const blindedMode = Boolean(taskData?.task?.blindedMode);
  const layoutMode = taskData?.task?.layoutMode || 'SINGLE';
  const annotationArtifacts = useMemo(() => (viewerArtifacts || []).map((artifact) => ({
    ...artifact,
    id: artifact.artifactId || artifact.id
  })), [viewerArtifacts]);
  const showAnnotationSection = allowAnnotation || allowHighlight || allowTagging;

  useEffect(() => {
    setAnswers(initialAnswers || {});
  }, [initialAnswers]);

  useEffect(() => {
    setAnnotationsState(initialAnnotations || []);
  }, [initialAnnotations]);

  useEffect(() => {
    onAnnotationsChange?.(annotationsState);
  }, [annotationsState, onAnnotationsChange]);

  useEffect(() => {
    if (isSubmitted) {
      return undefined;
    }
    const interval = setInterval(() => setTimeSpent((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const handleChange = (id, value) => {
    setErrors((prev) => ({ ...prev, [id]: '' }));
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    criteria.forEach((criterion) => {
      if (!criterion.required) return;
      const value = answers[criterion.id];
      if (value === undefined || value === null || value === '') {
        nextErrors[criterion.id] = 'Required';
      }
      if (Array.isArray(value) && value.length === 0) {
        nextErrors[criterion.id] = 'Required';
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setMessage('');
      await evaluationService.submitEvaluation(assignmentId, {
        timeSpentSeconds: timeSpent,
        answers,
        annotations: annotationsState
      });
      onAnswersChange(answers);
      setMessage('Evaluation submitted successfully.');
      navigate('/dashboard?tab=Tasks', { replace: true });
      return;
    } catch (err) {
      console.error('Failed to submit evaluation', err);
      setMessage(err.response?.data?.message || 'Unable to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishHighlight = (data) => {
    if (!allowAnnotation || isSubmitted) return;
    const annotationId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `annotation-${Date.now()}`;
    setEditorState({
      open: true,
      annotation: {
        id: annotationId,
        artifactId: data.artifactId,
        artifactDisplayName: data.artifactDisplayName,
        text: data.text || '',
        range: data.range || null,
        region: data.region || null,
        tags: [],
        createdAt: new Date().toISOString()
      }
    });
  };

  const handleSaveAnnotation = (updatedAnnotation) => {
    const normalized = {
      ...updatedAnnotation,
      id: updatedAnnotation.id || ((typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `annotation-${Date.now()}`),
      createdAt: updatedAnnotation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setAnnotationsState((prev) => {
      const exists = prev.some((annotation) => annotation.id === normalized.id);
      if (exists) {
        return prev.map((annotation) => (annotation.id === normalized.id ? normalized : annotation));
      }
      return [...prev, normalized];
    });
    setEditorState({ open: false, annotation: null });
  };

  const handleDeleteAnnotation = (annotationId) => {
    setAnnotationsState((prev) => prev.filter((annotation) => annotation.id !== annotationId));
  };

  const handleTagUpdate = (annotationId, tags) => {
    setAnnotationsState((prev) =>
      prev.map((annotation) => (annotation.id === annotationId ? { ...annotation, tags } : annotation))
    );
  };

  const handleCreateFromPanel = () => {
    if (!allowAnnotation || isSubmitted) return;
    const defaultArtifact = annotationArtifacts[0];
    const annotationId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `annotation-${Date.now()}`;
    setEditorState({
      open: true,
      annotation: {
        id: annotationId,
        artifactId: defaultArtifact?.id,
        text: '',
        tags: [],
        createdAt: new Date().toISOString()
      }
    });
  };

  const renderField = (criterion) => {
    const value = answers[criterion.id];
    const disabled = submitting || isSubmitted;
    switch (criterion.type) {
      case 'rating':
        return (
          <Box sx={{ px: 2 }}>
            <Slider
              min={criterion.scaleMin ?? 1}
              max={criterion.scaleMax ?? 5}
              value={typeof value === 'number' ? value : criterion.scaleMin ?? 1}
              onChange={(_, newValue) => handleChange(criterion.id, newValue)}
              valueLabelDisplay="auto"
              disabled={disabled}
            />
          </Box>
        );
      case 'single-choice':
        return (
          <RadioGroup value={value ?? ''} onChange={(e) => handleChange(criterion.id, e.target.value)}>
            {(criterion.options || []).map((option) => (
              <FormControlLabel
                key={option}
                value={option}
                control={<Radio />}
                label={option}
                disabled={disabled}
              />
            ))}
          </RadioGroup>
        );
      case 'multi-choice':
        return (
          <Stack spacing={1}>
            {(criterion.options || []).map((option) => {
              const selected = Array.isArray(value) ? value : [];
              return (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={selected.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleChange(criterion.id, [...selected, option]);
                        } else {
                          handleChange(criterion.id, selected.filter((item) => item !== option));
                        }
                      }}
                      disabled={disabled}
                    />
                  }
                  label={option}
                />
              );
            })}
          </Stack>
        );
      case 'yes-no':
        return (
          <Stack direction="row" spacing={2}>
            {['Yes', 'No'].map((option) => (
              <Button
                key={option}
                variant={value === option ? 'contained' : 'outlined'}
                onClick={() => handleChange(criterion.id, option)}
                disabled={disabled}
              >
                {option}
              </Button>
            ))}
          </Stack>
        );
      default:
        return (
          <TextField
            fullWidth
            multiline
            minRows={criterion.type === 'text' ? 3 : 1}
            value={value ?? ''}
            onChange={(e) => handleChange(criterion.id, e.target.value)}
            placeholder={criterion.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  // For SIDE_BY_SIDE mode, group artifacts into pairs
  const artifactPairs = useMemo(() => {
    if (layoutMode !== 'SIDE_BY_SIDE') {
      return [];
    }
    const pairs = [];
    for (let i = 0; i < viewerArtifacts.length; i += 2) {
      if (i + 1 < viewerArtifacts.length) {
        pairs.push([viewerArtifacts[i], viewerArtifacts[i + 1]]);
      } else {
        // If odd number, last artifact is alone
        pairs.push([viewerArtifacts[i]]);
      }
    }
    return pairs;
  }, [viewerArtifacts, layoutMode]);

  // For THREE_WAY mode, group artifacts into triplets
  const artifactTriplets = useMemo(() => {
    if (layoutMode !== 'THREE_WAY') {
      return [];
    }
    const triplets = [];
    for (let i = 0; i < viewerArtifacts.length; i += 3) {
      const triplet = [];
      for (let j = 0; j < 3 && i + j < viewerArtifacts.length; j++) {
        triplet.push(viewerArtifacts[i + j]);
      }
      if (triplet.length > 0) {
        triplets.push(triplet);
      }
    }
    return triplets;
  }, [viewerArtifacts, layoutMode]);

  // For SINGLE mode, group artifacts into singles (one per page)
  const artifactSingles = useMemo(() => {
    if (layoutMode !== 'SINGLE') {
      return [];
    }
    return viewerArtifacts.map(artifact => [artifact]);
  }, [viewerArtifacts, layoutMode]);

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [currentTripletIndex, setCurrentTripletIndex] = useState(0);
  const [currentSingleIndex, setCurrentSingleIndex] = useState(0);
  const isSideBySideMode = layoutMode === 'SIDE_BY_SIDE' && artifactPairs.length > 0;
  const isThreeWayMode = layoutMode === 'THREE_WAY' && artifactTriplets.length > 0;
  const isSingleMode = layoutMode === 'SINGLE' && artifactSingles.length > 0;
  const currentPair = isSideBySideMode ? artifactPairs[currentPairIndex] : null;
  const currentTriplet = isThreeWayMode ? artifactTriplets[currentTripletIndex] : null;
  const currentSingle = isSingleMode ? artifactSingles[currentSingleIndex] : null;
  const currentPairArtifacts = useMemo(() => {
    if (isSideBySideMode && currentPair) {
      return currentPair.map((artifact) => ({
        ...artifact,
        id: artifact.artifactId || artifact.id
      }));
    }
    if (isThreeWayMode && currentTriplet) {
      return currentTriplet.map((artifact) => ({
        ...artifact,
        id: artifact.artifactId || artifact.id
      }));
    }
    if (isSingleMode && currentSingle) {
      return currentSingle.map((artifact) => ({
        ...artifact,
        id: artifact.artifactId || artifact.id
      }));
    }
    return annotationArtifacts;
  }, [isSideBySideMode, isThreeWayMode, isSingleMode, currentPair, currentTriplet, currentSingle, annotationArtifacts]);

  // For side-by-side mode, answers are stored per pair
  // For three-way mode, answers are stored per triplet
  // For single mode, answers are stored per single artifact
  const getPairAnswerKey = (criterionId) => {
    if (isSingleMode) {
      return `single_${currentSingleIndex}_${String(criterionId)}`;
    }
    if (isThreeWayMode) {
      return `triplet_${currentTripletIndex}_${String(criterionId)}`;
    }
    if (isSideBySideMode) {
      return `pair_${currentPairIndex}_${String(criterionId)}`;
    }
    return String(criterionId);
  };

  const handlePairAnswerChange = (criterionId, value) => {
    const key = getPairAnswerKey(criterionId);
    handleChange(key, value);
  };

  const getPairAnswer = (criterionId) => {
    const key = getPairAnswerKey(criterionId);
    return answers[key];
  };

  const validateCurrentPair = () => {
    const nextErrors = {};
    criteria.forEach((criterion) => {
      if (!criterion.required) return;
      const value = getPairAnswer(criterion.id);
      if (value === undefined || value === null || value === '') {
        nextErrors[criterion.id] = 'Required';
      }
      if (Array.isArray(value) && value.length === 0) {
        nextErrors[criterion.id] = 'Required';
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextPair = () => {
    if (!validateCurrentPair()) {
      return;
    }
    if (isSingleMode) {
      if (currentSingleIndex < artifactSingles.length - 1) {
        setCurrentSingleIndex(currentSingleIndex + 1);
        setErrors({});
      }
    } else if (isThreeWayMode) {
      if (currentTripletIndex < artifactTriplets.length - 1) {
        setCurrentTripletIndex(currentTripletIndex + 1);
        setErrors({});
      }
    } else if (isSideBySideMode) {
      if (currentPairIndex < artifactPairs.length - 1) {
        setCurrentPairIndex(currentPairIndex + 1);
        setErrors({});
      }
    }
  };

  const handlePreviousPair = () => {
    if (isSingleMode) {
      if (currentSingleIndex > 0) {
        setCurrentSingleIndex(currentSingleIndex - 1);
        setErrors({});
      }
    } else if (isThreeWayMode) {
      if (currentTripletIndex > 0) {
        setCurrentTripletIndex(currentTripletIndex - 1);
        setErrors({});
      }
    } else if (isSideBySideMode) {
      if (currentPairIndex > 0) {
        setCurrentPairIndex(currentPairIndex - 1);
        setErrors({});
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateCurrentPair()) return;
    
    try {
      setSubmitting(true);
      setMessage('');
      // answers already contains all pair/triplet answers in pair_X_Y or triplet_X_Y format
      await evaluationService.submitEvaluation(assignmentId, {
        timeSpentSeconds: timeSpent,
        answers: answers,
        annotations: annotationsState
      });
      onAnswersChange(answers);
      setMessage('Evaluation submitted successfully.');
      navigate('/dashboard?tab=Tasks', { replace: true });
      return;
    } catch (err) {
      console.error('Failed to submit evaluation', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Unable to submit evaluation.';
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldForPair = (criterion) => {
    const value = getPairAnswer(criterion.id);
    const disabled = submitting || isSubmitted;
    switch (criterion.type) {
      case 'rating':
        return (
          <Box sx={{ px: 2 }}>
            <Slider
              min={criterion.scaleMin ?? 1}
              max={criterion.scaleMax ?? 5}
              value={typeof value === 'number' ? value : criterion.scaleMin ?? 1}
              onChange={(_, newValue) => handlePairAnswerChange(criterion.id, newValue)}
              valueLabelDisplay="auto"
              disabled={disabled}
            />
          </Box>
        );
      case 'single-choice':
        return (
          <RadioGroup value={value ?? ''} onChange={(e) => handlePairAnswerChange(criterion.id, e.target.value)}>
            {(criterion.options || []).map((option) => (
              <FormControlLabel
                key={option}
                value={option}
                control={<Radio />}
                label={option}
                disabled={disabled}
              />
            ))}
          </RadioGroup>
        );
      case 'multi-choice':
        return (
          <Stack spacing={1}>
            {(criterion.options || []).map((option) => {
              const selected = Array.isArray(value) ? value : [];
              return (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={selected.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handlePairAnswerChange(criterion.id, [...selected, option]);
                        } else {
                          handlePairAnswerChange(criterion.id, selected.filter((item) => item !== option));
                        }
                      }}
                      disabled={disabled}
                    />
                  }
                  label={option}
                />
              );
            })}
          </Stack>
        );
      case 'yes-no':
        return (
          <Stack direction="row" spacing={2}>
            {['Yes', 'No'].map((option) => (
              <Button
                key={option}
                variant={value === option ? 'contained' : 'outlined'}
                onClick={() => handlePairAnswerChange(criterion.id, option)}
                disabled={disabled}
              >
                {option}
              </Button>
            ))}
          </Stack>
        );
      default:
        return (
          <TextField
            fullWidth
            multiline
            minRows={criterion.type === 'text' ? 3 : 1}
            value={value ?? ''}
            onChange={(e) => handlePairAnswerChange(criterion.id, e.target.value)}
            placeholder={criterion.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  const columnWidth = layoutMode === 'THREE_WAY' ? 4 : layoutMode === 'SIDE_BY_SIDE' ? 6 : 12;

  // Render side-by-side pair view
  if (isSideBySideMode && currentPair) {
    return (
      <AppTheme>
        <CssBaseline enableColorScheme />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" onClick={() => navigate('/dashboard?tab=Tasks')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {taskData?.task?.title || 'Evaluation Task'}
            </Typography>
            <ColorModeSelect size="small" />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {taskData?.task?.title || 'Evaluation Task'}
                </Typography>
            <Typography variant="body2" color="text.secondary">
              {taskData?.task?.instructions}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {allowHighlight && <Chip label="Highlight" size="small" />}
              {allowAnnotation && <Chip label="Annotation" size="small" />}
              {allowTagging && <Chip label="Tagging" size="small" />}
              {blindedMode && <Chip label="Blinded" size="small" />}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={`Pair ${currentPairIndex + 1} of ${artifactPairs.length}`}
                color="primary"
                size="medium"
              />
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Compare These Two Artifacts
            </Typography>
            <Grid container spacing={3}>
              {currentPair.map((artifact, idx) => (
                <Grid item xs={12} md={6} key={(artifact.artifactId || '') + artifact.displayName + idx}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      Artifact {idx === 0 ? 'A' : 'B'}
                    </Typography>
                    <ArtifactCard
                      artifact={artifact}
                      annotations={annotationsState.filter(a => 
                        a.artifactId === artifact.artifactId || a.artifactId === artifact.id
                      )}
                      allowHighlight={allowHighlight}
                      allowAnnotation={allowAnnotation}
                      allowTagging={allowTagging}
                      readOnly={isSubmitted}
                      onStartHighlight={() => {}}
                      onFinishHighlight={handleFinishHighlight}
                      onDeleteAnnotation={handleDeleteAnnotation}
                      onUpdateAnnotation={(annotation) => !isSubmitted && setEditorState({ open: true, annotation })}
                      onTagAnnotation={handleTagUpdate}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Evaluation Criteria for This Pair
            </Typography>
            <Stack spacing={2}>
              {criteria.map((criterion) => (
                <Box key={criterion.id}>
                  <Typography fontWeight={600}>{criterion.name || 'Untitled Criterion'}</Typography>
                  {criterion.description && (
                    <Typography variant="body2" color="text.secondary">
                      {criterion.description}
                    </Typography>
                  )}
                  {renderFieldForPair(criterion)}
                  {errors[criterion.id] && (
                    <Typography variant="caption" color="error">
                      {errors[criterion.id]}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>

          {showAnnotationSection && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Annotations for This Pair
              </Typography>
              <AnnotationPanel
                annotations={annotationsState.filter(a => 
                  currentPairArtifacts.some(art => art.id === a.artifactId)
                )}
                artifacts={currentPairArtifacts}
                onDelete={isSubmitted ? undefined : handleDeleteAnnotation}
                onEdit={isSubmitted ? undefined : (annotation) => setEditorState({ open: true, annotation })}
                onCreate={isSubmitted ? undefined : handleCreateFromPanel}
                readOnly={isSubmitted}
                allowTagging={allowTagging}
              />
            </Paper>
          )}

          {message && (
            <Alert severity={message.includes('successfully') ? 'success' : 'error'}>
              {message}
            </Alert>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={handlePreviousPair}
                disabled={(isSideBySideMode && currentPairIndex === 0) || (isThreeWayMode && currentTripletIndex === 0) || (isSingleMode && currentSingleIndex === 0) || submitting || isSubmitted}
              >
                {isSingleMode ? 'Previous Artifact' : isThreeWayMode ? 'Previous Triplet' : 'Previous Pair'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Time Spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              {((isSideBySideMode && currentPairIndex < artifactPairs.length - 1) || 
                (isThreeWayMode && currentTripletIndex < artifactTriplets.length - 1) ||
                (isSingleMode && currentSingleIndex < artifactSingles.length - 1)) ? (
                <Button
                  variant="contained"
                  onClick={handleNextPair}
                  disabled={submitting || isSubmitted}
                >
                  {isSingleMode ? 'Next Artifact' : isThreeWayMode ? 'Next Triplet' : 'Next Pair'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleFinalSubmit}
                  disabled={submitting || isSubmitted}
                >
                  {isSubmitted ? 'Submitted' : 'Submit Evaluation'}
                </Button>
              )}
            </Stack>
          </Stack>
            </Stack>

            <AnnotationEditorDialog
              open={editorState.open}
              annotation={editorState.annotation}
              artifacts={currentPairArtifacts}
              allowTagging={allowTagging}
              onCancel={() => setEditorState({ open: false, annotation: null })}
              onSave={handleSaveAnnotation}
            />
          </Container>
        </Box>
      </AppTheme>
    );
  }

  // Render three-way triplet view
  if (isThreeWayMode && currentTriplet) {
    return (
      <AppTheme>
        <CssBaseline enableColorScheme />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" onClick={() => navigate('/dashboard?tab=Tasks')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {taskData?.task?.title || 'Evaluation Task'}
            </Typography>
            <ColorModeSelect size="small" />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {taskData?.task?.title || 'Evaluation Task'}
                </Typography>
            <Typography variant="body2" color="text.secondary">
              {taskData?.task?.instructions}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {allowHighlight && <Chip label="Highlight" size="small" />}
              {allowAnnotation && <Chip label="Annotation" size="small" />}
              {allowTagging && <Chip label="Tagging" size="small" />}
              {blindedMode && <Chip label="Blinded" size="small" />}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={`Triplet ${currentTripletIndex + 1} of ${artifactTriplets.length}`}
                color="primary"
                size="medium"
              />
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Compare These Three Artifacts
            </Typography>
            <Grid container spacing={3}>
              {currentTriplet.map((artifact, idx) => (
                <Grid item xs={12} md={4} key={(artifact.artifactId || '') + artifact.displayName + idx}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      Artifact {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                    </Typography>
                    <ArtifactCard
                      artifact={artifact}
                      annotations={annotationsState.filter(a => 
                        a.artifactId === artifact.artifactId || a.artifactId === artifact.id
                      )}
                      allowHighlight={allowHighlight}
                      allowAnnotation={allowAnnotation}
                      allowTagging={allowTagging}
                      readOnly={isSubmitted}
                      onStartHighlight={() => {}}
                      onFinishHighlight={handleFinishHighlight}
                      onDeleteAnnotation={handleDeleteAnnotation}
                      onUpdateAnnotation={(annotation) => !isSubmitted && setEditorState({ open: true, annotation })}
                      onTagAnnotation={handleTagUpdate}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Evaluation Criteria for This Triplet
            </Typography>
            <Stack spacing={2}>
              {criteria.map((criterion) => (
                <Box key={criterion.id}>
                  <Typography fontWeight={600}>{criterion.name || 'Untitled Criterion'}</Typography>
                  {criterion.description && (
                    <Typography variant="body2" color="text.secondary">
                      {criterion.description}
                    </Typography>
                  )}
                  {renderFieldForPair(criterion)}
                  {errors[criterion.id] && (
                    <Typography variant="caption" color="error">
                      {errors[criterion.id]}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>

          {showAnnotationSection && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Annotations for This Triplet
              </Typography>
              <AnnotationPanel
                annotations={annotationsState.filter(a => 
                  currentPairArtifacts.some(art => art.id === a.artifactId)
                )}
                artifacts={currentPairArtifacts}
                onDelete={isSubmitted ? undefined : handleDeleteAnnotation}
                onEdit={isSubmitted ? undefined : (annotation) => setEditorState({ open: true, annotation })}
                onCreate={isSubmitted ? undefined : handleCreateFromPanel}
                readOnly={isSubmitted}
                allowTagging={allowTagging}
              />
            </Paper>
          )}

          {message && (
            <Alert severity={message.includes('successfully') ? 'success' : 'error'}>
              {message}
            </Alert>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={handlePreviousPair}
                disabled={currentTripletIndex === 0 || submitting || isSubmitted}
              >
                Previous Triplet
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Time Spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              {currentTripletIndex < artifactTriplets.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNextPair}
                  disabled={submitting || isSubmitted}
                >
                  Next Triplet
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleFinalSubmit}
                  disabled={submitting || isSubmitted}
                >
                  {isSubmitted ? 'Submitted' : 'Submit Evaluation'}
                </Button>
              )}
            </Stack>
          </Stack>
            </Stack>

            <AnnotationEditorDialog
              open={editorState.open}
              annotation={editorState.annotation}
              artifacts={currentPairArtifacts}
              allowTagging={allowTagging}
              onCancel={() => setEditorState({ open: false, annotation: null })}
              onSave={handleSaveAnnotation}
            />
          </Container>
        </Box>
      </AppTheme>
    );
  }

  // Render single artifact view (one per page)
  if (isSingleMode && currentSingle) {
    return (
      <AppTheme>
        <CssBaseline enableColorScheme />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" onClick={() => navigate('/dashboard?tab=Tasks')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {taskData?.task?.title || 'Evaluation Task'}
            </Typography>
            <ColorModeSelect size="small" />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {taskData?.task?.title || 'Evaluation Task'}
                </Typography>
            <Typography variant="body2" color="text.secondary">
              {taskData?.task?.instructions}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {allowHighlight && <Chip label="Highlight" size="small" />}
              {allowAnnotation && <Chip label="Annotation" size="small" />}
              {allowTagging && <Chip label="Tagging" size="small" />}
              {blindedMode && <Chip label="Blinded" size="small" />}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={`Artifact ${currentSingleIndex + 1} of ${artifactSingles.length}`}
                color="primary"
                size="medium"
              />
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Evaluate This Artifact
            </Typography>
            <Grid container spacing={3}>
              {currentSingle.map((artifact) => (
                <Grid item xs={12} key={(artifact.artifactId || '') + artifact.displayName}>
                  <ArtifactCard
                    artifact={artifact}
                    annotations={annotationsState.filter(a => 
                      a.artifactId === artifact.artifactId || a.artifactId === artifact.id
                    )}
                    allowHighlight={allowHighlight}
                    allowAnnotation={allowAnnotation}
                    allowTagging={allowTagging}
                    readOnly={isSubmitted}
                    onStartHighlight={() => {}}
                    onFinishHighlight={handleFinishHighlight}
                    onDeleteAnnotation={handleDeleteAnnotation}
                    onUpdateAnnotation={(annotation) => !isSubmitted && setEditorState({ open: true, annotation })}
                    onTagAnnotation={handleTagUpdate}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Evaluation Criteria for This Artifact
            </Typography>
            <Stack spacing={2}>
              {criteria.map((criterion) => (
                <Box key={criterion.id}>
                  <Typography fontWeight={600}>{criterion.name || 'Untitled Criterion'}</Typography>
                  {criterion.description && (
                    <Typography variant="body2" color="text.secondary">
                      {criterion.description}
                    </Typography>
                  )}
                  {renderFieldForPair(criterion)}
                  {errors[criterion.id] && (
                    <Typography variant="caption" color="error">
                      {errors[criterion.id]}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>

          {showAnnotationSection && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Annotations for This Artifact
              </Typography>
              <AnnotationPanel
                annotations={annotationsState.filter(a => 
                  currentPairArtifacts.some(art => art.id === a.artifactId)
                )}
                artifacts={currentPairArtifacts}
                onDelete={isSubmitted ? undefined : handleDeleteAnnotation}
                onEdit={isSubmitted ? undefined : (annotation) => setEditorState({ open: true, annotation })}
                onCreate={isSubmitted ? undefined : handleCreateFromPanel}
                readOnly={isSubmitted}
                allowTagging={allowTagging}
              />
            </Paper>
          )}

          {message && (
            <Alert severity={message.includes('successfully') ? 'success' : 'error'}>
              {message}
            </Alert>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={handlePreviousPair}
                disabled={currentSingleIndex === 0 || submitting || isSubmitted}
              >
                Previous Artifact
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Time Spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              {currentSingleIndex < artifactSingles.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNextPair}
                  disabled={submitting || isSubmitted}
                >
                  Next Artifact
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleFinalSubmit}
                  disabled={submitting || isSubmitted}
                >
                  {isSubmitted ? 'Submitted' : 'Submit Evaluation'}
                </Button>
              )}
            </Stack>
          </Stack>
            </Stack>

            <AnnotationEditorDialog
              open={editorState.open}
              annotation={editorState.annotation}
              artifacts={currentPairArtifacts}
              allowTagging={allowTagging}
              onCancel={() => setEditorState({ open: false, annotation: null })}
              onSave={handleSaveAnnotation}
            />
          </Container>
        </Box>
      </AppTheme>
    );
  }

  // Render normal view (non-side-by-side, non-three-way, non-single)
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AppBar position="fixed" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/dashboard?tab=Tasks')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {taskData?.task?.title || 'Evaluation Task'}
          </Typography>
          <ColorModeSelect size="small" />
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {taskData?.task?.title || 'Evaluation Task'}
              </Typography>
          <Typography variant="body2" color="text.secondary">
            {taskData?.task?.instructions}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {allowHighlight && <Chip label="Highlight" size="small" />}
            {allowAnnotation && <Chip label="Annotation" size="small" />}
            {allowTagging && <Chip label="Tagging" size="small" />}
            {blindedMode && <Chip label="Blinded" size="small" />}
          </Stack>
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Artifacts
          </Typography>
          <Grid container spacing={2}>
            {viewerArtifacts.map((artifact) => (
              <Grid item xs={12} md={columnWidth} key={(artifact.artifactId || '') + artifact.displayName}>
                <ArtifactCard
                  artifact={artifact}
                  annotations={annotationsState}
                  allowHighlight={allowHighlight}
                  allowAnnotation={allowAnnotation}
                  allowTagging={allowTagging}
                  readOnly={isSubmitted}
                  onStartHighlight={() => {}}
                  onFinishHighlight={handleFinishHighlight}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  onUpdateAnnotation={(annotation) => !isSubmitted && setEditorState({ open: true, annotation })}
                  onTagAnnotation={handleTagUpdate}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Criteria
          </Typography>
          <Stack spacing={2}>
            {criteria.map((criterion) => (
              <Box key={criterion.id}>
                <Typography fontWeight={600}>{criterion.name || 'Untitled Criterion'}</Typography>
                {criterion.description && (
                  <Typography variant="body2" color="text.secondary">
                    {criterion.description}
                  </Typography>
                )}
                {renderField(criterion)}
                {errors[criterion.id] && (
                  <Typography variant="caption" color="error">
                    {errors[criterion.id]}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>

        {showAnnotationSection && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Annotations
            </Typography>
            <AnnotationPanel
              annotations={annotationsState}
              artifacts={annotationArtifacts}
              onDelete={isSubmitted ? undefined : handleDeleteAnnotation}
              onEdit={isSubmitted ? undefined : (annotation) => setEditorState({ open: true, annotation })}
              onCreate={isSubmitted ? undefined : handleCreateFromPanel}
              readOnly={isSubmitted}
              allowTagging={allowTagging}
            />
          </Paper>
        )}

        {message && (
          <Alert severity={message.includes('successfully') ? 'success' : 'error'}>
            {message}
          </Alert>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Time Spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
          </Typography>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || isSubmitted}>
            {isSubmitted ? 'Submitted' : 'Submit Evaluation'}
          </Button>
          </Stack>
          </Stack>

          <AnnotationEditorDialog
            open={editorState.open}
            annotation={editorState.annotation}
            artifacts={annotationArtifacts}
            allowTagging={allowTagging}
            onCancel={() => setEditorState({ open: false, annotation: null })}
            onSave={handleSaveAnnotation}
          />
        </Container>
      </Box>
    </AppTheme>
  );
}

export default EvaluationTaskDetail;    