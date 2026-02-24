import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiArtifactService } from '../../services/aiArtifactService';
import AppTheme from '../../shared-theme/AppTheme';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { alpha } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const AIArtifactGenerator = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [programmingLanguage, setProgrammingLanguage] = useState('java');
  const [complexity, setComplexity] = useState('medium');
  const [promptTitle, setPromptTitle] = useState('');
  const [contextDetails, setContextDetails] = useState('');
  const [coreTask, setCoreTask] = useState('');
  const [technicalRequirements, setTechnicalRequirements] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [generating, setGenerating] = useState(false);
  const [includeComments, setIncludeComments] = useState(false);
  const [followBestPractices, setFollowBestPractices] = useState(false);
  const [addErrorHandling, setAddErrorHandling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const composedPrompt = useMemo(() => {
    const sections = [];
    if (promptTitle.trim()) {
      sections.push(`Title: ${promptTitle.trim()}`);
    }
    if (contextDetails.trim()) {
      sections.push(`Context:\n${contextDetails.trim()}`);
    }
    if (coreTask.trim()) {
      sections.push(`Core Task:\n${coreTask.trim()}`);
    }
    if (technicalRequirements.trim()) {
      sections.push(`Technical Requirements:\n${technicalRequirements.trim()}`);
    }
    if (acceptanceCriteria.trim()) {
      sections.push(`Acceptance Criteria:\n${acceptanceCriteria.trim()}`);
    }
    return sections.join('\n\n');
  }, [promptTitle, contextDetails, coreTask, technicalRequirements, acceptanceCriteria]);
  const hasPrompt = coreTask.trim().length > 0;
  const hasApiKey = Boolean(user?.geminiApiKey);
  const isGenerateDisabled = generating || !hasPrompt || !hasApiKey;
  const generateDisabledReason = generating
    ? 'Code generation is currently running.'
    : !hasPrompt
      ? 'Describe the core task so the AI knows what to build.'
      : !hasApiKey
        ? 'Save your Gemini API key in Profile Settings to enable code generation.'
        : '';

  const languages = [
    'Java', 'Python', 'JavaScript', 'C++', 'C#', 'Go', 'Rust', 'TypeScript'
  ];

  const complexityLevels = [
    { value: 'beginner', label: 'Beginner', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'advanced', label: 'Advanced', color: 'error' },
  ];

  const handleGenerate = async () => {
    if (!user?.geminiApiKey) {
      setError('Please add your Google Gemini API key in your profile settings first.');
      return;
    }

    if (!coreTask.trim()) {
      setError('Please describe the core task you want to generate.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await aiArtifactService.generateArtifact({
        description: composedPrompt || coreTask,
        programmingLanguage,
        complexity,
        includeComments,
        followBestPractices,
        addErrorHandling,
      });

      const job = response.data;
      
      // Poll for completion
      const checkStatus = async () => {
        try {
          const jobResponse = await aiArtifactService.getJobById(job.id);
          const jobData = jobResponse.data;
          
          if (jobData.status === 'COMPLETED') {
            setSuccess('✓ Code generated successfully! Check the "AI Artifact Approval" tab to review and approve it.');
            setGenerating(false);
          } else if (jobData.status === 'FAILED') {
            setError(`Generation failed: ${jobData.errorMessage || 'Unknown error'}`);
            setGenerating(false);
          } else {
            setTimeout(checkStatus, 2000);
          }
        } catch (err) {
          setError('Failed to check generation status');
          setGenerating(false);
        }
      };

      setTimeout(checkStatus, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate artifact');
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setPromptTitle('');
    setContextDetails('');
    setCoreTask('');
    setTechnicalRequirements('');
    setAcceptanceCriteria('');
    setProgrammingLanguage('java');
    setComplexity('medium');
    setIncludeComments(false);
    setFollowBestPractices(false);
    setAddErrorHandling(false);
    setError('');
    setSuccess('');
  };

  const filledFieldSx = (theme) => ({
    '& .MuiFilledInput-root': {
      borderRadius: 2,
      backgroundColor:
        theme.palette.mode === 'dark'
          ? theme.palette.background.paper
          : theme.palette.common.white,
      border: `1px solid ${theme.palette.divider}`,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      alignItems: 'flex-start',
      paddingRight: 1,
      minWidth: 0,
      '&:hover': {
        borderColor: theme.palette.primary.light,
      },
      '&.Mui-focused': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    },
    '& .MuiFilledInput-input': {
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      minWidth: 0,
    },
    '& .MuiFilledInput-inputMultiline': {
      padding: theme.spacing(1.5),
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      overflowWrap: 'anywhere',
    },
    '& textarea': {
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      overflowWrap: 'anywhere',
    },
    '& .MuiFilledInput-underline:before, & .MuiFilledInput-underline:after': {
      display: 'none',
    },
  });

  const content = (
    <Container maxWidth="xl" sx={embedded ? { py: 3 } : undefined}>
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              AI Artifact Generator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Focus on the core task, add context if needed, then generate code.
            </Typography>
          </Box>
          <Chip
            icon={<AutoAwesomeIcon />}
            label={hasApiKey ? 'Gemini API key connected' : 'API key not configured'}
            color={hasApiKey ? 'success' : 'warning'}
            variant={hasApiKey ? 'filled' : 'outlined'}
            sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
          />
        </Stack>

        {!user?.geminiApiKey && (
          <Alert 
            severity="warning" 
            role="alert"
            sx={{ mb: 3 }}
            action={
              <Button 
                color="warning" 
                size="small" 
                variant="text"
                onClick={() => navigate('/dashboard?tab=Profile')}
              >
                Go to Profile Settings
              </Button>
            }
          >
            Please add your Google Gemini API key in your profile settings to use this feature.
          </Alert>
        )}

        {error && (
          <Alert severity="error" role="alert" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            role="alert"
            severity="success" 
            icon={<CheckCircleIcon />}
            sx={{ 
              mb: 3,
              fontSize: '1.1rem',
              fontWeight: 600,
              '& .MuiAlert-icon': {
                fontSize: '2rem'
              }
            }} 
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {generating && (
          <Card 
            elevation={0} 
            sx={{ mb: 3, border: 1, borderColor: 'primary.main', bgcolor: 'primary.50' }}
            aria-live="polite"
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={24} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={600} color="primary">
                    AI is generating your code...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This may take up to a minute depending on complexity and selected options.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Grid
          container
          spacing={3}
          sx={{
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            flexWrap: 'wrap',
          }}
        >
          <Grid item xs={12} lg={8} sx={{ minWidth: 0 }}>
            <Stack spacing={3} sx={{ minWidth: 0 }}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', minWidth: 0 }}>
                <CardContent sx={{ p: 3, minWidth: 0 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Prompt Builder
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Break down the artifact you need. We’ll stitch these fields into a clean AI prompt.
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
                        <TextField
                          label="Title"
                          variant="filled"
                          value={promptTitle}
                          onChange={(e) => setPromptTitle(e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={filledFieldSx}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} sx={{ minWidth: 0 }}>
                        <TextField
                          select
                          label=""
                          variant="filled"
                          value={programmingLanguage}
                          onChange={(e) => setProgrammingLanguage(e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={filledFieldSx}
                          inputProps={{ 'aria-label': 'Language' }}
                        >
                          {languages.map((lang) => (
                            <MenuItem key={lang} value={lang.toLowerCase()}>
                              {lang}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Complexity
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {complexityLevels.map((level) => {
                            const isSelected = complexity === level.value;
                            return (
                              <Tooltip
                                key={level.value}
                                title={
                                  level.value === 'beginner'
                                    ? 'Great for scripts, labs, and onboarding'
                                    : level.value === 'medium'
                                      ? 'Balanced defaults for most tasks'
                                      : 'Adds architectural patterns and optimization hints'
                                }
                              >
                                <Chip
                                  label={level.label}
                                  onClick={() => setComplexity(level.value)}
                                  component="button"
                                  type="button"
                                  role="button"
                                  aria-pressed={isSelected}
                                  sx={(theme) => {
                                    const paletteColor = theme.palette[level.color] || theme.palette.primary;
                                    const baseColor = paletteColor.main;
                                    return {
                                      fontWeight: 600,
                                      borderWidth: 1.5,
                                      borderColor: isSelected ? baseColor : theme.palette.divider,
                                      bgcolor: isSelected
                                        ? alpha(baseColor, theme.palette.mode === 'dark' ? 0.35 : 0.16)
                                        : 'transparent',
                                      color: isSelected ? (theme.palette.mode === 'dark' ? paletteColor.light : baseColor) : theme.palette.text.primary,
                                      '&:hover': {
                                        borderColor: baseColor,
                                        bgcolor: isSelected
                                          ? alpha(baseColor, theme.palette.mode === 'dark' ? 0.5 : 0.24)
                                          : theme.palette.action.hover,
                                      },
                                      '&:focus-visible': {
                                        outline: `2px solid ${alpha(baseColor, 0.7)}`,
                                      },
                                    };
                                  }}
                                />
                              </Tooltip>
                            );
                          })}
                        </Stack>
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                        Core task *
                      </Typography>
                      <TextField
                        placeholder="Describe the functionality, flows, or endpoints you expect."
                        variant="filled"
                        value={coreTask}
                        onChange={(e) => setCoreTask(e.target.value)}
                        required
                        InputProps={{ disableUnderline: true }}
                        multiline
                        minRows={5}
                        sx={(theme) => ({
                          ...filledFieldSx(theme),
                          '& textarea': {
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                          },
                        })}
                        helperText={hasPrompt ? ' ' : 'This field is required to run generation.'}
                        FormHelperTextProps={{ sx: { color: hasPrompt ? 'transparent' : 'error.main', mt: 0.5 } }}
                      />
                    </Box>

                    <Accordion disableGutters sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Advanced details (optional)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            label="Project context"
                            placeholder="Explain where this code runs, stakeholders, or business constraints..."
                            variant="filled"
                            value={contextDetails}
                            onChange={(e) => setContextDetails(e.target.value)}
                            InputProps={{ disableUnderline: true }}
                            multiline
                            minRows={3}
                            sx={(theme) => ({
                              ...filledFieldSx(theme),
                              '& textarea': {
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                              },
                            })}
                            helperText="Adds signals that help the AI choose patterns."
                            FormHelperTextProps={{ sx: { color: 'text.secondary', mt: 0.5 } }}
                          />
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                              <TextField
                                label="Technical requirements"
                                placeholder="Frameworks, data models, performance targets..."
                                variant="filled"
                                value={technicalRequirements}
                                onChange={(e) => setTechnicalRequirements(e.target.value)}
                                InputProps={{ disableUnderline: true }}
                                multiline
                                minRows={3}
                                sx={(theme) => ({
                                  ...filledFieldSx(theme),
                                  '& textarea': {
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                  },
                                })}
                              />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                              <TextField
                                label="Acceptance criteria"
                                placeholder="Edge cases, error handling, testing expectations..."
                                variant="filled"
                                value={acceptanceCriteria}
                                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                                InputProps={{ disableUnderline: true }}
                                multiline
                                minRows={3}
                                sx={(theme) => ({
                                  ...filledFieldSx(theme),
                                  '& textarea': {
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                  },
                                })}
                              />
                            </Grid>
                          </Grid>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                        Generation options
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {[
                          {
                            label: 'Include comments',
                            active: includeComments,
                            toggle: () => setIncludeComments(!includeComments),
                          },
                          {
                            label: 'Follow best practices',
                            active: followBestPractices,
                            toggle: () => setFollowBestPractices(!followBestPractices),
                          },
                          {
                            label: 'Add error handling',
                            active: addErrorHandling,
                            toggle: () => setAddErrorHandling(!addErrorHandling),
                          }
                        ].map((chip) => (
                          <Chip
                            key={chip.label}
                            label={chip.label}
                            onClick={chip.toggle}
                            component="button"
                            type="button"
                            role="switch"
                            aria-checked={chip.active}
                            sx={(theme) => ({
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              borderWidth: 1.5,
                              borderColor: chip.active ? theme.palette.primary.main : theme.palette.divider,
                              bgcolor: chip.active
                                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.4 : 0.12)
                                : 'transparent',
                              color: chip.active ? theme.palette.primary.main : theme.palette.text.primary,
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                bgcolor: chip.active
                                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.55 : 0.18)
                                  : theme.palette.action.hover
                              }
                            })}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
                <Divider />
                <CardActions 
                  sx={{ 
                    p: 2, 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleReset}
                    disabled={generating}
                  >
                    Reset
                  </Button>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, flex: 1 }}>
                    <Tooltip 
                      title={isGenerateDisabled ? generateDisabledReason : ''}
                      placement="top"
                      disableHoverListener={!isGenerateDisabled}
                    >
                      <Box component="span" sx={{ width: '100%', display: 'inline-flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                          onClick={handleGenerate}
                          disabled={isGenerateDisabled}
                          aria-disabled={isGenerateDisabled}
                          sx={(theme) => ({
                            minWidth: 220,
                            fontWeight: 600,
                            borderRadius: 2,
                            bgcolor: isGenerateDisabled
                              ? theme.palette.grey[300]
                              : theme.palette.mode === 'dark'
                                ? theme.palette.primary.light
                                : theme.palette.primary.light,
                            color: isGenerateDisabled
                              ? theme.palette.text.disabled
                              : theme.palette.primary.contrastText,
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: isGenerateDisabled ? theme.palette.grey[300] : theme.palette.primary.main
                            },
                            '&.Mui-disabled': {
                              border: `1px dashed ${theme.palette.divider}`,
                              color: theme.palette.text.disabled,
                              bgcolor: theme.palette.mode === 'dark'
                                ? alpha(theme.palette.text.primary, 0.2)
                                : theme.palette.grey[200],
                              opacity: 1
                            }
                          })}
                        >
                          {generating ? 'Generating Code...' : 'Generate Code'}
                        </Button>
                      </Box>
                    </Tooltip>
                    {isGenerateDisabled && generateDisabledReason && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: { xs: 'left', sm: 'right' } }}>
                        {generateDisabledReason}
                      </Typography>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={4} sx={{ minWidth: 0, display: 'flex' }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%', width: '100%' }}>
              <CardContent sx={{ p: 3, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Generation status
                </Typography>
                <Stack spacing={1.5} mb={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <SettingsIcon color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Prompt ready
                      </Typography>
                      <Typography variant="caption" color={hasPrompt ? 'text.secondary' : 'error.main'}>
                        {hasPrompt ? 'Looks good—review the preview below.' : 'Fill the core task to enable generation.'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <DescriptionIcon color={hasApiKey ? 'success' : 'warning'} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        API access
                      </Typography>
                      <Typography variant="caption" color={hasApiKey ? 'text.secondary' : 'warning.main'}>
                        {hasApiKey ? 'Gemini key detected.' : 'Add your Gemini key from dashboard settings.'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PlayArrowIcon color="info" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Review flow
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generated files go to AI Artifact Approval for sign-off.
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
                <Accordion defaultExpanded disableGutters sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Prompt preview
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ minWidth: 0 }}>
                    <Box
                      component="pre"
                      sx={(theme) => ({
                        p: 2,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[50],
                        border: `1px solid ${theme.palette.divider}`,
                        maxHeight: 280,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        width: '100%',
                        maxWidth: '100%',
                        display: 'block',
                        fontFamily: 'Menlo, Consolas, monospace',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      })}
                    >
                      {composedPrompt || 'Title:\n\nContext:\n\nCore Task:\n\nTechnical Requirements:\n\nAcceptance Criteria:'}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );

  if (embedded) {
    return content;
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <AppBar 
          position="fixed" 
          color="default"
          sx={{ 
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            color: 'text.primary'
          }}
          elevation={0}
        >
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
              AI Artifact Generator
            </Typography>
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
            width: '100%',
            overflowX: 'hidden'
          }}
        >
          <Toolbar />
          {content}
        </Box>
      </Box>
    </AppTheme>
  );
};

export default AIArtifactGenerator;
