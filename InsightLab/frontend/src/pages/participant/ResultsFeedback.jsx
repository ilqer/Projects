import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import RateReviewIcon from '@mui/icons-material/RateReview';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import VisibilityIcon from '@mui/icons-material/Visibility';

const ResultsFeedback = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  // Mock data based on domain model
  const quizResults = [
    {
      id: 1,
      quizTitle: 'Java Programming Fundamentals',
      score: 85,
      totalPoints: 100,
      passed: true,
      skillLevel: 'INTERMEDIATE',
      feedback: 'Good understanding of Java basics. Focus on advanced OOP concepts.',
      completedAt: '2025-11-01T14:30:00',
      studyTitle: 'Software Engineering Practices Study'
    },
    {
      id: 2,
      quizTitle: 'Python Data Structures',
      score: 72,
      totalPoints: 100,
      passed: true,
      skillLevel: 'BEGINNER',
      feedback: 'Solid foundation. Practice more on dictionaries and sets.',
      completedAt: '2025-10-28T10:15:00',
      studyTitle: 'Algorithm Comparison Study'
    },
    {
      id: 3,
      quizTitle: 'Advanced React Patterns',
      score: 45,
      totalPoints: 100,
      passed: false,
      skillLevel: 'BEGINNER',
      feedback: 'Need more practice with hooks and context API. Review the materials and retake.',
      completedAt: '2025-10-25T16:45:00',
      studyTitle: 'UI/UX Development Study'
    }
  ];

  const comparisonTasks = [
    {
      id: 1,
      studyTitle: 'Code Quality Assessment Study',
      status: 'COMPLETED',
      comparisonType: 'SIDE_BY_SIDE',
      artifactA: 'BubbleSort.java (Human)',
      artifactB: 'BubbleSort.java (AI)',
      evaluationScore: 8.5,
      timeSpent: 1200, // seconds
      completedAt: '2025-11-03T11:20:00',
      reviewApproved: true
    },
    {
      id: 2,
      studyTitle: 'Algorithm Efficiency Study',
      status: 'COMPLETED',
      comparisonType: 'THREE_WAY',
      artifactA: 'MergeSort.py (Human)',
      artifactB: 'MergeSort.py (AI-GPT)',
      artifactC: 'MergeSort.py (AI-Copilot)',
      evaluationScore: 9.2,
      timeSpent: 1800,
      completedAt: '2025-11-02T15:30:00',
      reviewApproved: true
    },
    {
      id: 3,
      studyTitle: 'Documentation Quality Study',
      status: 'IN_PROGRESS',
      comparisonType: 'SIDE_BY_SIDE',
      artifactA: 'API_Documentation.md (Human)',
      artifactB: 'API_Documentation.md (AI)',
      evaluationScore: null,
      timeSpent: 450,
      completedAt: null,
      reviewApproved: null
    },
    {
      id: 4,
      studyTitle: 'Test Case Generation Study',
      status: 'PENDING',
      comparisonType: 'SIDE_BY_SIDE',
      artifactA: 'UserAuthTests.java (Human)',
      artifactB: 'UserAuthTests.java (AI)',
      evaluationScore: null,
      timeSpent: 0,
      completedAt: null,
      reviewApproved: null
    }
  ];

  const evaluationDetails = [
    {
      id: 1,
      taskId: 1,
      artifactName: 'BubbleSort.java',
      ratings: [
        { criteria: 'READABILITY', score: 9, maxScore: 10, comment: 'Very clear variable names' },
        { criteria: 'CORRECTNESS', score: 8, maxScore: 10, comment: 'Correct implementation' },
        { criteria: 'EFFICIENCY', score: 7, maxScore: 10, comment: 'Could be optimized' },
        { criteria: 'MAINTAINABILITY', score: 9, maxScore: 10, comment: 'Well structured code' }
      ],
      annotations: 3,
      flaggedInvalid: false,
      reviewComments: 'Thorough evaluation with good insights.'
    },
    {
      id: 2,
      taskId: 2,
      artifactName: 'MergeSort.py',
      ratings: [
        { criteria: 'READABILITY', score: 10, maxScore: 10, comment: 'Excellent code clarity' },
        { criteria: 'CORRECTNESS', score: 9, maxScore: 10, comment: 'Minor edge case issue' },
        { criteria: 'EFFICIENCY', score: 10, maxScore: 10, comment: 'Optimal implementation' },
        { criteria: 'MAINTAINABILITY', score: 9, maxScore: 10, comment: 'Good modular design' }
      ],
      annotations: 5,
      flaggedInvalid: false,
      reviewComments: 'Excellent detailed analysis. Keep up the good work!'
    }
  ];

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'EXPERT': return 'error';
      case 'ADVANCED': return 'warning';
      case 'INTERMEDIATE': return 'info';
      case 'BEGINNER': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'warning';
      case 'PENDING': return 'default';
      case 'FLAGGED': return 'error';
      default: return 'default';
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const content = (
    <Container maxWidth="xl" sx={embedded ? { py: 3 } : undefined}>
            {/* Header Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <QuizIcon sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {quizResults.filter(q => q.passed).length}/{quizResults.length}
                        </Typography>
                        <Typography variant="body2">Quizzes Passed</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <AssignmentIcon sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {comparisonTasks.filter(t => t.status === 'COMPLETED').length}/{comparisonTasks.length}
                        </Typography>
                        <Typography variant="body2">Tasks Completed</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TrendingUpIcon sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {Math.round(quizResults.reduce((acc, q) => acc + (q.score / q.totalPoints), 0) / quizResults.length * 100)}%
                        </Typography>
                        <Typography variant="body2">Average Score</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Card>
              <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab icon={<QuizIcon />} label="Quiz Results" iconPosition="start" />
                <Tab icon={<AssignmentIcon />} label="Comparison Tasks" iconPosition="start" />
                <Tab icon={<RateReviewIcon />} label="Evaluation Details" iconPosition="start" />
              </Tabs>

              <CardContent sx={{ p: 3 }}>
                {/* Quiz Results Tab */}
                {currentTab === 0 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                      Competency Quiz Results
                    </Typography>
                    <Grid container spacing={3}>
                      {quizResults.map((quiz) => (
                        <Grid item xs={12} key={quiz.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {quiz.quizTitle}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {quiz.studyTitle}
                                  </Typography>
                                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Chip 
                                      label={quiz.skillLevel} 
                                      size="small" 
                                      color={getSkillLevelColor(quiz.skillLevel)}
                                    />
                                    <Chip 
                                      icon={quiz.passed ? <CheckCircleIcon /> : <CancelIcon />}
                                      label={quiz.passed ? 'PASSED' : 'FAILED'} 
                                      size="small" 
                                      color={quiz.passed ? 'success' : 'error'}
                                    />
                                  </Stack>
                                </Box>
                                <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                                  <Typography variant="h3" sx={{ fontWeight: 700, color: quiz.passed ? 'success.main' : 'error.main' }}>
                                    {quiz.score}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    out of {quiz.totalPoints}
                                  </Typography>
                                </Box>
                              </Stack>
                              
                              <Box sx={{ mb: 2 }}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography variant="body2">Score Progress</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {Math.round((quiz.score / quiz.totalPoints) * 100)}%
                                  </Typography>
                                </Stack>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={(quiz.score / quiz.totalPoints) * 100} 
                                  sx={{ height: 8, borderRadius: 1 }}
                                  color={quiz.passed ? 'success' : 'error'}
                                />
                              </Box>

                              <Divider sx={{ my: 2 }} />

                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Feedback:
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {quiz.feedback}
                              </Typography>

                              <Typography variant="caption" color="text.secondary">
                                Completed: {formatDate(quiz.completedAt)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Comparison Tasks Tab */}
                {currentTab === 1 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                      Comparison Tasks
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Study</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Artifacts</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Time Spent</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Review</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Completed</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {comparisonTasks.map((task) => (
                            <TableRow key={task.id} hover>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {task.studyTitle}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={task.comparisonType.replace('_', ' ')} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" display="block">{task.artifactA}</Typography>
                                <Typography variant="caption" display="block">{task.artifactB}</Typography>
                                {task.artifactC && (
                                  <Typography variant="caption" display="block">{task.artifactC}</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={task.status.replace('_', ' ')} 
                                  size="small" 
                                  color={getStatusColor(task.status)}
                                />
                              </TableCell>
                              <TableCell>
                                {task.evaluationScore ? (
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    {task.evaluationScore}/10
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell>{formatDuration(task.timeSpent)}</TableCell>
                              <TableCell>
                                {task.reviewApproved === true && (
                                  <Chip icon={<CheckCircleIcon />} label="Approved" size="small" color="success" />
                                )}
                                {task.reviewApproved === false && (
                                  <Chip icon={<CancelIcon />} label="Rejected" size="small" color="error" />
                                )}
                                {task.reviewApproved === null && (
                                  <Typography variant="body2" color="text.secondary">Pending</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">
                                  {formatDate(task.completedAt)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {task.status === 'COMPLETED' && (
                                  <Button 
                                    size="small" 
                                    startIcon={<VisibilityIcon />}
                                    variant="outlined"
                                  >
                                    View
                                  </Button>
                                )}
                                {task.status === 'IN_PROGRESS' && (
                                  <Button size="small" variant="contained">
                                    Continue
                                  </Button>
                                )}
                                {task.status === 'PENDING' && (
                                  <Button size="small" variant="outlined">
                                    Start
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Evaluation Details Tab */}
                {currentTab === 2 && (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                      Detailed Evaluation Feedback
                    </Typography>
                    <Grid container spacing={3}>
                      {evaluationDetails.map((evaluation) => (
                        <Grid item xs={12} key={evaluation.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {evaluation.artifactName}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                  <Chip label={`${evaluation.annotations} Annotations`} size="small" variant="outlined" />
                                  {!evaluation.flaggedInvalid && (
                                    <Chip icon={<CheckCircleIcon />} label="Valid" size="small" color="success" />
                                  )}
                                </Stack>
                              </Stack>

                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Rating Criteria:
                              </Typography>

                              <Grid container spacing={2} sx={{ mb: 3 }}>
                                {evaluation.ratings.map((rating, idx) => (
                                  <Grid item xs={12} md={6} key={idx}>
                                    <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                                      <CardContent sx={{ p: 2 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {rating.criteria.replace('_', ' ')}
                                          </Typography>
                                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            {rating.score}/{rating.maxScore}
                                          </Typography>
                                        </Stack>
                                        <LinearProgress 
                                          variant="determinate" 
                                          value={(rating.score / rating.maxScore) * 100} 
                                          sx={{ mb: 1, height: 6, borderRadius: 1 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                          {rating.comment}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>

                              <Divider sx={{ my: 2 }} />

                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Reviewer Comments:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {evaluation.reviewComments}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
    </Container>
  );

  if (embedded) {
    return content;
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>My Results & Feedback</Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

export default ResultsFeedback;
