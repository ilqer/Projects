import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Grid, Card, CardContent, CardActions, Button, Chip, Stack, LinearProgress, Divider, CircularProgress, Alert, List, ListItem, ListItemIcon, ListItemText, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Assignment, CheckCircle, Schedule, TrendingUp, Visibility, Quiz, ThumbUp, ThumbDown, AccessTime, Mail, Dashboard, History, Cancel, ExpandMore, ExpandLess, Quiz as QuizIcon, Close, Assessment } from '@mui/icons-material';
import { studyService, quizAssignmentService, quizSubmissionService, gradingService, evaluationService } from '../../../services/api';
import ParticipantHistory from './ParticipantHistory';
import ParticipantTasks from './ParticipantTasks';

const ParticipantOverview = ({ user, initialTab = 0 }) => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(initialTab);
  
  // Update tab when initialTab changes
  React.useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);
  const [assignedStudies, setAssignedStudies] = useState([]);
  const [quizAssignments, setQuizAssignments] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [expandedStudies, setExpandedStudies] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [error, setError] = useState(null);
  const [quizError, setQuizError] = useState(null);
  const [invitationError, setInvitationError] = useState(null);

  const toggleStudyTasks = (studyId) => {
    setExpandedStudies(prev => ({
      ...prev,
      [studyId]: !prev[studyId]
    }));
  };

  const handleOpenTaskDetails = async (task) => {
    setSelectedTask(task);
    setOpenTaskModal(true);
    setLoadingTaskDetails(true);
    try {
      if (task.taskType === 'QUIZ') {
        const response = await quizSubmissionService.getSubmissionResult(task.taskId);
        setTaskDetails(response.data);
      } else if (task.taskType === 'EVALUATION') {
        const response = await evaluationService.getSubmission(task.taskId);
        setTaskDetails(response.data);
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
      setTaskDetails({ error: 'Failed to load task details' });
    } finally {
      setLoadingTaskDetails(false);
    }
  };

  const handleCloseTaskModal = () => {
    setOpenTaskModal(false);
    setSelectedTask(null);
    setTaskDetails(null);
  };

  useEffect(() => {
    const fetchAssignedStudies = async () => {
      try {
        setLoading(true);
        const response = await studyService.getMyAssignedStudies();
        setAssignedStudies(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching assigned studies:', err);
        setError('Failed to load assigned studies');
      } finally {
        setLoading(false);
      }
    };

    const fetchQuizAssignments = async () => {
      try {
        setLoadingQuizzes(true);
        const response = await quizAssignmentService.getMyQuizAssignments();
        setQuizAssignments(response.data);
        setQuizError(null);
      } catch (err) {
        console.error('Error fetching quiz assignments:', err);
        setQuizError('Failed to load quiz assignments');
      } finally {
        setLoadingQuizzes(false);
      }
    };

    const fetchInvitations = async () => {
      try {
        setLoadingInvitations(true);
        const response = await studyService.getMyInvitations();
        setInvitations(response.data);
        setInvitationError(null);
      } catch (err) {
        console.error('Error fetching invitations:', err);
        setInvitationError('Failed to load study invitations');
      } finally {
        setLoadingInvitations(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await studyService.getParticipantHistory();
        setHistoryData(response.data);
      } catch (err) {
        console.error('Error fetching participant history:', err);
      }
    };

    fetchAssignedStudies();
    fetchQuizAssignments();
    fetchInvitations();
    fetchHistory();
  }, []);

  const activeStudies = assignedStudies.filter(s => s.status !== 'COMPLETED' && s.status !== 'DROPPED');
  const completedStudies = assignedStudies.filter(s => s.status === 'COMPLETED');

  const pendingStatuses = new Set(['PENDING', 'ACCEPTED', 'IN_PROGRESS']);
  const pendingQuizzes = quizAssignments.filter(q => pendingStatuses.has(q.status));
  const completedQuizzes = quizAssignments.filter(q => q.status === 'COMPLETED');

  const stats = {
    activeStudies: activeStudies.length,
    completedStudies: completedStudies.length,
    pendingQuizzes: pendingQuizzes.length,
    completedQuizzes: completedQuizzes.length
  };

  const groupedQuizAssignments = useMemo(() => {
    const buckets = new Map();
    quizAssignments.forEach((assignment) => {
      const key = assignment.studyId ? `study-${assignment.studyId}` : 'standalone';
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          studyId: assignment.studyId,
          studyTitle: assignment.studyTitle,
          assignments: []
        });
      }
      buckets.get(key).assignments.push(assignment);
    });
    return Array.from(buckets.values());
  }, [quizAssignments]);

  const handleAcceptEnrollment = async (enrollmentId) => {
    try {
      await studyService.acceptEnrollment(enrollmentId);
      // Refresh invitations and assigned studies
      const [invitationsResponse, studiesResponse] = await Promise.all([
        studyService.getMyInvitations(),
        studyService.getMyAssignedStudies()
      ]);
      setInvitations(invitationsResponse.data);
      setAssignedStudies(studiesResponse.data);
    } catch (err) {
      console.error('Error accepting enrollment:', err);
      alert(err.response?.data?.message || 'Failed to accept study invitation');
    }
  };

  const handleDeclineEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to decline this study invitation?')) {
      return;
    }

    try {
      await studyService.declineEnrollment(enrollmentId);
      // Refresh invitations
      const response = await studyService.getMyInvitations();
      setInvitations(response.data);
    } catch (err) {
      console.error('Error declining enrollment:', err);
      alert(err.response?.data?.message || 'Failed to decline study invitation');
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      PENDING: { label: 'Pending Response', color: 'warning' },
      ACCEPTED: { label: 'Accepted', color: 'info' },
      DECLINED: { label: 'Declined', color: 'error' },
      IN_PROGRESS: { label: 'In Progress', color: 'primary' },
      COMPLETED: { label: 'Completed', color: 'success' },
      EXPIRED: { label: 'Expired', color: 'default' }
    };
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} size="small" color={config.color} />;
  };

  const renderQuizAssignmentCard = (assignment) => (
    <Box key={assignment.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight={600} gutterBottom>
            {assignment.questionnaireTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {assignment.questionnaireDescription || 'No description'}
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
                icon={<AccessTime />}
                label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                size="small"
                variant="outlined"
                color={assignment.overdue ? 'error' : 'default'}
              />
            )}
          </Stack>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        {['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(assignment.status) && (
          <Button
            size="small"
            variant="contained"
            startIcon={<Quiz />}
            onClick={() => navigate(`/participant/quiz/${assignment.id}`)}
          >
            {assignment.status === 'IN_PROGRESS' ? 'Continue Quiz' : 'Start Quiz'}
          </Button>
        )}
        {assignment.status === 'COMPLETED' && (
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<CheckCircle />}
              label={`Score: ${assignment.score ? assignment.score.toFixed(1) : 'N/A'}%`}
              color={assignment.passed ? 'success' : 'error'}
              variant="outlined"
            />
            {assignment.passed !== null && (
              <Chip
                icon={assignment.passed ? <CheckCircle /> : <Cancel />}
                label={assignment.passed ? 'Passed' : 'Failed'}
                color={assignment.passed ? 'success' : 'error'}
                variant="outlined"
              />
            )}
            {assignment.canRetake && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Quiz />}
                onClick={() => navigate(`/participant/quiz/${assignment.id}`)}
              >
                Retake Quiz
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => navigate(`/participant/quiz-result/${assignment.id}`)}
            >
              View Results
            </Button>
          </Stack>
        )}
        <Button
          size="small"
          variant="text"
          onClick={() => navigate('/notifications')}
        >
          View in Notifications
        </Button>
      </Stack>

      {assignment.notes && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Notes from Researcher:
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {assignment.notes}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl">
      {/* Tab Content */}
      {currentTab === 0 && renderOverviewTab()}
      {currentTab === 1 && renderMyStudiesTab()}
      {currentTab === 2 && renderQuizzesTab()}
      {currentTab === 3 && <ParticipantTasks />}
      {currentTab === 4 && <ParticipantHistory user={user} />}

      {/* Task Details Modal */}
      <Dialog 
        open={openTaskModal} 
        onClose={handleCloseTaskModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Task Details</Typography>
            <IconButton onClick={handleCloseTaskModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingTaskDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : taskDetails?.error ? (
            <Alert severity="error">{taskDetails.error}</Alert>
          ) : selectedTask ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Task Title</Typography>
                <Typography variant="h6">{selectedTask.taskTitle}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Task Type</Typography>
                <Chip 
                  label={selectedTask.taskType} 
                  color={selectedTask.taskType === 'EVALUATION' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Box>

              {selectedTask.score != null && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Score</Typography>
                  <Typography variant="h5" color="success.main">{selectedTask.score}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                <Chip label={selectedTask.status || 'UNKNOWN'} size="small" />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Completed At</Typography>
                <Typography variant="body1">
                  {selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>

              <Divider />

              {selectedTask.taskType === 'QUIZ' && taskDetails?.questions && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Your Answers</Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {taskDetails.questions.map((question, idx) => (
                      <Box 
                        key={idx} 
                        sx={{ 
                          p: 2, 
                          border: 1, 
                          borderColor: 'divider', 
                          borderRadius: 1,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Q{idx + 1}: {question.questionText}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Your Answer: <strong>{question.userAnswer || 'No answer provided'}</strong>
                        </Typography>
                        {question.correctAnswer && (
                          <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                            Correct Answer: <strong>{question.correctAnswer}</strong>
                          </Typography>
                        )}
                        {question.isCorrect != null && (
                          <Chip 
                            label={question.isCorrect ? 'Correct' : 'Incorrect'} 
                            color={question.isCorrect ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {selectedTask.taskType === 'EVALUATION' && taskDetails && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Evaluation Details</Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {taskDetails.timeSpentSeconds != null && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" fontWeight={600}>Time Spent</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Math.floor(taskDetails.timeSpentSeconds / 60)} minutes {taskDetails.timeSpentSeconds % 60} seconds
                        </Typography>
                      </Box>
                    )}

                    {taskDetails.answers && typeof taskDetails.answers === 'object' && Object.keys(taskDetails.answers).length > 0 && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>Your Answers</Typography>
                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                          {Object.entries(taskDetails.answers).map(([key, value], idx) => (
                            <Box key={idx} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, borderLeft: 3, borderColor: 'primary.main' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {taskDetails.annotationsSnapshot && typeof taskDetails.annotationsSnapshot === 'object' && (() => {
                      const nonEmptyAnnotations = Object.entries(taskDetails.annotationsSnapshot).filter(([key, annotations]) => 
                        Array.isArray(annotations) && annotations.length > 0
                      );
                      return nonEmptyAnnotations.length > 0 && (
                        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>Annotations</Typography>
                          <Stack spacing={1.5} sx={{ mt: 1 }}>
                            {nonEmptyAnnotations.map(([key, annotations], idx) => (
                              <Box key={idx} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Artifact {key}
                                </Typography>
                                {annotations.map((annotation, aIdx) => (
                                  <Box key={aIdx} sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                                    <Typography variant="body2" fontSize="0.8rem">
                                      {annotation.text || annotation.comment || JSON.stringify(annotation)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      );
                    })()}

                    {taskDetails.snapshotDecision && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" fontWeight={600}>Your Decision</Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>{taskDetails.snapshotDecision}</strong>
                        </Typography>
                        {taskDetails.snapshotExplanation && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Explanation: {taskDetails.snapshotExplanation}
                          </Typography>
                        )}
                        {taskDetails.snapshotConfidence && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Confidence: {taskDetails.snapshotConfidence}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {taskDetails.cloneRelationship && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" fontWeight={600}>Clone Analysis</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Relationship: <strong>{taskDetails.cloneRelationship}</strong>
                        </Typography>
                        {taskDetails.cloneSimilarity != null && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Similarity: {(taskDetails.cloneSimilarity * 100).toFixed(1)}%
                          </Typography>
                        )}
                        {taskDetails.cloneNotes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Notes: {taskDetails.cloneNotes}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {taskDetails.bugSeverity && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" fontWeight={600}>Bug Report</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Severity: <strong>{taskDetails.bugSeverity}</strong>
                        </Typography>
                        {taskDetails.bugCategory && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Category: {taskDetails.bugCategory}
                          </Typography>
                        )}
                        {taskDetails.bugReproducible && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Reproducible: {taskDetails.bugReproducible}
                          </Typography>
                        )}
                        {taskDetails.bugNotes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Notes: {taskDetails.bugNotes}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {taskDetails.solidViolatedPrinciple && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" fontWeight={600}>SOLID Violation</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Principle: <strong>{taskDetails.solidViolatedPrinciple}</strong>
                        </Typography>
                        {taskDetails.solidViolationSeverity && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Severity: {taskDetails.solidViolationSeverity}
                          </Typography>
                        )}
                        {taskDetails.solidExplanation && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Explanation: {taskDetails.solidExplanation}
                          </Typography>
                        )}
                        {taskDetails.solidSuggestedFix && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Suggested Fix: {taskDetails.solidSuggestedFix}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {taskDetails.reviewerStatus && (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body2" fontWeight={600}>Reviewer Feedback</Typography>
                        <Chip label={taskDetails.reviewerStatus} size="small" sx={{ mt: 1 }} />
                        {taskDetails.reviewerQualityScore != null && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Quality Score: {taskDetails.reviewerQualityScore}/10
                          </Typography>
                        )}
                        {taskDetails.reviewerNotes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Notes: {taskDetails.reviewerNotes}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  function renderOverviewTab() {
    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Active Studies', value: stats.activeStudies, icon: Assignment, color: 'primary' },
          { label: 'Pending Quizzes', value: stats.pendingQuizzes, icon: Schedule, color: 'warning' },
          { label: 'Completed Studies', value: stats.completedStudies, icon: CheckCircle, color: 'success' }
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', transition: 'all 0.3s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.50`, display: 'flex' }}>
                    <stat.icon sx={{ fontSize: 28, color: `${stat.color}.main` }} />
                  </Box>
                </Stack>
                <Typography variant="h3" fontWeight={700} mb={0.5}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Active Studies</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Assignment />}
              onClick={() => navigate('/dashboard?tab=Tasks')}
            >
              View All Tasks
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : activeStudies.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No active studies assigned yet
            </Typography>
          ) : (
            <Stack spacing={3}>
              {activeStudies.map(study => (
                <Box key={study.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {study.studyTitle || study.title || 'Untitled Study'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {study.studyDescription || study.description || 'No description'}
                      </Typography>
                    </Box>
                    {study.endDate && (
                      <Chip 
                        label={study.daysRemaining >= 0 ? `${study.daysRemaining} days left` : 'Overdue'} 
                        size="small" 
                        variant="outlined"
                        color={study.daysRemaining < 7 ? 'warning' : 'default'}
                      />
                    )}
                  </Stack>
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>Progress</Typography>
                      <Box sx={{ flexGrow: 1, position: 'relative' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 1,
                            backgroundColor: 'action.disabledBackground',
                            position: 'absolute',
                            width: '100%'
                          }} 
                        />
                        <LinearProgress 
                          variant="determinate" 
                          value={study.progress ?? 0} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 1,
                            position: 'relative',
                            zIndex: 1
                          }} 
                          color="primary"
                        />
                      </Box>
                      <Typography variant="caption" fontWeight={600} sx={{ minWidth: 40, textAlign: 'right' }}>
                        {study.progress ?? 0}%
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/participant/study/${study.studyId}`)}
                    >
                      View Study
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card elevation={0} sx={{ border: 1, borderColor: 'warning.main', mt: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              <Mail sx={{ verticalAlign: 'middle', mr: 1 }} />
              Study Invitations ({invitations.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {loadingInvitations ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : invitationError ? (
              <Alert severity="error">{invitationError}</Alert>
            ) : (
              <Stack spacing={2}>
                {invitations.map(invitation => (
                  <Box key={invitation.id} sx={{ p: 2, border: 1, borderColor: 'warning.light', borderRadius: 1, bgcolor: 'warning.50' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight={600} gutterBottom>
                          {invitation.studyTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {invitation.studyDescription || 'No description'}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          <Chip label="Invited" size="small" color="warning" />
                          {invitation.startDate && (
                            <Chip
                              icon={<AccessTime />}
                              label={`Starts: ${new Date(invitation.startDate).toLocaleDateString()}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {invitation.endDate && (
                            <Chip
                              icon={<AccessTime />}
                              label={`Ends: ${new Date(invitation.endDate).toLocaleDateString()}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/participant/study/${invitation.studyId}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUp />}
                        onClick={() => handleAcceptEnrollment(invitation.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<ThumbDown />}
                        onClick={() => handleDeclineEnrollment(invitation.id)}
                      >
                        Decline
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Assigned Quizzes</Typography>
          <Divider sx={{ mb: 2 }} />
          {loadingQuizzes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : quizError ? (
            <Alert severity="error">{quizError}</Alert>
          ) : quizAssignments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No quiz assignments yet
            </Typography>
          ) : (
            <Stack spacing={3}>
              {groupedQuizAssignments.map((group) => (
                <Box key={group.key}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                    {group.studyId ? `Study: ${group.studyTitle || 'Study'}` : 'Standalone Quizzes'}
                  </Typography>
                  <Stack spacing={2}>
                    {group.assignments.map((assignment) => renderQuizAssignmentCard(assignment))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
      </>
    );
  }

  function renderMyStudiesTab() {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
    }

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>My Studies</Typography>
        
        {activeStudies.length === 0 ? (
          <Alert severity="info">You don't have any active studies at the moment.</Alert>
        ) : (
          <Grid container spacing={3}>
            {activeStudies.map((enrollment) => {
              // Find history data for this study
              const studyHistory = historyData.find(h => h.studyId === enrollment.studyId);
              const hasCompletedTasks = studyHistory && studyHistory.completedTasks && studyHistory.completedTasks.length > 0;
              const isExpanded = expandedStudies[enrollment.studyId];

              return (
                <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
                  <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', transition: 'all 0.3s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom fontWeight={600} noWrap title={enrollment.studyTitle || enrollment.study?.title}>
                        {enrollment.studyTitle || enrollment.study?.title || enrollment.title || 'Untitled Study'}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        {getStatusChip(enrollment.status)}
                        {enrollment.completionPercentage !== undefined && (
                          <Chip label={`${enrollment.completionPercentage}% Complete`} size="small" variant="outlined" />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {enrollment.studyDescription || enrollment.study?.description || enrollment.study?.objective || enrollment.description || 'No description'}
                      </Typography>
                      {enrollment.completionPercentage !== undefined && (
                        <LinearProgress variant="determinate" value={enrollment.completionPercentage} sx={{ height: 8, borderRadius: 4, mb: 2 }} />
                      )}

                      {/* Completed Tasks Section */}
                      {hasCompletedTasks && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              Completed Tasks ({studyHistory.completedTasks.length})
                            </Typography>
                            <IconButton size="small" onClick={() => toggleStudyTasks(enrollment.studyId)}>
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                          <Collapse in={isExpanded}>
                            <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
                              {studyHistory.completedTasks.slice(0, 5).map((task, idx) => (
                                <ListItem 
                                  key={idx} 
                                  button
                                  onClick={() => handleOpenTaskDetails(task)}
                                  sx={{ 
                                    py: 0.5,
                                    cursor: 'pointer',
                                    '&:hover': {
                                      bgcolor: 'action.selected'
                                    }
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    {task.taskType === 'EVALUATION' ? <Assignment fontSize="small" color="primary" /> : <QuizIcon fontSize="small" color="success" />}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2" noWrap>
                                        {task.taskTitle}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary">
                                        {task.score !== null ? `Score: ${task.score}` : task.status}
                                      </Typography>
                                    }
                                  />
                                  <Visibility fontSize="small" color="action" />
                                </ListItem>
                              ))}
                              {studyHistory.completedTasks.length > 5 && (
                                <Typography variant="caption" color="text.secondary" sx={{ pl: 2, display: 'block', mt: 1 }}>
                                  +{studyHistory.completedTasks.length - 5} more tasks
                                </Typography>
                              )}
                            </List>
                          </Collapse>
                        </>
                      )}
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ p: 2 }}>
                      <Button
                        size="small"
                        fullWidth
                        variant="contained"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/participant/study/${enrollment.studyId}`)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );
  }

  function renderQuizzesTab() {
    if (loadingQuizzes) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (quizError) {
      return <Alert severity="error" sx={{ mb: 3 }}>{quizError}</Alert>;
    }

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Quizzes</Typography>

        {groupedQuizAssignments.length === 0 ? (
          <Alert severity="info">You don't have any quiz assignments yet.</Alert>
        ) : (
          <Stack spacing={2}>
            {groupedQuizAssignments.map((group) => (
              <Card key={group.key} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {group.studyId ? `Study: ${group.studyTitle || 'Study'}` : 'Standalone Quizzes'}
                  </Typography>
                  <Stack spacing={2}>
                    {group.assignments.map((assignment) => renderQuizAssignmentCard(assignment))}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    );
  }
};

export default ParticipantOverview;
