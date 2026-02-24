import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Chip, Stack, Divider, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, List, ListItem, ListItemText, ListItemIcon, Paper } from '@mui/material';
import { CheckCircle, CalendarToday, Assessment, TrendingUp, Close, Assignment, Quiz as QuizIcon, ExpandMore, ExpandLess, Visibility } from '@mui/icons-material';
import { studyService, quizSubmissionService, gradingService, evaluationService } from '../../../services/api';

const ParticipantHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [expandedStudies, setExpandedStudies] = useState({});

  const handleOpenSummary = (study) => {
    setSelectedStudy(study);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedStudy(null);
  };

  const handleOpenTaskDetails = async (task) => {
    setSelectedTask(task);
    setOpenTaskModal(true);
    setLoadingTaskDetails(true);
    
    try {
      if (task.taskType === 'QUIZ') {
        // Fetch quiz submission details
        const response = await quizSubmissionService.getSubmissionResult(task.taskId);
        setTaskDetails(response.data);
      } else if (task.taskType === 'EVALUATION') {
        // Fetch evaluation submission details
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

  const toggleStudyExpansion = (studyId) => {
    setExpandedStudies(prev => ({
      ...prev,
      [studyId]: !prev[studyId]
    }));
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await studyService.getParticipantHistory();
        setHistoryData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching participant history:', err);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Calculate overall statistics
  const totalCompleted = historyData.filter(h => h.enrollmentStatus === 'COMPLETED').length;
  const totalTasks = historyData.reduce((sum, h) => sum + (h.totalTasksCompleted || 0), 0);
  const totalEvaluations = historyData.reduce((sum, h) => sum + (h.totalEvaluationsCompleted || 0), 0);
  const averageProgress = historyData.length > 0
    ? Math.round(historyData.reduce((sum, h) => sum + (h.progress || 0), 0) / historyData.length)
    : 0;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Study History</Typography>
        <Typography variant="body2" color="text.secondary">Review your past study participations</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Completed Studies', value: totalCompleted, icon: CheckCircle, color: 'success' },
          { label: 'Tasks Completed', value: totalTasks, icon: Assessment, color: 'info' },
          { label: 'Total Evaluations', value: totalEvaluations, icon: CalendarToday, color: 'primary' },
          { label: 'Average Progress', value: `${averageProgress}%`, icon: TrendingUp, color: 'warning' }
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>{stat.label}</Typography>
                    <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.50`, display: 'flex' }}>
                    <stat.icon sx={{ fontSize: 28, color: `${stat.color}.main` }} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Study History</Typography>
          <Divider sx={{ mb: 3 }} />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : historyData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircle sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">No study participation yet</Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {historyData.map(study => {
                const isExpanded = expandedStudies[study.studyId];
                const hasCompletedTasks = study.completedTasks && study.completedTasks.length > 0;
                
                return (
                  <Box 
                    key={study.studyId} 
                    sx={{ 
                      p: 3, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                          <Typography variant="h6" fontWeight={600}>{study.studyTitle}</Typography>
                          <Chip 
                            label={study.enrollmentStatus === 'COMPLETED' ? 'Completed' : study.enrollmentStatus} 
                            size="small" 
                            color={study.enrollmentStatus === 'COMPLETED' ? 'success' : 'default'} 
                            icon={study.enrollmentStatus === 'COMPLETED' ? <CheckCircle /> : null} 
                          />
                          {hasCompletedTasks && (
                            <Chip 
                              label={`${study.totalTasksCompleted} Tasks`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {study.studyDescription || 'No description'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Grid container spacing={2} sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Progress</Typography>
                        <Typography variant="body1" fontWeight={600}>{study.progress || 0}%</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Evaluations</Typography>
                        <Typography variant="body1" fontWeight={600}>{study.totalEvaluationsCompleted || 0}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Quizzes</Typography>
                        <Typography variant="body1" fontWeight={600}>{study.totalQuizzesCompleted || 0}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Total Tasks</Typography>
                        <Typography variant="body1" fontWeight={600}>{study.totalTasksCompleted || 0}</Typography>
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }} alignItems="center">
                      <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Enrolled: {study.enrolledAt ? new Date(study.enrolledAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Stack>
                      {study.completedAt && (
                        <>
                          <Typography variant="caption" color="text.secondary">•</Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
                            <CheckCircle sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Completed: {new Date(study.completedAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </>
                      )}
                      
                      {hasCompletedTasks && (
                        <Button
                          size="small"
                          onClick={() => toggleStudyExpansion(study.studyId)}
                          endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                        >
                          {isExpanded ? 'Hide' : 'View'} Tasks
                        </Button>
                      )}
                    </Stack>

                    {/* Completed Tasks List */}
                    {hasCompletedTasks && isExpanded && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight={600} mb={2}>
                          Completed Tasks ({study.completedTasks.length})
                        </Typography>
                        <List dense>
                          {study.completedTasks.map((task, idx) => (
                            <ListItem 
                              key={idx}
                              button
                              onClick={() => handleOpenTaskDetails(task)}
                              sx={{ 
                                mb: 1, 
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                  borderColor: 'primary.main'
                                }
                              }}
                            >
                              <ListItemIcon>
                                {task.taskType === 'EVALUATION' ? (
                                  <Assessment color="primary" />
                                ) : (
                                  <QuizIcon color="secondary" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" fontWeight={500}>
                                      {task.taskTitle}
                                    </Typography>
                                    <Chip 
                                      label={task.taskType} 
                                      size="small" 
                                      color={task.taskType === 'EVALUATION' ? 'primary' : 'secondary'}
                                      sx={{ height: 20 }}
                                    />
                                    {task.score != null && (
                                      <Chip 
                                        label={`Score: ${task.score}`} 
                                        size="small" 
                                        color="success"
                                        variant="outlined"
                                        sx={{ height: 20 }}
                                      />
                                    )}
                                  </Stack>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    Completed: {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'N/A'}
                                    {' • Status: '}{task.status || 'UNKNOWN'}
                                  </Typography>
                                }
                              />
                              <ListItemIcon>
                                <Visibility color="action" />
                              </ListItemIcon>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Summary Modal */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Study Summary</Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudy && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Study Title</Typography>
                <Typography variant="h6">{selectedStudy.studyTitle}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                <Typography variant="body1">{selectedStudy.studyDescription || 'No description available'}</Typography>
              </Box>

              <Divider />

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Enrollment Date</Typography>
                  <Typography variant="body1">
                    {selectedStudy.enrolledAt ? new Date(selectedStudy.enrolledAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Completion Date</Typography>
                  <Typography variant="body1">
                    {selectedStudy.completedAt ? new Date(selectedStudy.completedAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Duration</Typography>
                  <Typography variant="body1">
                    {selectedStudy.completedAt && selectedStudy.enrolledAt ? 
                      `${Math.ceil((new Date(selectedStudy.completedAt) - new Date(selectedStudy.enrolledAt)) / (1000 * 60 * 60 * 24))} days` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Progress</Typography>
                  <Typography variant="body1">{selectedStudy.progress}%</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                <Chip 
                  label={selectedStudy.status} 
                  color="success" 
                  size="small"
                  icon={<CheckCircle />}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Study Period</Typography>
                <Typography variant="body1">
                  {selectedStudy.startDate ? new Date(selectedStudy.startDate).toLocaleDateString() : 'N/A'} - {selectedStudy.endDate ? new Date(selectedStudy.endDate).toLocaleDateString() : 'Ongoing'}
                </Typography>
              </Box>

              <Alert severity="info">
                Total score will be available once the evaluation system is implemented.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
};

export default ParticipantHistory;
