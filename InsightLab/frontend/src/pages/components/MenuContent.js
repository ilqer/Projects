import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import FolderIcon from '@mui/icons-material/Folder';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HistoryIcon from '@mui/icons-material/History';
import ChecklistIcon from '@mui/icons-material/Checklist';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const getRoleSpecificItems = (role) => {
  switch (role) {
    case 'ADMIN':
      return [
        { text: 'Overview', icon: <DashboardRoundedIcon />, navigate: false },
        { text: 'Users', icon: <PeopleRoundedIcon />, navigate: false },
        { text: 'Studies', icon: <MonitorHeartIcon />, navigate: false },
        { text: 'Artifacts', icon: <Inventory2OutlinedIcon />, navigate: false },
        { text: 'Researcher Requests', icon: <PersonAddIcon />, navigate: false },
        { text: 'Reactivation Requests', icon: <LockOpenIcon />, navigate: false },
      ];
    case 'RESEARCHER':
      return [
        { text: 'Overview', icon: <DashboardRoundedIcon />, navigate: false },
        { text: 'Studies', icon: <FolderIcon />, navigate: false },
        { text: 'Artifacts', icon: <FolderIcon />, navigate: false },
        { text: 'Questionnaires', icon: <QuizIcon />, navigate: false },
        { text: 'AI Artifacts', icon: <AutoAwesomeIcon />, navigate: false },
        { text: 'AI Questions', icon: <QuizIcon />, navigate: false },
        { text: 'Statistics', icon: <AssessmentIcon />, navigate: false },
      ];
    case 'PARTICIPANT':
      return [
        { text: 'Overview', icon: <DashboardRoundedIcon />, navigate: false },
        { text: 'My Studies', icon: <AssignmentRoundedIcon />, navigate: false },
        { text: 'Tasks', icon: <ChecklistIcon />, navigate: false },
        { text: 'Quizzes', icon: <QuizIcon />, navigate: false },
        { text: 'History', icon: <HistoryIcon />, navigate: false },
      ];
    case 'REVIEWER':
      return [
        { text: 'Overview', icon: <DashboardRoundedIcon />, navigate: false },
        { text: 'Assigned Reviews', icon: <RateReviewIcon />, navigate: false },
        { text: 'History', icon: <HistoryIcon />, navigate: false },
      ];
    default:
      return [{ text: 'Dashboard', icon: <DashboardRoundedIcon />, navigate: false }];
  }
};

const secondaryListItems = [
  { text: 'About', icon: <InfoRoundedIcon /> },
  { text: 'Profile', icon: <AccountCircleIcon /> },
  { text: 'Logout', icon: <LogoutIcon /> },
];

export default function MenuContent({ currentTab, onTabChange, onLogout, onProfileClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roleSpecificItems = getRoleSpecificItems(user?.role);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const handleItemClick = (itemText) => {
    if (itemText === 'Logout') {
      setLogoutDialogOpen(true);
    } else if (itemText === 'Profile') {
      onProfileClick();
    } else {
      onTabChange(itemText);
    }
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    onLogout();
  };

  const handleMenuClick = (item) => {
    // Eğer navigate property'si varsa, route ile git
    if (item.navigate) {
      navigate(item.navigate);
    } else {
      // Yoksa normal tab değişikliği yap
      onTabChange(item.text);
    }
  };

  return (
  <>
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <Stack spacing={1}>
        {/* Role-Specific Menu Items */}
        <List dense>
          {roleSpecificItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                selected={currentTab === item.text}
                onClick={() => handleMenuClick(item)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Stack>

      {/* Secondary Menu Items */}
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={currentTab === item.text}
              onClick={() => handleItemClick(item.text)} // ya da handleMenuClick(item)
              sx={{
                borderRadius: 1,
                mx: 1,
                '&:hover': {
                  backgroundColor: item.text === 'Logout' ? 'error.light' : 'action.hover',
                },
                ...(item.text === 'Logout' && {
                  color: 'error.main',
                  '& .MuiListItemIcon-root': {
                    color: 'error.main',
                  },
                }),
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>

    {/* Logout confirmation dialog */}
    <Dialog
      open={logoutDialogOpen}
      onClose={() => setLogoutDialogOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Confirm Logout</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to logout?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setLogoutDialogOpen(false)} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleLogoutConfirm} variant="contained" color="error">
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  </>
  );
}