import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, Button, IconButton,
  MenuItem, Select, FormControl, InputLabel, Card, CardContent,
  Divider, Stack, Alert, CircularProgress, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Checkbox, Tabs, Tab,
  AppBar, Toolbar, CssBaseline
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon, Save as SaveIcon, Cancel as CancelIcon,
  Upload as UploadIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { questionnaireService } from '../../../services/questionnaireService';
import { studyService } from '../../../services/api';
import QuestionnaireConfigForm from '../../../components/QuestionnaireConfigForm';
import AppTheme from '../../../shared-theme/AppTheme';
import ColorModeSelect from '../../../shared-theme/ColorModeSelect';

const QuestionnaireBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const studyIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('studyId');
  }, [location.search]);
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  const [questionnaire, setQuestionnaire] = useState({
    title: '',
    description: '',
    type: 'COMPETENCY',
    questions: [],
    // UC4-2: Scoring configuration
    passingThreshold: 70,
    timeLimitMinutes: null,
    showCorrectAnswers: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    allowReview: true,
    gradingMethod: 'AUTOMATIC'
  });

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      loadQuestionnaire();
    }
  }, [id]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      const response = await questionnaireService.getQuestionnaireById(id);
      setQuestionnaire({
        title: response.data.title,
        description: response.data.description || '',
        type: response.data.type,
        questions: response.data.questions.map(q => ({
          questionText: q.questionText,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          displayOrder: q.displayOrder,
          points: q.points
        })),
        // UC4-2: Load scoring configuration
        passingThreshold: response.data.passingThreshold,
        intermediateThreshold: response.data.intermediateThreshold,
        advancedThreshold: response.data.advancedThreshold,
        timeLimitMinutes: response.data.timeLimitMinutes,
        showCorrectAnswers: response.data.showCorrectAnswers !== false,
        randomizeQuestions: response.data.randomizeQuestions || false,
        randomizeOptions: response.data.randomizeOptions || false,
        allowReview: response.data.allowReview !== false,
        gradingMethod: response.data.gradingMethod || 'AUTOMATIC'
      });
    } catch (err) {
      setError('Failed to load questionnaire');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBasicInfoChange = (field, value) => {
    setQuestionnaire(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = (config) => {
    setQuestionnaire(prev => ({ ...prev, ...config }));
  };

  const addQuestion = () => {
    const newQuestion = {
      questionText: '',
      type: 'MULTIPLE_CHOICE',
      options: [
        { optionText: '', isCorrect: false, displayOrder: 0 },
        { optionText: '', isCorrect: false, displayOrder: 1 }
      ],
      correctAnswer: '',
      displayOrder: questionnaire.questions.length,
      points: 1
    };
    setQuestionnaire(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (index) => {
    setQuestionnaire(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questionnaire.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newQuestions.length) return;
    
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    newQuestions.forEach((q, i) => q.displayOrder = i);
    
    setQuestionnaire(prev => ({ ...prev, questions: newQuestions }));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questionnaire.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    
    if (field === 'type') {
      if (value === 'TRUE_FALSE') {
        newQuestions[index].options = [
          { optionText: 'True', isCorrect: false, displayOrder: 0 },
          { optionText: 'False', isCorrect: false, displayOrder: 1 }
        ];
      } else if (value === 'SHORT_ANSWER') {
        newQuestions[index].options = [];
      } else if (value === 'MULTIPLE_CHOICE' && newQuestions[index].options.length === 0) {
        newQuestions[index].options = [
          { optionText: '', isCorrect: false, displayOrder: 0 },
          { optionText: '', isCorrect: false, displayOrder: 1 }
        ];
      }
    }
    
    setQuestionnaire(prev => ({ ...prev, questions: newQuestions }));
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questionnaire.questions];
    const question = newQuestions[questionIndex];
    question.options.push({
      optionText: '',
      isCorrect: false,
      displayOrder: question.options.length
    });
    setQuestionnaire(prev => ({ ...prev, questions: newQuestions }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questionnaire.questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options
      .filter((_, i) => i !== optionIndex);
    setQuestionnaire(prev => ({ ...prev, questions: newQuestions }));
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questionnaire.questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    setQuestionnaire(prev => ({ ...prev, questions: newQuestions }));
  };

  const calculateTotalPoints = () => {
    return questionnaire.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      if (!questionnaire.title.trim()) {
        setError('Questionnaire title is required');
        setCurrentTab(0);
        return;
      }
      
      if (questionnaire.title.trim().length < 3) {
        setError('Questionnaire title must be at least 3 characters');
        setCurrentTab(0);
        return;
      }
      
      if (!questionnaire.description.trim()) {
        setError('Description is required');
        setCurrentTab(0);
        return;
      }
      
      if (questionnaire.description.trim().length < 3) {
        setError('Description must be at least 3 characters');
        setCurrentTab(0);
        return;
      }
      
      if (questionnaire.questions.length === 0) {
        setError('At least one question is required');
        return;
      }
      
      for (let i = 0; i < questionnaire.questions.length; i++) {
        const q = questionnaire.questions[i];
        if (!q.questionText.trim()) {
          setError(`Question ${i + 1}: Question text is required`);
          setCurrentTab(1); // Switch to questions tab
          return;
        }
        
        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
          if (q.options.length < 2) {
            setError(`Question ${i + 1}: At least 2 options are required`);
            setCurrentTab(1);
            return;
          }
          
          const hasCorrect = q.options.some(opt => opt.isCorrect);
          if (!hasCorrect) {
            setError(`Question ${i + 1}: At least one correct option must be selected`);
            setCurrentTab(1);
            return;
          }
        }
        
        if (q.type === 'SHORT_ANSWER' && !q.correctAnswer.trim()) {
          setError(`Question ${i + 1}: Correct answer is required for short answer questions`);
          setCurrentTab(1);
          return;
        }
      }
      
      // Validate scoring configuration based on quiz type
      if (questionnaire.type === 'COMPETENCY') {
        if (questionnaire.passingThreshold === null || questionnaire.passingThreshold === undefined) {
          setError('Passing threshold is required for competency quizzes');
          setCurrentTab(2);
          return;
        }
        if (Number.isNaN(Number(questionnaire.passingThreshold)) ||
            questionnaire.passingThreshold < 1 ||
            questionnaire.passingThreshold > 100) {
          setError('Passing threshold must be between 1 and 100');
          setCurrentTab(2);
          return;
        }
        
        // Validate level thresholds
        if (questionnaire.intermediateThreshold !== null && questionnaire.intermediateThreshold !== undefined) {
          if (questionnaire.intermediateThreshold < questionnaire.passingThreshold) {
            setError('Intermediate threshold must be greater than or equal to passing threshold');
            setCurrentTab(2);
            return;
          }
        }
        
        if (questionnaire.advancedThreshold !== null && questionnaire.advancedThreshold !== undefined) {
          const minAdvanced = questionnaire.intermediateThreshold || questionnaire.passingThreshold;
          if (questionnaire.advancedThreshold < minAdvanced) {
            setError('Advanced threshold must be greater than or equal to intermediate threshold (or passing threshold if no intermediate)');
            setCurrentTab(2);
            return;
          }
        }
      } else {
        // BACKGROUND quiz - clear thresholds
        questionnaire.passingThreshold = null;
        questionnaire.intermediateThreshold = null;
        questionnaire.advancedThreshold = null;
      }
      
      if (questionnaire.timeLimitMinutes !== null && questionnaire.timeLimitMinutes < 1) {
        setError('Time limit must be at least 1 minute');
        setCurrentTab(0);
        return;
      }
      
      if (isEditMode) {
        await questionnaireService.updateQuestionnaire(id, questionnaire);
        setSuccess('Questionnaire updated successfully');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const response = await questionnaireService.createQuestionnaire(questionnaire);
        const createdQuestionnaire = response.data;
        setSuccess('Questionnaire created successfully');

        if (studyIdFromQuery) {
          const questionnaireId =
            createdQuestionnaire?.id ?? createdQuestionnaire?.questionnaireId;
          if (!questionnaireId) {
            setError('Questionnaire saved but its identifier was not returned.');
            return;
          }
          try {
            await studyService.attachQuizToStudy(studyIdFromQuery, {
              questionnaireId
            });
            navigate(`/researcher/study/${studyIdFromQuery}?tab=quizzes`);
            return;
          } catch (attachErr) {
            console.error('Failed to attach questionnaire to study:', attachErr);
            setError(
              attachErr.response?.data?.message ||
                'Questionnaire saved but failed to attach to the study'
            );
            return;
          }
        } else {
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save questionnaire');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      setImportError('Please select a file');
      return;
    }
    
    try {
      setImportError('');
      const response = await questionnaireService.importQuestionnaireFile(importFile);
      setQuestionnaire({
        title: response.data.title,
        description: response.data.description || '',
        type: response.data.type,
        questions: response.data.questions.map(q => ({
          questionText: q.questionText,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          displayOrder: q.displayOrder,
          points: q.points
        })),
        passingThreshold: response.data.passingThreshold,
        intermediateThreshold: response.data.intermediateThreshold,
        advancedThreshold: response.data.advancedThreshold,
        timeLimitMinutes: response.data.timeLimitMinutes,
        showCorrectAnswers: response.data.showCorrectAnswers !== false,
        randomizeQuestions: response.data.randomizeQuestions || false,
        randomizeOptions: response.data.randomizeOptions || false,
        allowReview: response.data.allowReview !== false,
        gradingMethod: response.data.gradingMethod || 'AUTOMATIC'
      });
      setImportDialogOpen(false);
      setSuccess('Questionnaire imported successfully');
    } catch (err) {
      setImportError(err.response?.data?.message || 'Failed to import questionnaire');
    }
  };

  if (loading) {
    return (
      <AppTheme>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  const totalPoints = calculateTotalPoints();

  return (
    <AppTheme>
      <CssBaseline />
      <AppBar position="fixed" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => {
            if (studyIdFromQuery) {
              navigate(`/researcher/study/${studyIdFromQuery}?tab=quizzes`);
            } else {
              navigate('/dashboard?tab=Questionnaires');
            }
          }} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {isEditMode ? 'Edit Questionnaire' : 'Create Questionnaire'}
          </Typography>
          <ColorModeSelect />
        </Toolbar>
      </AppBar>
      <Box sx={{ mt: 8 }} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {isEditMode ? 'Edit Questionnaire' : 'Create New Questionnaire'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode ? 'Update your questionnaire details and questions' : 'Design a competency or background questionnaire for your study'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Basic Information" />
            <Tab label={`Questions (${questionnaire.questions.length})`} />
            <Tab label="Scoring & Configuration" />
          </Tabs>
        </Box>

        {/* Tab Panel 0: Basic Information */}
        {currentTab === 0 && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Stack spacing={3}>
                <TextField
                  label="Questionnaire Title"
                  value={questionnaire.title}
                  onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                  required
                  fullWidth
                />

                
                <TextField
                  label="Description"
                  value={questionnaire.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  fullWidth
                />
                
                <FormControl fullWidth required>
                  <InputLabel>Questionnaire Type</InputLabel>
                  <Select
                    value={questionnaire.type}
                    label="Questionnaire Type"
                    onChange={(e) => handleBasicInfoChange('type', e.target.value)}
                  >
                    <MenuItem value="COMPETENCY">Competency Assessment</MenuItem>
                    <MenuItem value="BACKGROUND">Background Survey</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Tab Panel 1: Questions */}
        {currentTab === 1 && (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addQuestion}
              >
                Add Question
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setImportDialogOpen(true)}
              >
                Import from JSON
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Chip label={`Total Points: ${totalPoints}`} color="primary" />
            </Stack>

            <Stack spacing={3}>
              {questionnaire.questions.map((question, qIndex) => (
                <Card key={qIndex} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight={600}>
                        Question {qIndex + 1}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => moveQuestion(qIndex, 'up')}
                          disabled={qIndex === 0}
                        >
                          <ArrowUpIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => moveQuestion(qIndex, 'down')}
                          disabled={qIndex === questionnaire.questions.length - 1}
                        >
                          <ArrowDownIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>Question Type</InputLabel>
                        <Select
                          value={question.type}
                          label="Question Type"
                          onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        >
                          <MenuItem value="MULTIPLE_CHOICE">Multiple Choice</MenuItem>
                          <MenuItem value="TRUE_FALSE">True/False</MenuItem>
                          <MenuItem value="SHORT_ANSWER">Short Answer</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="Question Text"
                        value={question.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        required
                        fullWidth
                      />

                      <TextField
                        label="Points"
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }}
                        sx={{ width: 150 }}
                      />

                      {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Options
                          </Typography>
                          <Stack spacing={2}>
                            {question.options.map((option, oIndex) => (
                              <Stack key={oIndex} direction="row" spacing={2} alignItems="center">
                                <Checkbox
                                  checked={option.isCorrect}
                                  onChange={(e) => updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)}
                                />
                                <TextField
                                  label={`Option ${oIndex + 1}`}
                                  value={option.optionText}
                                  onChange={(e) => updateOption(qIndex, oIndex, 'optionText', e.target.value)}
                                  fullWidth
                                  disabled={question.type === 'TRUE_FALSE'}
                                />
                                {question.type === 'MULTIPLE_CHOICE' && question.options.length > 2 && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => removeOption(qIndex, oIndex)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                              </Stack>
                            ))}
                            {question.type === 'MULTIPLE_CHOICE' && (
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => addOption(qIndex)}
                                sx={{ alignSelf: 'flex-start' }}
                              >
                                Add Option
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      )}

                      {question.type === 'SHORT_ANSWER' && (
                        <TextField
                          label="Correct Answer"
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                          required
                          fullWidth
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}

        {/* Tab Panel 2: Scoring Configuration */}
        {currentTab === 2 && (
          <QuestionnaireConfigForm
            config={{
              ...questionnaire,
              totalPoints,
              type: questionnaire.type
            }}
            onChange={handleConfigChange}
          />
        )}

        {/* Save/Cancel Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
          </Button>
        </Stack>
      </Paper>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Questionnaire from JSON</DialogTitle>
        <DialogContent>
          {importError && <Alert severity="error" sx={{ mb: 2 }}>{importError}</Alert>}
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload a JSON file containing questionnaire data. You can download a template to see the required format.
          </Typography>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setImportFile(e.target.files[0])}
            style={{ marginTop: 16 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleImportFile} variant="contained">Import</Button>
        </DialogActions>
      </Dialog>
    </Container>
    </AppTheme>
  );
};

export default QuestionnaireBuilder;
