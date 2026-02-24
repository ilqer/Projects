import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ScienceIcon from '@mui/icons-material/Science';

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1),
}));

export default function SelectContent() {
  return (
    <LogoContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <ScienceIcon sx={{ fontSize: 28 }} />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Insight Lab
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
          Research Platform
        </Typography>
      </Box>
    </LogoContainer>
  );
}
