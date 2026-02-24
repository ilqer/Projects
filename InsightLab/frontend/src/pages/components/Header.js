import * as React from 'react';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';

import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';

import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/api';

export default function Header({ currentTab }) {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = React.useState(0);

  const loadUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data ?? 0);
    } catch (e) {
      console.error('Failed to load unread count', e);
    }
  };

  React.useEffect(() => {
    loadUnreadCount();

    // Sekmeye geri dönünce güncelle
    const onFocus = () => loadUnreadCount();
    window.addEventListener('focus', onFocus);

    // İstersen hafif polling (opsiyonel): 20 sn'de bir yenile
    const intervalId = setInterval(loadUnreadCount, 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 1.5,
      }}
      spacing={2}
    >
      <NavbarBreadcrumbs currentTab={currentTab} />

      <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
        <IconButton
          aria-label="Open notifications"
          onClick={() => navigate('/notifications')}
        >
          <Badge
            color="error"
            variant={unreadCount > 0 ? 'dot' : 'standard'}
          >
            <NotificationsRoundedIcon />
          </Badge>
        </IconButton>

        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}
