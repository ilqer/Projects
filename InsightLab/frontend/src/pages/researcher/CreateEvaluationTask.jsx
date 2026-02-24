import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Stepper, Step, StepLabel, IconButton, Divider, Alert, CircularProgress,
  List, ListItem, ListItemText, Switch, FormControlLabel, Stack, Chip, FormHelperText
} from '@mui/material';
import { ArrowBack, Add, Delete } from '@mui/icons-material';
import { researcherEvaluationService, studyService } from '../../services/api';

const CreateEvaluationTask = () => {
  const navigate = useNavigate();
  const { studyId } = useParams(); // Get studyId from URL
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [participantsRefreshing, setParticipantsRefreshing] = useState(false);
  const [studyArtifacts, setStudyArtifacts] = useState([]);
  const [study, setStudy] = useState(null);

  // Task Type Data
  const [taskType, setTaskType] = useState({
    name: '',
    description: '',
    artifactType: 'BUG_REPORT',
    layoutMode: 'SINGLE',
    comparisonMode: 'TEXTUAL',
    criteriaItems: []
  });

  // Evaluation Task Data
  const [task, setTask] = useState({
    title: '',
    description: '',
    instructions: '',
    artifacts: [],
    participantIds: [],
    dueDate: '',
    blindedMode: false
  });

  const steps = ['Task Type', 'Artifacts', 'Assign Participants'];

  const loadParticipants = React.useCallback(async () => {
    if (!studyId) return;
    try {
      setParticipantsRefreshing(true);
      const response = await studyService.getStudyEnrollments(studyId);
      const activeStatuses = new Set(['ENROLLED', 'IN_PROGRESS', 'COMPLETED']);
      const mapped = (response.data || [])
        .filter((enrollment) => activeStatuses.has(enrollment.status))
        .map((enrollment) => {
          console.log('Participant level from API:', enrollment.participantLevel);
          return {
            id: enrollment.participantId,
            fullName: enrollment.participantName,
            email: enrollment.participantEmail,
            status: enrollment.status,
            quizCompleted: Boolean(enrollment.quizCompleted),
            quizPassed: Boolean(enrollment.quizPassed),
            quizScore: enrollment.quizScore,
            quizTitle: enrollment.quizTitle,
            participantLevel: enrollment.participantLevel,
          };
        });
      setParticipants(mapped);
      setTask((prev) => {
        const validIds = prev.participantIds.filter((participantId) =>
          mapped.some((participant) => participant.id === participantId && participant.quizPassed)
        );
        if (validIds.length === prev.participantIds.length) {
          return prev;
        }
        return { ...prev, participantIds: validIds };
      });
    } catch (err) {
      console.error('Error loading participants:', err);
      setError('Failed to load study participants. Ensure enrollments are available.');
    } finally {
      setParticipantsRefreshing(false);
    }
  }, [studyId]);

  useEffect(() => {
    if (!studyId) {
      setError('Study ID is required. Please create evaluation tasks from within a study.');
      return;
    }
    loadStudyData();
    loadParticipants();
    loadStudyArtifacts();
  }, [studyId, loadParticipants]);

  useEffect(() => {
    if (activeStep === 2) {
      loadParticipants();
    }
  }, [activeStep, loadParticipants]);

  // Reset selected artifacts when artifact type changes
  useEffect(() => {
    setTask(prev => ({
      ...prev,
      artifacts: []
    }));
  }, [taskType.artifactType]);

  const loadStudyData = async () => {
    try {
      const response = await studyService.getStudyById(studyId);
      setStudy(response.data);
    } catch (err) {
      console.error('Error loading study:', err);
      setError('Failed to load study information');
    }
  };

  const loadStudyArtifacts = async () => {
    try {
      const response = await studyService.getStudyArtifacts(studyId);
      setStudyArtifacts(response.data || []);
    } catch (err) {
      console.error('Error loading study artifacts:', err);
    }
  };

  const handleNext = () => {
    setError('');

    // Validation for each step
    if (activeStep === 0) {
      // Step 1: Task Type Configuration
      if (!taskType.name.trim()) {
        setError('Task Type Name is required');
        return;
      }
    } else if (activeStep === 1) {
      // Step 2: Artifacts
      if (!task.title.trim()) {
        setError('Task Title is required');
        return;
      }
      if (!validateArtifacts()) {
        return; // validateArtifacts() sets the error message
      }
    } else if (activeStep === 2) {
      // Step 3: Assignment - will be validated in handleSubmit
      // Just proceed to submit
      handleSubmit();
      return;
    }

    // Move to next step
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const addCriteriaItem = () => {
    setTaskType({
      ...taskType,
      criteriaItems: [
        ...taskType.criteriaItems,
        {
          name: '',
          description: '',
          criterionType: 'TEXT_INPUT',
          isRequired: true,
          displayOrder: taskType.criteriaItems.length
        }
      ]
    });
  };

  const updateCriteriaItem = (index, field, value) => {
    const newCriteria = [...taskType.criteriaItems];
    newCriteria[index][field] = value;
    setTaskType({ ...taskType, criteriaItems: newCriteria });
  };

  const removeCriteriaItem = (index) => {
    const newCriteria = taskType.criteriaItems.filter((_, i) => i !== index);
    setTaskType({ ...taskType, criteriaItems: newCriteria });
  };

  const addArtifact = () => {
    setTask({
      ...task,
      artifacts: [
        ...task.artifacts,
        {
          artifactType: taskType.artifactType,
          data: getDefaultArtifactData(taskType.artifactType)
        }
      ]
    });
  };

  const getDefaultArtifactData = (type) => {
    switch (type) {
      case 'SNAPSHOT':
        return {
          referenceImageId: '',
          failureImageId: '',
          diffImageId: '',
          testName: ''
        };
      case 'CODE_CLONE':
        return {
          codeSnippet1: '',
          codeSnippet2: '',
          codeSnippet1FileName: '',
          codeSnippet2FileName: ''
        };
      case 'BUG_REPORT':
        return {
          bugReportJson: '',
          bugReportJsonFileName: ''
        };
      case 'SOLID_VIOLATION':
        return {
          solidJson: '',
          solidJsonFileName: ''
        };
      default:
        return {
          studyArtifactId: ''
        };
    }
  };

  const updateArtifact = (index, field, value) => {
    setTask((prev) => {
      const newArtifacts = [...prev.artifacts];
      const target = newArtifacts[index] || { data: {} };
      newArtifacts[index] = {
        ...target,
        data: {
          ...target.data,
          [field]: value
        }
      };
      return { ...prev, artifacts: newArtifacts };
    });
  };

  const removeArtifact = (index) => {
    const newArtifacts = task.artifacts.filter((_, i) => i !== index);
    setTask({ ...task, artifacts: newArtifacts });
  };

  const handleCodeFileUpload = (index, field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = typeof event.target?.result === 'string' ? event.target.result : '';
      updateArtifact(index, field, text);
      updateArtifact(index, `${field}FileName`, file.name);
    };
    reader.readAsText(file);
  };

  const handleBugFileUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = typeof event.target?.result === 'string' ? event.target.result : '';
      updateArtifact(index, 'bugReportJson', text);
      updateArtifact(index, 'bugReportJsonFileName', file.name);
    };
    reader.readAsText(file);
  };

  const handleSolidFileUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = typeof event.target?.result === 'string' ? event.target.result : '';
      updateArtifact(index, 'solidJson', text);
      updateArtifact(index, 'solidJsonFileName', file.name);
    };
    reader.readAsText(file);
  };

  const isJsonLikeArtifact = (artifact) => {
    if (!artifact) return false;
    const type = artifact.contentType || '';
    const filename = artifact.originalFilename || '';
    return type.includes('json') || type.includes('text') || filename.toLowerCase().endsWith('.json') || filename.toLowerCase().endsWith('.txt');
  };

  const compatibleArtifacts = useMemo(() => {
    switch (taskType.artifactType) {
      case 'BUG_REPORT':
      case 'SOLID_VIOLATION':
        return (studyArtifacts || []).filter(isJsonLikeArtifact);
      case 'CODE_CLONE':
        return studyArtifacts || [];
      case 'SNAPSHOT':
        return (studyArtifacts || []).filter(artifact => artifact.contentType?.startsWith('image/'));
      default:
        return studyArtifacts || [];
    }
  }, [studyArtifacts, taskType.artifactType]);

  const formatFileSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Validate artifacts before submission
  const validateArtifacts = () => {
    if (task.artifacts.length === 0) {
      setError('At least one artifact is required');
      return false;
    }

    for (let i = 0; i < task.artifacts.length; i++) {
      const artifact = task.artifacts[i];
      const type = taskType.artifactType;

      if (type !== 'SNAPSHOT' && type !== 'CODE_CLONE' && type !== 'BUG_REPORT') {
        if (!artifact.data.studyArtifactId) {
          setError(`Artifact ${i + 1}: Please select an existing study artifact.`);
          return false;
        }

        const exists = compatibleArtifacts.some(a => a.id === artifact.data.studyArtifactId);
        if (!exists) {
          setError(`Artifact ${i + 1}: Selected artifact is not compatible with ${type.replace('_', ' ')} tasks.`);
          return false;
        }
      }

      if (type === 'CODE_CLONE') {
        if (!artifact.data.codeSnippet1 || !artifact.data.codeSnippet1.trim()) {
          setError(`Artifact ${i + 1}: Original code is required.`);
          return false;
        }
        if (!artifact.data.codeSnippet2 || !artifact.data.codeSnippet2.trim()) {
          setError(`Artifact ${i + 1}: Clone code is required.`);
          return false;
        }
      }

      if (type === 'BUG_REPORT') {
        if (!artifact.data.bugReportJson || !artifact.data.bugReportJson.trim()) {
          setError(`Artifact ${i + 1}: Bug Report JSON is required.`);
          return false;
        }
        try {
          JSON.parse(artifact.data.bugReportJson);
        } catch (err) {
          setError(`Artifact ${i + 1}: Invalid JSON. Please provide valid bug report JSON.`);
          return false;
        }
      }

      if (type === 'SOLID_VIOLATION') {
        if (!artifact.data.solidJson || !artifact.data.solidJson.trim()) {
          setError(`Artifact ${i + 1}: SOLID code JSON is required.`);
          return false;
        }
        try {
          JSON.parse(artifact.data.solidJson);
        } catch (err) {
          setError(`Artifact ${i + 1}: Invalid JSON. Please provide valid SOLID code JSON.`);
          return false;
        }
      }

      if (type === 'SOLID_VIOLATION') {
        // Selection already validated above
      }

      if (type === 'SNAPSHOT') {
        if (!artifact.data.referenceImageId || !artifact.data.failureImageId || !artifact.data.diffImageId) {
          setError(`Artifact ${i + 1}: All three images (Reference, Failure, Diff) are required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate all fields
      if (!taskType.name.trim()) {
        setError('Task type name is required');
        setLoading(false);
        return;
      }

      if (!task.title.trim()) {
        setError('Task title is required');
        setLoading(false);
        return;
      }

      if (!validateArtifacts()) {
        setLoading(false);
        return;
      }

      if (task.participantIds.length === 0) {
        setError('At least one participant must be assigned');
        setLoading(false);
        return;
      }

      if (!task.dueDate) {
        setError('Due date is required');
        setLoading(false);
        return;
      }

      const selectedParticipants = participants.filter((p) => task.participantIds.includes(p.id));
      if (selectedParticipants.some((participant) => !participant.quizPassed)) {
        setError('All selected participants must pass the study quiz before evaluation tasks can be created.');
        setLoading(false);
        return;
      }

      // Create task type first
      const taskTypeResponse = await researcherEvaluationService.createTaskType(taskType);

      // Process artifacts based on type
      const processedArtifacts = task.artifacts.map(artifact => {
        if (taskType.artifactType === 'SNAPSHOT') {
          return {
            artifactType: artifact.artifactType,
            data: {
              referenceImageId: artifact.data.referenceImageId,
              failureImageId: artifact.data.failureImageId,
              diffImageId: artifact.data.diffImageId,
              testName: artifact.data.testName || ''
            }
          };
        }

        if (taskType.artifactType === 'BUG_REPORT') {
          return {
            artifactType: artifact.artifactType,
            data: {
              bugReportJson: artifact.data.bugReportJson
            }
          };
        }

        if (taskType.artifactType === 'SOLID_VIOLATION') {
          return {
            artifactType: artifact.artifactType,
            data: {
              solidJson: artifact.data.solidJson
            }
          };
        }

        if (taskType.artifactType === 'CODE_CLONE') {
          return {
            artifactType: artifact.artifactType,
            data: {
              codeSnippet1: artifact.data.codeSnippet1,
              codeSnippet2: artifact.data.codeSnippet2
            }
          };
        }

        return {
          artifactType: artifact.artifactType,
          data: {
            studyArtifactId: artifact.data.studyArtifactId
          }
        };
      });

      // Create evaluation task with processed artifacts
      const taskData = {
        studyId: parseInt(studyId), // Include studyId - REQUIRED
        taskTypeId: taskTypeResponse.data.id,
        title: task.title,
        description: task.description,
        instructions: task.instructions,
        artifacts: processedArtifacts,
        participantIds: task.participantIds,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        blindedMode: task.blindedMode,
        layoutMode: taskType.layoutMode
      };

      await researcherEvaluationService.createTask(taskData);

      // Navigate back to study detail page
      navigate(`/researcher/study/${studyId}`);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create evaluation task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTaskTypeForm = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Task Type Configuration</Typography>
      <TextField
        fullWidth
        label="Task Type Name"
        value={taskType.name}
        onChange={(e) => setTaskType({ ...taskType, name: e.target.value })}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label="Description"
        value={taskType.description}
        onChange={(e) => setTaskType({ ...taskType, description: e.target.value })}
        margin="normal"
        multiline
        rows={2}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Artifact Type</InputLabel>
        <Select
          value={taskType.artifactType}
          onChange={(e) => setTaskType({ ...taskType, artifactType: e.target.value })}
        >
          <MenuItem value="BUG_REPORT">Bug Report</MenuItem>
          <MenuItem value="CODE_CLONE">Code Clone</MenuItem>
          <MenuItem value="SOLID_VIOLATION">SOLID Violation</MenuItem>
          <MenuItem value="SNAPSHOT">Snapshot</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Layout Mode</InputLabel>
        <Select
          value={taskType.layoutMode}
          onChange={(e) => setTaskType({ ...taskType, layoutMode: e.target.value })}
        >
          <MenuItem value="SINGLE">Single Panel</MenuItem>
          <MenuItem value="SIDE_BY_SIDE">Side-by-Side (Pair Comparison)</MenuItem>
          <MenuItem value="THREE_WAY">Three Way</MenuItem>
        </Select>
        <FormHelperText>
          {taskType.layoutMode === 'SIDE_BY_SIDE' && 'Artifacts will be compared in pairs. Each pair will be shown on a separate page.'}
        </FormHelperText>
      </FormControl>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Evaluation Criteria</Typography>
        {taskType.criteriaItems.map((criteria, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                label="Criterion Name"
                value={criteria.name}
                onChange={(e) => updateCriteriaItem(index, 'name', e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={criteria.criterionType}
                  onChange={(e) => updateCriteriaItem(index, 'criterionType', e.target.value)}
                >
                  <MenuItem value="TEXT_INPUT">Text Input</MenuItem>
                  <MenuItem value="RATING">Rating</MenuItem>
                  <MenuItem value="SELECTION">Selection</MenuItem>
                  <MenuItem value="MULTIPLE_CHOICE">Multiple Choice</MenuItem>
                  <MenuItem value="BOOLEAN">Yes/No</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Required</InputLabel>
                <Select
                  value={criteria.isRequired}
                  onChange={(e) => updateCriteriaItem(index, 'isRequired', e.target.value)}
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={() => removeCriteriaItem(index)} color="error">
                <Delete />
              </IconButton>
            </Box>
          </Paper>
        ))}
        <Button startIcon={<Add />} onClick={addCriteriaItem} variant="outlined">
          Add Criterion
        </Button>
      </Box>
    </Box>
  );

  const renderArtifactsForm = () => (
    <Box>
      <TextField
        fullWidth
        label="Task Title"
        value={task.title}
        onChange={(e) => setTask({ ...task, title: e.target.value })}
        margin="normal"
        required
        helperText="* Required"
      />
      <TextField
        fullWidth
        label="Description"
        value={task.description}
        onChange={(e) => setTask({ ...task, description: e.target.value })}
        margin="normal"
        multiline
        rows={2}
        helperText="Optional"
      />
      <TextField
        fullWidth
        label="Instructions"
        value={task.instructions}
        onChange={(e) => setTask({ ...task, instructions: e.target.value })}
        margin="normal"
        multiline
        rows={3}
        helperText="Optional - Instructions for participants"
      />

      <Divider sx={{ my: 3 }} />

      <Paper sx={{ p: 2, mb: 3 }} elevation={0} variant="outlined">
        <FormControlLabel
          control={
            <Switch
              checked={task.blindedMode}
              onChange={(e) => setTask({ ...task, blindedMode: e.target.checked })}
            />
          }
          label="Enable Blinded Mode"
        />
        <Typography variant="body2" color="text.secondary">
          When enabled, participants will see anonymized artifact labels (Document A, Document B, …) with file metadata
          removed. Researchers and reviewers still see the original artifacts.
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Artifacts ({taskType.artifactType.replace('_', ' ')})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {taskType.artifactType === 'BUG_REPORT' && 'Provide the bug report JSON directly via text input or file upload.'}
        {taskType.artifactType === 'CODE_CLONE' && 'Provide the original and clone code snippets via text input or file upload.'}
        {taskType.artifactType === 'SOLID_VIOLATION' && 'Provide the SOLID code artifact JSON directly or upload a .json file.'}
        {taskType.artifactType === 'SOLID_VIOLATION' && 'Select SOLID violation JSON/TXT artifacts uploaded to the study.'}
        {taskType.artifactType === 'SNAPSHOT' && 'Select three previously uploaded images from this study: Reference, Failure, and Diff.'}
      </Typography>

      {taskType.artifactType !== 'CODE_CLONE' && taskType.artifactType !== 'BUG_REPORT' && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Compatible Study Artifacts ({compatibleArtifacts.length})
          </Typography>
          {compatibleArtifacts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No artifacts of type {taskType.artifactType.replace('_', ' ')} are available in this study. Add artifacts to the study first, then return here.
            </Typography>
          ) : (
            <List dense>
              {compatibleArtifacts.map((artifact) => (
                <ListItem key={artifact.id} divider>
                  <ListItemText
                    primary={artifact.displayLabel || artifact.originalFilename}
                    secondary={`${artifact.contentType || 'Unknown type'} • ${formatFileSize(artifact.sizeBytes)}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {taskType.artifactType === 'CODE_CLONE' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Provide both the Original and Clone code artifacts directly. You can paste code into the editors
          or upload supported text/code files (.txt, .java, .js, .py, etc.).
        </Alert>
      )}

      {taskType.artifactType === 'BUG_REPORT' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Paste structured bug report JSON or upload a .json/.txt file. Participants will see this JSON exactly as provided.
        </Alert>
      )}
      {taskType.artifactType === 'SOLID_VIOLATION' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Paste the SOLID code artifact JSON or upload a .json file. Include the code snippet, context, and notes as needed.
        </Alert>
      )}

      {taskType.artifactType === 'SNAPSHOT' && compatibleArtifacts.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No images found in this study. Please upload images to the study first before creating SNAPSHOT evaluation tasks.
        </Alert>
      )}

      {task.artifacts.map((artifact, index) => (
        <Paper key={index} sx={{ p: 3, mb: 2, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Artifact {index + 1}
            </Typography>
            <IconButton onClick={() => removeArtifact(index)} color="error" size="small">
              <Delete />
            </IconButton>
          </Box>

          {/* EXISTING STUDY ARTIFACT SELECTION */}
          {taskType.artifactType !== 'SNAPSHOT' && taskType.artifactType !== 'CODE_CLONE' && taskType.artifactType !== 'BUG_REPORT' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Select Study Artifact</InputLabel>
                <Select
                  value={artifact.data.studyArtifactId || ''}
                  label="Select Study Artifact"
                  onChange={(e) => updateArtifact(index, 'studyArtifactId', e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select an artifact from this study</em>
                  </MenuItem>
                  {compatibleArtifacts.map(sa => (
                    <MenuItem key={sa.id} value={sa.id}>
                      {sa.displayLabel || sa.originalFilename}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {artifact.data.studyArtifactId && (
                <Alert severity="info">
                  {(() => {
                    const selected = compatibleArtifacts.find(a => a.id === artifact.data.studyArtifactId);
                    return selected
                      ? `Using ${selected.displayLabel || selected.originalFilename} (${selected.contentType || 'Unknown'})`
                      : 'Selected artifact is no longer available.';
                  })()}
                </Alert>
              )}
            </Box>
          )}

          {taskType.artifactType === 'CODE_CLONE' && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Input A: Original Code Artifact
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  value={artifact.data.codeSnippet1 || ''}
                  onChange={(e) => updateArtifact(index, 'codeSnippet1', e.target.value)}
                  placeholder="Paste the original code or upload a file"
                  helperText="Required"
                  sx={{ mt: 1 }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }} alignItems="center">
                  <Button
                    variant="outlined"
                    component="label"
                  >
                    Upload File
                    <input
                      type="file"
                      accept=".txt,.java,.js,.ts,.py,.rb,.cs,.cpp,.c,.json"
                      hidden
                      onChange={(e) => handleCodeFileUpload(index, 'codeSnippet1', e.target.files?.[0] || null)}
                    />
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {artifact.data.codeSnippet1FileName
                      ? `Loaded from: ${artifact.data.codeSnippet1FileName}`
                      : 'Supports .txt, .java, .js, .py, and other text/code files.'}
                  </Typography>
                </Stack>
              </Box>

              <Divider flexItem />

              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Input B: Clone Code Artifact
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  value={artifact.data.codeSnippet2 || ''}
                  onChange={(e) => updateArtifact(index, 'codeSnippet2', e.target.value)}
                  placeholder="Paste the clone code or upload a file"
                  helperText="Required"
                  sx={{ mt: 1 }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }} alignItems="center">
                  <Button
                    variant="outlined"
                    component="label"
                  >
                    Upload File
                    <input
                      type="file"
                      accept=".txt,.java,.js,.ts,.py,.rb,.cs,.cpp,.c,.json"
                      hidden
                      onChange={(e) => handleCodeFileUpload(index, 'codeSnippet2', e.target.files?.[0] || null)}
                    />
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {artifact.data.codeSnippet2FileName
                      ? `Loaded from: ${artifact.data.codeSnippet2FileName}`
                      : 'Supports .txt, .java, .js, .py, and other text/code files.'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          )}

          {taskType.artifactType === 'BUG_REPORT' && (
            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                minRows={10}
                label="Bug Report JSON (required)"
                value={artifact.data.bugReportJson || ''}
                onChange={(e) => updateArtifact(index, 'bugReportJson', e.target.value)}
                placeholder='{ "title": "Bug title", "stepsToReproduce": ["Step 1", "Step 2"] }'
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <Button variant="outlined" component="label">
                  Upload JSON / TXT
                  <input
                    type="file"
                    accept=".json,.txt"
                    hidden
                    onChange={(e) => handleBugFileUpload(index, e.target.files?.[0] || null)}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {artifact.data.bugReportJsonFileName
                    ? `Loaded from: ${artifact.data.bugReportJsonFileName}`
                    : 'Accepts .json or .txt files with structured bug report data.'}
                </Typography>
              </Stack>
            </Stack>
          )}

          {taskType.artifactType === 'SOLID_VIOLATION' && (
            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                minRows={10}
                label="SOLID Code Artifact JSON (required)"
                value={artifact.data.solidJson || ''}
                onChange={(e) => updateArtifact(index, 'solidJson', e.target.value)}
                placeholder='{ "codeSnippet": "class Example { ... }", "context": "...", "notes": "..." }'
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <Button variant="outlined" component="label">
                  Upload JSON
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={(e) => handleSolidFileUpload(index, e.target.files?.[0] || null)}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {artifact.data.solidJsonFileName
                    ? `Loaded from: ${artifact.data.solidJsonFileName}`
                    : 'Upload a .json file that contains the SOLID code example metadata.'}
                </Typography>
              </Stack>
            </Stack>
          )}

          {/* SNAPSHOT ARTIFACT */}
          {taskType.artifactType === 'SNAPSHOT' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Reference Image */}
              <FormControl fullWidth required>
                <InputLabel>Reference Image</InputLabel>
                <Select
                  value={artifact.data.referenceImageId || ''}
                  onChange={(e) => updateArtifact(index, 'referenceImageId', e.target.value)}
                  label="Reference Image"
                >
                  <MenuItem value="">
                    <em>Select an image from study</em>
                  </MenuItem>
                  {compatibleArtifacts.map(img => (
                      <MenuItem key={img.id} value={img.id}>
                        {img.displayLabel || img.originalFilename || `Image ${img.id}`}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Failure Image */}
              <FormControl fullWidth required>
                <InputLabel>Failure Image</InputLabel>
                <Select
                  value={artifact.data.failureImageId || ''}
                  onChange={(e) => updateArtifact(index, 'failureImageId', e.target.value)}
                  label="Failure Image"
                >
                  <MenuItem value="">
                    <em>Select an image from study</em>
                  </MenuItem>
                  {compatibleArtifacts.map(img => (
                      <MenuItem key={img.id} value={img.id}>
                        {img.displayLabel || img.originalFilename || `Image ${img.id}`}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Diff Image */}
              <FormControl fullWidth required>
                <InputLabel>Diff Image</InputLabel>
                <Select
                  value={artifact.data.diffImageId || ''}
                  onChange={(e) => updateArtifact(index, 'diffImageId', e.target.value)}
                  label="Diff Image"
                >
                  <MenuItem value="">
                    <em>Select an image from study</em>
                  </MenuItem>
                  {compatibleArtifacts.map(img => (
                      <MenuItem key={img.id} value={img.id}>
                        {img.displayLabel || img.originalFilename || `Image ${img.id}`}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Test Name"
                value={artifact.data.testName || ''}
                onChange={(e) => updateArtifact(index, 'testName', e.target.value)}
                helperText="Optional - Name of the test that produced this snapshot"
              />
            </Box>
          )}
        </Paper>
      ))}

      <Button
        startIcon={<Add />}
        onClick={addArtifact}
        variant="outlined"
        fullWidth
        disabled={
          taskType.artifactType !== 'CODE_CLONE' &&
          taskType.artifactType !== 'BUG_REPORT' &&
          compatibleArtifacts.length === 0
        }
      >
        Add Artifact
      </Button>
    </Box>
  );

  const renderAssignmentForm = () => {
    const awaitingParticipants = participants.filter((p) => !p.quizPassed);

    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Assign Participants
          </Typography>
          {participants.length > 0 && (
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
        {participants.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No enrolled participants were found for this study. Invite or enroll participants before assigning tasks.
          </Alert>
        )}
        {awaitingParticipants.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {awaitingParticipants.length} participant{awaitingParticipants.length > 1 ? 's' : ''} still need to complete
            and pass the study quiz before evaluation tasks can be assigned.
          </Alert>
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel>Select Participants</InputLabel>
          <Select
            multiple
            label="Select Participants"
            value={task.participantIds}
            onChange={(event) => {
              const { value } = event.target;
              const rawValues = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',') : []);
              const normalizedValues = rawValues.map((val) =>
                typeof val === 'number' ? val : Number(val)
              );
              setTask({ ...task, participantIds: normalizedValues });
            }}
            renderValue={(selected) => {
              if (!Array.isArray(selected) || selected.length === 0) {
                return 'Select participants';
              }
              const labels = participants
                .filter((participant) => selected.includes(participant.id))
                .map((participant) => participant.fullName);
              return labels.join(', ');
            }}
          >
            {participants.map((participant) => (
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
                      {participant.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {participant.email}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
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
                        color={
                          participant.participantLevel === 'ADVANCED' ? 'success' :
                          participant.participantLevel === 'INTERMEDIATE' ? 'warning' : 'info'
                        }
                        label={participant.participantLevel ?? 'BEGINNER'}
                      />
                    )}
                  </Stack>
                </Stack>
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Only participants who completed and passed the study quiz can receive evaluation tasks.
          </FormHelperText>
        </FormControl>

        <TextField
          fullWidth
          type="datetime-local"
          label="Due Date"
          value={task.dueDate}
          onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/researcher/study/${studyId}`)}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>Create Evaluation Task</Typography>
            {study && (
              <Typography variant="body2" color="text.secondary">
                Study: {study.title}
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="outlined"
          onClick={() => studyId && navigate(`/studies/${studyId}/tasks/create-custom`)}
        >
          Switch to Custom Builder
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && renderTaskTypeForm()}
        {activeStep === 1 && renderArtifactsForm()}
        {activeStep === 2 && renderAssignmentForm()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : activeStep === steps.length - 1 ? 'Create Task' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateEvaluationTask;
