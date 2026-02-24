import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Stack,
  Container,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import { questionnaireService } from '../../services/questionnaireService';
import { aiQuestionService } from '../../services/aiQuestionService';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import CssBaseline from '@mui/material/CssBaseline';

function AIQuestionGeneration({ embedded = false, onNavigateToProfile }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    questionnaireId: '',
    topic: '',
    difficulty: 'MEDIUM',
    numberOfQuestions: 5,
  });

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      const response = await questionnaireService.getMyQuestionnaires();
      setQuestionnaires(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'numberOfQuestions' 
        ? parseInt(e.target.value) || 5
        : e.target.value,
    });
    setMessage(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!formData.questionnaireId || !formData.topic) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user?.geminiApiKey) {
      setError('Please add your Google Gemini API key in your profile settings first.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await aiQuestionService.generateQuestions({
        questionnaireId: parseInt(formData.questionnaireId),
        topic: formData.topic,
        difficulty: formData.difficulty,
        numberOfQuestions: formData.numberOfQuestions,
      });
      
      const job = response.data;
      
      if (job.status === 'FAILED') {
        setError(`Generation failed: ${job.errorMessage || 'Unknown error. Please check your API key and try again.'}`);
      } else if (job.status === 'COMPLETED') {
        setMessage('Questions generated successfully! Check the AI Question Approval page to review them.');
      } else {
        setMessage(`Generation job created (ID: ${job.id}). Status: ${job.status}. Questions will be generated shortly. Check the approval page in a few moments.`);
      }
      
      setFormData({
        questionnaireId: '',
        topic: '',
        difficulty: 'MEDIUM',
        numberOfQuestions: 5,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create generation job. Please check your API key.');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <AppTheme>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: embedded ? '400px' : '100vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {!embedded && (
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <AutoAwesomeIcon sx={{ mr: 1 }} />
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                AI Question Generation
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
        )}

        <Box component="main" sx={{ flexGrow: 1, p: embedded ? 0 : 3, minHeight: embedded ? 'auto' : '100vh', mt: embedded ? 0 : 8 }}>
          <Container maxWidth="md">
            <Paper sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    Generate Quiz Questions with AI
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use Google Gemini AI to automatically generate quiz questions. Select a questionnaire, enter a topic, and let AI create questions for you.
                  </Typography>
                </Box>

                <Divider />

                {!user?.geminiApiKey && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      API Key Required
                    </Typography>
                    You need to add your Google Gemini API key in your profile settings to use this feature.
                    <Button
                      size="small"
                      onClick={() => navigate('/dashboard?tab=Profile')}
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Go to Profile Settings
                    </Button>
                  </Alert>
                )}

                {message && (
                  <Alert severity="success" onClose={() => setMessage(null)} sx={{ borderRadius: 2 }}>
                    {message}
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                {questionnaires.length === 0 ? (
                  <Card sx={{ bgcolor: 'action.hover', border: '2px dashed', borderColor: 'divider' }}>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No Questionnaires Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        You need to create a questionnaire first before generating AI questions.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/researcher/questionnaires/create')}
                      >
                        Create Questionnaire
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card variant="outlined">
                    <CardContent>
                      <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                          <FormControl fullWidth required>
                            <InputLabel>Select Questionnaire</InputLabel>
                            <Select
                              name="questionnaireId"
                              value={formData.questionnaireId}
                              onChange={handleChange}
                              label="Select Questionnaire"
                            >
                              {questionnaires.map((q) => (
                                <MenuItem key={q.id} value={q.id}>
                                  <Box>
                                    <Typography variant="body1">{q.title}</Typography>
                                    {q.skillDomain && (
                                      <Typography variant="caption" color="text.secondary">
                                        {q.skillDomain}
                                      </Typography>
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <TextField
                            label="Topic"
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            required
                            fullWidth
                            placeholder="e.g., Java Programming, Database Design, Software Testing"
                          />

                          <FormControl fullWidth required>
                            <InputLabel>Difficulty Level</InputLabel>
                            <Select
                              name="difficulty"
                              value={formData.difficulty}
                              onChange={handleChange}
                              label="Difficulty Level"
                            >
                              <MenuItem value="EASY">
                                <Box>
                                  <Typography>Easy</Typography>
                                </Box>
                              </MenuItem>
                              <MenuItem value="MEDIUM">
                                <Box>
                                  <Typography>Medium</Typography>
                                </Box>
                              </MenuItem>
                              <MenuItem value="HARD">
                                <Box>
                                  <Typography>Hard</Typography>
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>

                          <TextField
                            label="Number of Questions"
                            name="numberOfQuestions"
                            type="number"
                            value={formData.numberOfQuestions}
                            onChange={handleChange}
                            required
                            fullWidth
                            inputProps={{ min: 1, max: 20 }}
                            helperText="How many questions to generate (1-20)"
                          />

                          <Stack direction="row" spacing={2}>
                            <Button
                              type="submit"
                              variant="contained"
                              size="large"
                              disabled={submitting || !user?.geminiApiKey}
                              fullWidth
                              startIcon={submitting ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                            >
                              {submitting ? 'Generating...' : 'Generate Questions'}
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Paper>
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
}

export default AIQuestionGeneration;
