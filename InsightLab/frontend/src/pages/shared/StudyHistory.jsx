import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

// Import MUI components
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import LinearProgress from '@mui/material/LinearProgress';
import Container from '@mui/material/Container';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GetAppIcon from '@mui/icons-material/GetApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import BugReportIcon from '@mui/icons-material/BugReport';

export default function StudyHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [studies, setStudies] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState('all');
  const [orderBy, setOrderBy] = React.useState('date');
  const [order, setOrder] = React.useState('desc');
  
  // Pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  
  // Detail dialog
  const [selectedStudy, setSelectedStudy] = React.useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);

  // Load study history
  React.useEffect(() => {
    loadStudyHistory();
  }, []);

  const loadStudyHistory = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockStudies = [
        {
          id: 1,
          studyName: 'Code Quality Comparison Study',
          description: 'Comparing AI-generated vs human-written code quality',
          role: 'Participant',
          status: 'completed',
          startDate: '2025-10-01',
          endDate: '2025-10-15',
          tasksCompleted: 12,
          totalTasks: 12,
          artifactsEvaluated: 24,
          artifactTypes: ['Source Code', 'Test Cases'],
          myContribution: {
            evaluations: 12,
            annotations: 48,
            avgTimePerTask: '15 min',
            completionRate: 100
          },
          researcherName: 'Dr. John Smith',
          participantCount: 25,
          results: {
            available: true,
            summary: 'AI-generated code showed 85% quality match with human code'
          }
        },
        {
          id: 2,
          studyName: 'UML Diagram Readability Assessment',
          description: 'Evaluating readability of different UML diagram styles',
          role: 'Researcher',
          status: 'completed',
          startDate: '2025-09-15',
          endDate: '2025-10-05',
          tasksCompleted: 150,
          totalTasks: 150,
          artifactsEvaluated: 300,
          artifactTypes: ['UML Diagrams'],
          myContribution: {
            studyCreated: true,
            participantsEnrolled: 30,
            dataCollected: '300 evaluations',
            completionRate: 100
          },
          researcherName: 'Me',
          participantCount: 30,
          results: {
            available: true,
            summary: 'Class diagrams received highest readability scores'
          }
        },
        {
          id: 3,
          studyName: 'API Documentation Comparison',
          description: 'Comparing manual vs auto-generated API documentation',
          role: 'Participant',
          status: 'in-progress',
          startDate: '2025-11-01',
          endDate: null,
          tasksCompleted: 5,
          totalTasks: 10,
          artifactsEvaluated: 10,
          artifactTypes: ['Documentation'],
          myContribution: {
            evaluations: 5,
            annotations: 20,
            avgTimePerTask: '12 min',
            completionRate: 50
          },
          researcherName: 'Dr. Jane Doe',
          participantCount: 20,
          results: {
            available: false
          }
        },
        {
          id: 4,
          studyName: 'Test Case Effectiveness Study',
          description: 'Evaluating effectiveness of different test case strategies',
          role: 'Reviewer',
          status: 'completed',
          startDate: '2025-08-20',
          endDate: '2025-09-10',
          tasksCompleted: 45,
          totalTasks: 45,
          artifactsEvaluated: 90,
          artifactTypes: ['Test Cases'],
          myContribution: {
            reviewsCompleted: 45,
            issuesIdentified: 12,
            avgReviewTime: '8 min',
            completionRate: 100
          },
          researcherName: 'Dr. Alice Brown',
          participantCount: 15,
          results: {
            available: true,
            summary: 'BDD-style tests showed higher comprehension'
          }
        },
        {
          id: 5,
          studyName: 'Requirements Document Analysis',
          description: 'Analyzing clarity and completeness of requirements',
          role: 'Participant',
          status: 'dropped',
          startDate: '2025-07-15',
          endDate: '2025-07-20',
          tasksCompleted: 2,
          totalTasks: 15,
          artifactsEvaluated: 4,
          artifactTypes: ['Requirements Documents'],
          myContribution: {
            evaluations: 2,
            annotations: 8,
            avgTimePerTask: '18 min',
            completionRate: 13
          },
          researcherName: 'Dr. Bob Wilson',
          participantCount: 25,
          results: {
            available: false
          }
        },
        {
          id: 6,
          studyName: 'Bug Report Quality Assessment',
          description: 'Evaluating quality metrics of bug reports',
          role: 'Researcher',
          status: 'in-progress',
          startDate: '2025-10-20',
          endDate: null,
          tasksCompleted: 80,
          totalTasks: 120,
          artifactsEvaluated: 160,
          artifactTypes: ['Bug Reports'],
          myContribution: {
            studyCreated: true,
            participantsEnrolled: 20,
            dataCollected: '160 evaluations',
            completionRate: 67
          },
          researcherName: 'Me',
          participantCount: 20,
          results: {
            available: false
          }
        },
        {
          id: 7,
          studyName: 'Code Refactoring Comparison',
          description: 'Comparing manual vs AI-assisted code refactoring',
          role: 'Participant',
          status: 'completed',
          startDate: '2025-06-10',
          endDate: '2025-07-05',
          tasksCompleted: 20,
          totalTasks: 20,
          artifactsEvaluated: 40,
          artifactTypes: ['Source Code'],
          myContribution: {
            evaluations: 20,
            annotations: 75,
            avgTimePerTask: '20 min',
            completionRate: 100
          },
          researcherName: 'Dr. Carol Davis',
          participantCount: 18,
          results: {
            available: true,
            summary: 'AI-assisted refactoring maintained 92% code quality'
          }
        },
      ];
      setStudies(mockStudies);
      setLoading(false);
    }, 800);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (study) => {
    setSelectedStudy(study);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedStudy(null);
  };

  const handleExportData = (study) => {
    // Simulate data export
    console.log('Exporting data for study:', study.studyName);
    alert(`Exporting data for: ${study.studyName}\nFormat: CSV`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'dropped': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'in-progress': return <PendingIcon />;
      case 'dropped': return <CancelIcon />;
      default: return <HistoryIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Researcher': return 'primary';
      case 'Participant': return 'secondary';
      case 'Reviewer': return 'warning';
      default: return 'default';
    }
  };

  const getArtifactIcon = (type) => {
    switch (type) {
      case 'Source Code': return <CodeIcon fontSize="small" />;
      case 'Test Cases': return <AssignmentIcon fontSize="small" />;
      case 'UML Diagrams': return <DescriptionIcon fontSize="small" />;
      case 'Bug Reports': return <BugReportIcon fontSize="small" />;
      default: return <DescriptionIcon fontSize="small" />;
    }
  };

  // Filter and sort logic
  const filteredStudies = React.useMemo(() => {
    let filtered = [...studies];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(study =>
        study.studyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        study.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        study.researcherName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(study => study.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(study => study.role === roleFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const studyDate = new Date();
      
      filtered = filtered.filter(study => {
        const startDate = new Date(study.startDate);
        
        switch (dateRange) {
          case 'week':
            studyDate.setDate(now.getDate() - 7);
            return startDate >= studyDate;
          case 'month':
            studyDate.setMonth(now.getMonth() - 1);
            return startDate >= studyDate;
          case 'quarter':
            studyDate.setMonth(now.getMonth() - 3);
            return startDate >= studyDate;
          case 'year':
            studyDate.setFullYear(now.getFullYear() - 1);
            return startDate >= studyDate;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'name':
          aValue = a.studyName.toLowerCase();
          bValue = b.studyName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'completion':
          aValue = (a.tasksCompleted / a.totalTasks) * 100;
          bValue = (b.tasksCompleted / b.totalTasks) * 100;
          break;
        default:
          return 0;
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [studies, searchQuery, statusFilter, roleFilter, dateRange, orderBy, order]);

  // Statistics
  const stats = React.useMemo(() => {
    const completed = studies.filter(s => s.status === 'completed').length;
    const inProgress = studies.filter(s => s.status === 'in-progress').length;
    const totalEvaluations = studies.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const totalArtifacts = studies.reduce((sum, s) => sum + s.artifactsEvaluated, 0);
    
    return {
      total: studies.length,
      completed,
      inProgress,
      dropped: studies.filter(s => s.status === 'dropped').length,
      totalEvaluations,
      totalArtifacts,
      asResearcher: studies.filter(s => s.role === 'Researcher').length,
      asParticipant: studies.filter(s => s.role === 'Participant').length,
      asReviewer: studies.filter(s => s.role === 'Reviewer').length,
    };
  }, [studies]);

  const renderContent = () => (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <HistoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h3">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Studies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h3">{stats.completed}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RateReviewIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h3">{stats.totalEvaluations}</Typography>
              <Typography variant="body2" color="text.secondary">Total Evaluations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h3">{stats.totalArtifacts}</Typography>
              <Typography variant="body2" color="text.secondary">Artifacts Evaluated</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role Distribution */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>My Participation</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="Researcher" color="primary" size="small" />
                <Typography variant="body2">{stats.asResearcher} studies</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="Participant" color="secondary" size="small" />
                <Typography variant="body2">{stats.asParticipant} studies</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="Reviewer" color="warning" size="small" />
                <Typography variant="body2">{stats.asReviewer} studies</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color="action" />
          <Typography variant="h6">Filter Studies</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search studies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="dropped">Dropped</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>My Role</InputLabel>
              <Select
                value={roleFilter}
                label="My Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="Researcher">Researcher</MenuItem>
                <MenuItem value="Participant">Participant</MenuItem>
                <MenuItem value="Reviewer">Reviewer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last 3 Months</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRoleFilter('all');
                setDateRange('all');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Showing {filteredStudies.length} of {studies.length} studies
        </Typography>
      </Paper>

      {/* Studies Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Loading study history...
            </Typography>
          </Box>
        ) : filteredStudies.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No studies found</Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || statusFilter !== 'all' || roleFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'You haven\'t participated in any studies yet'}
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                    >
                      Study Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'role'}
                      direction={orderBy === 'role' ? order : 'asc'}
                      onClick={() => handleRequestSort('role')}
                    >
                      My Role
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                    >
                      Status
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
                  <TableCell align="center">
                    <TableSortLabel
                      active={orderBy === 'completion'}
                      direction={orderBy === 'completion' ? order : 'asc'}
                      onClick={() => handleRequestSort('completion')}
                    >
                      Progress
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Artifacts</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudies
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((study) => (
                    <TableRow key={study.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {study.studyName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {study.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={study.role} 
                          size="small" 
                          color={getRoleColor(study.role)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={study.status.replace('-', ' ')} 
                          size="small" 
                          color={getStatusColor(study.status)}
                          icon={getStatusIcon(study.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(study.startDate).toLocaleDateString()}
                        </Typography>
                        {study.endDate && (
                          <Typography variant="caption" color="text.secondary">
                            to {new Date(study.endDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(study.tasksCompleted / study.totalTasks) * 100} 
                            sx={{ width: '100%', height: 6, borderRadius: 1 }}
                            color={study.status === 'completed' ? 'success' : 'primary'}
                          />
                          <Typography variant="caption">
                            {study.tasksCompleted}/{study.totalTasks} tasks
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {study.artifactTypes.map((type, idx) => (
                            <Chip 
                              key={idx}
                              label={type} 
                              size="small" 
                              variant="outlined"
                              icon={getArtifactIcon(type)}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewDetails(study)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {study.role === 'Researcher' && (
                          <Tooltip title="Export Data">
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleExportData(study)}
                            >
                              <GetAppIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredStudies.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedStudy && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">{selectedStudy.studyName}</Typography>
                <Chip 
                  label={selectedStudy.status.replace('-', ' ')} 
                  size="small" 
                  color={getStatusColor(selectedStudy.status)}
                  icon={getStatusIcon(selectedStudy.status)}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedStudy.description}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Study Details */}
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="My Role" 
                        secondary={selectedStudy.role}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Researcher" 
                        secondary={selectedStudy.researcherName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><EventIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Start Date" 
                        secondary={new Date(selectedStudy.startDate).toLocaleDateString()}
                      />
                    </ListItem>
                    {selectedStudy.endDate && (
                      <ListItem>
                        <ListItemIcon><EventIcon /></ListItemIcon>
                        <ListItemText 
                          primary="End Date" 
                          secondary={new Date(selectedStudy.endDate).toLocaleDateString()}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><AssignmentIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Tasks Completed" 
                        secondary={`${selectedStudy.tasksCompleted} / ${selectedStudy.totalTasks}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><RateReviewIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Artifacts Evaluated" 
                        secondary={selectedStudy.artifactsEvaluated}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Total Participants" 
                        secondary={selectedStudy.participantCount}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Artifact Types */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Artifact Types
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {selectedStudy.artifactTypes.map((type, idx) => (
                      <Chip 
                        key={idx}
                        label={type} 
                        size="small" 
                        icon={getArtifactIcon(type)}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* My Contribution */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    My Contribution
                  </Typography>
                  <Card variant="outlined" sx={{ mt: 1 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        {selectedStudy.role === 'Researcher' ? (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Participants Enrolled
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.participantsEnrolled}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Data Collected
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.dataCollected}
                              </Typography>
                            </Grid>
                          </>
                        ) : selectedStudy.role === 'Reviewer' ? (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Reviews Completed
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.reviewsCompleted}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Issues Identified
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.issuesIdentified}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Avg Review Time
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.avgReviewTime}
                              </Typography>
                            </Grid>
                          </>
                        ) : (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Evaluations
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.evaluations}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Annotations
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.annotations}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Avg Time per Task
                              </Typography>
                              <Typography variant="h6">
                                {selectedStudy.myContribution.avgTimePerTask}
                              </Typography>
                            </Grid>
                          </>
                        )}
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Completion Rate
                          </Typography>
                          <Typography variant="h6">
                            {selectedStudy.myContribution.completionRate}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Results */}
                {selectedStudy.results.available && (
                  <>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Study Results
                      </Typography>
                      <Card variant="outlined" sx={{ mt: 1, bgcolor: 'success.50' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <BarChartIcon color="success" />
                            <Box>
                              <Typography variant="subtitle2" color="success.main" gutterBottom>
                                Results Available
                              </Typography>
                              <Typography variant="body2">
                                {selectedStudy.results.summary}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedStudy.role === 'Researcher' && (
                <Button 
                  startIcon={<GetAppIcon />}
                  onClick={() => handleExportData(selectedStudy)}
                >
                  Export Data
                </Button>
              )}
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );

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
              Study History
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
            {renderContent()}
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
}