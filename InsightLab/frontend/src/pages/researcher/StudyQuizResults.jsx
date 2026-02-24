import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Box,
  Container,
  Typography,
  IconButton,
  Paper,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import QuizIcon from '@mui/icons-material/Quiz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import { studyService, quizAssignmentService } from '../../services/api';

const statusColorMap = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  DECLINED: 'default',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  EXPIRED: 'default',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const StudyQuizResults = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();

  const [study, setStudy] = useState(null);
  const [studyQuizzes, setStudyQuizzes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [quizResults, setQuizResults] = useState([]);
  const [quizResultsLoading, setQuizResultsLoading] = useState(false);
  const [quizResultsError, setQuizResultsError] = useState('');
  const [quizResultsRefreshing, setQuizResultsRefreshing] = useState(false);

  useEffect(() => {
    if (studyId) {
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const initialize = async () => {
    try {
      setPageLoading(true);
      setQuizResultsError('');
      const [studyRes, quizzesRes] = await Promise.all([
        studyService.getStudyById(studyId),
        studyService.getStudyQuizzes(studyId),
      ]);
      setStudy(studyRes.data);
      const quizzes = quizzesRes.data || [];
      setStudyQuizzes(quizzes);
      await fetchQuizResults(false, quizzes);
    } catch (err) {
      console.error('Failed to load study quiz results page:', err);
      setQuizResultsError(err.response?.data?.message || 'Failed to load study information');
    } finally {
      setPageLoading(false);
    }
  };

  const aggregateQuizResultsFromQuestionnaires = async (quizzes) => {
    if (!quizzes || quizzes.length === 0) {
      return { aggregated: [], hadQuizzes: false };
    }

    const aggregated = [];
    await Promise.all(
      quizzes.map(async (quiz) => {
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

    return { aggregated, hadQuizzes: true };
  };

  const ensureStudyQuizzes = async () => {
    if (studyQuizzes && studyQuizzes.length > 0) {
      return studyQuizzes;
    }
    try {
      const response = await studyService.getStudyQuizzes(studyId);
      const quizzes = response.data || [];
      setStudyQuizzes(quizzes);
      return quizzes;
    } catch (err) {
      console.warn('Failed to reload study quizzes for fallback', err);
      return [];
    }
  };

  const fetchQuizResults = async (silent = false, quizzesOverride = null) => {
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
      const quizzes = quizzesOverride && quizzesOverride.length > 0
        ? quizzesOverride
        : await ensureStudyQuizzes();
      const { aggregated, hadQuizzes } = await aggregateQuizResultsFromQuestionnaires(quizzes);
      setQuizResults(aggregated);

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

  const summary = useMemo(() => {
    const total = quizResults.length;
    const completed = quizResults.filter((assignment) => assignment.status === 'COMPLETED').length;
    const passed = quizResults.filter((assignment) => assignment.passed).length;
    return { total, completed, passed };
  }, [quizResults]);

  const resultsByQuestionnaire = useMemo(() => {
    const map = {};
    quizResults.forEach((assignment) => {
      const key = assignment.questionnaireId;
      if (!map[key]) {
        map[key] = {
          questionnaireId: assignment.questionnaireId,
          questionnaireTitle: assignment.questionnaireTitle || 'Questionnaire',
          total: 0,
          completed: 0,
          passed: 0,
        };
      }
      map[key].total += 1;
      if (assignment.status === 'COMPLETED') {
        map[key].completed += 1;
      }
      if (assignment.passed) {
        map[key].passed += 1;
      }
    });
    return Object.values(map).sort((a, b) => a.questionnaireTitle.localeCompare(b.questionnaireTitle));
  }, [quizResults]);

  if (pageLoading) {
    return (
      <AppTheme>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <CssBaseline />
      <AppBar position="fixed" color="default" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(`/researcher/study/${studyId}?tab=quizzes`)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {study ? `${study.title} · Quiz Results` : 'Quiz Results'}
          </Typography>
          <ColorModeSelect />
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {quizResultsError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setQuizResultsError('')}>
            {quizResultsError}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Study
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {study?.title || 'Study'}
              </Typography>
              <Typography color="text.secondary">
                {study?.status ? `Status: ${study.status}` : ''}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchQuizResults(true)}
                disabled={quizResultsRefreshing}
              >
                {quizResultsRefreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate(`/researcher/study/${studyId}?tab=quizzes`)}
              >
                Back to Study
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Paper elevation={0} sx={{ p: 2, flex: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="overline" color="text.secondary">
                Total Assignments
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <QuizIcon color="primary" />
                <Typography variant="h4" fontWeight={700}>
                  {summary.total}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Across {studyQuizzes.length} attached quizzes
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, flex: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="overline" color="text.secondary">
                Completed
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AssessmentIcon color="success" />
                <Typography variant="h4" fontWeight={700}>
                  {summary.completed}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {summary.total ? `${Math.round((summary.completed / summary.total) * 100)}% completion` : '—'}
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, flex: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="overline" color="text.secondary">
                Passed
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleIcon color="success" />
                <Typography variant="h4" fontWeight={700}>
                  {summary.passed}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {summary.total ? `${Math.round((summary.passed / summary.total) * 100)}% pass rate` : '—'}
              </Typography>
            </Paper>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Quizzes in this Study
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {studyQuizzes.length === 0 ? 'No quizzes attached yet.' : `${studyQuizzes.length} quiz(es) attached.`}
            </Typography>
          </Stack>

          {studyQuizzes.length > 0 && (
            <Stack spacing={1} mt={2}>
              {studyQuizzes.map((quiz) => (
                <Stack
                  key={quiz.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  sx={{ p: 1.5, borderRadius: 1, border: 1, borderColor: 'divider' }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {quiz.questionnaireTitle || 'Questionnaire'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Questionnaire ID: {quiz.questionnaireId}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/researcher/questionnaires/${quiz.questionnaireId}`)}
                  >
                    Open Questionnaire
                  </Button>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Questionnaire Summary
          </Typography>
          {resultsByQuestionnaire.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No quiz assignments yet.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Questionnaire</TableCell>
                    <TableCell>Total Assignments</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Passed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultsByQuestionnaire.map((row) => (
                    <TableRow key={row.questionnaireId} hover>
                      <TableCell>{row.questionnaireTitle}</TableCell>
                      <TableCell>{row.total}</TableCell>
                      <TableCell>{row.completed}</TableCell>
                      <TableCell>{row.passed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Individual Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest quiz assignments scoped to this study
            </Typography>
          </Stack>

          {quizResultsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : quizResults.length === 0 ? (
            <Alert severity="info">No quiz assignments yet. Assign quizzes to participants to see their progress.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Questionnaire</TableCell>
                    <TableCell>Participant</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Passed</TableCell>
                    <TableCell>Assigned</TableCell>
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
                          color={statusColorMap[assignment.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {assignment.score !== null && assignment.score !== undefined ? `${assignment.score.toFixed(1)}%` : '—'}
                      </TableCell>
                      <TableCell>
                        {assignment.passed === null || assignment.passed === undefined ? (
                          <Chip label="Pending" size="small" />
                        ) : assignment.passed ? (
                          <Chip icon={<CheckCircleIcon />} label="Passed" color="success" size="small" />
                        ) : (
                          <Chip icon={<CancelIcon />} label="Failed" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(assignment.assignedAt)}</TableCell>
                      <TableCell>{assignment.completedAt ? formatDateTime(assignment.completedAt) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </AppTheme>
  );
};

export default StudyQuizResults;
