import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box, Typography, Grid, Card, CardContent, CardActions,
  Button, Chip, Stack, Divider, CircularProgress, Container,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon, Assessment as AssessmentIcon, People as PeopleIcon,
  Folder as FolderIcon, TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon, AutoAwesome as AutoAwesomeIcon, Quiz as QuizIcon,
} from '@mui/icons-material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { studyService } from '../../../services/api';
import { artifactService } from '../../../services/artifactService';
import ArtifactUploader from '../../../components/ArtifactUploader';
import MyStudies from './MyStudies';
import ResearcherArtifacts from './ResearcherArtifacts';
import QuestionnaireList from '../questionnaires/QuestionnaireList';
import AIArtifactApproval from '../AIArtifactApproval';
import AIQuestionApproval from '../AIQuestionApproval';

const ResearcherOverview = ({ user, initialTab = 0, onTabChange }) => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState(null);

  // Update tab when initialTab changes
  React.useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  // Artifact states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadArtifacts();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [studiesResponse, overviewResponse] = await Promise.all([
        studyService.getMyStudies(),
        studyService.getDashboardOverview()
      ]);
      setStudies(studiesResponse.data);
      setDashboardStats(overviewResponse.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudies = async () => {
    try {
      const response = await studyService.getMyStudies();
      setStudies(response.data);
    } catch (err) {
      console.error('Error loading studies:', err);
      setError('Failed to load studies');
    }
  };

  const loadArtifacts = async () => {
    try {
      setLoadingArtifacts(true);
      const res = await artifactService.getMyArtifacts();
      setArtifacts(res.data || []);
    } catch (e) {
      console.error('Error loading artifacts:', e);
    } finally {
      setLoadingArtifacts(false);
    }
  };


  const handleArtifactDeleted = (id) => {
    setArtifacts((list) => list.filter((a) => a.id !== id));
  };

  const activeStudies = studies.filter(study => study.status === 'ACTIVE' && study.isActive);
  const draftStudies = studies.filter(study => study.status === 'DRAFT');

  const stats = dashboardStats ? {
    totalStudies: dashboardStats.totalStudies,
    activeStudies: dashboardStats.activeStudies,
    draftStudies: dashboardStats.draftStudies,
    totalParticipants: dashboardStats.totalParticipants,
    totalArtifacts: dashboardStats.totalArtifacts,
    averageCompletionRate: dashboardStats.averageCompletionRate,
    averageRating: dashboardStats.averageRating,
  } : {
    totalStudies: studies.length,
    activeStudies: activeStudies.length,
    draftStudies: draftStudies.length,
    totalParticipants: 0,
    totalArtifacts: artifacts.length,
    averageCompletionRate: 0,
    averageRating: 0,
  };

  const calculateProgress = (study) => {
    if (!study.startDate) return 0;
    if (!study.endDate) return 50;
    const start = new Date(study.startDate);
    const end = new Date(study.endDate);
    const now = new Date();
    if (now < start) return 0;
    if (now > end) return 100;
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const formatDaysRemaining = (daysRemaining) => {
    if (daysRemaining === null || daysRemaining === undefined) return 'No deadline';
    if (daysRemaining < 0) return 'Ended';
    if (daysRemaining === 0) return 'Ends today';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };

  const renderOverviewTab = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { label: 'Total Studies', value: stats.totalStudies, icon: FolderIcon, color: 'primary', badge: `${stats.draftStudies} drafts` },
              { label: 'Active Studies', value: stats.activeStudies, icon: AssessmentIcon, color: 'success', badge: <TrendingUpIcon sx={{ fontSize: 20 }} /> },
              { label: 'Total Participants', value: stats.totalParticipants, icon: PeopleIcon, color: 'info', badge: `${stats.averageCompletionRate}% avg completion` }
            ].map((stat, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: 1,
                    borderColor: 'divider',
                    transition: 'all 0.3s',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.50`, display: 'flex' }}>
                        <stat.icon sx={{ fontSize: 28, color: `${stat.color}.main` }} />
                      </Box>
                      {typeof stat.badge === 'string' ? (
                        <Chip label={stat.badge} size="small" color={stat.color} variant="outlined" />
                      ) : stat.badge}
                    </Stack>
                    <Typography variant="h3" fontWeight={700} mb={0.5}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card elevation={0} sx={{ mb: 4, border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/researcher/create-study')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                >
                  Create New Study
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setUploadOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Upload Artifact
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/researcher/ai-generator')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  AI Artifact Generator
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AssessmentIcon />}
                  onClick={() => setCurrentTab(2)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Manage Questionnaires
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<BarChartIcon />}
                  onClick={() => navigate('/researcher/statistics')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  View Statistics
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {activeStudies.length > 0 ? 'Active Studies' : 'Your Studies'}
            </Typography>
            <Stack direction="row" spacing={1}>
              {onTabChange && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onTabChange('Studies')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Go to Studies
                </Button>
              )}
            </Stack>
          </Stack>

          {studies.length === 0 ? (
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" mb={2}>
                No studies yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first study to get started
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/researcher/create-study')}>
                Create New Study
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {(activeStudies.length > 0 ? activeStudies : studies).slice(0, 3).map((study) => {
                const progress = calculateProgress(study);
                return (
                  <Grid item xs={12} md={6} lg={4} key={study.id}>
                    <Card
                      elevation={0}
                      onClick={() => navigate(`/researcher/study/${study.id}`)}
                      sx={{
                        height: '100%',
                        border: 1,
                        borderColor: 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 4, transform: 'translateY(-4px)', borderColor: 'primary.main' }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight={600} noWrap title={study.title}>
                          {study.title}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ my: 2 }}>
                          <Chip
                            label={study.status}
                            color={study.status === 'ACTIVE' ? 'success' : study.status === 'DRAFT' ? 'warning' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          {study.endDate && (
                            <Chip label={formatDaysRemaining(study.daysRemaining)} variant="outlined" size="small" />
                          )}
                        </Stack>
                        <Box sx={{ mb: 2 }}>
                          <Stack direction="row" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              Progress
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {progress}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover' }}
                          />
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {study.objective || study.description || 'No description'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
              {studies.length > 3 && (
                <Grid item xs={12} md={6} lg={4}>
                  <Card
                    elevation={0}
                    onClick={() => onTabChange ? onTabChange('Studies') : navigate('/researcher/studies')}
                    sx={{
                      height: '100%',
                      border: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200,
                      transition: 'all 0.3s',
                      '&:hover': { boxShadow: 4, borderColor: 'primary.main' }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight={700}>
                        +{studies.length - 3}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        more studies
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* Upload modal */}
          <ArtifactUploader
            open={uploadOpen}
            onClose={() => setUploadOpen(false)}
            onUploaded={() => loadArtifacts()}
          />

          {/* Uploaded artifacts section - detailed grid layout */}
          <Box sx={{ mt: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Uploaded Artifacts
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setUploadOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Upload
                </Button>
                {onTabChange && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onTabChange('Artifacts')}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Go to Artifacts
                  </Button>
                )}
              </Stack>
            </Stack>

            {loadingArtifacts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : artifacts.length === 0 ? (
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" mb={2}>
                  No artifacts yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Upload your first artifact to get started
                </Typography>
                <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setUploadOpen(true)}>
                  Upload Artifact
                </Button>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {artifacts.slice(0, 3).map((artifact) => {
                  const fileSize = artifact.sizeBytes
                    ? artifact.sizeBytes > 1024 * 1024
                      ? `${(artifact.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                      : `${(artifact.sizeBytes / 1024).toFixed(1)} KB`
                    : 'Unknown size';
                  const uploadDate = artifact.createdAt
                    ? new Date(artifact.createdAt).toLocaleDateString()
                    : 'Unknown date';
                  return (
                    <Grid item xs={12} md={6} lg={4} key={artifact.id}>
                      <Card
                        elevation={0}
                        onClick={() => navigate(`/researcher/artifact/${artifact.id}`)}
                        sx={{
                          height: '100%',
                          border: 1,
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          '&:hover': { boxShadow: 4, transform: 'translateY(-4px)', borderColor: 'primary.main' }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom fontWeight={600} noWrap title={artifact.originalFilename || artifact.displayLabel}>
                            {artifact.originalFilename || artifact.displayLabel || 'Untitled'}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ my: 2 }}>
                            <Chip
                              label={artifact.contentType?.split('/')[1]?.toUpperCase() || 'FILE'}
                              color="primary"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                            <Chip
                              label={fileSize}
                              variant="outlined"
                              size="small"
                            />
                          </Stack>
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                Uploaded
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {uploadDate}
                              </Typography>
                            </Stack>
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {artifact.description || artifact.contentType || 'No description'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
                {artifacts.length > 3 && (
                  <Grid item xs={12} md={6} lg={4}>
                    <Card
                      elevation={0}
                      onClick={() => onTabChange ? onTabChange('Artifacts') : null}
                      sx={{
                        height: '100%',
                        border: 1,
                        borderColor: 'divider',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 200,
                        transition: 'all 0.3s',
                        '&:hover': { boxShadow: 4, borderColor: 'primary.main' }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary" fontWeight={700}>
                          +{artifacts.length - 3}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          more artifacts
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </>
      );
  };

  const renderAIArtifactsTab = () => {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          AI Artifact Management
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', transition: 'all 0.3s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', display: 'inline-flex', mb: 2 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  AI Artifact Generator
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Generate artifacts using AI to accelerate your research process
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<AutoAwesomeIcon />}
                  onClick={() => navigate('/researcher/ai-generator')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Generate Artifacts
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
        
        {/* AI Artifact Approval Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Pending Artifact Approvals
          </Typography>
          <AIArtifactApproval embedded={true} />
        </Box>
      </Box>
    );
  };

  const renderAIQuestionsTab = () => {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          AI Question Management
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider', transition: 'all 0.3s', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50', display: 'inline-flex', mb: 2 }}>
                  <QuizIcon sx={{ fontSize: 28, color: 'success.main' }} />
                </Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  AI Question Generator
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Generate questionnaire questions using AI
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<QuizIcon />}
                  onClick={() => navigate('/researcher/ai-questions')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Generate Questions
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
        
        {/* AI Question Approval Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Pending Question Approvals
          </Typography>
          <AIQuestionApproval embedded={true} />
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tab Content */}
      {currentTab === 0 && renderOverviewTab()}
      {currentTab === 1 && <MyStudies user={user} />}
      {currentTab === 2 && <ResearcherArtifacts />}
      {currentTab === 3 && <QuestionnaireList embedded={true} />}
      {currentTab === 4 && renderAIArtifactsTab()}
      {currentTab === 5 && renderAIQuestionsTab()}
    </Container>
  );
};

export default ResearcherOverview;
