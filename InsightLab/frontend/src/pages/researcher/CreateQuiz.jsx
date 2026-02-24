import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiQuestionService } from '../../services/aiQuestionService';
import { questionnaireService } from '../../services/questionnaireService';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import Divider from '@mui/material/Divider';
import CodeIcon from '@mui/icons-material/Code';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useColorScheme } from '@mui/material/styles';

const aiSuggestedQuestions = {
  'Software Testing': [
    { text: 'Which testing technique focuses on the internal structure of the software?', type: 'MULTIPLE_CHOICE', options: ['Black Box Testing', 'White Box Testing', 'Gray Box Testing', 'Regression Testing'], correctAnswer: 'White Box Testing', difficulty: 'intermediate' },
    { text: 'Unit testing is performed before integration testing.', type: 'TRUE_FALSE', correctAnswer: 'True', difficulty: 'beginner' },
    { text: 'What does TDD stand for in software development?', type: 'SHORT_ANSWER', correctAnswer: 'Test-Driven Development', difficulty: 'intermediate' }
  ],
  'Java Programming': [
    { text: 'Which keyword is used to inherit a class in Java?', type: 'MULTIPLE_CHOICE', options: ['implements', 'extends', 'inherits', 'super'], correctAnswer: 'extends', difficulty: 'beginner' },
    { text: 'Java supports multiple inheritance through classes.', type: 'TRUE_FALSE', correctAnswer: 'False', difficulty: 'intermediate' },
    { text: 'What is the main method signature in Java?', type: 'SHORT_ANSWER', correctAnswer: 'public static void main(String[] args)', difficulty: 'beginner' }
  ],
  'UML Diagrams': [
    { text: 'Which UML diagram shows the sequence of messages between objects?', type: 'MULTIPLE_CHOICE', options: ['Class Diagram', 'Sequence Diagram', 'Use Case Diagram', 'Activity Diagram'], correctAnswer: 'Sequence Diagram', difficulty: 'intermediate' },
    { text: 'A class diagram shows the dynamic behavior of a system.', type: 'TRUE_FALSE', correctAnswer: 'False', difficulty: 'beginner' },
    { text: 'What does UML stand for?', type: 'SHORT_ANSWER', correctAnswer: 'Unified Modeling Language', difficulty: 'beginner' }
  ],
  'Data Structures': [
    { text: 'Which data structure follows the LIFO principle?', type: 'MULTIPLE_CHOICE', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 'Stack', difficulty: 'beginner' },
    { text: 'A binary search tree allows duplicate values.', type: 'TRUE_FALSE', correctAnswer: 'False', difficulty: 'intermediate' },
    { text: 'What is the time complexity of searching in a balanced BST?', type: 'SHORT_ANSWER', correctAnswer: 'O(log n)', difficulty: 'intermediate' }
  ]
};

const languageLabels = { java: 'Java', python: 'Python', cpp: 'C++', javascript: 'JavaScript', typescript: 'TypeScript', csharp: 'C#' };

const difficultyColors = { beginner: '#4caf50', intermediate: '#ff9800', advanced: '#ff5722', expert: '#f44336' };

