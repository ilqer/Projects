import { reviewerAssignmentService } from '../../services/api';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

// MUI
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FlagIcon from '@mui/icons-material/Flag';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export default function AssignedReviews({ embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [orderBy, setOrderBy] = React.useState('date');
  const [order, setOrder] = React.useState('desc');

  // ---------- Helper: backend DTO -> UI row ----------
  const mapAssignment = (a) => {
    // Status mapping:
    // PENDING -> 'pending'
    // ACCEPTED / IN_PROGRESS -> 'in-progress'
    // COMPLETED -> 'completed'
    // DECLINED -> satırı göstermeyelim (null döndürüp sonra filter(Boolean))
    let status;
    switch (a.status) {
      case 'PENDING':
        status = 'pending';
        break;
      case 'COMPLETED':
        status = 'completed';
        break;
      case 'DECLINED':
        return null; // listede göstermiyoruz
      case 'ACCEPTED':
      case 'IN_PROGRESS':
      default:
        status = 'in-progress';
    }

    // Eğer flaggedEvaluations > 0 ise ve completed değilse, status'i 'flagged' yapalım
    const flaggedCount = a.flaggedEvaluations ?? 0;
    if (flaggedCount > 0 && status !== 'completed') {
      status = 'flagged';
    }

    return {
      studyId: a.studyId,
      id: a.id,
      studyName: a.studyTitle || 'Untitled study',
      // Participant yok, assign eden researcher’ı burada gösteriyoruz
      participantName: a.assignedByName || 'Study owner',
      participantEmail: a.reviewerEmail || '',
      evaluationDate: a.assignedAt,
      status, // 'pending' | 'in-progress' | 'completed' | 'flagged'
      priority: 'medium', // şimdilik sabit
      completeness: a.progressPercentage ?? 0,
      participantsCount: a.totalParticipants ?? 0,
      issuesFound: flaggedCount,
    };
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await reviewerAssignmentService.getMyAssignments();
      const mapped = (res.data || [])
        .map(mapAssignment)
        .filter(Boolean); // DECLINED olanları atmıştık
      setReviews(mapped);
    } catch (err) {
      console.error('Error loading assigned reviews', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAssignments();
  }, []);

  // ---------- Accept / Decline ----------
  const handleAccept = async (id) => {
    try {
      await reviewerAssignmentService.acceptAssignment(id);
      await loadAssignments(); // status in-progress olur, listede kalır
    } catch (err) {
      console.error('Error accepting assignment', err);
      alert(err.response?.data?.message || 'Failed to accept assignment');
    }
  };

  const handleDecline = async (id) => {
    const reason = window.prompt('Reason for declining? (optional)');
    try {
      await reviewerAssignmentService.declineAssignment(id, reason || null);
      await loadAssignments(); // DECLINED olan listeden düşer
    } catch (err) {
      console.error('Error declining assignment', err);
      alert(err.response?.data?.message || 'Failed to decline assignment');
    }
  };

  // ---------- Sort / Filter helpers ----------
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in-progress': return 'info';
      case 'completed': return 'success';
      case 'flagged': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  // Filter and sort logic
  const filteredReviews = React.useMemo(() => {
    let filtered = [...reviews];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.studyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.participantEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(review => review.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(review => review.priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'study':
          aValue = a.studyName;
          bValue = b.studyName;
          break;
        case 'participant':
          aValue = a.participantName;
          bValue = b.participantName;
          break;
        case 'date':
          aValue = new Date(a.evaluationDate);
          bValue = new Date(b.evaluationDate);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'completeness':
          aValue = a.completeness;
          bValue = b.completeness;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [reviews, searchQuery, statusFilter, priorityFilter, orderBy, order]);

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    inProgress: reviews.filter(r => r.status === 'in-progress').length,
    completed: reviews.filter(r => r.status === 'completed').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
  };

  const renderReviewsContent = () => (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      {/* Statistics Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Review Summary</Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2 }}>
          <Box>
            <Typography variant="h4" color="primary">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total Reviews</Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="info.main">{stats.inProgress}</Typography>
            <Typography variant="body2" color="text.secondary">In Progress</Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="success.main">{stats.completed}</Typography>
            <Typography variant="body2" color="text.secondary">Completed</Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.main">{stats.flagged}</Typography>
            <Typography variant="body2" color="text.secondary">Flagged</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon />
          <Typography variant="h6">Filters & Search</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by study, participant, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Showing {filteredReviews.length} of {reviews.length} reviews
        </Typography>
      </Paper>

      {/* Reviews Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Loading reviews...
            </Typography>
          </Box>
        ) : filteredReviews.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>No reviews found</Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No reviews have been assigned to you yet'}
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'study'}
                    direction={orderBy === 'study' ? order : 'asc'}
                    onClick={() => handleRequestSort('study')}
                  >
                    Study Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'participant'}
                    direction={orderBy === 'participant' ? order : 'asc'}
                    onClick={() => handleRequestSort('participant')}
                  >
                    Assigned By
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'date'}
                    direction={orderBy === 'date' ? order : 'asc'}
                    onClick={() => handleRequestSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleRequestSort('status')}
                  >
                    Study Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'priority'}
                    direction={orderBy === 'priority' ? order : 'asc'}
                    onClick={() => handleRequestSort('priority')}
                  >
                    Priority
                  </TableSortLabel>
                </TableCell>
                <TableCell>Participants</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {review.studyName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{review.participantName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {review.participantEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(review.evaluationDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(review.evaluationDate).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={review.status.replace('-', ' ')} 
                      size="small" 
                      color={getStatusColor(review.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={review.priority} 
                      size="small" 
                      color={getPriorityColor(review.priority)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={review.participantsCount} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    {review.status === 'pending' ? (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          color="success"
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleAccept(review.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<CloseIcon />}
                          onClick={() => handleDecline(review.id)}
                        >
                          Decline
                        </Button>
                      </Stack>
                    ) : (
                      <Tooltip title="Open reviewer workspace">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={!review.studyId}
                            onClick={() =>
                              navigate(`/reviewer/studies/${review.studyId}/reviewer-dashboard`)
                            }
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );

  if (embedded) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {renderReviewsContent()}
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
            <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
              Assigned Reviews
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
            {renderReviewsContent()}
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
}
