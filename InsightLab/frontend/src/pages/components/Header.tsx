import * as React from 'react';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';

import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';

import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

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
      <NavbarBreadcrumbs />

      <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
        {/* Search ve tarih kaldırıldı */}

        <IconButton
          aria-label="Open notifications"
          onClick={() => navigate('/notifications')}
        >
          <NotificationsRoundedIcon />
        </IconButton>

        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}
