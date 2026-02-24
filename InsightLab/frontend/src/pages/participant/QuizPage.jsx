import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Box,
  Typography,
  Container,
  Paper,
  Button,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Timer,
  Quiz as QuizIcon,
  NavigateNext,
  NavigateBefore,
  Send,
  Save,
} from '@mui/icons-material';
import { quizSubmissionService } from '../../services/api';

const QuizPage = () => {
  const { quizId } = useParams(); // This is the assignment ID
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState('idle');
  const [autosaveError, setAutosaveError] = useState(null);
  const [saveAndExitLoading, setSaveAndExitLoading] = useState(false);
  const [saveProgressLoading, setSaveProgressLoading] = useState(false);

  const pendingSaveIdsRef = useRef(new Set());
  const answersRef = useRef({});
  const questionMapRef = useRef({});
  const isFlushingRef = useRef(false);

  // Initialize quiz
  useEffect(() => {
    let isMounted = true;

    const startQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        // Start quiz attempt
        const submissionResponse = await quizSubmissionService.startQuizAttempt(quizId);

        if (!isMounted) return; // Prevent state updates if component unmounted

        setSubmission(submissionResponse.data);

        // Get quiz questions
        const quizResponse = await quizSubmissionService.getQuizForTaking(submissionResponse.data.id);

        if (!isMounted) return; // Prevent state updates if component unmounted

        const restoredAnswers = {};
        (quizResponse.data.answers || []).forEach((savedAnswer) => {
          if (savedAnswer.selectedOptionIds && savedAnswer.selectedOptionIds.length > 0) {
            restoredAnswers[savedAnswer.questionId] = savedAnswer.selectedOptionIds[0];
          } else if (savedAnswer.answerText !== undefined && savedAnswer.answerText !== null) {
            restoredAnswers[savedAnswer.questionId] = savedAnswer.answerText;
          }
        });
        setAnswers(restoredAnswers);
        answersRef.current = restoredAnswers;
        pendingSaveIdsRef.current.clear();
        setAutosaveStatus('idle');
        setAutosaveError(null);
        setLastSavedTime(null);
        if ((quizResponse.data.answers || []).length > 0) {
          setLastSavedTime(new Date());
        }
        setQuiz(quizResponse.data);

        // Initialize timer if time limit exists
        if (quizResponse.data.timeLimitMinutes) {
          const startTime = new Date(submissionResponse.data.startedAt || new Date());
          const endTime = new Date(startTime.getTime() + quizResponse.data.timeLimitMinutes * 60000);
          const remaining = Math.max(0, Math.floor((endTime - new Date()) / 1000));
          setTimeRemaining(remaining);
        }
      } catch (err) {
        console.error('Error starting quiz:', err);
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load quiz. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    startQuiz();

    return () => {
      isMounted = false; // Cleanup: mark as unmounted
    };
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (quiz?.questions) {
      const lookup = {};
      quiz.questions.forEach((question) => {
        lookup[question.id] = question;
      });
      questionMapRef.current = lookup;
    }
  }, [quiz]);

  useEffect(() => {
    pendingSaveIdsRef.current.clear();
  }, [submission?.id]);

  const flushPendingAnswers = useCallback(async () => {
    if (!submission) {
      return true;
    }

    if (isFlushingRef.current) {
      await isFlushingRef.current;
      return pendingSaveIdsRef.current.size === 0;
    }

    const pendingIds = Array.from(pendingSaveIdsRef.current);
    if (pendingIds.length === 0) {
      setAutosaveStatus('idle');
      return true;
    }

    setAutosaveStatus('saving');
    setAutosaveError(null);

    const questionLookup = questionMapRef.current || {};

    const flushPromise = (async () => {
      try {
        await Promise.all(
          pendingIds.map((questionId) => {
            const question = questionLookup[questionId];
            if (!question) return Promise.resolve();

            const value = answersRef.current[questionId];
            if (value === undefined) return Promise.resolve();

            const payload = {
              submissionId: submission.id,
              questionId,
            };

            if (question.type === 'MULTIPLE_CHOICE') {
              if (value === '' || value === null || value === undefined) {
                return Promise.resolve();
              }
              payload.selectedOptionIds = Array.isArray(value) ? value : [value];
            } else {
              payload.answerText = value ?? '';
            }

            return quizSubmissionService.submitAnswer(payload);
          })
        );

        pendingIds.forEach((id) => pendingSaveIdsRef.current.delete(id));
        setLastSavedTime(new Date());
        setAutosaveStatus('idle');
        return true;
      } catch (err) {
        console.error('Auto-save failed', err);
        setAutosaveError(err?.response?.data?.message || 'Auto-save failed. Will retry shortly.');
        setAutosaveStatus('error');
        return false;
      }
    })();

    isFlushingRef.current = flushPromise;
    const result = await flushPromise;
    isFlushingRef.current = null;
    return result;
  }, [submission]);

  useEffect(() => {
    if (!submission || submitted) {
      return undefined;
    }

    const interval = setInterval(() => {
      flushPendingAnswers();
    }, 10000);

    return () => {
      clearInterval(interval);
      flushPendingAnswers();
    };
  }, [submission, submitted, flushPendingAnswers]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingAnswers();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flushPendingAnswers]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    pendingSaveIdsRef.current.add(questionId);
    setAutosaveStatus('dirty');
    setAutosaveError(null);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAutoSubmit = () => {
    setShowSubmitDialog(false);
    handleSubmitQuiz();
  };

  const handleManualSave = async () => {
    setSaveProgressLoading(true);
    const saved = await flushPendingAnswers();
    setSaveProgressLoading(false);

    if (!saved) {
      setError('Failed to save your progress. Please check your connection and try again.');
    }
  };

  const handleSaveAndExit = async () => {
    if (!submission) {
      navigate('/dashboard');
      return;
    }

    setSaveAndExitLoading(true);
    const saved = await flushPendingAnswers();
    setSaveAndExitLoading(false);

    if (!saved) {
      setError('Failed to save your latest answers. Please check your connection and try again.');
      return;
    }

    navigate('/dashboard');
  };

  const handleSubmitQuiz = async () => {
    if (!submission) return;

    try {
      const saved = await flushPendingAnswers();
      if (!saved) {
        setError('Some answers could not be saved. Please check your connection and try again.');
        return;
      }

      setSubmitting(true);
      const response = await quizSubmissionService.submitQuiz(submission.id);
      setSubmitted(true);
      setResult(response.data);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const renderQuestionInput = (question) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
            <RadioGroup
              value={answer ?? ''}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value, 10))}
            >
              {question.options.map((option) => (
                <Paper
                  key={option.id}
                  elevation={answer === option.id ? 2 : 0}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: answer === option.id ? 'primary.main' : 'divider',
                    bgcolor: answer === option.id ? 'action.selected' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.light',
                    },
                  }}
                  onClick={() => handleAnswerChange(question.id, option.id)}
                >
                  <FormControlLabel
                    value={option.id}
                    control={<Radio />}
                    label={option.optionText}
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'TRUE_FALSE':
        return (
          <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
            <RadioGroup
              value={answer ?? ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              {['true', 'false'].map((value) => (
                <Paper
                  key={value}
                  elevation={answer === value ? 2 : 0}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: answer === value ? 'primary.main' : 'divider',
                    bgcolor: answer === value ? 'action.selected' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.light',
                    },
                  }}
                  onClick={() => handleAnswerChange(question.id, value)}
                >
                  <FormControlLabel
                    value={value}
                    control={<Radio />}
                    label={value === 'true' ? 'True' : 'False'}
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'SHORT_ANSWER':
        return (
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            placeholder="Type your answer here..."
            value={answer ?? ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            sx={{ mt: 2 }}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  if (error) {
    return (
      <AppTheme>
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
            >
              Try Again
            </Button>
          </Stack>
        </Container>
      </AppTheme>
    );
  }

  if (submitted && result) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Quiz Completed
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Container maxWidth="md">
              <Card elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h4" gutterBottom>
                      Quiz Submitted Successfully!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {quiz.questionnaireTitle}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {result.requiresManualGrading ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Your quiz requires manual grading
                      </Typography>
                      <Typography variant="body2">
                        Your submission includes questions that need to be reviewed by the researcher. You'll receive a
                        notification once grading is complete.
                      </Typography>
                    </Alert>
                  ) : (
                    <Box>
                      <Typography variant="h5" gutterBottom align="center">
                        Your Score
                      </Typography>
                      <Box sx={{ textAlign: 'center', my: 3 }}>
                        <Typography variant="h2" color="primary" fontWeight="bold">
                          {result.finalScore?.toFixed(1)}%
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {result.totalPointsEarned} / {result.totalPointsPossible} points
                        </Typography>
                      </Box>

                      {quiz.passingThreshold && (
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          {result.passed ? (
                            <Chip label="PASSED" color="success" size="large" icon={<CheckCircle />} />
                          ) : (
                            <Chip label="NOT PASSED" color="error" size="large" />
                          )}
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Passing threshold: {quiz.passingThreshold}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                    <Button variant="contained" onClick={() => navigate('/dashboard')}>
                      Back to Dashboard
                    </Button>
                    {!result.requiresManualGrading && (
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/participant/quiz-result/${quizId}`)}
                      >
                        View Details
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
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
            <QuizIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              {quiz?.questionnaireTitle || 'Quiz'}
            </Typography>
            {timeRemaining !== null && (
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={timeRemaining < 300 ? 'error' : 'default'}
                sx={{ mr: 2 }}
              />
            )}
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="lg">
            {/* Progress Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Question {currentQuestionIndex + 1} of {quiz?.questions.length}
                </Typography>
                <Typography variant="body2" fontWeight="600">
                  {getAnsweredCount()} / {quiz?.questions.length} answered
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={((currentQuestionIndex + 1) / quiz?.questions.length) * 100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Paper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography
                variant="caption"
                color={autosaveStatus === 'error' ? 'error.main' : 'text.secondary'}
              >
                {autosaveStatus === 'saving' && 'Saving changes...'}
                {autosaveStatus === 'dirty' && 'Changes not saved yet'}
                {autosaveStatus === 'error' && (autosaveError || 'Auto-save failed. Retrying...')}
                {autosaveStatus === 'idle' && lastSavedTime && `Saved at ${lastSavedTime.toLocaleTimeString()}`}
                {autosaveStatus === 'idle' && !lastSavedTime && 'All changes saved'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Autosaves every 10 seconds
              </Typography>
            </Box>

            {/* Question Card */}
            <Paper sx={{ p: 4, mb: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip label={currentQuestion?.type.replace('_', ' ')} size="small" />
                  <Chip label={`${currentQuestion?.points} point${currentQuestion?.points !== 1 ? 's' : ''}`} size="small" color="primary" variant="outlined" />
                </Stack>
                <Typography variant="h5" gutterBottom>
                  {currentQuestion?.questionText}
                </Typography>
              </Box>

              {renderQuestionInput(currentQuestion)}
            </Paper>

            {/* Navigation Buttons */}
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={saveProgressLoading ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleManualSave}
                  disabled={saveProgressLoading}
                >
                  {saveProgressLoading ? 'Saving...' : 'Save Progress'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={saveAndExitLoading ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSaveAndExit}
                  disabled={saveAndExitLoading}
                >
                  {saveAndExitLoading ? 'Saving...' : 'Save & Exit'}
                </Button>
                {currentQuestionIndex === quiz?.questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Send />}
                    onClick={() => setShowSubmitDialog(true)}
                    size="large"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button variant="contained" endIcon={<NavigateNext />} onClick={handleNextQuestion}>
                    Next
                  </Button>
                )}
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Quiz?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You have answered {getAnsweredCount()} out of {quiz?.questions.length} questions.
          </Typography>
          {getAnsweredCount() < quiz?.questions.length && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have unanswered questions. Are you sure you want to submit?
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitQuiz} variant="contained" color="success" disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
};

export default QuizPage;
