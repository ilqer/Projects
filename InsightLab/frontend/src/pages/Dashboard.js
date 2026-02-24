import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import MainGrid from './components/MainGrid';
import SideMenu from './components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import ResearcherOverview from './researcher/dashboard/ResearcherOverview';
import AdminOverview from './admin/dashboard/AdminOverview';
import ParticipantOverview from './participant/dashboard/ParticipantOverview';
import ReviewerOverview from './reviewer/dashboard/ReviewerOverview';
import ResearcherArtifacts from './researcher/dashboard/ResearcherArtifacts';
import ArtifactManagement from './admin/dashboard/ArtifactManagement';

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations';

// Import MUI components for Settings page
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CardActions from '@mui/material/CardActions';

// Import icons for Analytics buttons
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RestoreIcon from '@mui/icons-material/Restore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ScienceIcon from '@mui/icons-material/Science';
import CreateIcon from '@mui/icons-material/Create';
import FolderIcon from '@mui/icons-material/Folder';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QuizIcon from '@mui/icons-material/Quiz';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ErrorIcon from '@mui/icons-material/Error';
import BlockIcon from '@mui/icons-material/Block';
import FeedbackIcon from '@mui/icons-material/Feedback';
import GradingIcon from '@mui/icons-material/Grading';
import CheckIcon from '@mui/icons-material/Check';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';


const ROLE_TAB_MAPPING = {
  RESEARCHER: ['Overview', 'Studies', 'Artifacts', 'Questionnaires', 'AI Artifacts', 'AI Questions'],
  ADMIN: ['Overview', 'Users', 'Studies', 'Artifacts', 'Researcher Requests', 'Reactivation Requests'],
  PARTICIPANT: ['Overview', 'My Studies', 'Quizzes', 'Tasks', 'History'],
  REVIEWER: ['Overview', 'Assigned Reviews', 'History'],
};

