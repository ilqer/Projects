import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';

const SideBySideComparator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studyId, taskId } = useParams();

  const [ratings, setRatings] = useState({
    artifact1_readability: 0,
    artifact1_correctness: 0,
    artifact2_readability: 0,
    artifact2_correctness: 0,
  });

  const [annotations, setAnnotations] = useState({
    artifact1: '',
    artifact2: ''
  });

  const [selectedArtifact, setSelectedArtifact] = useState('');

  // Dummy artifact data
  const artifacts = {
    artifact1: {
      name: 'Human-Written Code',
      type: 'Java Code',
      content: `public class LoginController {
    private UserService userService;
    
    public LoginController(UserService userService) {
        this.userService = userService;
    }
    
    public Response login(LoginRequest request) {
        try {
            User user = userService.authenticate(
                request.getUsername(), 
                request.getPassword()
            );
            
            if (user != null) {
                String token = generateToken(user);
                return Response.success(token);
            }
            
            return Response.error("Invalid credentials");
        } catch (Exception e) {
            return Response.error("Login failed: " + e.getMessage());
        }
    }
    
    private String generateToken(User user) {
        // Token generation logic
        return "token_" + user.getId();
    }
}`,
    },
    artifact2: {
      name: 'AI-Generated Code',
      type: 'Java Code',
      content: `public class LoginController {
    private final UserService userService;
    
    public LoginController(UserService userService) {
        this.userService = Objects.requireNonNull(userService);
    }
    
    public Response login(LoginRequest request) {
        validateRequest(request);
        
        return userService.authenticate(request.getUsername(), request.getPassword())
            .map(this::generateSuccessResponse)
            .orElse(Response.error("Invalid credentials"));
    }
    
    private void validateRequest(LoginRequest request) {
        if (request == null || request.getUsername() == null) {
            throw new IllegalArgumentException("Invalid request");
        }
    }
    
    private Response generateSuccessResponse(User user) {
        String token = TokenGenerator.generate(user);
        return Response.success(token);
    }
}`,
    },
  };

  const handleRatingChange = (key, value) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleAnnotationChange = (artifact, value) => {
    setAnnotations(prev => ({ ...prev, [artifact]: value }));
  };

  const handleSubmit = () => {
    console.log('Submitting evaluation:', { ratings, annotations, selectedArtifact });
    alert('Evaluation submitted successfully!');
    navigate(-1);
  };

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
              Artifact Comparison
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh', overflow: 'auto' }}>
          <Toolbar />
          <Container maxWidth="xl">
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Comparison Task
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compare the two artifacts below and evaluate them based on readability and correctness.
                You may add annotations and select your preference.
              </Typography>
            </Paper>

            {/* Side-by-Side Artifacts */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Artifact 1 */}
              <Paper sx={{ flex: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Artifact A</Typography>
                  <Chip label={artifacts.artifact1.type} size="small" />
                </Box>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    maxHeight: 400,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {artifacts.artifact1.content}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Readability</Typography>
                    <Rating
                      value={ratings.artifact1_readability}
                      onChange={(e, newValue) => handleRatingChange('artifact1_readability', newValue)}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Correctness</Typography>
                    <Rating
                      value={ratings.artifact1_correctness}
                      onChange={(e, newValue) => handleRatingChange('artifact1_correctness', newValue)}
                    />
                  </Box>
                  <TextField
                    label="Annotations / Comments"
                    multiline
                    rows={3}
                    value={annotations.artifact1}
                    onChange={(e) => handleAnnotationChange('artifact1', e.target.value)}
                    fullWidth
                  />
                </Stack>
              </Paper>

              {/* Sync Icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SyncIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>

              {/* Artifact 2 */}
              <Paper sx={{ flex: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Artifact B</Typography>
                  <Chip label={artifacts.artifact2.type} size="small" />
                </Box>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    maxHeight: 400,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {artifacts.artifact2.content}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Readability</Typography>
                    <Rating
                      value={ratings.artifact2_readability}
                      onChange={(e, newValue) => handleRatingChange('artifact2_readability', newValue)}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Correctness</Typography>
                    <Rating
                      value={ratings.artifact2_correctness}
                      onChange={(e, newValue) => handleRatingChange('artifact2_correctness', newValue)}
                    />
                  </Box>
                  <TextField
                    label="Annotations / Comments"
                    multiline
                    rows={3}
                    value={annotations.artifact2}
                    onChange={(e) => handleAnnotationChange('artifact2', e.target.value)}
                    fullWidth
                  />
                </Stack>
              </Paper>
            </Box>

            {/* Overall Preference */}
            <Paper sx={{ p: 3, mb: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Which artifact do you prefer overall?</FormLabel>
                <RadioGroup
                  row
                  value={selectedArtifact}
                  onChange={(e) => setSelectedArtifact(e.target.value)}
                >
                  <FormControlLabel value="artifact1" control={<Radio />} label="Artifact A" />
                  <FormControlLabel value="artifact2" control={<Radio />} label="Artifact B" />
                  <FormControlLabel value="equal" control={<Radio />} label="No Preference" />
                </RadioGroup>
              </FormControl>
            </Paper>

            {/* Submit Button */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                size="large"
              >
                Submit Evaluation
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                size="large"
              >
                Cancel
              </Button>
            </Stack>
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default SideBySideComparator;
