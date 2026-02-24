import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Card, CardContent, Stack, Chip,
  Divider, CircularProgress, Alert, IconButton, LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { quizAssignmentService } from '../../services/api';

const QuizResult = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuizResult();
  }, [assignmentId]);

  const loadQuizResult = async () => {
    try {
      setLoading(true);
      const response = await quizAssignmentService.getAssignmentById(assignmentId);
      setAssignment(response.data);
    } catch (err) {
      console.error('Error loading quiz result:', err);
      setError('Failed to load quiz result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !assignment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Quiz result not found'}</Alert>
      </Container>
    );
  }

  const showCorrectAnswers = assignment.questionnaire?.showCorrectAnswers !== false;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/dashboard?tab=2')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Quiz Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {assignment.questionnaireTitle}
          </Typography>
        </Box>
      </Box>

      {/* Score Summary */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h3" fontWeight={700} color={assignment.passed ? 'success.main' : 'error.main'}>
              {assignment.score?.toFixed(1)}%
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your Score
            </Typography>
          </Box>
          <Chip
            icon={assignment.passed ? <CheckCircleIcon /> : <CancelIcon />}
            label={assignment.passed ? 'Passed' : 'Failed'}
            color={assignment.passed ? 'success' : 'error'}
            size="large"
            sx={{ fontWeight: 600, fontSize: '1rem', px: 2, py: 3 }}
          />
        </Stack>
        
        <Divider sx={{ my: 2 }} />
        
        <Stack direction="row" spacing={4} flexWrap="wrap">
          <Box>
            <Typography variant="body2" color="text.secondary">Completed</Typography>
            <Typography variant="body1" fontWeight={600}>
              {assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'N/A'}
            </Typography>
          </Box>
          {assignment.timeTakenMinutes && (
            <Box>
              <Typography variant="body2" color="text.secondary">Time Taken</Typography>
              <Typography variant="body1" fontWeight={600}>
                {assignment.timeTakenMinutes} minutes
              </Typography>
            </Box>
          )}

        </Stack>
      </Paper>



    </Container>
  );
};

export default QuizResult;
