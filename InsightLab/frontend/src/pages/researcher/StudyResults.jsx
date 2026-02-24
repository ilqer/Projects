import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const StudyResults = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const content = (
    <Container maxWidth="lg" sx={embedded ? { py: 3 } : undefined}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Study Results</Typography>
        <Typography variant="body1" paragraph>
          This is a dummy page for Study Results. Content will be implemented here.
        </Typography>
        <Typography>View and export study results and data.</Typography>
        {!embedded && (
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );

  if (embedded) {
    return content;
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>Study Results</Typography>
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

export default StudyResults;
