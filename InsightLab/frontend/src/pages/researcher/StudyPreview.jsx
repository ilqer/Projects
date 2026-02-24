import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { studyService, reviewerAssignmentService, quizAssignmentService } from '../../services/api';
import { questionnaireService } from '../../services/questionnaireService';
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
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Group as GroupIcon } from '@mui/icons-material';
import ExportModal from '../../components/ExportModal';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import QuizIcon from '@mui/icons-material/Quiz';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const StudyPreview = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const assignmentStatusColor = {
    PENDING: 'warning',
    ACCEPTED: 'info',
    DECLINED: 'default',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    EXPIRED: 'default'
  };

  const [study, setStudy] = useState(null);
  const [reviewerAssignments, setReviewerAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [studyQuizzes, setStudyQuizzes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState('');
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [quizResultsLoading, setQuizResultsLoading] = useState(false);
  const [quizResultsError, setQuizResultsError] = useState('');
  const [quizResultsRefreshing, setQuizResultsRefreshing] = useState(false);
  const [quizToRemove, setQuizToRemove] = useState(null);
  const [removingQuiz, setRemovingQuiz] = useState(false);

  useEffect(() => {
    loadStudy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (studyId) {
      fetchStudyQuizzes();
    }
  }, [studyId]);

  useEffect(() => {
    if (activeTab === 'quizzes' && studyId) {
      fetchQuizResults();
    }
  }, [activeTab, studyId]);

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

  const aggregateQuizResultsFromQuestionnaires = async (quizzesOverride = null) => {
    const source = Array.isArray(quizzesOverride) ? quizzesOverride : studyQuizzes;
    const hadQuizzes = Array.isArray(source) && source.length > 0;

    if (!hadQuizzes) {
      setQuizResults([]);
      return { results: [], hadQuizzes };
    }

    const aggregated = [];
    await Promise.all(
      source.map(async (quiz) => {
        try {
          const res = await quizAssignmentService.getAssignmentsByQuestionnaire(quiz.questionnaireId);
          (res.data || [])
            .filter((assignment) => assignment.studyId && String(assignment.studyId) === String(studyId))
            .forEach((assignment) => {
              aggregated.push({
                ...assignment,
                questionnaireTitle: quiz.questionnaireTitle || assignment.questionnaireTitle,
              });
            });
        } catch (err) {
          console.warn('Failed to load assignments for questionnaire', quiz.questionnaireId, err);
        }
      })
    );

    setQuizResults(aggregated);
    return { results: aggregated, hadQuizzes };
  };

  const fetchQuizResults = async (silent = false) => {
    try {
      if (!silent) {
        setQuizResultsLoading(true);
      } else {
        setQuizResultsRefreshing(true);
      }
      setQuizResultsError('');
      const response = await quizAssignmentService.getAssignmentsByStudy(studyId);
      setQuizResults(response.data || []);
      setQuizResultsError('');
    } catch (err) {
      console.error('Failed to load quiz results:', err);
      const { results: aggregated, hadQuizzes } = await aggregateQuizResultsFromQuestionnaires();
      if (!aggregated.length && hadQuizzes) {
        setQuizResultsError(err.response?.data?.message || 'Failed to load quiz results');
      } else {
        setQuizResultsError('');
      }
    } finally {
      setQuizResultsLoading(false);
      setQuizResultsRefreshing(false);
    }
  };

  const loadStudy = async () => {
    try {
      setLoading(true);
      setError('');

      // Study + reviewer assignments birlikte çek
      const [studyRes, assignmentsRes] = await Promise.all([
        studyService.getStudyById(studyId),
        reviewerAssignmentService.getAssignmentsByStudy(studyId),
      ]);

      setStudy(studyRes.data);
      setStudyQuizzes(studyRes.data?.quizzes || []);
      setReviewerAssignments(assignmentsRes.data || []);
    } catch (err) {
      console.error('Error loading study:', err);
      setError(
        'Failed to load study: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_, value) => {
    // Navigate to external pages only for complex tabs
    switch (value) {
      case 'edit':
        navigate(`/researcher/study/${studyId}/edit`);
        return;
      case 'evaluation-tasks':
        navigate(`/researcher/evaluation-tasks?studyId=${studyId}`);
        return;
      case 'create-evaluation-task':
        navigate(`/researcher/studies/${studyId}/create-evaluation-task`);
        return;
      default:
        // Show content inline for overview, participants, reviewers, quizzes, export
        setActiveTab(value);
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
    if (attachLoading) return;
    setAttachDialogOpen(false);
    setAttachError('');
    setSelectedQuestionnaireId('');
  };

  const handleAttachConfirm = async () => {
    if (!selectedQuestionnaireId) {
      setAttachError('Please select a questionnaire to attach');
      return;
    }

    try {
      setAttachLoading(true);
      await studyService.attachQuizToStudy(studyId, {
        questionnaireId: selectedQuestionnaireId
      });
      setAttachDialogOpen(false);
      setSelectedQuestionnaireId('');
      await Promise.all([fetchStudyQuizzes(), loadStudy()]);
    } catch (err) {
      console.error('Error attaching questionnaire:', err);
      setAttachError(err.response?.data?.message || 'Failed to attach questionnaire');
    } finally {
      setAttachLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    navigate(`/researcher/questionnaires/create?studyId=${studyId}`);
  };

  const handleAssignQuiz = (studyQuizId) => {
    navigate(`/researcher/study/${studyId}/quizzes/${studyQuizId}/assign`);
  };

  const confirmRemoveQuiz = (quiz) => {
    setQuizToRemove(quiz);
  };

  const handleRemoveQuizCancel = () => {
    if (removingQuiz) return;
    setQuizToRemove(null);
  };

  const handleRemoveQuizConfirm = async () => {
    if (!quizToRemove) return;
    try {
      setRemovingQuiz(true);
      await studyService.removeStudyQuiz(studyId, quizToRemove.id);
      setQuizToRemove(null);
      await Promise.all([fetchStudyQuizzes(), loadStudy()]);
    } catch (err) {
      console.error('Error removing study quiz:', err);
      alert(err.response?.data?.message || 'Failed to detach quiz from study');
    } finally {
      setRemovingQuiz(false);
    }
  };

  const renderQuizzesTab = () => (
    <Box sx={{ mt: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" fontWeight={600}>
          Study Quizzes
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAttachDialog}
          >
            Attach Existing
          </Button>
          <Button
            variant="outlined"
            startIcon={<QuizIcon />}
            onClick={handleCreateQuiz}
          >
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
                      <Chip
                        label={`Type: ${quiz.questionnaireType}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Questions: ${quiz.questionCount ?? 'N/A'}`}
                        size="small"
                        variant="outlined"
                      />
                      {quiz.timeLimitMinutes && (
                        <Chip
                          label={`Time Limit: ${quiz.timeLimitMinutes} min`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {quiz.displayOrder !== null && (
                        <Chip
                          label={`Order ${quiz.displayOrder + 1}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {!quiz.questionnaireActive && (
                        <Chip label="Inactive" size="small" color="warning" variant="outlined" />
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ minWidth: 220 }}>
                    <Typography variant="caption" color="text.secondary">
                      Attached on {quiz.attachedAt ? new Date(quiz.attachedAt).toLocaleDateString() : '—'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
              <CardActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AssignmentIcon />}
                  onClick={() => handleAssignQuiz(quiz.id)}
                >
                  Assign Quiz
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={() => navigate(`/researcher/questionnaires/${quiz.questionnaireId}`)}
                >
                  View Questionnaire
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => confirmRemoveQuiz(quiz)}
                >
                  Detach
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={600}>
            Quiz Results
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => fetchQuizResults(true)}
              disabled={quizResultsRefreshing}
            >
              {quizResultsRefreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate(`/researcher/study/${studyId}/quiz-results`)}
            >
              Full Page
            </Button>
          </Stack>
        </Stack>

        {quizResultsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : quizResultsError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setQuizResultsError('')}>
            {quizResultsError}
          </Alert>
        ) : quizResults.length === 0 ? (
          <Alert severity="info">No quiz assignments yet. Assign quizzes to participants to see results.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Questionnaire</TableCell>
                  <TableCell>Participant</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Passed</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizResults.map((assignment) => (
                  <TableRow key={assignment.id} hover>
                    <TableCell>{assignment.questionnaireTitle || 'Questionnaire'}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{assignment.participantName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.participantEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.status}
                        size="small"
                        color={assignmentStatusColor[assignment.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {assignment.score !== null ? `${assignment.score.toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell>
                      {assignment.passed === null ? (
                        <Chip label="Pending" size="small" />
                      ) : assignment.passed ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          color="success"
                          size="small"
                          label="Passed"
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon />}
                          color="error"
                          size="small"
                          label="Failed"
                        />
                      )}
                    </TableCell>
                    <TableCell>{assignment.dueDate ? formatDate(assignment.dueDate) : '—'}</TableCell>
                    <TableCell>{assignment.completedAt ? formatDate(assignment.completedAt) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );

  const renderParticipantsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Study Participants
        </Typography>
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">Max Participants</Typography>
              <Typography variant="h6" fontWeight={600}>
                {study?.maxParticipants || 'Unlimited'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Current Participants</Typography>
              <Typography variant="h6" fontWeight={600}>
                {study?.participantCount || 0}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 2 }}>
        Participants are assigned through evaluation tasks. Create an evaluation task to assign participants.
      </Alert>

      <Button
        variant="outlined"
        startIcon={<AssignmentIcon />}
        onClick={() => navigate(`/researcher/evaluation-tasks?studyId=${studyId}`)}
      >
        View Evaluation Tasks
      </Button>
    </Box>
  );

  const renderReviewersTab = () => (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Study Reviewers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/researcher/study/${studyId}/reviewers`)}
        >
          Assign Reviewers
        </Button>
      </Stack>

      {reviewerAssignments.length === 0 ? (
        <Alert severity="info">
          No reviewers assigned to this study yet. Click "Manage Reviewers" to assign reviewers.
        </Alert>
      ) : (
        <List>
          {reviewerAssignments.map((a) => (
            <ListItem
              key={a.reviewerId}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'background.paper',
              }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>{a.reviewerName || a.reviewerEmail}</Typography>
                    <Chip
                      label={a.status}
                      size="small"
                      color={assignmentStatusColor[a.status] || 'default'}
                    />
                  </Stack>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={a.progressPercentage ?? 0}
                          sx={{ height: 6, borderRadius: 1 }}
                          color={(a.progressPercentage ?? 0) >= 100 ? 'success' : 'primary'}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                        {a.progressPercentage ?? 0}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Evaluations: {a.reviewedEvaluations ?? 0}/{a.totalEvaluations ?? a.totalParticipants ?? 0}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  const renderExportTab = () => (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Export Study Results
        </Typography>
      </Stack>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Export Options
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Export your study data including participant responses, evaluation results, and quiz scores.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={() => setExportModalOpen(true)}
            >
              Export All Data
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="info">
        The export will include all completed evaluations, participant data, and any quiz results associated with this study.
      </Alert>
    </Box>
  );

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await studyService.publishStudy(studyId);
      alert('Study published successfully!');
      loadStudy(); // Reload to get updated status
    } catch (err) {
      console.error('Error publishing study:', err);
      alert(
        'Failed to publish study: ' +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await studyService.deleteStudy(studyId);
      alert('Study deleted successfully!');
      navigate('/dashboard?tab=Studies');
    } catch (err) {
      console.error('Error deleting study:', err);
      alert(
        'Failed to delete study: ' +
          (err.response?.data?.message || err.message)
      );
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleArchiveClick = () => {
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    try {
      setArchiving(true);
      await studyService.archiveStudy(studyId);
      alert('Study archived successfully!');
      navigate('/dashboard?tab=Studies');
    } catch (err) {
      console.error('Error archiving study:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Unknown error';
      alert('Failed to archive study: ' + errorMessage);
      setArchiving(false);
      setArchiveDialogOpen(false);
    }
  };

  const handleArchiveCancel = () => {
    setArchiveDialogOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'warning';
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'default';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      case 'ARCHIVED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Reviewer assignment status chip color
  const getAssignmentStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'DECLINED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <AppTheme>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  if (error || !study) {
    return (
      <AppTheme>
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Alert severity="error">{error || 'Study not found'}</Alert>
          <Button onClick={() => navigate('/dashboard?tab=Studies')} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Container>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/dashboard?tab=Studies')}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Study Preview
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="md">
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                {study.title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  label={study.status}
                  color={getStatusColor(study.status)}
                  size="small"
                />
                {study.blindedMode && (
                  <Chip label="Blinded Mode" color="info" size="small" />
                )}
                {study.daysRemaining !== null &&
                  study.daysRemaining !== undefined && (
                    <Chip
                      label={
                        study.daysRemaining < 0
                          ? 'Ended'
                          : `${study.daysRemaining} days left`
                      }
                      color={study.daysRemaining < 7 ? 'error' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  )}
              </Stack>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                >
                  <Tab label="Overview" value="overview" />
                  {study.status !== 'ARCHIVED' && study.status !== 'COMPLETED' && study.status !== 'CANCELLED' && (
                    <Tab label="Edit Study" value="edit" />
                  )}
                  <Tab label="Evaluation Tasks" value="evaluation-tasks" />
                  {study.status !== 'ARCHIVED' && study.status !== 'COMPLETED' && study.status !== 'CANCELLED' && (
                    <Tab label="Create Evaluation Task" value="create-evaluation-task" />
                  )}
                  <Tab label="Participants" value="participants" />
                  <Tab label="Reviewers" value="reviewers" />
                  <Tab label="Quizzes" value="quizzes" />
                  <Tab label="Export Results" value="export" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 2 }} />

              {study.description && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {study.description}
                  </Typography>
                </>
              )}

              <Typography variant="h6" gutterBottom>
                Objective
              </Typography>
              <Typography variant="body1" paragraph>
                {study.objective}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <List>
                <ListItem>
                  <ListItemText
                    primary="Start Date"
                    secondary={formatDate(study.startDate)}
                  />
                </ListItem>
                {study.endDate && (
                  <ListItem>
                    <ListItemText
                      primary="End Date (Deadline)"
                      secondary={formatDate(study.endDate)}
                    />
                  </ListItem>
                )}
                {study.comparisonType && (
                  <ListItem>
                    <ListItemText
                      primary="Comparison Type"
                      secondary={study.comparisonType
                        .split('-')
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(' ')}
                    />
                  </ListItem>
                )}
                {study.maxParticipants && (
                  <ListItem>
                    <ListItemText
                      primary="Maximum Participants"
                      secondary={study.maxParticipants}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Created By"
                    secondary={study.researcherName}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Created At"
                    secondary={new Date(
                      study.createdAt
                    ).toLocaleString()}
                  />
                </ListItem>
              </List>

              {/* Study Artifacts Section */}
              {study.artifacts && study.artifacts.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Study Artifacts
                  </Typography>
                  <List>
                    {study.artifacts.map((artifact, index) => {
                      const artifactUuid = artifact.artifactId || artifact.id;
                      return (
                        <ListItem key={index}>
                          <Box
                            sx={{
                              display: 'flex',
                              width: '100%',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 2
                            }}
                          >
                            <ListItemText
                              primary={
                                artifact.displayLabel ||
                                artifact.originalFilename
                              }
                              secondary={
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{ mt: 0.5 }}
                                >
                                  <Chip
                                    label={artifact.contentType}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`${(
                                      artifact.sizeBytes / 1024
                                    ).toFixed(1)} KB`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`Order: ${
                                      artifact.displayOrder + 1
                                    }`}
                                    size="small"
                                    color="primary"
                                  />
                                </Stack>
                              }
                            />
                            {artifactUuid && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AnalyticsIcon />}
                                sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                                onClick={() =>
                                  navigate(`/researcher/study/${study.id}/artifacts/${artifactUuid}/analytics`)
                                }
                              >
                                View Analytics
                              </Button>
                            )}
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                </>
              )}

              {/* Custom Evaluation Criteria Section */}
              {study.customCriteria &&
                study.customCriteria.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Custom Evaluation Criteria
                    </Typography>
                    <List>
                      {study.customCriteria.map((criterion, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography variant="subtitle1">
                                  {criterion.name}
                                </Typography>
                                <Chip
                                  label={criterion.ratingFormat.replace(
                                    '_',
                                    ' '
                                  )}
                                  size="small"
                                  color="secondary"
                                />
                              </Box>
                            }
                            secondary={
                              <>
                                {criterion.description && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {criterion.description}
                                  </Typography>
                                )}
                                {criterion.ratingOptions && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Options: {criterion.ratingOptions}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

              {/* Assigned Reviewers Section */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GroupIcon sx={{ mr: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Assigned Reviewers
                </Typography>
              </Box>

              {reviewerAssignments.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  No reviewers assigned yet.
                </Typography>
              ) : (
                <List>
                  {reviewerAssignments.map((a) => (
                    <ListItem key={a.id} alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography variant="subtitle1">
                              {a.reviewerName}
                            </Typography>
                            <Chip
                              label={a.status}
                              size="small"
                              color={getAssignmentStatusColor(a.status)}
                            />
                          </Stack>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {a.reviewerEmail}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              Assigned by {a.assignedByName} on{' '}
                              {a.assignedAt
                                ? new Date(
                                    a.assignedAt
                                  ).toLocaleString()
                                : '—'}
                            </Typography>

                            <Box sx={{ mt: 1 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Progress:
                                </Typography>
                                <Box sx={{ flexGrow: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={a.progressPercentage ?? 0}
                                    sx={{
                                      height: 6,
                                      borderRadius: 1,
                                    }}
                                    color={
                                      (a.progressPercentage ?? 0) >= 100
                                        ? 'success'
                                        : 'primary'
                                    }
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{ minWidth: 40, textAlign: 'right' }}
                                >
                                  {a.progressPercentage ?? 0}%
                                </Typography>
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                Evaluations: {a.reviewedEvaluations ?? 0}/
                                {a.totalEvaluations ?? a.totalParticipants ?? 0}
                                {typeof a.flaggedEvaluations === 'number' &&
                                  a.flaggedEvaluations > 0 &&
                                  ` • Flagged: ${a.flaggedEvaluations}`}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

                  {/* Action Buttons - only Delete and Archive */}
                  <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap">
                    {study.status === 'COMPLETED' && (
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<ArchiveIcon />}
                        onClick={handleArchiveClick}
                      >
                        Archive Study
                      </Button>
                    )}
                    {study.status !== 'ARCHIVED' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteClick}
                      >
                        Delete Study
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}

              {activeTab === 'participants' && renderParticipantsTab()}
              {activeTab === 'reviewers' && renderReviewersTab()}
              {activeTab === 'quizzes' && renderQuizzesTab()}
              {activeTab === 'export' && renderExportTab()}

            </Paper>
          </Container>
        </Box>
      </Box>

      {/* Attach Questionnaire Dialog */}
      <Dialog open={attachDialogOpen} onClose={handleAttachDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Attach Questionnaire</DialogTitle>
        <DialogContent dividers>
          {attachError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {attachError}
            </Alert>
          )}
          <FormControl fullWidth>
            <InputLabel id="attach-questionnaire-label">Questionnaire</InputLabel>
            <Select
              labelId="attach-questionnaire-label"
              label="Questionnaire"
              value={selectedQuestionnaireId}
              onChange={(event) => setSelectedQuestionnaireId(event.target.value)}
              disabled={attachLoading}
            >
              {availableQuestionnaires.map((questionnaire) => (
                <MenuItem key={questionnaire.id} value={questionnaire.id}>
                  {questionnaire.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAttachDialogClose} disabled={attachLoading}>
            Cancel
          </Button>
          <Button onClick={handleAttachConfirm} variant="contained" disabled={attachLoading}>
            {attachLoading ? 'Attaching...' : 'Attach'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detach Quiz Dialog */}
      <Dialog open={Boolean(quizToRemove)} onClose={handleRemoveQuizCancel}>
        <DialogTitle>Detach Quiz</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {quizToRemove
              ? `Remove "${quizToRemove.questionnaireTitle}" from this study? Quiz data stays intact and can be reattached later.`
              : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveQuizCancel} disabled={removingQuiz}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveQuizConfirm}
            color="error"
            variant="contained"
            disabled={removingQuiz}
          >
            {removingQuiz ? 'Removing...' : 'Detach'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Study?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{study?.title}"? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onClose={handleArchiveCancel}>
        <DialogTitle>Archive Study?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to archive "{study?.title}"?
            <br />
            <br />
            Archived studies will be removed from your active dashboard but
            remain accessible via the "Archived" tab. All collected data will be
            retained and can be exported at any time.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleArchiveCancel} disabled={archiving}>
            Cancel
          </Button>
          <Button
            onClick={handleArchiveConfirm}
            color="secondary"
            variant="contained"
            disabled={archiving}
          >
            {archiving ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        studyId={studyId}
      />
    </AppTheme>
  );
};

export default StudyPreview;
