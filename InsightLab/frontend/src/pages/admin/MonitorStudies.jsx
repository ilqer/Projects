// MonitorStudies.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studyService } from '../../services/api';

import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';

import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';

import LinearProgress from '@mui/material/LinearProgress';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import TodayIcon from '@mui/icons-material/Today';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import PercentIcon from '@mui/icons-material/Percent';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

const statusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return 'success';
    case 'DRAFT': return 'default';
    case 'ARCHIVED': return 'warning';
    case 'PAUSED': return 'info';
    case 'COMPLETED': return 'primary';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

// ✅ timezone yoksa UTC kabul et (3 saat geride görünme bug'ını düzeltir)
const parseIsoAssumeUtcIfNoTz = (iso) => {
  if (!iso) return null;
  const hasTz = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso + 'Z');
};

function formatDate(d) {
  if (!d) return 'N/A';
  const dateObj = parseIsoAssumeUtcIfNoTz(d);
  if (!dateObj || Number.isNaN(dateObj.getTime())) return 'N/A';
  return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const formatDateTimeLocal = (iso) => {
  const d = parseIsoAssumeUtcIfNoTz(iso);
  if (!d || Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(); // local timezone (TR)
};

export default function MonitorStudies({ embedded = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    loadStudies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      loadStudies(true);
    }, 30000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // -------------------------
  // CSV helpers
  // -------------------------
  const toCsvValue = (v) => {
    if (v === null || v === undefined) return '""';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const downloadCsv = (filename, rows) => {
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const formatIsoForCsv = (iso) => {
    if (!iso) return '';
    const hasTz = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso);
    const d = new Date(hasTz ? iso : iso + 'Z');
    return Number.isNaN(d.getTime()) ? iso : d.toISOString();
  };

  const handleExportStudiesCsv = (data) => {
    const header = [
      'ID',
      'Title',
      'OwnerName',
      'OwnerId',
      'Status',
      'StartDate',
      'Deadline',
      'CompletionPct',
      'LastUpdate',
      'ParticipantsActive',
      'ParticipantsAssigned',
    ];

    const rows = (data || []).map((s) => [
      toCsvValue(s.id),
      toCsvValue(s.title),
      toCsvValue(s.owner?.name || ''),
      toCsvValue(s.owner?.id || ''),
      toCsvValue(s.status || ''),
      toCsvValue(formatIsoForCsv(s.startDate)),
      toCsvValue(formatIsoForCsv(s.deadline)),
      toCsvValue(s.completionPct ?? ''),
      toCsvValue(formatIsoForCsv(s.lastUpdate)),
      toCsvValue(s.participants?.active ?? ''),
      toCsvValue(s.participants?.assigned ?? ''),
    ]);

    downloadCsv(
      `studies_${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows]
    );
  };

  // -------------------------
  // Data load
  // -------------------------
  const loadStudies = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);

      const response = await studyService.getAllStudies();

      const transformedStudies = (response.data || []).map((study) => ({
        id: study.id,
        title: study.title,
        owner: {
          id: study.researcherId,
          name: study.researcherName,
        },
        status: study.status,
        participants: {
          assigned: study.maxParticipants || 0,
          active: 0, // TODO: actual participant data
        },
        startDate: study.startDate,
        deadline: study.endDate,
        completionPct: calculateCompletion(study),
        lastUpdate: study.updatedAt,
      }));

      setStudies(transformedStudies);
      setLastRefresh(new Date());
      setError('');
    } catch (err) {
      console.error('Error loading studies:', err);
      if (!isBackgroundRefresh) setError('Failed to load studies');
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
    }
  };

  const calculateCompletion = (study) => {
    if (!study.startDate) return 0;
    if (!study.endDate) return 50;

    const start = parseIsoAssumeUtcIfNoTz(study.startDate);
    const end = parseIsoAssumeUtcIfNoTz(study.endDate);
    const now = new Date();

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // sorting + pagination
  const [orderBy, setOrderBy] = useState('lastUpdate');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // actions
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const [confirm, setConfirm] = useState({ open: false, action: null, study: null });

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from) : null; // yyyy-mm-dd
    const toDate = to ? new Date(to) : null;

    return studies.filter((s) => {
      const matchesQ =
        !q ||
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        (s.owner?.name || '').toLowerCase().includes(q.toLowerCase());

      const matchesStatus =
        status === 'all' || (s.status || '').toUpperCase() === status.toUpperCase();

      const sStart = s.startDate ? parseIsoAssumeUtcIfNoTz(s.startDate) : null;
      const sEnd = s.deadline ? parseIsoAssumeUtcIfNoTz(s.deadline) : null;

      const startOk = !fromDate || (sStart && sStart >= fromDate);
      const endOk = !toDate || (sEnd && sEnd <= toDate);

      return matchesQ && matchesStatus && startOk && endOk;
    });
  }, [studies, q, status, from, to]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av, bv;
      switch (orderBy) {
        case 'title': av = a.title; bv = b.title; break;
        case 'owner': av = a.owner?.name || ''; bv = b.owner?.name || ''; break;
        case 'status': av = a.status; bv = b.status; break;
        case 'startDate': av = a.startDate; bv = b.startDate; break;
        case 'deadline': av = a.deadline; bv = b.deadline; break;
        case 'completionPct': av = a.completionPct; bv = b.completionPct; break;
        case 'lastUpdate':
        default:
          av = parseIsoAssumeUtcIfNoTz(a.lastUpdate)?.getTime() ?? 0;
          bv = parseIsoAssumeUtcIfNoTz(b.lastUpdate)?.getTime() ?? 0;
          break;
      }
      if (av < bv) return order === 'asc' ? -1 : 1;
      if (av > bv) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, orderBy, order]);

  const pageRows = useMemo(
    () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  // KPIs (from filtered)
  const kpis = useMemo(() => {
    const active = filtered.filter((s) => (s.status || '').toUpperCase() === 'ACTIVE');
    const totalParticipants = filtered.reduce((acc, s) => acc + (s.participants?.active || 0), 0);
    const completionAvg = filtered.length
      ? Math.round(filtered.reduce((acc, s) => acc + (s.completionPct || 0), 0) / filtered.length)
      : 0;
    return { shown: filtered.length, activeCount: active.length, totalParticipants, completionAvg };
  }, [filtered]);

  // actions
  const onOpen = (study) => {
    navigate(`/admin/studies/${study.id}`);
  };
  const onArchive = (study) => setConfirm({ open: true, action: 'archive', study });
  const onDelete = (study) => setConfirm({ open: true, action: 'delete', study });

  const handleConfirm = async () => {
    const { action, study } = confirm;

    if (action === 'delete') {
      // ✅ SADECE LISTEDEN KALDIR (backend'de hiç bir şey silme)
      setStudies((prev) => prev.filter((x) => x.id !== study.id));

      setConfirm({ open: false, action: null, study: null });
      setSnack({
        open: true,
        message: `Study "${study.title}" is deleted.`,
        severity: 'success'
      });
      return;
    }

    if (action === 'archive') {
      setConfirm({ open: false, action: null, study: null });
      setSnack({
        open: true,
        message: `Demo: "${study.title}" would be archived.`,
        severity: 'info'
      });
    }
  };

  const handleCancel = () => setConfirm({ open: false, action: null, study: null });

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (loading) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </AppTheme>
    );
  }

  const content = (
    <Container maxWidth="xl">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              All Researchers' Studies
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hi Admin, monitor and manage all ongoing research studies.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Auto-refresh (30s)
                </Typography>
              }
            />

            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => loadStudies()}
            >
              Refresh
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => handleExportStudiesCsv(sorted)} // filtrelenmiş + sıralanmış tüm liste
            >
              Export CSV
            </Button>
          </Stack>
        </Stack>

        {lastRefresh && (
          <Stack direction="row" spacing={1} alignItems="center">
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
          </Stack>
        )}
      </Box>

      {/* KPI cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50' }}>
                <TodayIcon sx={{ color: 'primary.main' }} />
              </Box>
            </Stack>
            <Typography variant="h3" fontWeight={700}>{kpis.shown}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Studies (Shown)
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50' }}>
                <AssessmentIcon sx={{ color: 'success.main' }} />
              </Box>
            </Stack>
            <Typography variant="h3" fontWeight={700}>{kpis.activeCount}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Active Studies
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.50' }}>
                <PeopleIcon sx={{ color: 'info.main' }} />
              </Box>
            </Stack>
            <Typography variant="h3" fontWeight={700}>{kpis.totalParticipants}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Active Participants
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.50' }}>
                <PercentIcon sx={{ color: 'warning.main' }} />
              </Box>
            </Stack>
            <Typography variant="h3" fontWeight={700}>{kpis.completionAvg}%</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Avg. Completion
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" useFlexGap flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search by title or owner…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ minWidth: 280, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />

          <Button
            size="small"
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => { setQ(''); setStatus('all'); setFrom(''); setTo(''); }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'title' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'title'}
                    direction={orderBy === 'title' ? order : 'asc'}
                    onClick={() => handleRequestSort('title')}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>

                <TableCell sortDirection={orderBy === 'owner' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'owner'}
                    direction={orderBy === 'owner' ? order : 'asc'}
                    onClick={() => handleRequestSort('owner')}
                  >
                    Owner
                  </TableSortLabel>
                </TableCell>

                <TableCell>Status</TableCell>
                <TableCell align="right">Participants</TableCell>

                <TableCell sortDirection={orderBy === 'startDate' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'startDate'}
                    direction={orderBy === 'startDate' ? order : 'asc'}
                    onClick={() => handleRequestSort('startDate')}
                  >
                    Start
                  </TableSortLabel>
                </TableCell>

                <TableCell sortDirection={orderBy === 'deadline' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'deadline'}
                    direction={orderBy === 'deadline' ? order : 'asc'}
                    onClick={() => handleRequestSort('deadline')}
                  >
                    Deadline
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === 'completionPct' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'completionPct'}
                    direction={orderBy === 'completionPct' ? order : 'asc'}
                    onClick={() => handleRequestSort('completionPct')}
                  >
                    Completion
                  </TableSortLabel>
                </TableCell>

                <TableCell sortDirection={orderBy === 'lastUpdate' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'lastUpdate'}
                    direction={orderBy === 'lastUpdate' ? order : 'asc'}
                    onClick={() => handleRequestSort('lastUpdate')}
                  >
                    Last Update
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pageRows.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Stack spacing={0.3}>
                      <Typography variant="subtitle2">{s.title}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {s.id}</Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {s.owner?.name ? s.owner.name[0] : '?'}
                      </Avatar>
                      <Typography variant="body2">{s.owner?.name || 'N/A'}</Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip size="small" label={s.status} color={statusColor(s.status)} variant="outlined" />
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2">
                      {s.participants.active}/{s.participants.assigned}
                    </Typography>
                  </TableCell>

                  <TableCell>{formatDate(s.startDate)}</TableCell>
                  <TableCell>{formatDate(s.deadline)}</TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 120 }}>
                      <LinearProgress
                        variant="determinate"
                        value={s.completionPct}
                        sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                        color={s.completionPct >= 80 ? 'success' : s.completionPct >= 50 ? 'warning' : 'error'}
                      />
                      <Typography variant="caption" fontWeight="medium">
                        {s.completionPct}%
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {/* ✅ fixed: timezone yoksa UTC kabul edip local göster */}
                      {formatDateTimeLocal(s.lastUpdate)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="View study details">
                        <IconButton size="small" onClick={() => onOpen(s)}>
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={s.status === 'Archived' ? 'Already archived' : 'Archive (demo)'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onArchive(s)}
                            disabled={s.status === 'Archived'}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Delete study">
                        <IconButton size="small" color="error" onClick={() => onDelete(s)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No studies match your filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Container>
  );

  // embedded mode: return content + dialogs/snackbar
  if (embedded) {
    return (
      <>
        {content}

        <Dialog open={confirm.open} onClose={handleCancel}>
          <DialogTitle>
            {confirm.action === 'archive' ? 'Archive Study' : 'Delete Study'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirm.action === 'archive'
                ? 'Demo only. This will archive:'
                : 'This will delete the study'}
              <br />
              <b>{confirm.study?.title}</b>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              variant={confirm.action === 'delete' ? 'contained' : 'outlined'}
              color={confirm.action === 'delete' ? 'error' : 'primary'}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snack.severity}
            onClose={() => setSnack({ ...snack, open: false })}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  // standalone page wrapper
  return (
    <AppTheme>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
          elevation={0}
        >
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
              Monitor Studies
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', pt: 3, pb: 6, px: 3 }}
        >
          <Toolbar />
          {content}
        </Box>
      </Box>

      <Dialog open={confirm.open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirm.action === 'archive' ? 'Archive Study' : 'Delete Study'}
        </DialogTitle>
        <DialogContent>
          {confirm.action === 'delete' ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  This does NOT delete any data.
                </Typography>
                <Typography variant="body2">
                  It only removes the study from the current list view.
                </Typography>
              </Alert>
              <DialogContentText>
                Remove from the list:<br />
                <strong>{confirm.study?.title}</strong>
              </DialogContentText>
            </>
          ) : (
            <DialogContentText>
              Demo only. This will archive:<br />
              <strong>{confirm.study?.title}</strong>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            variant={confirm.action === 'delete' ? 'contained' : 'outlined'}
            color={confirm.action === 'delete' ? 'error' : 'primary'}
            onClick={handleConfirm}
            startIcon={confirm.action === 'delete' ? <DeleteIcon /> : null}
          >
            {confirm.action === 'delete' ? 'Remove' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </AppTheme>
  );
}
