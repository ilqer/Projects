import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Button, Card, CardContent,
  Chip, Stack, Divider, CircularProgress, Alert, IconButton,
  AppBar, Toolbar, CssBaseline
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  PowerSettingsNew as PowerIcon, Send as SendIcon
} from '@mui/icons-material';
import { questionnaireService } from '../../../services/questionnaireService';
import { quizAssignmentService } from '../../../services/api';
import AppTheme from '../../../shared-theme/AppTheme';
import ColorModeSelect from '../../../shared-theme/ColorModeSelect';

const QuestionnaireView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    loadQuestionnaire();
    loadAssignments();
  }, [id]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      const response = await questionnaireService.getQuestionnaireById(id);
      setQuestionnaire(response.data);
    } catch (err) {
      setError('Failed to load questionnaire');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const response = await quizAssignmentService.getAssignmentsByQuestionnaire(id);
      setAssignments(response.data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      if (questionnaire.isActive) {
        await questionnaireService.deactivateQuestionnaire(id);
      } else {
        await questionnaireService.activateQuestionnaire(id);
      }
      loadQuestionnaire();
    } catch (err) {
      setError('Failed to update questionnaire status');
      console.error(err);
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      MULTIPLE_CHOICE: 'Multiple Choice',
      TRUE_FALSE: 'True/False',
      SHORT_ANSWER: 'Short Answer'
    };
    return labels[type] || type;
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      PENDING: { label: 'Pending', color: 'warning' },
      ACCEPTED: { label: 'Accepted', color: 'info' },
      DECLINED: { label: 'Declined', color: 'error' },
      IN_PROGRESS: { label: 'In Progress', color: 'primary' },
      COMPLETED: { label: 'Completed', color: 'success' },
      EXPIRED: { label: 'Expired', color: 'default' }
    };
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} size="small" color={config.color} />;
  };

  if (loading) {
    return (
      <AppTheme>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </AppTheme>
    );
  }

  if (!questionnaire) {
    return (
      <AppTheme>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">Questionnaire not found</Alert>
        </Container>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <CssBaseline />
      <AppBar position="fixed" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard?tab=Questionnaires')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {questionnaire.title}
          </Typography>
          <ColorModeSelect />
        </Toolbar>
      </AppBar>
      <Box sx={{ mt: 8 }} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {questionnaire.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                label={questionnaire.type === 'COMPETENCY' ? 'Competency' : 'Background'}
                color={questionnaire.type === 'COMPETENCY' ? 'primary' : 'secondary'}
                size="small"
              />
              <Chip
                label={questionnaire.isActive ? 'Active' : 'Inactive'}
                color={questionnaire.isActive ? 'success' : 'default'}
                size="small"
              />
              <Chip label={`Version ${questionnaire.version}`} size="small" variant="outlined" />
            </Stack>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => navigate(`/researcher/questionnaires/${id}/assign`)}
              color="primary"
            >
              Assign to Participants
            </Button>
            <Button
              variant="outlined"
              startIcon={<PowerIcon />}
              onClick={handleToggleActive}
              color={questionnaire.isActive ? 'error' : 'success'}
            >
              {questionnaire.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/researcher/questionnaires/${id}/edit`)}
            >
              Edit
            </Button>
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {questionnaire.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Description
            </Typography>
            <Typography variant="body1">{questionnaire.description}</Typography>
          </Box>
        )}
        
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Questions
            </Typography>
            <Typography variant="h6">{questionnaire.questionCount}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Created
            </Typography>
            <Typography variant="body1">
              {new Date(questionnaire.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Last Updated
            </Typography>
            <Typography variant="body1">
              {new Date(questionnaire.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {questionnaire.linkedStudies && questionnaire.linkedStudies.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Linked Studies
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {questionnaire.linkedStudies.map((study) => (
              <Card key={study.studyId} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {study.studyTitle || 'Untitled Study'}
                      </Typography>
                      <Chip
                        label={study.studyStatus}
                        size="small"
                        sx={{ mt: 1 }}
                        color={
                          study.studyStatus === 'ACTIVE'
                            ? 'success'
                            : study.studyStatus === 'DRAFT'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/researcher/study/${study.studyId}?tab=quizzes`)}
                    >
                      View Study
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Assigned Participants */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Assigned Participants ({assignments.length})
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {loadingAssignments ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : assignments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No participants assigned yet. Click "Assign to Participants" to get started.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {assignments.map((assignment) => (
              <Box
                key={assignment.id}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {assignment.participantName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {assignment.participantEmail}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {getStatusChip(assignment.status)}
                      {assignment.studyTitle && (
                        <Chip
                          label={`Study: ${assignment.studyTitle}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {assignment.dueDate && (
                        <Chip
                          label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {assignment.status === 'COMPLETED' && assignment.score !== null && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`Score: ${assignment.score.toFixed(1)}%`}
                          size="small"
                          color={assignment.passed ? 'success' : 'error'}
                          variant="outlined"
                        />
                      )}
                      {assignment.status === 'COMPLETED' && assignment.passed !== null && (
                        <Chip
                          icon={assignment.passed ? <CheckCircleIcon /> : <CancelIcon />}
                          label={assignment.passed ? 'Passed' : 'Failed'}
                          size="small"
                          color={assignment.passed ? 'success' : 'error'}
                        />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="column" spacing={0.5} alignItems="flex-end" sx={{ minWidth: 150 }}>
                    <Typography variant="caption" color="text.secondary">
                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                    </Typography>
                    {assignment.acceptedAt && (
                      <Typography variant="caption" color="success.main">
                        Accepted: {new Date(assignment.acceptedAt).toLocaleDateString()}
                      </Typography>
                    )}
                    {assignment.declinedAt && (
                      <Typography variant="caption" color="error.main">
                        Declined: {new Date(assignment.declinedAt).toLocaleDateString()}
                      </Typography>
                    )}
                    {assignment.completedAt && (
                      <Typography variant="caption" color="success.main">
                        Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
                {assignment.declineReason && (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'error.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Decline Reason:
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      {assignment.declineReason}
                    </Typography>
                  </Box>
                )}
                {assignment.notes && (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Notes:
                    </Typography>
                    <Typography variant="body2">
                      {assignment.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Questions */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Questions ({questionnaire.questions?.length || 0})
      </Typography>
      
      <Stack spacing={2}>
        {questionnaire.questions?.map((question, index) => (
          <Card key={question.id} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Question {index + 1}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={getQuestionTypeLabel(question.type)} size="small" />
                  <Chip label={`${question.points} point${question.points !== 1 ? 's' : ''}`} size="small" variant="outlined" />
                </Stack>
              </Stack>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                {question.questionText}
              </Typography>
              
              {/* Options for MCQ and True/False */}
              {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') && (
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                    Options:
                  </Typography>
                  <Stack spacing={1}>
                    {question.options?.map((option, optIndex) => (
                      <Box
                        key={optIndex}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: option.isCorrect ? 'success.50' : 'grey.50',
                          border: 1,
                          borderColor: option.isCorrect ? 'success.main' : 'divider'
                        }}
                      >
                        {option.isCorrect ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="disabled" fontSize="small" />
                        )}
                        <Typography variant="body2">
                          {option.optionText}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
              
              {/* Correct Answer for Short Answer */}
              {question.type === 'SHORT_ANSWER' && question.correctAnswer && (
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                    Correct Answer:
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'success.50',
                      border: 1,
                      borderColor: 'success.main'
                    }}
                  >
                    <Typography variant="body2">{question.correctAnswer}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
    </AppTheme>
  );
};

export default QuestionnaireView;
