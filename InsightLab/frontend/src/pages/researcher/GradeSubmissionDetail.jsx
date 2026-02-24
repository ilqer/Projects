import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  ExpandMore,
  Save,
  Send,
  History,
  Person,
  Quiz,
  AccessTime,
} from '@mui/icons-material';
import { gradingService } from '../../services/api';
import AppNavbar from '../components/AppNavbar';

const GradeSubmissionDetail = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [finalComments, setFinalComments] = useState('');
  const [gradingHistory, setGradingHistory] = useState([]);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [submissionResponse, historyResponse] = await Promise.all([
        gradingService.getSubmissionDetails(submissionId),
        gradingService.getGradingHistory(submissionId),
      ]);

      setSubmission(submissionResponse.data);
      setGradingHistory(historyResponse.data);

      // Initialize grades from existing data
      const initialGrades = {};
      const initialFeedbacks = {};
      submissionResponse.data.answers?.forEach((answer) => {
        initialGrades[answer.id] = answer.pointsEarned || 0;
        initialFeedbacks[answer.id] = answer.feedbackList?.[0]?.feedbackText || '';
      });
      setGrades(initialGrades);
      setFeedbacks(initialFeedbacks);
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError(err.response?.data?.message || 'Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (answerId, points) => {
    setGrades((prev) => ({ ...prev, [answerId]: parseFloat(points) || 0 }));
  };

  const handleFeedbackChange = (answerId, feedback) => {
    setFeedbacks((prev) => ({ ...prev, [answerId]: feedback }));
  };

  const handleSaveGrade = async (answer) => {
    try {
      setSaving(true);
      await gradingService.manuallyGradeAnswer({
        questionAnswerId: answer.id,
        pointsEarned: grades[answer.id],
        feedbackText: feedbacks[answer.id],
      });

      // Refresh submission
      await fetchSubmissionDetails();
      alert('Grade saved successfully!');
    } catch (err) {
      console.error('Error saving grade:', err);
      alert(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkGrade = async () => {
    try {
      setSaving(true);

      // Only include answers that require manual grading
      const gradesToSubmit = submission.answers
        .filter((answer) => answer.requiresManualGrading)
        .map((answer) => ({
          questionAnswerId: answer.id,
          pointsEarned: grades[answer.id],
          feedbackText: feedbacks[answer.id],
        }));

      if (gradesToSubmit.length === 0) {
        alert('No answers require manual grading');
        return;
      }

      await gradingService.bulkGradeSubmission({
        submissionId: parseInt(submissionId),
        grades: gradesToSubmit,
      });

      await fetchSubmissionDetails();
      alert('All grades saved successfully!');
    } catch (err) {
      console.error('Error bulk grading:', err);
      alert(err.response?.data?.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setSaving(true);
      await gradingService.finalizeGrading(submissionId, {
        finalComments: finalComments,
        returnToParticipant: true,
      });

      alert('Grading finalized and returned to participant!');
      navigate('/researcher/grading');
    } catch (err) {
      console.error('Error finalizing:', err);
      alert(err.response?.data?.message || 'Failed to finalize grading');
    } finally {
      setSaving(false);
      setShowFinalizeDialog(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getQuestionTypeColor = (type) => {
    const colors = {
      MULTIPLE_CHOICE: 'primary',
      TRUE_FALSE: 'secondary',
      SHORT_ANSWER: 'warning',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <AppTheme>
        <AppNavbar user={user} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  if (error) {
    return (
      <AppTheme>
        <AppNavbar user={user} />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Container>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <AppNavbar user={user} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <IconButton onClick={() => navigate('/researcher/grading')}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              Grade Submission
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {submission.questionnaireTitle}
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<History />} onClick={() => setGradingHistory([...gradingHistory])}>
            View History
          </Button>
        </Stack>

        {/* Submission Info Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Person fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Participant
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600}>
                  {submission.participantName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {submission.participantEmail}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <AccessTime fontSize="small" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Submitted
                  </Typography>
                </Stack>
                <Typography variant="body1">{formatDate(submission.submittedAt)}</Typography>
                {submission.timeTakenMinutes && (
                  <Typography variant="caption" color="text.secondary">
                    Time taken: {submission.timeTakenMinutes} minutes
                  </Typography>
                )}
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Current Score
                </Typography>
                {submission.finalScore !== null ? (
                  <>
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {submission.finalScore.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {submission.totalPointsEarned} / {submission.totalPointsPossible} points
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Not graded yet
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleBulkGrade}
            disabled={saving}
          >
            Save All Grades
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Send />}
            onClick={() => setShowFinalizeDialog(true)}
            disabled={saving || submission.requiresManualGrading}
          >
            Finalize & Return
          </Button>
          {submission.requiresManualGrading && (
            <Alert severity="info" sx={{ flex: 1 }}>
              Complete manual grading before finalizing
            </Alert>
          )}
        </Stack>

        {/* Questions and Answers */}
        <Typography variant="h6" fontWeight={600} mb={2}>
          Questions & Answers
        </Typography>

        {submission.answers?.map((answer, index) => (
          <Accordion key={answer.id} defaultExpanded={answer.requiresManualGrading}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Question {index + 1}
                </Typography>
                <Chip label={answer.questionType} size="small" color={getQuestionTypeColor(answer.questionType)} />
                <Box sx={{ flexGrow: 1 }} />
                {answer.requiresManualGrading ? (
                  <Chip label="Requires Manual Grading" color="warning" size="small" />
                ) : (
                  <Chip
                    label={answer.isCorrect ? 'Correct' : 'Incorrect'}
                    color={answer.isCorrect ? 'success' : 'error'}
                    size="small"
                    icon={answer.isCorrect ? <CheckCircle /> : undefined}
                  />
                )}
                <Typography variant="body2" fontWeight={600}>
                  {answer.pointsEarned} / {answer.pointsPossible} pts
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {/* Question Text */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Question
                  </Typography>
                  <Typography variant="body1">{answer.questionText}</Typography>
                </Paper>

                {/* Participant's Answer */}
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Participant's Answer
                  </Typography>
                  {answer.questionType === 'MULTIPLE_CHOICE' && answer.options && (
                    <Box>
                      {answer.options.map((option) => (
                        <Box
                          key={option.id}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            border: 1,
                            borderRadius: 1,
                            borderColor: answer.selectedOptionIds?.includes(option.id)
                              ? option.isCorrect
                                ? 'success.main'
                                : 'error.main'
                              : option.isCorrect
                              ? 'success.light'
                              : 'divider',
                            bgcolor: answer.selectedOptionIds?.includes(option.id)
                              ? option.isCorrect
                                ? 'success.50'
                                : 'error.50'
                              : option.isCorrect
                              ? 'success.50'
                              : 'transparent',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            {answer.selectedOptionIds?.includes(option.id) && (
                              <Chip
                                label="Selected"
                                size="small"
                                color={option.isCorrect ? 'success' : 'error'}
                              />
                            )}
                            {option.isCorrect && (
                              <Chip label="Correct" size="small" color="success" variant="outlined" />
                            )}
                            <Typography>{option.optionText}</Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {answer.questionType === 'TRUE_FALSE' && (
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {answer.answerText}
                      </Typography>
                      {answer.correctAnswer && (
                        <Typography variant="caption" color="text.secondary">
                          Correct answer: {answer.correctAnswer}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {answer.questionType === 'SHORT_ANSWER' && (
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }} variant="outlined">
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {answer.answerText || <em>No answer provided</em>}
                      </Typography>
                    </Paper>
                  )}
                </Paper>

                {/* Grading Section */}
                {answer.requiresManualGrading && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Manual Grading
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Points Earned"
                        type="number"
                        size="small"
                        value={grades[answer.id] || 0}
                        onChange={(e) => handleGradeChange(answer.id, e.target.value)}
                        InputProps={{
                          inputProps: { min: 0, max: answer.pointsPossible, step: 0.5 },
                        }}
                        helperText={`Maximum: ${answer.pointsPossible} points`}
                        sx={{ maxWidth: 200 }}
                      />
                      <TextField
                        label="Feedback"
                        multiline
                        rows={3}
                        fullWidth
                        value={feedbacks[answer.id] || ''}
                        onChange={(e) => handleFeedbackChange(answer.id, e.target.value)}
                        placeholder="Provide feedback to the participant..."
                      />
                      <Button
                        variant="outlined"
                        startIcon={<Save />}
                        onClick={() => handleSaveGrade(answer)}
                        disabled={saving}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        Save Grade
                      </Button>
                    </Stack>
                  </Paper>
                )}

                {/* Existing Feedback */}
                {answer.feedbackList && answer.feedbackList.length > 0 && (
                  <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Previous Feedback
                    </Typography>
                    {answer.feedbackList.map((feedback) => (
                      <Box key={feedback.id} sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {feedback.graderName} - {formatDate(feedback.createdAt)}
                        </Typography>
                        <Typography variant="body2">{feedback.feedbackText}</Typography>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Finalize Dialog */}
        <Dialog open={showFinalizeDialog} onClose={() => setShowFinalizeDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Finalize Grading</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to finalize grading and return results to the participant?
            </Typography>
            <TextField
              label="Final Comments (Optional)"
              multiline
              rows={4}
              fullWidth
              value={finalComments}
              onChange={(e) => setFinalComments(e.target.value)}
              placeholder="Add any final comments for the participant..."
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowFinalizeDialog(false)}>Cancel</Button>
            <Button onClick={handleFinalize} variant="contained" color="success" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Finalize & Send'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppTheme>
  );
};

export default GradeSubmissionDetail;
