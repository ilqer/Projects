import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import RateReviewIcon from '@mui/icons-material/RateReview';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import QuizIcon from '@mui/icons-material/Quiz';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getMyNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showSnackbar('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (currentTab === 'unread') {
      return notifications.filter(n => !n.read);
    } else if (currentTab === 'read') {
      return notifications.filter(n => n.read);
    }
    return notifications;
  }, [notifications, currentTab]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <AssignmentIcon color="primary" />;
      case 'DEADLINE_REMINDER':
        return <AccessTimeIcon color="warning" />;
      case 'STUDY_INVITATION':
        return <MailOutlineIcon color="info" />;
      case 'REVIEW_ASSIGNED':
        return <RateReviewIcon color="secondary" />;
      case 'SYSTEM_ALERT':
        return <NotificationsActiveIcon color="error" />;
      case 'QUIZ_INVITATION':
        return <QuizIcon color="primary" />;
      case 'QUIZ_INVITATION_ACCEPTED':
        return <CheckCircleOutlineIcon color="success" />;
      case 'QUIZ_INVITATION_DECLINED':
        return <CloseIcon color="error" />;
      default:
        return <NotificationsActiveIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'primary';
      case 'DEADLINE_REMINDER':
        return 'warning';
      case 'STUDY_INVITATION':
        return 'info';
      case 'REVIEW_ASSIGNED':
        return 'secondary';
      case 'SYSTEM_ALERT':
        return 'error';
      case 'QUIZ_INVITATION':
        return 'primary';
      case 'QUIZ_INVITATION_ACCEPTED':
        return 'success';
      case 'QUIZ_INVITATION_DECLINED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ));
      handleCloseMenu();
    } catch (error) {
      console.error('Error marking as read:', error);
      showSnackbar('Failed to mark as read', 'error');
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await notificationService.markAsUnread(notificationId);
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: false, readAt: null } : n
      ));
      handleCloseMenu();
    } catch (error) {
      console.error('Error marking as unread:', error);
      showSnackbar('Failed to mark as unread', 'error');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      handleCloseMenu();
      showSnackbar('Notification deleted', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showSnackbar('Failed to delete notification', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
      showSnackbar('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showSnackbar('Failed to mark all as read', 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await notificationService.deleteAllNotifications();
        setNotifications([]);
        showSnackbar('All notifications deleted', 'success');
      } catch (error) {
        console.error('Error deleting all notifications:', error);
        showSnackbar('Failed to delete all notifications', 'error');
      }
    }
  };

  const handleOpenMenu = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    if (
      notification.type === 'QUIZ_INVITATION' &&
      notification.relatedEntityType === 'QUIZ_ASSIGNMENT' &&
      user?.role === 'PARTICIPANT'
    ) {
      navigate(`/participant/quiz/${notification.relatedEntityId}`);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
            <Box sx={{ flexGrow: 1 }} />
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
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Notifications
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Stay updated with your tasks, deadlines, and system alerts
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {unreadCount > 0 && (
                    <Button
                      variant="outlined"
                      startIcon={<MarkEmailReadIcon />}
                      onClick={handleMarkAllAsRead}
                      size="small"
                    >
                      Mark All Read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={handleDeleteAll}
                      size="small"
                    >
                      Delete All
                    </Button>
                  )}
                </Stack>
              </Stack>

              {/* Stats Cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50' }}>
                          <NotificationsActiveIcon sx={{ color: 'primary.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="h4" fontWeight={700}>
                            {notifications.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Notifications
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.50' }}>
                          <MailOutlineIcon sx={{ color: 'warning.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="h4" fontWeight={700}>
                            {unreadCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Unread
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.50' }}>
                          <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="h4" fontWeight={700}>
                            {notifications.length - unreadCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Read
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Tabs and Notifications List */}
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
              >
                <Tab
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>All</span>
                      <Chip label={notifications.length} size="small" />
                    </Stack>
                  }
                  value="all"
                />
                <Tab
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>Unread</span>
                      {unreadCount > 0 && (
                        <Badge badgeContent={unreadCount} color="error">
                          <span style={{ width: 8 }} />
                        </Badge>
                      )}
                    </Stack>
                  }
                  value="unread"
                />
                <Tab label="Read" value="read" />
              </Tabs>

              {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading notifications...</Typography>
                </Box>
              ) : filteredNotifications.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <NotificationsActiveIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentTab === 'unread'
                      ? "You're all caught up! No unread notifications."
                      : currentTab === 'read'
                      ? "No read notifications yet."
                      : "You don't have any notifications yet."}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {filteredNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          bgcolor: notification.read ? 'transparent' : 'action.hover',
                          '&:hover': {
                            bgcolor: 'action.selected',
                          },
                          cursor: 'pointer',
                          py: 2,
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={(e) => handleOpenMenu(e, notification)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        }
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <ListItemIcon sx={{ minWidth: 48 }}>
                          {getNotificationIcon(notification.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography
                                variant="subtitle2"
                                fontWeight={notification.read ? 400 : 700}
                              >
                                {notification.title}
                              </Typography>
                              {!notification.read && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main',
                                  }}
                                />
                              )}
                              <Chip
                                label={notification.type.replace(/_/g, ' ')}
                                size="small"
                                color={getNotificationColor(notification.type)}
                                variant="outlined"
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5} mt={0.5}>
                              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {formatTimeAgo(notification.sentAt)}
                                {notification.senderName && ` • From: ${notification.senderName}`}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < filteredNotifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Container>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedNotification && !selectedNotification.read ? (
          <MenuItem onClick={() => handleMarkAsRead(selectedNotification.id)}>
            <ListItemIcon>
              <MarkEmailReadIcon fontSize="small" />
            </ListItemIcon>
            Mark as read
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleMarkAsUnread(selectedNotification?.id)}>
            <ListItemIcon>
              <MailOutlineIcon fontSize="small" />
            </ListItemIcon>
            Mark as unread
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDelete(selectedNotification?.id)}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppTheme>
  );
};

export default NotificationsPage;
