import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Menu,
  Grid,
  AppBar,
  Toolbar,
  CssBaseline
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  FileDownload,
  Visibility,
  Search as SearchIcon,
  FilterList
} from '@mui/icons-material';
import { researcherEvaluationService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

const statusColor = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'PENDING':
      return 'default';
    case 'REVIEWED':
      return 'primary';
    default:
      return 'default';
  }
};

const decisionConfig = {
  BUG: { label: 'Bug', color: 'error' },
  EXPECTED_CHANGE: { label: 'Expected Change', color: 'warning' }
};

const cloneRelationshipOptions = [
  { value: 'EXACT_COPY', label: 'Exact Copy' },
  { value: 'RENAMED_COPY', label: 'Renamed Copy' },
  { value: 'RESTRUCTURED_COPY', label: 'Restructured Copy' },
  { value: 'DIFFERENT_IMPLEMENTATION', label: 'Different Implementation' },
  { value: 'NO_RELATION', label: 'No Relation' }
];

const cloneRelationshipLabels = cloneRelationshipOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const bugSeverityOptions = ['Critical', 'Major', 'Moderate', 'Minor', 'Trivial'];
const bugReproducibleOptions = [
  { value: 'ALL', label: 'All' },
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
  { value: 'UNCLEAR', label: 'Unclear' }
];
const bugReproLabels = {
  YES: 'Yes',
  NO: 'No',
  UNCLEAR: 'Unclear'
};
const solidPrincipleOptions = [
  'Single Responsibility Principle (SRP)',
  'Open/Closed Principle (OCP)',
  'Liskov Substitution Principle (LSP)',
  'Interface Segregation Principle (ISP)',
  'Dependency Inversion Principle (DIP)',
  'None / No Violation'
];
const solidSeverityOptions = ['Critical', 'Major', 'Moderate', 'Minor', 'Very Minor'];

