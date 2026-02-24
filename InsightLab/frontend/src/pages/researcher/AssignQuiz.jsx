import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Card, CardContent,
  Chip, Stack, Divider, CircularProgress, Alert,
  TextField, List, ListItem, ListItemText, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, IconButton, Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Send as SendIcon,
  Person as PersonIcon, CheckCircle as CheckCircleIcon,
  Timer as TimerIcon, Assignment as AssignmentIcon,
  EmojiEvents as TrophyIcon, Delete as DeleteIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import AppTheme from '../../shared-theme/AppTheme';
import CssBaseline from '@mui/material/CssBaseline';
import { questionnaireService } from '../../services/questionnaireService';
import { studyService } from '../../services/api';

const AssignQuiz = () => {
  const navigate = useNavigate();
  const { questionnaireId, studyId: routeStudyId, studyQuizId } = useParams();
  const isRouteStudyScoped = Boolean(routeStudyId && studyQuizId);

  const [questionnaire, setQuestionnaire] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [assignedParticipants, setAssignedParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Result dialog
  const [resultDialog, setResultDialog] = useState({ open: false, result: null });
  const [studyContext, setStudyContext] = useState(null);

  useEffect(() => {
    if (isRouteStudyScoped) {
      loadStudyScopedData();
    } else if (questionnaireId) {
      loadQuestionnaireAndStudy();
    } else {
      setError('Quiz not found');
    }
  }, [questionnaireId, isRouteStudyScoped, routeStudyId, studyQuizId]);

  const loadQuestionnaireAndStudy = async () => {
    try {
      setLoading(true);
      setError('');
      const questionnaireRes = await questionnaireService.getQuestionnaireById(questionnaireId);
      const questionnaireData = questionnaireRes.data;
      setQuestionnaire(questionnaireData);

      const linkedStudy = questionnaireData.linkedStudies?.[0];
      if (!linkedStudy) {
        setError('This quiz is not linked to any study. Attach it to a study before assigning participants.');
        setParticipants([]);
        setStudyContext(null);
        return;
      }

      await loadStudyParticipants(linkedStudy.studyId);
      setStudyContext({
        studyId: linkedStudy.studyId,
        studyTitle: linkedStudy.studyTitle,
        studyQuizId: linkedStudy.studyQuizId
      });
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudyScopedData = async () => {
    try {
      setLoading(true);
      setError('');
      const [studyRes, enrollmentsRes] = await Promise.all([
        studyService.getStudyById(routeStudyId),
        studyService.getStudyEnrollments(routeStudyId)
      ]);

      const studyData = studyRes.data;
      const quizzes = studyData?.quizzes || [];
      const attachedQuiz = quizzes.find(
        (quiz) => String(quiz.id) === String(studyQuizId)
      );

      if (!attachedQuiz) {
        setError('Quiz is not attached to this study');
        return;
      }

      const questionnaireRes = await questionnaireService.getQuestionnaireById(
        attachedQuiz.questionnaireId
      );
      setQuestionnaire(questionnaireRes.data);

      const eligibleStatuses = new Set([
        'ENROLLED',
        'IN_PROGRESS',
        'COMPLETED'
      ]);

      const enrolledParticipants = (enrollmentsRes.data || [])
        .filter((enrollment) => eligibleStatuses.has(enrollment.status))
        .map((enrollment) => ({
          id: enrollment.participantId,
          fullName: enrollment.participantName,
          email: enrollment.participantEmail,
          status: enrollment.status
        }));

      setParticipants(enrolledParticipants);
      setSelectedParticipants([]);
      setStudyContext({
        studyId: routeStudyId,
        studyTitle: studyData.title,
        studyQuizId,
      });

      // Load assigned participants
      await loadAssignedParticipants(routeStudyId, studyQuizId);
    } catch (err) {
      console.error('Error loading study quiz data:', err);
      setError(err.response?.data?.message || 'Failed to load study quiz data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedParticipants = async (studyId, studyQuizId) => {
    try {
      const response = await studyService.getStudyQuizAssignments(studyId, studyQuizId);
      const assignments = response.data || [];
      setAssignedParticipants(assignments.map(a => ({
        assignmentId: a.id,
        participantId: a.participantId,
        participantName: a.participantName,
        participantEmail: a.participantEmail,
        assignedAt: a.assignedAt,
        status: a.status
      })));
    } catch (err) {
      console.error('Error loading assigned participants:', err);
      // Don't set error, just log it
    }
  };

  const loadStudyParticipants = async (studyId) => {
    const enrollmentsRes = await studyService.getStudyEnrollments(studyId);
    const eligibleStatuses = new Set([
      'ENROLLED',
      'IN_PROGRESS',
      'COMPLETED'
    ]);
    const enrolledParticipants = (enrollmentsRes.data || [])
      .filter((enrollment) => eligibleStatuses.has(enrollment.status))
      .map((enrollment) => ({
        id: enrollment.participantId,
        fullName: enrollment.participantName,
        email: enrollment.participantEmail,
        status: enrollment.status
      }));
    setParticipants(enrolledParticipants);
    setSelectedParticipants([]);
  };

  const handleParticipantToggle = (participantId) => {
    setSelectedParticipants(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        return [...prev, participantId];
      }
    });
  };

  const handleSelectAll = () => {
    const availableParticipants = participants.filter(
      p => !assignedParticipants.find(ap => ap.participantId === p.id)
    );
    
    if (selectedParticipants.length === availableParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(availableParticipants.map(p => p.id));
    }
  };

  const handleSubmit = async () => {
    if (!studyContext) {
      setError('This quiz must be linked to a study before assigning participants.');
      return;
    }

    if (selectedParticipants.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        participantIds: selectedParticipants,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        maxAttempts: 1,
        allowRetake: false,
        notes: notes.trim() || null
      };

      const response = await studyService.assignStudyQuiz(
        studyContext.studyId,
        studyContext.studyQuizId,
        payload
      );

      setResultDialog({ open: true, result: response.data });

      setSelectedParticipants([]);
      setDueDate('');
      setNotes('');
      
      // Reload assigned participants
      if (studyContext) {
        await loadAssignedParticipants(studyContext.studyId, studyContext.studyQuizId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign quiz');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (assignmentId, participantName) => {
    if (!window.confirm(`Are you sure you want to unassign ${participantName} from this quiz?`)) {
      return;
    }

    setUnassigning(true);
    try {
      await studyService.deleteQuizAssignment(assignmentId);
      
      // Reload assigned participants
      if (studyContext) {
        await loadAssignedParticipants(studyContext.studyId, studyContext.studyQuizId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign participant');
      console.error(err);
    } finally {
      setUnassigning(false);
    }
  };

  const handleCloseSnackbar = () => {
    // Removed snackbar functionality
  };

  const navigateBack = () => {
    if (studyContext) {
      navigate(`/researcher/study/${studyContext.studyId}?tab=quizzes`);
    } else if (questionnaire?.id || questionnaireId) {
      navigate(`/researcher/questionnaires/${questionnaire?.id || questionnaireId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleCloseResultDialog = () => {
    setResultDialog({ open: false, result: null });
  };

  if (loading) {
    return (
      <AppTheme>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  if (!questionnaire) {
    return (
      <AppTheme>
        <CssBaseline />
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
          <Alert severity="error">Questionnaire not found</Alert>
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <IconButton onClick={navigateBack} sx={{ mb: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Assign Quiz to Participants
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select participants and configure assignment settings for "{questionnaire.title}"
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          {studyContext && (
            <Alert severity="info" icon={<AssignmentIcon />} sx={{ mb: 3 }}>
              Assigning quiz within study: <strong>{studyContext.studyTitle}</strong>
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Left Column - Questionnaire Details & Settings */}
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                {/* Questionnaire Info Card */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <AssignmentIcon color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        Questionnaire Details
                      </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Title
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {questionnaire.title}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Type
                        </Typography>
                        <Chip
                          label={questionnaire.type === 'COMPETENCY' ? 'Competency' : 'Background'}
                          size="small"
                          color={questionnaire.type === 'COMPETENCY' ? 'primary' : 'secondary'}
                          sx={{ fontWeight: 500 }}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Questions
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <AssignmentIcon fontSize="small" color="action" />
                            <Typography variant="body1" fontWeight={500}>
                              {questionnaire.questionCount}
                            </Typography>
                          </Stack>
                        </Grid>

                        {questionnaire.timeLimitMinutes && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Time Limit
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <TimerIcon fontSize="small" color="action" />
                              <Typography variant="body1" fontWeight={500}>
                                {questionnaire.timeLimitMinutes} min
                              </Typography>
                            </Stack>
                          </Grid>
                        )}

                        {questionnaire.totalPoints && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Total Points
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <TrophyIcon fontSize="small" color="action" />
                              <Typography variant="body1" fontWeight={500}>
                                {questionnaire.totalPoints}
                              </Typography>
                            </Stack>
                          </Grid>
                        )}

                        {questionnaire.passingThreshold && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Passing Score
                            </Typography>
                            <Typography variant="body1" fontWeight={500} color="success.main">
                              {questionnaire.passingThreshold}%
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Assignment Settings Card */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Assignment Settings
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Stack spacing={3}>
                      <TextField
                        label="Study"
                        value={studyContext?.studyTitle || 'Not linked to a study'}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        helperText="Quizzes can only be assigned within their study"
                        error={!studyContext}
                        size="small"
                      />

                      <TextField
                        type="datetime-local"
                        label="Due Date (Optional)"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: new Date().toISOString().slice(0, 16) }}
                        helperText="Set a deadline for completing the quiz"
                      />

                      <TextField
                        label="Notes for Participants (Optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        size="small"
                        helperText="Additional instructions or information"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column - Participant Selection */}
            <Grid item xs={12} md={5}>
              <Stack spacing={3}>
                {/* Already Assigned Participants */}
                {assignedParticipants.length > 0 && (
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <CheckCircleIcon color="success" />
                        <Typography variant="h6" fontWeight={600}>
                          Already Assigned
                        </Typography>
                        <Chip 
                          label={assignedParticipants.length} 
                          color="success" 
                          size="small"
                        />
                      </Stack>
                      <Divider sx={{ mb: 2 }} />

                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          maxHeight: 300, 
                          overflow: 'auto',
                          '&::-webkit-scrollbar': { width: 8 },
                          '&::-webkit-scrollbar-thumb': { 
                            backgroundColor: 'divider', 
                            borderRadius: 4 
                          }
                        }}
                      >
                        <List disablePadding>
                          {assignedParticipants.map((participant, index) => (
                            <React.Fragment key={participant.assignmentId}>
                              <ListItem
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  bgcolor: 'success.lighter',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  }
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={1} flex={1}>
                                  <CheckCircleIcon fontSize="small" color="success" />
                                  <ListItemText
                                    primary={participant.participantName}
                                    secondary={participant.participantEmail}
                                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                  />
                                </Stack>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUnassign(participant.assignmentId, participant.participantName)}
                                  disabled={unassigning}
                                  color="error"
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </ListItem>
                              {index < assignedParticipants.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      </Paper>
                    </CardContent>
                  </Card>
                )}

                {/* Available Participants to Assign */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                          Available to Assign
                        </Typography>
                      </Stack>
                      <Chip 
                        label={`${selectedParticipants.length} selected`} 
                        color="primary" 
                        size="small"
                      />
                    </Stack>
                    <Divider sx={{ mb: 2 }} />

                    {participants.filter(p => !assignedParticipants.find(ap => ap.participantId === p.id)).length === 0 ? (
                      <Alert severity="info" icon={<PersonOffIcon />}>
                        All participants are already assigned
                      </Alert>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleSelectAll}
                          fullWidth
                          sx={{ mb: 2 }}
                        >
                          {selectedParticipants.length === participants.filter(p => !assignedParticipants.find(ap => ap.participantId === p.id)).length 
                            ? 'Deselect All' 
                            : 'Select All'}
                        </Button>
                        
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            maxHeight: 400, 
                            overflow: 'auto',
                            '&::-webkit-scrollbar': { width: 8 },
                            '&::-webkit-scrollbar-thumb': { 
                              backgroundColor: 'divider', 
                              borderRadius: 4 
                            }
                          }}
                        >
                          <List disablePadding>
                            {participants
                              .filter(participant => !assignedParticipants.find(ap => ap.participantId === participant.id))
                              .map((participant, index, filteredArray) => (
                                <React.Fragment key={participant.id}>
                                  <ListItem
                                    button
                                    onClick={() => handleParticipantToggle(participant.id)}
                                    selected={selectedParticipants.includes(participant.id)}
                                    sx={{
                                      '&.Mui-selected': {
                                        bgcolor: 'action.selected',
                                      },
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                      }
                                    }}
                                  >
                                    <ListItemIcon>
                                      <Checkbox
                                        edge="start"
                                        checked={selectedParticipants.includes(participant.id)}
                                        tabIndex={-1}
                                        disableRipple
                                      />
                                    </ListItemIcon>
                                    <ListItemIcon>
                                      <PersonIcon color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={participant.fullName}
                                      secondary={participant.email}
                                      primaryTypographyProps={{ fontWeight: 500 }}
                                    />
                                  </ListItem>
                                  {index < filteredArray.length - 1 && <Divider />}
                                </React.Fragment>
                              ))}
                          </List>
                        </Paper>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'sticky', 
              bottom: 0, 
              mt: 4, 
              p: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={navigateBack}
                disabled={submitting}
                size="large"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={submitting || !studyContext || selectedParticipants.length === 0}
                size="large"
                sx={{
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: (theme) => 
                      theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.5)' 
                        : 'rgba(0, 0, 0, 0.6)',
                    opacity: 1,
                    '& .MuiButton-startIcon': {
                      opacity: 0.8,
                    }
                  }
                }}
              >
                {submitting ? 'Assigning...' : `Assign to ${selectedParticipants.length} Participant${selectedParticipants.length !== 1 ? 's' : ''}`}
              </Button>
            </Stack>
          </Paper>

          {/* Result Dialog */}
          <Dialog
            open={resultDialog.open}
            onClose={handleCloseResultDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" fontWeight={600}>
                  Quiz Assignment Complete
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              {resultDialog.result && (
                <Stack spacing={2}>
                  <Alert severity="success">
                    {resultDialog.result.message}
                  </Alert>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Total Participants
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {resultDialog.result.totalAssigned}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Successfully Assigned
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="success.main">
                          {resultDialog.result.successCount}
                        </Typography>
                      </Grid>
                      {resultDialog.result.failureCount > 0 && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Failed
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="error.main">
                            {resultDialog.result.failureCount}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Stack>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseResultDialog} variant="contained" fullWidth>
                Done
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default AssignQuiz;
