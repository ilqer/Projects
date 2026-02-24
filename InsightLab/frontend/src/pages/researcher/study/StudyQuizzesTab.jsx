import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import { studyService, quizAssignmentService } from '../../../services/api';
import { questionnaireService } from '../../../services/questionnaireService';

const StudyQuizzesTab = () => {
  const { study, studyId } = useOutletContext();
  const navigate = useNavigate();

  const [studyQuizzes, setStudyQuizzes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [quizResultsLoading, setQuizResultsLoading] = useState(false);
  const [quizResultsError, setQuizResultsError] = useState('');
  const [quizResultsRefreshing, setQuizResultsRefreshing] = useState(false);

  // Attach dialog state
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState('');
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState('');

  // Remove quiz state
  const [quizToRemove, setQuizToRemove] = useState(null);
  const [removingQuiz, setRemovingQuiz] = useState(false);

  useEffect(() => {
    fetchStudyQuizzes();
    fetchQuizResults();
  }, [studyId]);

  const fetchStudyQuizzes = async () => {
    try {
      setQuizLoading(true);
      setQuizError('');
      const response = await studyService.getStudyQuizzes(studyId);
      setStudyQuizzes(response.data || []);
    } catch (err) {
      console.error('Error loading study quizzes:', err);
      setQuizError('Failed to load study quizzes');
    } finally {
      setQuizLoading(false);
    }
  };

  const fetchQuizResults = async (silent = false) => {
    try {
      if (!silent) setQuizResultsLoading(true);
      else setQuizResultsRefreshing(true);
      setQuizResultsError('');
      const response = await quizAssignmentService.getAssignmentsByStudy(studyId);
      setQuizResults(response.data || []);
    } catch (err) {
      console.error('Failed to load quiz results:', err);
      setQuizResultsError('Failed to load quiz results');
    } finally {
      setQuizResultsLoading(false);
      setQuizResultsRefreshing(false);
    }
  };

  const openAttachDialog = async () => {
    setAttachDialogOpen(true);
    setAttachError('');
    try {
      setAttachLoading(true);
      const response = await questionnaireService.getMyQuestionnaires();
      setAvailableQuestionnaires(response.data || []);
    } catch (err) {
      console.error('Error loading questionnaires:', err);
      setAttachError('Failed to load questionnaires');
    } finally {
      setAttachLoading(false);
    }
  };

  const handleAttachDialogClose = () => {
    setAttachDialogOpen(false);
    setSelectedQuestionnaireId('');
    setAttachError('');
  };

  const handleAttachQuestionnaire = async () => {
    if (!selectedQuestionnaireId) return;
    try {
      setAttachLoading(true);
      await studyService.attachQuizToStudy(studyId, { questionnaireId: selectedQuestionnaireId });
      await fetchStudyQuizzes();
      handleAttachDialogClose();
    } catch (err) {
      console.error('Error attaching questionnaire:', err);
      setAttachError(err.response?.data?.message || 'Failed to attach questionnaire');
    } finally {
      setAttachLoading(false);
    }
  };

  const confirmRemoveQuiz = (quiz) => setQuizToRemove(quiz);
  const handleRemoveQuizCancel = () => setQuizToRemove(null);

  const handleRemoveQuizConfirm = async () => {
    if (!quizToRemove) return;
    try {
      setRemovingQuiz(true);
      // Use the study quiz ID (quizToRemove.id), not the questionnaire ID
      await studyService.removeStudyQuiz(studyId, quizToRemove.id);
      await fetchStudyQuizzes();
      setQuizToRemove(null);
    } catch (err) {
      console.error('Error removing quiz:', err);
      alert(err.response?.data?.message || 'Failed to remove quiz');
    } finally {
      setRemovingQuiz(false);
    }
  };

  const handleAssignQuiz = (quizId) => {
    navigate(`/researcher/study/${studyId}/quizzes/${quizId}/assign`);
  };

  const handleCreateQuiz = () => {
    navigate(`/researcher/questionnaires/create?studyId=${studyId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  if (!study) return null;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Study Quizzes
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAttachDialog}>
            Attach Existing
          </Button>
          <Button variant="outlined" startIcon={<QuizIcon />} onClick={handleCreateQuiz}>
            Create New
          </Button>
        </Stack>
      </Stack>

      {quizLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : quizError ? (
        <Alert severity="error">{quizError}</Alert>
      ) : studyQuizzes.length === 0 ? (
        <Alert severity="info">No quizzes are attached to this study yet.</Alert>
      ) : (
        <Stack spacing={2}>
          {studyQuizzes.map((quiz) => (
            <Card key={quiz.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {quiz.questionnaireTitle}
                    </Typography>
                    {quiz.questionnaireDescription && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {quiz.questionnaireDescription}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                      <Chip label={`Type: ${quiz.questionnaireType}`} size="small" variant="outlined" />
                      <Chip label={`Questions: ${quiz.questionCount ?? 'N/A'}`} size="small" variant="outlined" />
                      {quiz.timeLimitMinutes && (
                        <Chip label={`Time Limit: ${quiz.timeLimitMinutes} min`} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ minWidth: 220 }}>
                    <Typography variant="caption" color="text.secondary">
                      Attached on {quiz.attachedAt ? formatDate(quiz.attachedAt) : '—'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
              <CardActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" variant="contained" startIcon={<AssignmentIcon />} onClick={() => handleAssignQuiz(quiz.id)}>
                  Assign Quiz
                </Button>
                <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={() => navigate(`/researcher/questionnaires/${quiz.questionnaireId}`)}>
                  View Questionnaire
                </Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => confirmRemoveQuiz(quiz)}>
                  Detach
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* Quiz Results Section */}
      <Box sx={{ mt: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Quiz Results
          </Typography>
          <Button size="small" variant="outlined" startIcon={quizResultsRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />} onClick={() => fetchQuizResults(true)} disabled={quizResultsRefreshing}>
            Refresh
          </Button>
        </Stack>

        {quizResultsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : quizResultsError ? (
          <Alert severity="error">{quizResultsError}</Alert>
        ) : quizResults.length === 0 ? (
          <Alert severity="info">No quiz results yet.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Participant</TableCell>
                  <TableCell>Quiz</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizResults.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.participantName || assignment.participantEmail}</TableCell>
                    <TableCell>{assignment.questionnaireTitle}</TableCell>
                    <TableCell>
                      <Chip label={assignment.status} size="small" color={assignment.status === 'COMPLETED' ? 'success' : assignment.status === 'IN_PROGRESS' ? 'primary' : 'default'} />
                    </TableCell>
                    <TableCell>{assignment.score ?? '—'}{assignment.maxScore ? `/${assignment.maxScore}` : ''}</TableCell>
                    <TableCell>{formatDate(assignment.dueDate)}</TableCell>
                    <TableCell>{formatDate(assignment.completedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Attach Questionnaire Dialog */}
      <Dialog open={attachDialogOpen} onClose={handleAttachDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Attach Questionnaire</DialogTitle>
        <DialogContent dividers>
          {attachError && <Alert severity="error" sx={{ mb: 2 }}>{attachError}</Alert>}
          <FormControl fullWidth>
            <InputLabel>Questionnaire</InputLabel>
            <Select value={selectedQuestionnaireId} label="Questionnaire" onChange={(e) => setSelectedQuestionnaireId(e.target.value)} disabled={attachLoading}>
              {availableQuestionnaires.map((q) => (
                <MenuItem key={q.id} value={q.id}>{q.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAttachDialogClose} disabled={attachLoading}>Cancel</Button>
          <Button onClick={handleAttachQuestionnaire} variant="contained" disabled={attachLoading || !selectedQuestionnaireId}>
            {attachLoading ? 'Attaching...' : 'Attach'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Quiz Dialog */}
      <Dialog open={Boolean(quizToRemove)} onClose={handleRemoveQuizCancel}>
        <DialogTitle>Detach Quiz</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {quizToRemove ? `Remove "${quizToRemove.questionnaireTitle}" from this study? Quiz data stays intact and can be reattached later.` : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveQuizCancel} disabled={removingQuiz}>Cancel</Button>
          <Button onClick={handleRemoveQuizConfirm} color="error" variant="contained" disabled={removingQuiz}>
            {removingQuiz ? 'Removing...' : 'Detach'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudyQuizzesTab;