const EvaluationTaskSubmissions = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('participant');
  const [sortDirection, setSortDirection] = useState('asc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [bugReproFilter, setBugReproFilter] = useState('ALL');
  const [solidSeverityFilter, setSolidSeverityFilter] = useState('ALL');

  const taskTitle = submissions[0]?.taskTitle || 'Evaluation Task';
  const studyTitle = submissions[0]?.studyTitle || 'Study';
  const artifactType = submissions[0]?.artifactType;
  const isSnapshotTask = artifactType === 'SNAPSHOT';
  const isCloneTask = artifactType === 'CODE_CLONE';
  const isBugTask = artifactType === 'BUG_REPORT';
  const isSolidTask = artifactType === 'SOLID_VIOLATION';
  const decisionFilterOptions = isSnapshotTask
    ? [
        { value: 'BUG', label: 'Bug' },
        { value: 'EXPECTED_CHANGE', label: 'Expected change' },
        { value: 'UNSET', label: 'No decision' }
      ]
    : isCloneTask
      ? [
          ...cloneRelationshipOptions,
          { value: 'UNSET', label: 'No relationship' }
        ]
      : isBugTask
        ? [
            ...bugSeverityOptions.map(option => ({ value: option, label: option })),
            { value: 'UNSET', label: 'No severity' }
          ]
        : isSolidTask
          ? [
              ...solidPrincipleOptions.map(option => ({ value: option, label: option })),
              { value: 'UNSET', label: 'No principle' }
            ]
          : [];
  const decisionSelectLabel = isCloneTask
    ? 'Clone Relationship'
    : isBugTask
      ? 'Bug Severity'
      : isSolidTask
        ? 'Violated Principle'
        : 'Decision';
  const isDecisionFilterDisabled = decisionFilterOptions.length === 0;
  const decisionColumnLabel = isCloneTask
    ? 'Clone Relationship'
    : isBugTask
      ? 'Bug Severity'
      : isSolidTask
        ? 'Violated Principle'
        : 'Decision';
  const confidenceColumnLabel = isCloneTask
    ? 'Similarity'
    : isBugTask
      ? 'Reproducible?'
      : isSolidTask
        ? 'Severity'
        : 'Confidence';

  useEffect(() => {
    loadSubmissions();
  }, [taskId]);

  useEffect(() => {
    setDecisionFilter('ALL');
  }, [isSnapshotTask, isCloneTask, isBugTask, isSolidTask]);

  useEffect(() => {
    if (!isBugTask) {
      setBugReproFilter('ALL');
    }
  }, [isBugTask]);

  useEffect(() => {
    if (!isSolidTask) {
      setSolidSeverityFilter('ALL');
    }
  }, [isSolidTask]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await researcherEvaluationService.getTaskSubmissions(taskId);
      setSubmissions(response.data || []);
    } catch (err) {
      console.error('Failed to load submissions', err);
      setError('Unable to load submissions for this task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format) => {
    handleExportClose();
    try {
      const response = await researcherEvaluationService.exportTaskSubmissions(taskId, format);
      
      // Determine content type based on format
      let contentType = 'text/csv';
      if (format === 'json') {
        contentType = 'application/json';
      } else if (format === 'pdf') {
        contentType = 'application/pdf';
      } else if (format === 'xlsx' || format === 'excel') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
      
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || contentType
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'];
      let filename = `task-${taskId}-submissions.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.*)/);
        if (match && match[1]) {
          filename = match[1].replace(/"/g, '');
        }
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export submissions', err);
      setError('Unable to export submissions right now. Please try again.');
    }
  };

  const filteredSubmissions = useMemo(() => {
    let data = submissions.slice();

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((item) =>
        (item.participantName || '').toLowerCase().includes(term) ||
        (item.participantEmail || '').toLowerCase().includes(term)
      );
    }

    if (statusFilter === 'SUBMITTED') {
      data = data.filter((item) => item.submitted);
    } else if (statusFilter === 'PENDING') {
      data = data.filter((item) => item.status === 'PENDING');
    } else if (statusFilter === 'IN_PROGRESS') {
      data = data.filter((item) => item.status === 'IN_PROGRESS');
    }

    if (isSnapshotTask) {
      if (decisionFilter === 'BUG') {
        data = data.filter((item) => item.snapshotDecision === 'BUG');
      } else if (decisionFilter === 'EXPECTED_CHANGE') {
        data = data.filter((item) => item.snapshotDecision === 'EXPECTED_CHANGE');
      } else if (decisionFilter === 'UNSET') {
        data = data.filter((item) => !item.snapshotDecision);
      }
    } else if (isCloneTask) {
      if (decisionFilter === 'UNSET') {
        data = data.filter((item) => !item.cloneRelationship);
      } else if (decisionFilter !== 'ALL') {
        data = data.filter((item) => item.cloneRelationship === decisionFilter);
      }
    } else if (isBugTask) {
      if (decisionFilter === 'UNSET') {
        data = data.filter((item) => !item.bugSeverity);
      } else if (decisionFilter !== 'ALL') {
        data = data.filter((item) => item.bugSeverity === decisionFilter);
      }
      if (bugReproFilter !== 'ALL') {
        data = data.filter((item) => (item.bugReproducible || 'UNSET') === bugReproFilter);
      }
    } else if (isSolidTask) {
      if (decisionFilter === 'UNSET') {
        data = data.filter((item) => !item.solidViolatedPrinciple);
      } else if (decisionFilter !== 'ALL') {
        data = data.filter((item) => item.solidViolatedPrinciple === decisionFilter);
      }
      if (solidSeverityFilter !== 'ALL') {
        data = data.filter((item) => (item.solidViolationSeverity || 'UNSET') === solidSeverityFilter);
      }
    }

    data.sort((a, b) => {
      let aValue;
      let bValue;

      switch (sortKey) {
        case 'time':
          aValue = a.timeSpentSeconds || 0;
          bValue = b.timeSpentSeconds || 0;
          break;
        case 'submittedAt':
          aValue = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          bValue = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          break;
        default:
          aValue = (a.participantName || '').toLowerCase();
          bValue = (b.participantName || '').toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [submissions, searchTerm, statusFilter, decisionFilter, sortKey, sortDirection, isSnapshotTask, isCloneTask, isBugTask, bugReproFilter, isSolidTask, solidSeverityFilter]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const submittedCount = submissions.filter((item) => item.submitted).length;
    const bugCount = submissions.filter((item) => item.snapshotDecision === 'BUG').length;
    const expectedCount = submissions.filter((item) => item.snapshotDecision === 'EXPECTED_CHANGE').length;
    const annotationTotal = submissions.reduce((acc, item) => acc + (item.annotationCount || 0), 0);
    const cloneCounts = cloneRelationshipOptions.reduce((acc, option) => {
      acc[option.value] = submissions.filter((item) => item.cloneRelationship === option.value).length;
      return acc;
    }, {});
    const unsetCloneCount = submissions.filter((item) => !item.cloneRelationship).length;
    const bugSeverityCounts = bugSeverityOptions.reduce((acc, option) => {
      acc[option] = submissions.filter((item) => item.bugSeverity === option).length;
      return acc;
    }, {});
    const bugSeverityUnset = submissions.filter((item) => !item.bugSeverity).length;
    const bugReproCounts = {
      YES: submissions.filter((item) => item.bugReproducible === 'YES').length,
      NO: submissions.filter((item) => item.bugReproducible === 'NO').length,
      UNCLEAR: submissions.filter((item) => item.bugReproducible === 'UNCLEAR').length,
      UNSET: submissions.filter((item) => !item.bugReproducible).length
    };
    const solidPrincipleCounts = solidPrincipleOptions.reduce((acc, option) => {
      acc[option] = submissions.filter((item) => item.solidViolatedPrinciple === option).length;
      return acc;
    }, {});
    const solidPrincipleUnset = submissions.filter((item) => !item.solidViolatedPrinciple).length;
    const solidSeverityCounts = solidSeverityOptions.reduce((acc, option) => {
      acc[option] = submissions.filter((item) => item.solidViolationSeverity === option).length;
      return acc;
    }, {});
    const solidSeverityUnset = submissions.filter((item) => !item.solidViolationSeverity).length;
    return {
      total,
      submittedCount,
      pendingCount: total - submittedCount,
      bugCount,
      expectedCount,
      annotationTotal,
      cloneCounts,
      unsetCloneCount,
      bugSeverityCounts,
      bugSeverityUnset,
      bugReproCounts,
      solidPrincipleCounts,
      solidPrincipleUnset,
      solidSeverityCounts,
      solidSeverityUnset
    };
  }, [submissions]);

  const content = (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Task Submissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {taskTitle} • {studyTitle}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={loadSubmissions}>
            <Refresh />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportClick}
          >
            Export
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => handleExport('csv')}>Download CSV</MenuItem>
            <MenuItem onClick={() => handleExport('json')}>Download JSON</MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>Download PDF</MenuItem>
            <MenuItem onClick={() => handleExport('xlsx')}>Download Excel (XLSX)</MenuItem>
          </Menu>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Assignments</Typography>
            <Typography variant="h5" fontWeight={700}>{stats.submittedCount}/{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Submitted</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Pending</Typography>
            <Typography variant="h5" fontWeight={700}>{stats.pendingCount}</Typography>
            <Typography variant="body2" color="text.secondary">Not yet submitted</Typography>
          </Paper>
        </Grid>
        {isSnapshotTask && (
          <>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Bug Decisions</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.bugCount}</Typography>
                <Typography variant="body2" color="text.secondary">Reported regressions</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Expected Changes</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.expectedCount}</Typography>
                <Typography variant="body2" color="text.secondary">Benign differences</Typography>
              </Paper>
            </Grid>
          </>
        )}
        {isCloneTask && cloneRelationshipOptions.map((option) => (
          <Grid item xs={12} sm={6} md={3} key={option.value}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{option.label}</Typography>
              <Typography variant="h5" fontWeight={700}>
                {stats.cloneCounts?.[option.value] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Responses</Typography>
            </Paper>
          </Grid>
        ))}
        {isCloneTask && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">No Relationship Selected</Typography>
              <Typography variant="h5" fontWeight={700}>{stats.unsetCloneCount || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Participants skipped</Typography>
            </Paper>
          </Grid>
        )}
        {isBugTask && bugSeverityOptions.map((option) => (
          <Grid item xs={12} sm={6} md={3} key={option}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{option}</Typography>
              <Typography variant="h5" fontWeight={700}>{stats.bugSeverityCounts?.[option] || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Reports</Typography>
            </Paper>
          </Grid>
        ))}
        {isBugTask && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">No Severity Selected</Typography>
              <Typography variant="h5" fontWeight={700}>{stats.bugSeverityUnset || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Participants skipped</Typography>
            </Paper>
          </Grid>
        )}
        {isBugTask && ['YES', 'NO', 'UNCLEAR'].map((value) => (
          <Grid item xs={12} sm={6} md={3} key={value}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {`Reproducible: ${bugReproLabels[value]}`}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {stats.bugReproCounts?.[value] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">Reports</Typography>
            </Paper>
          </Grid>
        ))}
        {isSolidTask && solidPrincipleOptions.map((option) => (
          <Grid item xs={12} sm={6} md={3} key={option}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{option}</Typography>
              <Typography variant="h5" fontWeight={700}>{stats.solidPrincipleCounts?.[option] || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Responses</Typography>
            </Paper>
          </Grid>
        ))}
        {isSolidTask && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">No Principle Selected</Typography>
              <Typography variant="h5" fontWeight={700}>{stats.solidPrincipleUnset || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Participants skipped</Typography>
            </Paper>
          </Grid>
        )}
        {isSolidTask && solidSeverityOptions.map((option) => (
          <Grid item xs={12} sm={6} md={3} key={option}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">{`Severity: ${option}`}</Typography>
              <Typography variant="h5" fontWeight={700}>{stats.solidSeverityCounts?.[option] || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Reports</Typography>
            </Paper>
          </Grid>
        ))}
        {isSolidTask && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">No Severity Selected</Typography>
              <Typography variant="h5" fontWeight={700}>{stats.solidSeverityUnset || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Participants skipped</Typography>
            </Paper>
          </Grid>
        )}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Annotations</Typography>
            <Typography variant="h5" fontWeight={700}>{stats.annotationTotal}</Typography>
            <Typography variant="body2" color="text.secondary">Total notes & highlights</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }} elevation={0}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              placeholder="Search participant"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              fullWidth
            />
            <FormControl sx={{ minWidth: 200 }} disabled={isDecisionFilterDisabled}>
              <InputLabel id="decision-filter-label">{decisionSelectLabel}</InputLabel>
              <Select
                labelId="decision-filter-label"
                label={decisionSelectLabel}
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                {decisionFilterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {isBugTask && (
              <ToggleButtonGroup
                value={bugReproFilter}
                exclusive
                onChange={(_, value) => value && setBugReproFilter(value)}
                size="small"
                color="primary"
              >
                {bugReproducibleOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
            {isSolidTask && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="solid-severity-filter-label">Violation Severity</InputLabel>
                <Select
                  labelId="solid-severity-filter-label"
                  label="Violation Severity"
                  value={solidSeverityFilter}
                  onChange={(e) => setSolidSeverityFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  {solidSeverityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                  <MenuItem value="UNSET">Not specified</MenuItem>
                </Select>
              </FormControl>
            )}
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="sort-key-label">Sort by</InputLabel>
              <Select
                labelId="sort-key-label"
                label="Sort by"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <MenuItem value="participant">Participant</MenuItem>
                <MenuItem value="time">Time spent</MenuItem>
                <MenuItem value="submittedAt">Submission date</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={sortDirection}
              exclusive
              onChange={(_, value) => value && setSortDirection(value)}
              size="small"
              color="primary"
            >
              <ToggleButton value="asc">Asc</ToggleButton>
              <ToggleButton value="desc">Desc</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterList fontSize="small" color="action" />
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(_, value) => value && setStatusFilter(value)}
              size="small"
              color="primary"
            >
              <ToggleButton value="ALL">All</ToggleButton>
              <ToggleButton value="SUBMITTED">Submitted</ToggleButton>
              <ToggleButton value="IN_PROGRESS">In Progress</ToggleButton>
              <ToggleButton value="PENDING">Pending</ToggleButton>
            </ToggleButtonGroup>
            <Button onClick={() => {
              setStatusFilter('ALL');
              setDecisionFilter('ALL');
              setBugReproFilter('ALL');
              setSolidSeverityFilter('ALL');
              setSearchTerm('');
              setSortKey('participant');
              setSortDirection('asc');
            }}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {filteredSubmissions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No submissions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Adjust your filters or wait for participants to submit their evaluations.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>Participant</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>{decisionColumnLabel}</strong></TableCell>
                <TableCell align="center"><strong>{confidenceColumnLabel}</strong></TableCell>
                <TableCell align="center"><strong>Time Spent</strong></TableCell>
                <TableCell align="center"><strong>Submitted At</strong></TableCell>
                <TableCell align="center"><strong>Annotations</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((submission) => {
                const decisionInfo = isSnapshotTask ? decisionConfig[submission.snapshotDecision] || null : null;
                const severityLabel = submission.bugSeverity || '—';
                const reproducibleLabel = submission.bugReproducible
                  ? bugReproLabels[submission.bugReproducible] || submission.bugReproducible
                  : '—';
                const solidSeverityLabel = submission.solidViolationSeverity || '—';
                return (
                  <TableRow key={submission.assignmentId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {submission.participantName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {submission.participantEmail}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={submission.status}
                        color={statusColor(submission.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {isCloneTask ? (
                        submission.cloneRelationship ? (
                          <Chip
                            label={cloneRelationshipLabels[submission.cloneRelationship] || submission.cloneRelationship}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )
                      ) : isBugTask ? (
                        <Typography variant="body2">
                          {severityLabel}
                        </Typography>
                      ) : decisionInfo ? (
                        <Chip label={decisionInfo.label} color={decisionInfo.color} size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {isCloneTask
                          ? (submission.cloneSimilarity !== undefined && submission.cloneSimilarity !== null
                              ? `${submission.cloneSimilarity}%`
                              : '—')
                          : isBugTask
                            ? reproducibleLabel
                            : isSolidTask
                              ? solidSeverityLabel
                              : (submission.snapshotConfidence || '—')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDuration(submission.timeSpentSeconds)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDateTime(submission.submittedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={submission.annotationCount || 0} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Visibility />}
                        disabled={!submission.submitted}
                        onClick={() => navigate(`/researcher/evaluation-tasks/${taskId}/submissions/${submission.assignmentId}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(`/researcher/evaluation-tasks/${taskId}`)} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                Task Submissions
              </Typography>
              <ColorModeSelect />
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
            <Toolbar />
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => {
              const studyId = submissions[0]?.studyId;
              studyId ? navigate(`/researcher/study/${studyId}/evaluation-tasks`) : navigate('/researcher/evaluation-tasks');
            }} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Task Submissions
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

export default EvaluationTaskSubmissions;