const CreateQuiz = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    timeLimit: ''
  });
  
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(true);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoadingQuestionnaires(true);
      const response = await questionnaireService.getMyQuestionnaires();
      setQuestionnaires(response.data || []);
    } catch (err) {
      setErrorMessage('Failed to load questionnaires');
    } finally {
      setLoadingQuestionnaires(false);
    }
  };
  
  const [questions, setQuestions] = useState([{
    text: '',
    type: 'MULTIPLE_CHOICE',
    options: ['', '', '', ''],
    correctAnswer: '',
    codeSnippet: '',
    codeLanguage: 'javascript',
    difficulty: 'beginner'
  }]);

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    if (field === 'type') {
      if (value === 'TRUE_FALSE') {
        updated[index].options = ['True', 'False'];
        updated[index].correctAnswer = '';
      } else if (value === 'MULTIPLE_CHOICE') {
        updated[index].options = ['', '', '', ''];
      }
    }
    if (field === 'codeSnippet') {
      updated[index].correctAnswer = value;
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      text: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: '',
      codeSnippet: '',
      codeLanguage: 'javascript',
      difficulty: 'beginner'
    }]);
  };

  const addSuggestedQuestions = async () => {
    if (!user?.geminiApiKey) {
      setErrorMessage('Please add your Google Gemini API key in your profile settings first.');
      return;
    }

    if (!selectedTopic || !formData.title) {
      setErrorMessage('Please enter a quiz title and select a topic first.');
      return;
    }

    try {
      setGeneratingQuestions(true);
      setErrorMessage('');
      setSuccessMessage('');

      // First, create a temporary questionnaire to generate questions for
      const questionnaireResponse = await questionnaireService.createQuestionnaire({
        title: formData.title,
        description: formData.description || 'AI Generated Quiz',
        skillDomain: formData.domain || selectedTopic,
        timeLimit: parseInt(formData.timeLimit) || 30,
      });

      const questionnaireId = questionnaireResponse.data.id;

      // Generate AI questions
      await aiQuestionService.generateQuestions({
        questionnaireId: questionnaireId,
        topic: selectedTopic,
        difficulty: 'MEDIUM',
        numberOfQuestions: 5,
      });

      // Poll for generated drafts
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait
      
      const pollDrafts = async () => {
        try {
          const draftsResponse = await aiQuestionService.getPendingDrafts(questionnaireId);
          const drafts = draftsResponse.data || [];

          if (drafts.length > 0) {
            // Convert drafts to question format
            const newQuestions = drafts.map(draft => ({
              text: draft.questionText,
              type: draft.type,
              options: draft.options?.map(opt => opt.optionText) || (draft.type === 'TRUE_FALSE' ? ['True', 'False'] : []),
              correctAnswer: draft.correctAnswer,
              codeSnippet: '',
              codeLanguage: 'javascript',
              difficulty: 'intermediate'
            }));
            
            setQuestions([...questions, ...newQuestions]);
            setSuccessMessage(`Successfully added ${newQuestions.length} AI-generated questions!`);
            setAiDialogOpen(false);
            setSelectedTopic('');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollDrafts, 1000); // Poll every second
          } else {
            setErrorMessage('Question generation is taking longer than expected. Please check the AI Question Approval page.');
            setAiDialogOpen(false);
          }
        } catch (err) {
          setErrorMessage('Failed to fetch generated questions');
        } finally {
          setGeneratingQuestions(false);
        }
      };

      // Start polling after a short delay
      setTimeout(pollDrafts, 2000);

    } catch (err) {
      setGeneratingQuestions(false);
      setErrorMessage(err?.response?.data?.message || 'Failed to generate questions');
    }
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    console.log('Quiz Data:', { ...formData, questions });
    alert('Quiz created successfully!');
    navigate('/dashboard');
  };

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
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>Create Quiz</Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
        )}
        <Box component="main" sx={{ flexGrow: 1, p: embedded ? 0 : 3, minHeight: embedded ? 'auto' : '100vh' }}>
          {!embedded && <Toolbar />}
          <Container maxWidth="md">
            <Paper sx={{ p: 3 }}>
              <Stack spacing={3}>
                {errorMessage && (
                  <Alert severity="error" onClose={() => setErrorMessage('')}>
                    {errorMessage}
                  </Alert>
                )}
                {successMessage && (
                  <Alert severity="success" onClose={() => setSuccessMessage('')}>
                    {successMessage}
                  </Alert>
                )}
                {!user?.geminiApiKey && (
                  <Alert severity="warning">
                    Add your Google Gemini API key in your profile to use AI question generation.
                  </Alert>
                )}
                <Typography variant="h5">Quiz Information</Typography>
                
                <TextField
                  label="Quiz Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                />
                
                <TextField
                  label="Skill Domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g., Software Testing, Java Programming, UML Diagrams"
                  fullWidth
                />
                
                <TextField
                  label="Time Limit (minutes)"
                  name="timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={handleChange}
                  fullWidth
                />

                <Divider />
                
                <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', opacity: 0.9 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon />
                        <Typography variant="h6">AI Question Generator</Typography>
                      </Box>
                      <Typography variant="body2">
                        Let AI help you generate quiz questions based on a topic. Select a topic to get AI-powered suggestions.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="inherit"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={() => setAiDialogOpen(true)}
                        fullWidth
                      >
                        Generate AI Questions
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Divider />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5">Questions</Typography>
                  <Button startIcon={<AddIcon />} onClick={addQuestion} variant="outlined">
                    Add Question
                  </Button>
                </Box>

                {questions.map((q, qIndex) => (
                  <Paper key={qIndex} sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">Question {qIndex + 1}</Typography>
                        {questions.length > 1 && (
                          <IconButton size="small" onClick={() => removeQuestion(qIndex)}>
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                      
                      <TextField
                        label="Question Text"
                        value={q.text}
                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                        fullWidth
                        required
                      />
                      
                      <FormControl fullWidth>
                        <InputLabel>Question Type</InputLabel>
                        <Select
                          value={q.type}
                          label="Question Type"
                          onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                        >
                          <MenuItem value="MULTIPLE_CHOICE">Multiple Choice</MenuItem>
                          <MenuItem value="TRUE_FALSE">True/False</MenuItem>
                          <MenuItem value="SHORT_ANSWER">Short Answer</MenuItem>
                          <MenuItem value="CODE_SNIPPET">Code Snippet</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Difficulty Level</InputLabel>
                        <Select
                          value={q.difficulty || 'beginner'}
                          label="Difficulty Level"
                          onChange={(e) => handleQuestionChange(qIndex, 'difficulty', e.target.value)}
                        >
                          <MenuItem value="beginner">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: difficultyColors.beginner }} />
                              Beginner
                            </Box>
                          </MenuItem>
                          <MenuItem value="intermediate">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: difficultyColors.intermediate }} />
                              Intermediate
                            </Box>
                          </MenuItem>
                          <MenuItem value="advanced">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: difficultyColors.advanced }} />
                              Advanced
                            </Box>
                          </MenuItem>
                          <MenuItem value="expert">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: difficultyColors.expert }} />
                              Expert
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                      
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>Options</Typography>
                          {q.options.map((opt, oIndex) => (
                            <TextField
                              key={oIndex}
                              label={`Option ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              fullWidth
                              size="small"
                              sx={{ mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}

                      {q.type === 'TRUE_FALSE' && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>Correct Answer *</Typography>
                          <RadioGroup
                            value={q.correctAnswer}
                            onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                          >
                            <FormControlLabel value="True" control={<Radio />} label="True" />
                            <FormControlLabel value="False" control={<Radio />} label="False" />
                          </RadioGroup>
                        </Box>
                      )}

                      {q.type === 'CODE_SNIPPET' && (
                        <Box>
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Code Language</InputLabel>
                            <Select
                              value={q.codeLanguage || 'javascript'}
                              label="Code Language"
                              onChange={(e) => handleQuestionChange(qIndex, 'codeLanguage', e.target.value)}
                            >
                              <MenuItem value="java">Java</MenuItem>
                              <MenuItem value="python">Python</MenuItem>
                              <MenuItem value="cpp">C++</MenuItem>
                              <MenuItem value="javascript">JavaScript</MenuItem>
                              <MenuItem value="typescript">TypeScript</MenuItem>
                              <MenuItem value="csharp">C#</MenuItem>
                            </Select>
                          </FormControl>
                          
                          <Box sx={{
                            border: '2px solid black',
                            borderRadius: 1,
                            overflow: 'hidden' 
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              px: 2, 
                              py: 1,
                              borderBottom: '1px solid black'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27c93f' }} />
                                </Box>
                                <Chip label={languageLabels[q.codeLanguage || 'javascript']} size="small" />
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                              <Box sx={{
                                px: 2, 
                                py: 2,
                                borderRight: '1px solid black',
                                userSelect: 'none' 
                              }}>
                                <Typography component="pre" sx={{ 
                                  fontFamily: 'monospace', 
                                  fontSize: '0.875rem',
                                  lineHeight: 1.5, 
                                  m: 0, 
                                  textAlign: 'right' 
                                }}>
                                  {(q.codeSnippet || '').split('\n').map((_, i) => i + 1).join('\n') || '1'}
                                </Typography>
                              </Box>
                              <TextField
                                multiline
                                minRows={12}
                                fullWidth
                                value={q.codeSnippet || ''}
                                onChange={(e) => handleQuestionChange(qIndex, 'codeSnippet', e.target.value)}
                                placeholder="// Start typing your code here..."
                                sx={{
                                  '& .MuiInputBase-root': {
                                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                    fontSize: '0.875rem',
                                    p: 2,
                                    lineHeight: 1.5,
                                    alignItems: 'flex-start',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                  '& .MuiInputBase-input': {
                                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                    '&::placeholder': {
                                        opacity: 1,
                                    }
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      )}
                      
                      {q.type !== 'TRUE_FALSE' && q.type !== 'CODE_SNIPPET' && (
                        <TextField
                          label="Correct Answer"
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                          placeholder={q.type === 'MULTIPLE_CHOICE' ? 'e.g., Option 1 or A' : 'Enter correct answer'}
                          fullWidth
                          required
                        />
                      )}
                    </Stack>
                  </Paper>
                ))}

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    fullWidth
                  >
                    Create Quiz
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Container>
        </Box>
      </Box>

      {/* AI Question Generator Dialog */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">AI Question Generator</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Topic</InputLabel>
              <Select
                value={selectedTopic}
                label="Select Topic"
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <MenuItem value="Software Testing">Software Testing</MenuItem>
                <MenuItem value="Java Programming">Java Programming</MenuItem>
                <MenuItem value="UML Diagrams">UML Diagrams</MenuItem>
                <MenuItem value="Data Structures">Data Structures</MenuItem>
              </Select>
            </FormControl>

            {selectedTopic && aiSuggestedQuestions[selectedTopic] && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested Questions Preview ({aiSuggestedQuestions[selectedTopic].length} questions)
                </Typography>
                <Stack spacing={1.5} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {aiSuggestedQuestions[selectedTopic].map((q, idx) => (
                    <Card key={idx} sx={{ bgcolor: 'action.hover' }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="body2" sx={{ flex: 1 }}>{q.text}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                              <Chip 
                                label={q.type === 'MULTIPLE_CHOICE' ? 'MCQ' : q.type === 'TRUE_FALSE' ? 'T/F' : q.type === 'SHORT_ANSWER' ? 'Short' : 'Code'} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)} 
                                size="small"
                                sx={{ 
                                  bgcolor: difficultyColors[q.difficulty] + '20',
                                  color: difficultyColors[q.difficulty],
                                  borderColor: difficultyColors[q.difficulty]
                                }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="caption" color="text.secondary">
                              Answer: {q.correctAnswer}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiDialogOpen(false)} disabled={generatingQuestions}>Cancel</Button>
          <Button 
            onClick={addSuggestedQuestions} 
            disabled={!selectedTopic || generatingQuestions || !user?.geminiApiKey}
            variant="contained"
            startIcon={generatingQuestions ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {generatingQuestions ? 'Generating...' : 'Generate Questions'}
          </Button>
        </DialogActions>
      </Dialog>


    </AppTheme>
  );
};

export default CreateQuiz;
