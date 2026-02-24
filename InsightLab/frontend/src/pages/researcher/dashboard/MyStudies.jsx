import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Grid, Card, CardContent, CardActions,
  Button, Chip, Stack, TextField, InputAdornment, IconButton,
  CircularProgress, Alert, Divider, Paper, Tabs, Tab, LinearProgress, Tooltip
} from '@mui/material';
import {
  Search as SearchIcon, Clear as ClearIcon, Edit as EditIcon,
  Visibility as VisibilityIcon, Add as AddIcon,
  CalendarToday as CalendarIcon, People as PeopleIcon, Group as GroupIcon
} from '@mui/icons-material';

import { studyService } from '../../../services/api';

const MyStudies = ({ user }) => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);
  const [archivedStudies, setArchivedStudies] = useState([]);
  const [filteredStudies, setFilteredStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState(0); // 0: All, 1: Draft, 2: Active, 3: Completed, 4: Other, 5: Archived

  useEffect(() => {
    loadStudies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [studies, archivedStudies, searchQuery, activeTabFilter]);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const [activeResponse, archivedResponse] = await Promise.all([
        studyService.getMyStudies(),
        studyService.getArchivedStudies()
      ]);
      setStudies(activeResponse.data);
      setArchivedStudies(archivedResponse.data);
    } catch (err) {
      console.error('Error loading studies:', err);
      setError('Failed to load studies');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Start with archived studies if on archived tab, otherwise use active studies
    let filtered = activeTabFilter === 5 ? [...archivedStudies] : [...studies];

    // Apply tab filter (only for non-archived tabs)
    if (activeTabFilter !== 5) {
      switch (activeTabFilter) {
        case 1:
          filtered = filtered.filter(s => s.status === 'DRAFT');
          break;
        case 2:
          filtered = filtered.filter(s => s.status === 'ACTIVE');
          break;
        case 3:
          filtered = filtered.filter(s => s.status === 'COMPLETED');
          break;
        case 4:
          filtered = filtered.filter(s => ['PAUSED', 'CANCELLED'].includes(s.status));
          break;
        default:
          // Show all
          break;
      }
    }


    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.objective?.toLowerCase().includes(query)
      );
    }

    setFilteredStudies(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      ACTIVE: 'success',
      COMPLETED: 'info',
      PAUSED: 'warning',
      CANCELLED: 'error',
      ARCHIVED: 'secondary',
    };
    return colors[status] || 'default';
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const studyCounts = {
    all: studies.length,
    draft: studies.filter(s => s.status === 'DRAFT').length,
    active: studies.filter(s => s.status === 'ACTIVE').length,
    completed: studies.filter(s => s.status === 'COMPLETED').length,
    other: studies.filter(s => ['PAUSED', 'CANCELLED'].includes(s.status)).length,
    archived: archivedStudies.length,
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              My Studies
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and monitor all your research studies
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/researcher/create-study')}
            size="large"
          >
            Create New Study
          </Button>
        </Stack>
      </Box>

      {/* Tab Filters */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTabFilter} 
          onChange={(e, v) => setActiveTabFilter(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All (${studyCounts.all})`} />
          <Tab label={`Draft (${studyCounts.draft})`} />
          <Tab label={`Active (${studyCounts.active})`} />
          <Tab label={`Completed (${studyCounts.completed})`} />
          <Tab label={`Other (${studyCounts.other})`} />
          <Tab label={`Archived (${studyCounts.archived})`} />
        </Tabs>
      </Paper>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search studies by title, description, or objective..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} edge="end" size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Studies Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredStudies.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery || activeTabFilter !== 0
              ? 'No studies match your filters'
              : 'No studies yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || activeTabFilter !== 0
              ? 'Try adjusting your search or filters'
              : 'Create your first study to get started'}
          </Typography>
          {!searchQuery && activeTabFilter === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/researcher/create-study')}
            >
              Create New Study
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredStudies.length} of {activeTabFilter === 5 ? archivedStudies.length : studies.length} studies
          </Typography>
          <Grid container spacing={3}>
            {filteredStudies.map((study) => {
              const progress = calculateProgress(study);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={study.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      '&:hover': { boxShadow: 6 },
                      transition: 'box-shadow 0.3s'
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Chip 
                          label={study.status} 
                          color={getStatusColor(study.status)} 
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {study.daysRemaining !== null && study.status === 'ACTIVE' && (
                          <Chip
                            icon={<CalendarIcon />}
                            label={formatDaysRemaining(study.daysRemaining)}
                            size="small"
                            color={study.daysRemaining < 7 ? 'error' : 'default'}
                            variant="outlined"
                          />
                        )}
                      </Stack>

                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {study.title}
                      </Typography>

                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {study.objective || study.description || 'No description'}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            Start Date:
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {formatDate(study.startDate)}
                          </Typography>
                        </Stack>
                        {study.endDate && (
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              End Date:
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                              {formatDate(study.endDate)}
                            </Typography>
                          </Stack>
                        )}
                        {study.maxParticipants && (
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Max Participants:
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                              {study.maxParticipants}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>

                      {study.status === 'ACTIVE' && study.endDate && (
                        <Box sx={{ mt: 2 }}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="caption" fontWeight={600}>
                              {progress}%
                            </Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 1,
                              bgcolor: 'action.hover'
                            }}
                          />
                        </Box>
                      )}
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1}>

                      {/* Participants */}
                      <Button
                        size="small"
                        startIcon={<PeopleIcon />}
                        onClick={() => navigate(`/researcher/study/${study.id}/participants`)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        variant="outlined"
                      >
                        Participants
                      </Button>

                      {/* Reviewers */}
                      <Button
                        size="small"
                        startIcon={<GroupIcon />}
                        onClick={() => navigate(`/researcher/study/${study.id}/reviewers`)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        variant="outlined"
                      >
                        Reviewers
                      </Button>

                      {/* View */}
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/researcher/study/${study.id}`)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        View
                      </Button>

                    </Stack>

                    <Tooltip
                      title={
                        study.status === 'COMPLETED' || study.status === 'CANCELLED'
                          ? `Cannot edit ${study.status.toLowerCase()} studies`
                          : ''
                      }
                    >
                      <span>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/researcher/study/${study.id}/edit`)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                          disabled={study.status === 'COMPLETED' || study.status === 'CANCELLED'}
                        >
                          Edit
                        </Button>
                      </span>
                    </Tooltip>
                  </CardActions>

                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default MyStudies;
