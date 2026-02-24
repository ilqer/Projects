import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studyService } from '../../services/api';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import ArtifactSelector from '../../components/ArtifactSelector';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';

const CreateEditStudy = ({ embedded = false, studyIdProp = null, onSave = null }) => {
  const { studyId: studyIdParam } = useParams();
  const studyId = studyIdProp || studyIdParam;
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!studyId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objective: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    artifacts: [],
  });

  useEffect(() => {
    if (isEdit) {
      loadStudy();
    }
  }, [studyId]);

  const loadStudy = async () => {
    try {
      setLoading(true);
      const response = await studyService.getStudyById(studyId);
      const study = response.data;
      
      // Check if study can be edited
      if (study.status === 'COMPLETED' || study.status === 'CANCELLED') {
        setError(`Cannot edit ${study.status.toLowerCase()} studies. Only DRAFT, ACTIVE, and PAUSED studies can be edited.`);
        setLoading(false);
        return;
      }
      
      setFormData({
        title: study.title || '',
        description: study.description || '',
        objective: study.objective || '',
        startDate: study.startDate || '',
        endDate: study.endDate || '',
        maxParticipants: study.maxParticipants || '',
        artifacts: study.artifacts || [],
      });
    } catch (err) {
      setError('Failed to load study. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Study title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Study title must be at least 3 characters';
    }
    
    if (!formData.objective.trim()) {
      errors.objective = 'Study objective is required';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.startDate = 'Start date cannot be in the past';
      }
    }
    
    if (formData.endDate && formData.startDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    if (formData.maxParticipants && formData.maxParticipants < 1) {
      errors.maxParticipants = 'Maximum participants must be at least 1';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const studyData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        objective: formData.objective.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        artifacts: formData.artifacts,
      };

      if (isEdit) {
        await studyService.updateStudy(studyId, studyData);
        setSuccess('Study updated successfully!');
        // Call onSave callback if provided (for embedded mode)
        if (onSave) {
          setTimeout(() => onSave(), 1000);
        }
      } else {
        await studyService.createStudy(studyData);
        setSuccess('Study created successfully! The study is saved as a draft.');
      }
      
      // Redirect after a short delay (only in standalone mode)
      if (!embedded) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving study:', err);
      setError(
        isEdit 
          ? 'Failed to update study. ' + (err.response?.data?.message || err.message)
          : 'Failed to create study. ' + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Main form content
  const formContent = (
    <>
      {loading && !isEdit ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
                )}
                
                <Stack spacing={3}>
                  <TextField
                    label="Study Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!formErrors.title}
                    helperText={formErrors.title}
                    disabled={loading}
                  />

                  <TextField
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    fullWidth
                    disabled={loading}
                    helperText="Provide a brief description of the study"
                  />

                  <TextField
                    label="Objective"
                    name="objective"
                    value={formData.objective}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!formErrors.objective}
                    helperText={formErrors.objective || "Define the main goal and purpose of this study"}
                    disabled={loading}
                  />

                  <TextField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!formErrors.startDate}
                    helperText={formErrors.startDate || "Participants cannot start tasks before this date"}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />

                  <TextField
                    label="End Date (Optional)"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    fullWidth
                    error={!!formErrors.endDate}
                    helperText={formErrors.endDate || "Leave blank for no deadline"}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />

                  <TextField
                    label="Maximum Participants"
                    name="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    fullWidth
                    error={!!formErrors.maxParticipants}
                    helperText={formErrors.maxParticipants}
                    disabled={loading}
                  />

                  <Divider sx={{ my: 2 }} />

                  <ArtifactSelector
                    selectedArtifacts={formData.artifacts}
                    onChange={(artifacts) => setFormData(prev => ({ ...prev, artifacts }))}
                    disabled={loading}
                  />

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      fullWidth
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        isEdit ? 'Update Study' : 'Create Study'
                      )}
                    </Button>
                    {isEdit && !embedded && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/researcher/studies/${studyId}/create-evaluation-task`)}
                        fullWidth
                        disabled={loading}
                      >
                        Create Evaluation Task
                      </Button>
                    )}
                    {!embedded && (
                      <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                        fullWidth
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            )}
    </>
  );

  // Return embedded version without AppTheme and AppBar
  if (embedded) {
    return formContent;
  }

  // Return standalone version with AppTheme and AppBar
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
              {isEdit ? 'Edit Study' : 'Create New Study'}
            </Typography>
            <ColorModeSelect />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, minHeight: '100vh' }}>
          <Toolbar />
          <Container maxWidth="md">
            {formContent}
          </Container>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default CreateEditStudy;
