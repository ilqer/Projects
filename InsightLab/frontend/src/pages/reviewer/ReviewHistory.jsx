import * as React from 'react';
import { evaluationReviewService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

// Import MUI components
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function ReviewHistory({ embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState('all');

  // Load history from backend
  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await evaluationReviewService.getReviewHistory();
        // DTO beklenen alanlar:
        // id, studyName, participantName, reviewDate,
        // decision ('approved' | 'rejected' | 'flagged'),
        // qualityScore (0–5), issuesFound, timeSpent
        setHistory(res.data);
      } catch (err) {
        console.error('Error loading review history', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);


  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'flagged': return 'warning';
      case 'incomplete': return 'info';
      default: return 'default';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'approved': return <CheckCircleIcon fontSize="small" />;
      case 'rejected': return <CancelIcon fontSize="small" />;
      case 'flagged': return <FlagIcon fontSize="small" />;
      case 'incomplete': return <CancelIcon fontSize="small" />;
      default: return null;
    }
  };

  // Filter by time
  const filteredHistory = React.useMemo(() => {
    if (timeFilter === 'all') return history;
    
    const now = new Date();
    const filtered = history.filter(item => {
      const reviewDate = new Date(item.reviewDate);
      const diffDays = (now - reviewDate) / (1000 * 60 * 60 * 24);
      
      switch (timeFilter) {
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case '3months':
          return diffDays <= 90;
        default:
          return true;
      }
    });
    
    return filtered;
  }, [history, timeFilter]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = filteredHistory.length;
    const approved = filteredHistory.filter(h => h.decision === 'approved').length;
    const rejected = filteredHistory.filter(h => h.decision === 'rejected').length;
    const flagged = filteredHistory.filter(h => h.decision === 'flagged').length;
    const avgQuality = total > 0 
      ? (filteredHistory.reduce((sum, h) => sum + h.qualityScore, 0) / total).toFixed(2)
      : 0;
    const totalIssues = filteredHistory.reduce((sum, h) => sum + h.issuesFound, 0);
    
    return {
      total,
      approved,
      rejected,
      flagged,
      avgQuality,
      totalIssues,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0
    };
  }, [filteredHistory]);

  const handleExport = () => {
    // Create CSV content
    const headers = ['Study Name', 'Participant', 'Review Date', 'Decision', 'Quality Score', 'Issues Found', 'Time Spent'];
    const rows = filteredHistory.map(item => [
      item.studyName,
      item.participantName,
      new Date(item.reviewDate).toLocaleString(),
      item.decision,
      item.qualityScore,
      item.issuesFound,
      item.timeSpent
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderHistoryContent = () => (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <BarChartIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total Reviews</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.50' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3">{stats.approved}</Typography>
            <Typography variant="body2" color="text.secondary">Approved</Typography>
            <Typography variant="caption" color="success.main">
              {stats.approvalRate}% approval rate
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUpIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3">{stats.avgQuality}</Typography>
            <Typography variant="body2" color="text.secondary">Avg Quality Score</Typography>
            <Typography variant="caption" color="text.secondary">
              Out of 5.0
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.50' }}>
            <FlagIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h3">{stats.flagged}</Typography>
            <Typography variant="body2" color="text.secondary">Flagged</Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.flagged} flagged, {stats.rejected} rejected
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Review History</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              select
              label="Time Period"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="3months">Last 3 Months</MenuItem>
            </TextField>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={filteredHistory.length === 0}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* History Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Loading history...
            </Typography>
          </Box>
        ) : filteredHistory.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>No review history</Typography>
            <Typography variant="body2" color="text.secondary">
              {timeFilter !== 'all' 
                ? 'No reviews found in the selected time period' 
                : 'You haven\'t completed any reviews yet'}
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Study Name</TableCell>
                  <TableCell>Participant</TableCell>
                  <TableCell>Review Date</TableCell>
                  <TableCell>Decision</TableCell>
                  <TableCell align="center">Quality Score</TableCell>
                  <TableCell align="center">Issues Found</TableCell>
                  <TableCell>Time Spent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.studyName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.participantName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(item.reviewDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.reviewDate).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getDecisionIcon(item.decision)}
                        label={item.decision.charAt(0).toUpperCase() + item.decision.slice(1)}
                        size="small"
                        color={getDecisionColor(item.decision)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="bold">
                          {item.qualityScore.toFixed(1)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(item.qualityScore / 5) * 100} 
                          sx={{ width: 60, height: 4, borderRadius: 1 }}
                          color={
                            item.qualityScore >= 4 ? 'success' : 
                            item.qualityScore >= 3 ? 'warning' : 
                            'error'
                          }
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {item.issuesFound > 0 ? (
                        <Chip 
                          label={item.issuesFound} 
                          size="small" 
                          color="warning"
                          icon={<FlagIcon />}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.timeSpent}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredHistory.length} review{filteredHistory.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </>
        )}
      </TableContainer>

      {/* Performance Insights */}
      {filteredHistory.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Performance Insights</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Review Efficiency
                </Typography>
                <Typography variant="h5" color="primary">
                  {(filteredHistory.length / Math.max(1, Math.ceil((new Date() - new Date(filteredHistory[filteredHistory.length - 1]?.reviewDate)) / (1000 * 60 * 60 * 24)))).toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reviews per day
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Quality Trend
                </Typography>
                <Typography variant="h5" color="success.main">
                  {stats.avgQuality >= 4 ? '↑ Excellent' : stats.avgQuality >= 3 ? '→ Good' : '↓ Needs Improvement'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average score: {stats.avgQuality}/5.0
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Flagged Rate
                </Typography>
                <Typography variant="h5" color="info.main">
                  {((stats.flagged / Math.max(1, stats.total)) * 100).toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.flagged} flagged in {stats.total} reviews
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );

  if (embedded) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {renderHistoryContent()}
      </Container>
    );
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
          elevation={0}
        >
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
              Review History
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: '100vh',
            pt: 3,
            pb: 6,
            px: 3,
          }}
        >
          <Toolbar />
          <Container maxWidth="xl">
            {renderHistoryContent()}
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
}
