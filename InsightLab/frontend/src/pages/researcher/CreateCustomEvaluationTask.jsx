import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward, Upload, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { researcherEvaluationService, studyService } from '../../services/api';
import { artifactService as artifactUploadService } from '../../services/artifactService';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';


const steps = ['Select Artifacts', 'Define Criteria', 'Configure Settings', 'Review & Create'];

const defaultCriterion = (type) => {
  switch (type) {
    case 'rating':
      return { id: `crit-${Date.now()}`, type, name: '', description: '', required: true, scaleMin: 1, scaleMax: 5 };
    case 'single-choice':
    case 'multi-choice':
      return { id: `crit-${Date.now()}`, type, name: '', required: true, options: ['Option 1'] };
    case 'yes-no':
      return { id: `crit-${Date.now()}`, type, name: '', required: true };
    default:
      return { id: `crit-${Date.now()}`, type: 'text', name: '', required: false, placeholder: '' };
  }
};

const layoutLabels = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'SIDE_BY_SIDE', label: 'Side-by-side' },
  { value: 'THREE_WAY', label: 'Three-way' }
];

const CreateCustomEvaluationTask = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [study, setStudy] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsRefreshing, setParticipantsRefreshing] = useState(false);
  const [existingTasks, setExistingTasks] = useState([]);

  const [task, setTask] = useState({
    title: '',
    description: '',
    instructions: '',
    artifactReferences: [],
    criteria: [],
    allowHighlight: true,
    allowAnnotation: true,
    allowTagging: false,
    layoutMode: 'SINGLE',
    blindedMode: false,
    participantIds: [],
    dueDate: ''
  });

  const loadParticipants = React.useCallback(async () => {
    if (!studyId) return;
    try {
      setParticipantsRefreshing(true);
      const response = await studyService.getStudyEnrollments(studyId);
      const activeStatuses = new Set(['ENROLLED', 'IN_PROGRESS', 'COMPLETED']);
      const participantUsers = (response.data || [])
        .filter((enrollment) => activeStatuses.has(enrollment.status))
        .map((enrollment) => {
          console.log('Participant level from API:', enrollment.participantLevel);
          return {
            id: enrollment.participantId,
            fullName: enrollment.participantName,
            email: enrollment.participantEmail,
            quizPassed: Boolean(enrollment.quizPassed),
            quizCompleted: Boolean(enrollment.quizCompleted),
            quizScore: enrollment.quizScore,
            participantLevel: enrollment.participantLevel,
          };
        });
      setParticipants(participantUsers);
      setTask((prev) => {
        if (!prev.participantIds?.length) return prev;
        const eligible = prev.participantIds.filter((id) =>
          participantUsers.some((participant) => participant.id === id && participant.quizPassed)
        );
        return eligible.length === prev.participantIds.length ? prev : { ...prev, participantIds: eligible };
      });
    } catch (err) {
      console.error(err);
      setError('Unable to load participant statuses. Please try again.');
    } finally {
      setParticipantsRefreshing(false);
    }
  }, [studyId]);

  useEffect(() => {
    if (!studyId) {
      setError('Study ID is required. Please create evaluation tasks from within a study.');
      setLoading(false);
      return;
    }
    const init = async () => {
      try {
        const [studyResp, artifactsResp, templatesResp, enrollmentsResp, tasksResp] = await Promise.all([
          studyService.getStudyById(studyId),
          studyService.getStudyArtifacts(studyId),
          researcherEvaluationService.getEvaluationTemplates(),
          studyService.getStudyEnrollments(studyId),
          researcherEvaluationService.getMyTasks()
        ]);

        setStudy(studyResp.data);
        setArtifacts(artifactsResp.data || []);
        setTemplates(templatesResp.data || []);

        const activeStatuses = new Set(['ENROLLED', 'IN_PROGRESS', 'COMPLETED']);
        const participantUsers = (enrollmentsResp.data || [])
          .filter((enrollment) => activeStatuses.has(enrollment.status))
          .map((enrollment) => {
            console.log('Participant level from API:', enrollment.participantLevel);
            return {
              id: enrollment.participantId || enrollment.id,
              fullName: enrollment.participantName || enrollment.fullName,
              email: enrollment.participantEmail || enrollment.email,
              quizPassed: Boolean(enrollment.quizPassed),
              quizCompleted: Boolean(enrollment.quizCompleted),
              quizScore: enrollment.quizScore,
              participantLevel: enrollment.participantLevel,
            };
          });

        setParticipants(participantUsers);
        setTask((prev) => {
          if (!prev.participantIds?.length) return prev;
          const eligible = prev.participantIds.filter((id) =>
            participantUsers.some((participant) => participant.id === id && participant.quizPassed)
          );
          return eligible.length === prev.participantIds.length ? prev : { ...prev, participantIds: eligible };
        });

        const studyTasks = (tasksResp.data || []).filter(
          (taskItem) => taskItem.studyId === Number(studyId)
        );
        setExistingTasks(studyTasks);
      } catch (err) {
        console.error(err);
        setError('Unable to load study resources.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [studyId, loadParticipants]);

  useEffect(() => {
    if (activeStep === 2) {
      loadParticipants();
    }
  }, [activeStep, loadParticipants]);

  const artifactOptions = useMemo(() => {
    return artifacts.map((artifact) => ({
      ...artifact,
      display: artifact.displayLabel || artifact.originalFilename || artifact.id
    }));
  }, [artifacts]);

  const participantOptions = useMemo(() => {
    return participants.map((participant) => ({
      id: participant.id,
      label: participant.fullName || participant.username || participant.email,
      email: participant.email,
      quizPassed: participant.quizPassed,
      quizCompleted: participant.quizCompleted,
      quizScore: participant.quizScore,
      participantLevel: participant.participantLevel
    }));
  }, [participants]);

  const updateTask = (updates) => {
    setTask((prev) => ({ ...prev, ...updates }));
  };

  const handleAddArtifact = (artifact) => {
    // SINGLE layout için
    if (task.layoutMode === 'SINGLE') {
      const alreadySelected = task.artifactReferences.some((ref) => ref.artifactId === artifact.id);
      if (alreadySelected) return;
      const newRef = {
        id: `artifact-${Date.now()}`,
        artifactId: artifact.id,
        displayLabel: artifact.displayLabel || artifact.originalFilename,
        displayOrder: task.artifactReferences.length + 1,
        blinded: task.blindedMode
      };
      updateTask({
        artifactReferences: [...task.artifactReferences, newRef]
      });
    } 
    // SIDE_BY_SIDE veya THREE_WAY layout için pair sistemi - otomatik pair bulma/yeni pair oluşturma
    else if (task.layoutMode === 'SIDE_BY_SIDE' || task.layoutMode === 'THREE_WAY') {
      const requiredArtifactsPerPair = task.layoutMode === 'SIDE_BY_SIDE' ? 2 : 3;
      const pairs = getPairs();
      let targetPairId = null;
      
      // Eksik artifact olan bir pair bul (1 veya 2 artifact olan)
      const incompletePair = pairs.find((pair) => 
        pair.artifacts.length < requiredArtifactsPerPair && 
        !pair.artifacts.some((a) => a.artifactId === artifact.id)
      );
      
      if (incompletePair) {
        targetPairId = incompletePair.pairId;
      } else {
        // Yeni pair oluştur
        const existingPairs = task.artifactReferences
          .filter((ref) => ref.pairId)
          .map((ref) => ref.pairId);
        const maxPairNumber = existingPairs.length > 0 
          ? Math.max(...existingPairs.map((id) => parseInt(id.split('-')[1]) || 0))
          : 0;
        targetPairId = `pair-${maxPairNumber + 1}`;
      }
      
      // Bu artifact zaten bu pair'de var mı kontrol et
      const pairRefs = task.artifactReferences.filter((ref) => ref.pairId === targetPairId);
      const alreadyInPair = pairRefs.some((ref) => ref.artifactId === artifact.id);
      if (alreadyInPair) return;
      
      // Bu pair'de zaten yeterli artifact var mı kontrol et (güvenlik için)
      if (pairRefs.length >= requiredArtifactsPerPair) return;
      
      const newRef = {
        id: `artifact-${Date.now()}`,
        pairId: targetPairId,
        artifactId: artifact.id,
        displayLabel: artifact.displayLabel || artifact.originalFilename,
        displayOrder: pairRefs.length + 1,
        blinded: task.blindedMode
      };
      updateTask({
        artifactReferences: [...task.artifactReferences, newRef]
      });
    }
  };

  const handleRemoveArtifact = (index, pairId = null) => {
    if (task.layoutMode === 'SINGLE') {
      const updated = task.artifactReferences.filter((_, idx) => idx !== index).map((ref, idx) => ({
        ...ref,
        displayOrder: idx + 1
      }));
      updateTask({ artifactReferences: updated });
    } else if (task.layoutMode === 'SIDE_BY_SIDE' && pairId) {
      // Pair'den artifact'i kaldır
      const updated = task.artifactReferences.filter((ref) => !(ref.pairId === pairId && ref.id === task.artifactReferences[index].id));
      // Display order'ı güncelle
      const pairRefs = updated.filter((ref) => ref.pairId === pairId);
      const reordered = updated.map((ref) => {
        if (ref.pairId === pairId) {
          const pairIndex = pairRefs.findIndex((r) => r.id === ref.id);
          return { ...ref, displayOrder: pairIndex + 1 };
        }
        return ref;
      });
      updateTask({ artifactReferences: reordered });
    }
  };

  const handleReorderArtifact = (index, direction) => {
    const newOrder = [...task.artifactReferences];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    updateTask({
      artifactReferences: newOrder.map((ref, idx) => ({ ...ref, displayOrder: idx + 1 }))
    });
  };

  const handleArtifactLabelChange = (index, value, pairId = null) => {
    const updated = [...task.artifactReferences];
    if (task.layoutMode === 'SINGLE') {
      updated[index] = { ...updated[index], displayLabel: value };
    } else if (task.layoutMode === 'SIDE_BY_SIDE' && pairId) {
      const ref = updated.find((ref) => ref.pairId === pairId && ref.id === task.artifactReferences[index].id);
      if (ref) {
        ref.displayLabel = value;
      }
    }
    updateTask({ artifactReferences: updated });
  };

  const removePair = (pairId) => {
    const updated = task.artifactReferences.filter((ref) => ref.pairId !== pairId);
    updateTask({ artifactReferences: updated });
  };

  const getPairs = () => {
    if (task.layoutMode !== 'SIDE_BY_SIDE' && task.layoutMode !== 'THREE_WAY') return [];
    const pairs = {};
    task.artifactReferences.forEach((ref) => {
      if (ref.pairId) {
        if (!pairs[ref.pairId]) {
          pairs[ref.pairId] = [];
        }
        pairs[ref.pairId].push(ref);
      }
    });
    return Object.keys(pairs)
      .sort((a, b) => {
        const numA = parseInt(a.split('-')[1]) || 0;
        const numB = parseInt(b.split('-')[1]) || 0;
        return numA - numB;
      })
      .map((pairId) => ({
        pairId,
        pairNumber: parseInt(pairId.split('-')[1]) || 0,
        artifacts: pairs[pairId].sort((a, b) => a.displayOrder - b.displayOrder)
      }));
  };

  const addCriterion = (type) => {
    updateTask({ criteria: [...task.criteria, defaultCriterion(type)] });
  };

  const updateCriterion = (index, field, value) => {
    const updated = [...task.criteria];
    updated[index] = { ...updated[index], [field]: value };
    updateTask({ criteria: updated });
  };

  const removeCriterion = (index) => {
    updateTask({ criteria: task.criteria.filter((_, idx) => idx !== index) });
  };

  const canUseLayout = (mode) => {
    const count = task.artifactReferences.length;
    if (count <= 1) return mode === 'SINGLE';
    if (count === 2) return mode === 'SINGLE' || mode === 'SIDE_BY_SIDE';
    return true;
  };

  const handleUploadArtifacts = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      setError('');

      // Çalışan pipeline: services/artifactService içindeki upload
      await artifactUploadService.upload(files, studyId);

      // Upload sonrası study’nin artifact listesini tazele
      const refreshed = await studyService.getStudyArtifacts(studyId);
      setArtifacts(refreshed.data || []);

    } catch (err) {
      console.error('Upload failed', err);
      setError(err.response?.data?.message || 'Unable to upload artifact.');
    } finally {
      // Aynı dosyayı tekrar seçebilmek için input'u resetle
      if (event.target) {
        event.target.value = '';
      }
    }
  };


  const applyTemplate = async (templateId) => {
    try {
      const response = await researcherEvaluationService.applyEvaluationTemplate(templateId);
      const template = response.data;
      updateTask({
        title: template.title || task.title,
        description: template.description || task.description,
        instructions: template.instructions || task.instructions,
        artifactReferences: (template.artifactReferences || []).map((ref, idx) => ({
          ...ref,
          displayOrder: idx + 1,
          artifactId: null
        })),
        criteria: template.criteria || [],
        allowHighlight: template.allowHighlight ?? task.allowHighlight,
        allowAnnotation: template.allowAnnotation ?? task.allowAnnotation,
        allowTagging: template.allowTagging ?? task.allowTagging,
        layoutMode: template.layoutMode || task.layoutMode,
        blindedMode: template.blindedMode ?? task.blindedMode
      });
      setTemplateDialog(false);
    } catch (err) {
      console.error('Failed to apply template', err);
      setError('Unable to load template.');
    }
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!task.title.trim()) {
        setError('Task title is required.');
        return false;
      }
      // Check for duplicate task titles in the same study
      const duplicateTask = existingTasks.find(
        existingTask => existingTask.title?.trim().toLowerCase() === task.title.trim().toLowerCase()
      );
      if (duplicateTask) {
        setError('An evaluation task with this title already exists in this study. Please use a different title.');
        return false;
      }
      if (task.artifactReferences.length === 0) {
        setError('Select at least one artifact.');
        return false;
      }
      // SIDE_BY_SIDE modunda her pair'de tam 2 artifact olmalı
      if (task.layoutMode === 'SIDE_BY_SIDE') {
        const pairs = getPairs();
        if (pairs.length === 0) {
          setError('Create at least one pair with 2 artifacts.');
          return false;
        }
        const incompletePairs = pairs.filter((pair) => pair.artifacts.length !== 2);
        if (incompletePairs.length > 0) {
          setError(`Each pair must have exactly 2 artifacts. Pair ${incompletePairs[0].pairNumber} has ${incompletePairs[0].artifacts.length} artifact(s).`);
          return false;
        }
      }
      // THREE_WAY modunda her pair'de tam 3 artifact olmalı
      if (task.layoutMode === 'THREE_WAY') {
        const pairs = getPairs();
        if (pairs.length === 0) {
          setError('Create at least one pair with 3 artifacts.');
          return false;
        }
        const incompletePairs = pairs.filter((pair) => pair.artifacts.length !== 3);
        if (incompletePairs.length > 0) {
          setError(`Each pair must have exactly 3 artifacts. Pair ${incompletePairs[0].pairNumber} has ${incompletePairs[0].artifacts.length} artifact(s).`);
          return false;
        }
      }
    }
    if (activeStep === 1) {
      if (task.criteria.length === 0) {
        setError('Add at least one criterion.');
        return false;
      }
    }
    if (activeStep === 2) {
      if (!task.participantIds || task.participantIds.length === 0) {
        setError('Select at least one participant to assign this task.');
        return false;
      }
      const selected = participantOptions.filter((p) => task.participantIds.includes(p.id));
      if (selected.some((participant) => !participant.quizPassed)) {
        setError('All selected participants must pass the study quiz before assignment.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (!validateStep()) return;
    if (activeStep === steps.length - 1) {
      submitTask();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const submitTask = async () => {
    if (!studyId) {
      setError('Study ID is required to create evaluation task.');
      return;
    }
    try {
      setSaving(true);
      const selected = participantOptions.filter((p) => task.participantIds.includes(p.id));
      if (selected.some((participant) => !participant.quizPassed)) {
        setError('All selected participants must pass the study quiz before assignment.');
        setSaving(false);
        return;
      }
      const payload = {
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null
      };
      await researcherEvaluationService.createCustomTask(studyId, payload);
      navigate(`/researcher/study/${studyId}/evaluation-tasks`);
    } catch (err) {
      console.error('Failed to create task', err);
      setError(err.response?.data?.message || 'Unable to create evaluation task.');
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <Container maxWidth="lg">
      {/* Başlık */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Create Evaluation Task
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {study?.title}
        </Typography>
      </Box>


      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      {activeStep === 0 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Task Title"
              required
              fullWidth
              value={task.title}
              onChange={(e) => updateTask({ title: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              fullWidth
              value={task.description}
              onChange={(e) => updateTask({ description: e.target.value })}
              InputProps={{
                sx: {
                  '& textarea': {
                    paddingTop: 0,
                    marginTop: '14px',
                  }
                }
              }}
            />
            <TextField
              label="Instructions"
              multiline
              minRows={2}
              fullWidth
              value={task.instructions}
              onChange={(e) => updateTask({ instructions: e.target.value })}
              InputProps={{
                sx: {
                  '& textarea': {
                    paddingTop: 0,
                    marginTop: '14px',
                  }
                }
              }}
            />

            <TextField
              select
              label="Layout Mode"
              fullWidth
              value={task.layoutMode}
              onChange={(e) => {
                // Layout mode değiştiğinde artifactReferences'ı temizle
                updateTask({ layoutMode: e.target.value, artifactReferences: [] });
              }}
            >
              {layoutLabels.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Study Artifacts
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                >
                  Upload
                  <input hidden type="file" multiple onChange={handleUploadArtifacts} />
                </Button>
              </Stack>
              <Grid container spacing={2}>
                {artifactOptions.map((artifact) => {
                  // SIDE_BY_SIDE veya THREE_WAY modunda, bu artifact hangi pair'lerde kullanılmış kontrol et (bilgi amaçlı)
                  const usedInPairs = (task.layoutMode === 'SIDE_BY_SIDE' || task.layoutMode === 'THREE_WAY')
                    ? task.artifactReferences
                        .filter((ref) => ref.artifactId === artifact.id && ref.pairId)
                        .map((ref) => ref.pairId)
                    : [];
                  const isUsed = task.layoutMode === 'SINGLE'
                    ? task.artifactReferences.some((ref) => ref.artifactId === artifact.id)
                    : false;

                  return (
                    <Grid item xs={12} md={6} key={artifact.id}>
                      <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography fontWeight={600}>{artifact.display}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {artifact.contentType} • {Math.round((artifact.sizeBytes || 0) / 1024)} KB
                          </Typography>
                          {(task.layoutMode === 'SIDE_BY_SIDE' || task.layoutMode === 'THREE_WAY') && usedInPairs.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Used in: {usedInPairs.map((pid) => `Pair ${pid.split('-')[1]}`).join(', ')}
                            </Typography>
                          )}
                        </Box>
                        <Button 
                          size="small" 
                          onClick={() => handleAddArtifact(artifact)}
                          disabled={task.layoutMode === 'SINGLE' ? isUsed : false}
                        >
                          {task.layoutMode === 'SINGLE' 
                            ? (isUsed ? 'Added' : 'Add')
                            : 'Add'
                          }
                        </Button>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                {(task.layoutMode === 'SIDE_BY_SIDE' || task.layoutMode === 'THREE_WAY') ? 'Selected Pairs' : 'Selected Artifacts'}
              </Typography>
              
              {task.layoutMode === 'SINGLE' ? (
                <>
                  {task.artifactReferences.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No artifacts selected.
                    </Typography>
                  )}
                  <Stack spacing={1}>
                    {task.artifactReferences.map((ref, index) => (
                      <Paper key={ref.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <TextField
                            label={`Artifact ${index + 1} Label`}
                            value={ref.displayLabel || ''}
                            onChange={(e) => handleArtifactLabelChange(index, e.target.value)}
                            sx={{ flex: 1 }}
                          />
                          <IconButton onClick={() => handleReorderArtifact(index, 'up')} disabled={index === 0}>
                            <ArrowUpward fontSize="small" />
                          </IconButton>
                          <IconButton onClick={() => handleReorderArtifact(index, 'down')} disabled={index === task.artifactReferences.length - 1}>
                            <ArrowDownward fontSize="small" />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleRemoveArtifact(index)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </>
              ) : (task.layoutMode === 'SIDE_BY_SIDE' || task.layoutMode === 'THREE_WAY') && (
                <>
                  {getPairs().length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No pairs created. Add artifacts to create pairs.
                    </Typography>
                  )}
                  <Stack spacing={2}>
                    {getPairs().map((pair) => (
                      <Paper key={pair.pairId} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Pair {pair.pairNumber}
                          </Typography>
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => removePair(pair.pairId)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Stack spacing={2}>
                          {pair.artifacts.map((artifact, idx) => (
                            <Paper key={artifact.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                  label={`Artifact ${idx + 1} Label`}
                                  value={artifact.displayLabel || ''}
                                  onChange={(e) => {
                                    const artifactIndex = task.artifactReferences.findIndex((r) => r.id === artifact.id);
                                    handleArtifactLabelChange(artifactIndex, e.target.value, pair.pairId);
                                  }}
                                  sx={{ flex: 1 }}
                                  size="small"
                                />
                                <IconButton 
                                  color="error" 
                                  size="small"
                                  onClick={() => {
                                    const artifactIndex = task.artifactReferences.findIndex((r) => r.id === artifact.id);
                                    handleRemoveArtifact(artifactIndex, pair.pairId);
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Paper>
                          ))}
                          {(() => {
                            const requiredCount = task.layoutMode === 'SIDE_BY_SIDE' ? 2 : 3;
                            if (pair.artifacts.length < requiredCount) {
                              return (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  {requiredCount - pair.artifacts.length} more artifact needed
                                </Typography>
                              );
                            }
                            return null;
                          })()}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          </Stack>
        </Paper>
      )}

      {activeStep === 1 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => addCriterion('rating')}>
                Add Rating
              </Button>
              <Button variant="outlined" onClick={() => addCriterion('text')}>
                Add Text
              </Button>
              <Button variant="outlined" onClick={() => addCriterion('single-choice')}>
                Add Single Choice
              </Button>
              <Button variant="outlined" onClick={() => addCriterion('multi-choice')}>
                Add Multi Choice
              </Button>
              <Button variant="outlined" onClick={() => addCriterion('yes-no')}>
                Add Yes / No
              </Button>
            </Stack>
            {task.criteria.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No criteria defined yet.
              </Typography>
            )}
            {task.criteria.map((criterion, index) => (
              <Paper key={criterion.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Name"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <Select
                      value={criterion.type}
                      onChange={(e) => updateCriterion(index, 'type', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="rating">Rating</MenuItem>
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="single-choice">Single Choice</MenuItem>
                      <MenuItem value="multi-choice">Multi Choice</MenuItem>
                      <MenuItem value="yes-no">Yes / No</MenuItem>
                    </Select>
                    <IconButton color="error" onClick={() => removeCriterion(index)}>
                      <Delete />
                    </IconButton>
                  </Stack>
                  <TextField
                    label="Description"
                    multiline
                    minRows={2}
                    fullWidth
                    value={criterion.description || ''}
                    onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                    InputProps={{
                      sx: {
                        '& textarea': {
                          paddingTop: 0,
                          marginTop: '14px',
                        }
                      }
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(criterion.required)}
                        onChange={(e) => updateCriterion(index, 'required', e.target.checked)}
                      />
                    }
                    label="Required"
                  />
                  {criterion.type === 'rating' && (
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Min"
                        type="number"
                        value={criterion.scaleMin ?? 1}
                        onChange={(e) => updateCriterion(index, 'scaleMin', Number(e.target.value))}
                      />
                      <TextField
                        label="Max"
                        type="number"
                        value={criterion.scaleMax ?? 5}
                        onChange={(e) => updateCriterion(index, 'scaleMax', Number(e.target.value))}
                      />
                    </Stack>
                  )}
                  {(criterion.type === 'single-choice' || criterion.type === 'multi-choice') && (
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Options
                      </Typography>
                      {(criterion.options || []).map((option, optIdx) => (
                        <Stack direction="row" spacing={1} key={`${criterion.id}-opt-${optIdx}`}>
                          <TextField
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(criterion.options || [])];
                              newOptions[optIdx] = e.target.value;
                              updateCriterion(index, 'options', newOptions);
                            }}
                            sx={{ flex: 1 }}
                          />
                          <IconButton
                            onClick={() => {
                              const newOptions = (criterion.options || []).filter((_, oIdx) => oIdx !== optIdx);
                              updateCriterion(index, 'options', newOptions);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          updateCriterion(index, 'options', [...(criterion.options || []), `Option ${criterion.options?.length + 1 || 1}`])
                        }
                      >
                        Add Option
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {activeStep === 2 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(task.allowHighlight)}
                  onChange={(e) => updateTask({ allowHighlight: e.target.checked })}
                />
              }
              label="Allow Highlight"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(task.allowAnnotation)}
                  onChange={(e) => updateTask({ allowAnnotation: e.target.checked })}
                />
              }
              label="Allow Annotation"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(task.allowTagging)}
                  onChange={(e) => updateTask({ allowTagging: e.target.checked })}
                />
              }
              label="Allow Tagging"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(task.blindedMode)}
                  onChange={(e) => updateTask({ blindedMode: e.target.checked })}
                />
              }
              label="Blinded Mode"
            />

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>
                  Assign Participants
                </Typography>
                {participantOptions.length > 0 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={loadParticipants}
                    disabled={participantsRefreshing}
                  >
                    {participantsRefreshing ? 'Refreshing…' : 'Refresh status'}
                  </Button>
                )}
              </Stack>
              {participantOptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No participants are available. Invite participants to your study first.
                </Typography>
              ) : (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  {participantOptions.some((participant) => !participant.quizPassed) && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      Participants must complete and pass the study quiz before they can receive evaluation tasks.
                    </Alert>
                  )}
                  <InputLabel>Participants</InputLabel>
                  <Select
                    multiple
                    label="Participants"
                    value={task.participantIds}
                    onChange={(e) => {
                      const { value } = e.target;
                      const parsed = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',') : []);
                      const normalized = parsed.map((val) => (typeof val === 'number' ? val : Number(val)));
                      updateTask({ participantIds: normalized });
                    }}
                    renderValue={(selected) =>
                      selected
                        .map((value) => participantOptions.find((p) => p.id === value)?.label || value)
                        .join(', ')
                    }
                  >
                    {participantOptions.map((participant) => (
                      <MenuItem
                        key={participant.id}
                        value={participant.id}
                        disabled={!participant.quizPassed}
                      >
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ width: '100%' }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {participant.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {participant.email}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              size="small"
                              color={
                                participant.quizPassed
                                  ? 'success'
                                  : participant.quizCompleted
                                    ? 'error'
                                    : 'warning'
                              }
                              label={
                                participant.quizPassed
                                  ? 'Quiz Passed'
                                  : participant.quizCompleted
                                    ? `Failed ${participant.quizScore ? participant.quizScore.toFixed(1) : '0'}%`
                                    : 'Quiz Pending'
                              }
                            />
                            {participant.quizPassed && (
                              <Chip
                                size="small"
                                variant="outlined"
                                color={
                                  participant.participantLevel === 'ADVANCED' ? 'success' :
                                  participant.participantLevel === 'INTERMEDIATE' ? 'warning' : 'info'
                                }
                                label={participant.participantLevel ?? (participant.quizPassed ? 'BEGINNER' : null)}
                              />
                            )}
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Only participants who passed the required study quiz can be selected.
                  </FormHelperText>
                </FormControl>
              )}
            </Box>

            <TextField
              label="Due Date"
              type="datetime-local"
              value={task.dueDate}
              onChange={(e) => updateTask({ dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Paper>
      )}

      {activeStep === 3 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review your configuration before creating the task.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Artifacts ({task.artifactReferences.length})
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {task.artifactReferences.map((ref) => (
                  <Chip key={ref.id} label={ref.displayLabel || ref.id} sx={{ mb: 1 }} />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Criteria
              </Typography>
              <Stack spacing={1}>
                {task.criteria.map((criterion) => (
                  <Paper key={criterion.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography fontWeight={600}>{criterion.name || 'Untitled Criterion'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {criterion.type} {criterion.required ? '(required)' : ''}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Interaction Settings
              </Typography>
              <Stack direction="row" spacing={1}>
                {task.allowHighlight && <Chip label="Highlight" />}
                {task.allowAnnotation && <Chip label="Annotation" />}
                {task.allowTagging && <Chip label="Tagging" />}
                <Chip label={`Layout: ${task.layoutMode}`} />
                {task.blindedMode && <Chip label="Blinded" />}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Participants
              </Typography>
              {task.participantIds.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No participants selected.
                </Typography>
              ) : (
                <Chip label={`${task.participantIds.length} participant(s)`} />
              )}
              {task.dueDate && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Due: {new Date(task.dueDate).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>
      )}

      <Stack direction="row" justifyContent="space-between">
        <Button disabled={activeStep === 0 || saving} onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}>
          Back
        </Button>
        <Button variant="contained" onClick={handleNext} disabled={saving}>
          {activeStep === steps.length - 1 ? 'Create Task' : 'Next'}
        </Button>
      </Stack>

      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Template</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {templates.map((template) => (
              <Paper
                key={template.id}
                variant="outlined"
                sx={{ p: 2, cursor: 'pointer' }}
                onClick={() => applyTemplate(template.id)}
              >
                <Typography fontWeight={600}>{template.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {template.description}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Create Evaluation Task
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Container maxWidth="md" sx={{ py: 6 }}>
              <Typography>Loading...</Typography>
            </Container>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Create Evaluation Task
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

export default CreateCustomEvaluationTask;