const SUPPORTED_QUERY_TABS = ['Profile', 'Settings', 'About', 'Feedback', 'Artifacts'];

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateUserData } = useAuth();
  // Tab state - default to 'Overview' to show role-specific dashboard
  const [currentTab, setCurrentTab] = React.useState('Overview');
  const allowedQueryTabs = React.useMemo(() => {
    const roleTabs = ROLE_TAB_MAPPING[user?.role] || [];
    return new Set([...roleTabs, ...SUPPORTED_QUERY_TABS]);
  }, [user?.role]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const decodedTab = decodeURIComponent(tabParam);
      if (allowedQueryTabs.has(decodedTab) && decodedTab !== currentTab) {
        setCurrentTab(decodedTab);
        navigate('/dashboard', { replace: true });
      }
    }
  }, [location.search, allowedQueryTabs, navigate]);

  // Handle tab changes with navigation for certain tabs
  const handleTabChange = (newTab) => {
    // Navigate to specific routes for these tabs
    if (newTab === 'Statistics' && user?.role === 'RESEARCHER') {
      navigate('/researcher/statistics');
      return;
    }
    
    // For other tabs, just update the state
    setCurrentTab(newTab);
  };
  
  // Profile editing state
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    currentPassword: '',
    newPassword: '',
    geminiApiKey: '', // Don't pre-fill API key for security
  });
  const [apiKeyChanged, setApiKeyChanged] = React.useState(false);
  
  // Password change state
  const [showPwdSection, setShowPwdSection] = React.useState(false);
  const [confirmPassword, setConfirmPassword] = React.useState('');
  
  // UI state
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  // Refs for password inputs
  const currentPwdInputRef = React.useRef(null);
  const newPwdInputRef = React.useRef(null);
  
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  const resetPasswordPart = () => {
    setShowPwdSection(false);
    setConfirmPassword('');
    setFormData((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
    }));
  };
  
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const updateData = {
        email: formData.email,
        fullName: formData.fullName,
      };
      
      // Only include API key for researchers if it was changed
      if (user?.role === 'RESEARCHER' && apiKeyChanged) {
        // Send the API key (empty string will clear it, non-empty will set it)
        updateData.geminiApiKey = formData.geminiApiKey || '';
      }

      if (showPwdSection) {
        if (!formData.currentPassword) {
          setError('Current password is required.');
          setLoading(false);
          return;
        }
        if (!formData.newPassword) {
          setError('New password is required.');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError('New password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        if (formData.newPassword !== confirmPassword) {
          setError('New passwords do not match.');
          setFormData((prev) => ({ ...prev, newPassword: '' }));
          setConfirmPassword('');
          setLoading(false);
          return;
        }

        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await userService.updateUser(user.id, updateData);
      updateUserData(response.data);

      setMessage('Profile updated successfully!');
      setIsEditing(false);
      resetPasswordPart();
      setApiKeyChanged(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to update profile';

      setError(msg);

      if (
        /current\s*password/i.test(msg) &&
        /(invalid|wrong|mismatch|incorrect)/i.test(msg)
      ) {
        setFormData((prev) => ({ ...prev, currentPassword: '' }));
        setTimeout(() => currentPwdInputRef.current?.focus(), 0);
      }
      if (
        /(new\s*password|passwords)/i.test(msg) &&
        /(mismatch|match|dont|do\s*not)/i.test(msg)
      ) {
        setFormData((prev) => ({ ...prev, newPassword: '' }));
        setConfirmPassword('');
        setTimeout(() => newPwdInputRef.current?.focus(), 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await userService.deleteUser(user.id);
      alert('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleProfileClick = () => {
    setCurrentTab('Profile');
  };
  
  // Render Profile Tab Content (moved from Settings)
  const renderProfileContent = () => (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3, width: '100%' }}>
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Profile Information
            </Typography>
            {!isEditing && (
              <Button variant="contained" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </Box>
          
          {!isEditing ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                <Typography variant="body1">{user?.username}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{user?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{user?.fullName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                <Typography variant="body1">{user?.role}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Account Status</Typography>
                <Typography variant="body1">{user?.active ? 'Active' : 'Inactive'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
                <Typography variant="body1">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
              {user?.role === 'RESEARCHER' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Google Gemini API Key</Typography>
                  <Typography variant="body1">
                    {user?.geminiApiKey ? '••••••••••••' : 'Not set'}
                  </Typography>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box component="form" onSubmit={handleUpdate} noValidate>
              <Stack spacing={3}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { bgcolor: 'background.paper', px: 0.5 }
                  }}
                />
                
                <TextField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { bgcolor: 'background.paper', px: 0.5 }
                  }}
                />
                
                {user?.role === 'RESEARCHER' && (
                  <TextField
                    label="Google Gemini API Key"
                    name="geminiApiKey"
                    type="password"
                    value={formData.geminiApiKey}
                    onChange={(e) => {
                      setFormData({ ...formData, geminiApiKey: e.target.value });
                      setApiKeyChanged(true);
                    }}
                    fullWidth
                    helperText={apiKeyChanged ? "Enter your API key or leave empty to clear it." : "Enter your API key. Get it from Google AI Studio."}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { bgcolor: 'background.paper', px: 0.5 }
                    }}
                  />
                )}
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (showPwdSection) {
                      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
                      setConfirmPassword('');
                      setShowPwdSection(false);
                    } else {
                      setShowPwdSection(true);
                    }
                  }}
                >
                  {showPwdSection ? 'Cancel Change Password' : 'Change Password'}
                </Button>
                
                {showPwdSection && (
                  <>
                    <TextField
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      inputRef={currentPwdInputRef}
                      required
                      fullWidth
                      InputLabelProps={{ 
                        shrink: true,
                        sx: { bgcolor: 'background.paper', px: 0.5 }
                      }}
                    />
                    
                    <TextField
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      inputRef={newPwdInputRef}
                      required
                      fullWidth
                      helperText="Minimum 6 characters"
                      InputLabelProps={{ 
                        shrink: true,
                        sx: { bgcolor: 'background.paper', px: 0.5 }
                      }}
                    />
                    
                    <TextField
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      fullWidth
                      InputLabelProps={{ 
                        shrink: true,
                        sx: { bgcolor: 'background.paper', px: 0.5 }
                      }}
                    />
                  </>
                )}
                
                <Stack direction="row" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        email: user?.email || '',
                        fullName: user?.fullName || '',
                        currentPassword: '',
                        newPassword: '',
                        geminiApiKey: '',
                      });
                      setApiKeyChanged(false);
                      setError('');
                      resetPasswordPart();
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
      
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Status
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Deactivating your account will temporarily disable your access. You can request reactivation at any time.
          </Typography>
          
          <Button
            variant="outlined"
            color="warning"
            onClick={async () => {
              if (window.confirm('Are you sure you want to deactivate your account? You will need admin approval to reactivate it.')) {
                try {
                  await userService.deactivateAccount(user.id);
                  alert('Account deactivated successfully');
                  logout();
                  navigate('/login');
                } catch (err) {
                  setError(err?.response?.data?.message || 'Failed to deactivate account');
                }
              }
            }}
          >
            Deactivate Account
          </Button>
        </CardContent>
      </Card>
      <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
        <CardContent>
          <Typography variant="h6" color="error.main" gutterBottom>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Once you delete your account, there is no going back. Please be certain.
          </Typography>
          
          {!showDeleteConfirm ? (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Are you absolutely sure? This action cannot be undone.
              </Alert>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
  
  // Render content based on selected tab
  const renderContent = () => {
    // Role-specific dashboard tabs
    const currentRoleTabs = ROLE_TAB_MAPPING[user?.role] || [];
    
    // Handle specific admin request tabs first
    if (currentTab === 'Researcher Requests') {
      const ResearcherRequestsContent = React.lazy(() => import('./admin/dashboard/ResearcherRequests'));
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <ResearcherRequestsContent />
        </React.Suspense>
      );
    }
    if (currentTab === 'Reactivation Requests') {
      const ReactivationRequestsContent = React.lazy(() => import('./admin/dashboard/ReactivationRequests'));
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <ReactivationRequestsContent />
        </React.Suspense>
      );
    }

    
    // Check if current tab is a role-specific tab
    if (currentRoleTabs.includes(currentTab)) {
      const tabIndex = currentRoleTabs.indexOf(currentTab);
      
      if (user?.role === 'RESEARCHER') {
        return <ResearcherOverview user={user} initialTab={tabIndex} onTabChange={handleTabChange} />;
      } else if (user?.role === 'ADMIN') {
        return <AdminOverview user={user} initialTab={tabIndex} />;
      } else if (user?.role === 'PARTICIPANT') {
        return <ParticipantOverview user={user} initialTab={tabIndex} />;
      } else if (user?.role === 'REVIEWER') {
        return <ReviewerOverview user={user} initialTab={tabIndex} />;
      }
    }

    // Handle other navigation items
    switch (currentTab) {
      case 'Profile':
        return renderProfileContent();
      case 'Settings':
        return (
          <Box sx={{ p: 3, width: '100%', maxWidth: 900 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
              Settings
            </Typography>
            <Alert severity="info">
              Settings and preferences coming soon.
            </Alert>
          </Box>
        );
      case 'About':
        const creators = [
          'Altay İlker Yiğitel',
          'Mustafa Mert Gülhan',
          'Ece Bulut',
          'Yasemin Altun',
          'Efe Erdoğmuş'
        ];
        return (
          <Box sx={{ p: 3, width: '100%', maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                Insight Lab
              </Typography>
              <Typography variant="body1" color="text.secondary">
                A Research Platform for Software Artifact Evaluation
              </Typography>
            </Box>

            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InfoRoundedIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      About the Platform
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Insight Lab is a research platform designed for systematic evaluation of diverse software artifacts. 
                    It enables researchers to conduct empirical studies, recruit participants, and gather comparative feedback 
                    on source code, test cases, UML diagrams, and requirements documents.
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PeopleIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Creators
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {creators.map((creator, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'action.hover', 
                          textAlign: 'center' 
                        }}>
                          <Typography variant="body1">{creator}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FeedbackIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Contact & Feedback
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    We welcome your feedback and suggestions.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<FeedbackIcon />}
                    href="mailto:insightlabservice@gmail.com"
                    sx={{ textTransform: 'none' }}
                  >
                    insightlabservice@gmail.com
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        );
      case 'Feedback':
        return (
          <Box sx={{ p: 3, width: '100%', maxWidth: 900 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
              Feedback
            </Typography>
            <Alert severity="info">
              Feedback form coming soon.
            </Alert>
          </Box>
        );
      case 'Artifacts':
        if (user?.role === 'ADMIN') {
          return <ArtifactManagement />;
        }
        return <ResearcherArtifacts />;

      default:
        return <MainGrid />;
    }
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu currentTab={currentTab} onTabChange={handleTabChange} onLogout={handleLogout} onProfileClick={handleProfileClick} user={user} />
        <AppNavbar />
        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
            minHeight: '100vh',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header currentTab={currentTab} />
            {renderContent()}
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
