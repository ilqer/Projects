import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MuiToolbar from '@mui/material/Toolbar';
import { tabsClasses } from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';

import SideMenuMobile from './SideMenuMobile';
import MenuButton from './MenuButton';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';

import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/api'; // path sende farklıysa düzelt

const Toolbar = styled(MuiToolbar)({
  width: '100%',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  justifyContent: 'center',
  gap: '12px',
  flexShrink: 0,
  [`& ${tabsClasses.flexContainer}`]: {
    gap: '8px',
    p: '8px',
    pb: 0,
  },
});

export default function AppNavbar() {
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);

  // 🔔 state’leri
  const [notifAnchor, setNotifAnchor] = React.useState<null | HTMLElement>(null);
  const [topNotifications, setTopNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifLoading, setNotifLoading] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const loadNotificationsForDropdown = async () => {
    setNotifLoading(true);
    try {
      const res = await notificationService.getMyNotifications();
      const all = res.data || [];
      setUnreadCount(all.filter((n: any) => !n.read).length);
      setTopNotifications(all.slice(0, 6)); // dropdown’da 6 tane göster
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleOpenNotifMenu = async (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);
    await loadNotificationsForDropdown(); // menü açılırken güncelle
  };

  const handleCloseNotifMenu = () => setNotifAnchor(null);

  const handleClickNotification = async (n: any) => {
    try {
      if (!n.read) {
        await notificationService.markAsRead(n.id);
      }
    } catch (e) {
      console.error('Failed to mark as read:', e);
    } finally {
      handleCloseNotifMenu();
      navigate('/notifications'); // tek yerden detay sayfaya
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: 'auto', md: 'none' }, // mobil bar
        boxShadow: 0,
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        top: 'var(--template-frame-height, 0px)',
      }}
    >
      <Toolbar variant="regular">
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            flexGrow: 1,
            width: '100%',
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mr: 'auto' }}>
            <CustomIcon />
            <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
              Dashboard
            </Typography>
          </Stack>

          <ColorModeIconDropdown />

          {/* 🔔 Notification bell */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleOpenNotifMenu} aria-label="notifications">
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <MenuButton aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuRoundedIcon />
          </MenuButton>

          <SideMenuMobile open={open} toggleDrawer={toggleDrawer} />
        </Stack>
      </Toolbar>

      {/* 🔔 Dropdown menu */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={handleCloseNotifMenu}
        PaperProps={{ sx: { width: 340 } }}
      >
        <MenuItem disabled sx={{ opacity: 1, fontWeight: 700 }}>
          Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}
        </MenuItem>
        <Divider />

        {notifLoading ? (
          <MenuItem disabled>Loading…</MenuItem>
        ) : topNotifications.length === 0 ? (
          <MenuItem disabled>No notifications</MenuItem>
        ) : (
          topNotifications.map((n) => (
            <MenuItem key={n.id} onClick={() => handleClickNotification(n)}>
              <ListItemText
                primary={n.title}
                secondary={n.message}
                primaryTypographyProps={{ fontWeight: n.read ? 400 : 700 }}
                secondaryTypographyProps={{ sx: { whiteSpace: 'pre-line' } }}
              />
            </MenuItem>
          ))
        )}

        <Divider />
        <MenuItem
          onClick={() => {
            handleCloseNotifMenu();
            navigate('/notifications');
          }}
          sx={{ justifyContent: 'center', fontWeight: 700 }}
        >
          View all
        </MenuItem>
      </Menu>
    </AppBar>
  );
}

export function CustomIcon() {
  return (
    <Box
      sx={{
        width: '1.5rem',
        height: '1.5rem',
        bgcolor: 'black',
        borderRadius: '999px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundImage:
          'linear-gradient(135deg, hsl(210, 98%, 60%) 0%, hsl(210, 100%, 35%) 100%)',
        color: 'hsla(210, 100%, 95%, 0.9)',
        border: '1px solid',
        borderColor: 'hsl(210, 100%, 55%)',
        boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.3)',
      }}
    >
      <DashboardRoundedIcon color="inherit" sx={{ fontSize: '1rem' }} />
    </Box>
  );
}
