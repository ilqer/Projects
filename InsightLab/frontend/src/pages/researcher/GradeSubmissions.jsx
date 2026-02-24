import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Grading,
  Visibility,
  CheckCircle,
  HourglassEmpty,
  AccessTime,
  Person,
  Assignment,
  RateReview,
  PictureAsPdf,
  TableChart,
} from '@mui/icons-material';
import { gradingService } from '../../services/api';
import AppNavbar from '../components/AppNavbar';

const GradeSubmissions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allResponse, pendingResponse] = await Promise.all([
        gradingService.getSubmissions(),
        gradingService.getPendingManualGrading(),
      ]);

      setSubmissions(allResponse.data);
      setPendingSubmissions(pendingResponse.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      IN_PROGRESS: { label: 'In Progress', color: 'info', icon: <HourglassEmpty /> },
      SUBMITTED: { label: 'Submitted', color: 'warning', icon: <AccessTime /> },
      GRADED: { label: 'Graded', color: 'success', icon: <CheckCircle /> },
      RETURNED: { label: 'Returned', color: 'default', icon: <CheckCircle /> },
    };
    const config = statusConfig[status] || { label: status, color: 'default' };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      const response = await gradingService.exportGradingActionsAsPDF();
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grading_actions_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF: ' + (err.response?.data?.message || err.message));
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const response = await gradingService.exportGradingActionsAsExcel();
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grading_actions_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Failed to export Excel: ' + (err.response?.data?.message || err.message));
    } finally {
      setExportingExcel(false);
    }
  };

  const renderSubmissionsTable = (submissionsList) => {
    if (submissionsList.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No submissions found
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Participant</TableCell>
              <TableCell>Questionnaire</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Manual Grading</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissionsList.map((submission) => (
              <TableRow
                key={submission.id}
                hover
                sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
                onClick={() => navigate(`/researcher/grading/${submission.id}`)}
              >
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Person fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {submission.participantName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {submission.participantEmail}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{submission.questionnaireTitle}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Attempt #{submission.attemptNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(submission.submittedAt)}
                  </Typography>
                </TableCell>
                <TableCell align="center">{getStatusChip(submission.status)}</TableCell>
                <TableCell align="center">
                  {submission.finalScore !== null ? (
                    <Stack alignItems="center">
                      <Typography variant="body2" fontWeight={600}>
                        {submission.finalScore.toFixed(1)}%
                      </Typography>
                      {submission.passed !== null && (
                        <Chip
                          label={submission.passed ? 'PASSED' : 'FAILED'}
                          size="small"
                          color={submission.passed ? 'success' : 'error'}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Not graded
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {submission.requiresManualGrading ? (
                    <Tooltip title={`${submission.questionsRequiringGrading} question(s) need manual grading`}>
                      <Chip
                        label={`${submission.questionsRequiringGrading} pending`}
                        color="warning"
                        size="small"
                        icon={<RateReview />}
                      />
                    </Tooltip>
                  ) : (
                    <Chip label="Auto-graded" color="success" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Grade Submission">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/researcher/grading/${submission.id}`);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <AppTheme>
        <AppNavbar user={user} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <AppNavbar user={user} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Grading sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Grade Quiz Submissions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Review and grade participant quiz submissions
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={exportingPDF ? <CircularProgress size={20} /> : <PictureAsPdf />}
                onClick={handleExportPDF}
                disabled={exportingPDF || exportingExcel}
                color="error"
              >
                {exportingPDF ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="outlined"
                startIcon={exportingExcel ? <CircularProgress size={20} /> : <TableChart />}
                onClick={handleExportExcel}
                disabled={exportingPDF || exportingExcel}
                color="success"
              >
                {exportingExcel ? 'Exporting...' : 'Export Excel'}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ p: 1.5, bgcolor: 'warning.50', borderRadius: 2 }}>
                  <HourglassEmpty sx={{ color: 'warning.main' }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {pendingSubmissions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Manual Grading
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: 2 }}>
                  <Assignment sx={{ color: 'info.main' }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {submissions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: 2 }}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {submissions.filter((s) => s.status === 'GRADED' || s.status === 'RETURNED').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Graded
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Pending Manual Grading (${pendingSubmissions.length})`} />
            <Tab label={`All Submissions (${submissions.length})`} />
          </Tabs>
        </Paper>

        {/* Submissions Table */}
        <Paper>
          {currentTab === 0 && renderSubmissionsTable(pendingSubmissions)}
          {currentTab === 1 && renderSubmissionsTable(submissions)}
        </Paper>

        {/* Refresh Button */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="outlined" onClick={fetchSubmissions}>
            Refresh
          </Button>
        </Box>
      </Container>
    </AppTheme>
  );
};

export default GradeSubmissions;
