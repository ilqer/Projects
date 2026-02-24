import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Card, CardContent, CardActions,
  Grid, Chip, Stack, IconButton, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as VisibilityIcon, PowerSettingsNew as PowerIcon,
  Assessment as AssessmentIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { questionnaireService } from '../../../services/questionnaireService';

const QuestionnaireList = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      const response = await questionnaireService.getMyQuestionnaires();
      setQuestionnaires(response.data);
    } catch (err) {
      setError('Failed to load questionnaires');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await questionnaireService.deleteQuestionnaire(selectedQuestionnaire.id);
      setQuestionnaires(prev => prev.filter(q => q.id !== selectedQuestionnaire.id));
      setDeleteDialogOpen(false);
      setSelectedQuestionnaire(null);
    } catch (err) {
      setError('Failed to delete questionnaire');
      console.error(err);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await questionnaireService.deactivateQuestionnaire(id);
      loadQuestionnaires();
    } catch (err) {
      setError('Failed to deactivate questionnaire');
      console.error(err);
    }
  };

  const handleActivate = async (id) => {
    try {
      await questionnaireService.activateQuestionnaire(id);
      loadQuestionnaires();
    } catch (err) {
      setError('Failed to activate questionnaire');
      console.error(err);
    }
  };

  const openDeleteDialog = (questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setDeleteDialogOpen(true);
  };

  const getTypeColor = (type) => {
    return type === 'COMPETENCY' ? 'primary' : 'secondary';
  };

  const getTypeLabel = (type) => {
    return type === 'COMPETENCY' ? 'Competency' : 'Background';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: embedded ? 0 : 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!embedded && (
            <IconButton
              onClick={() => navigate('/dashboard')}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              My Questionnaires
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your competency and background questionnaires
            </Typography>
          </Box>
        </Box>
        {!embedded && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/researcher/questionnaires/create')}
            size="large"
          >
            Create Questionnaire
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {questionnaires.length === 0 ? (
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', p: 4, textAlign: 'center' }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" mb={2}>
            No questionnaires yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first questionnaire to assess participant competency and background
          </Typography>
          {!embedded && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/researcher/questionnaires/create')}
            >
              Create Questionnaire
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {questionnaires.map((questionnaire) => (
            <Grid item xs={12} md={6} lg={4} key={questionnaire.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: 1,
                  borderColor: 'divider',
                  transition: 'all 0.3s',
                  '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={getTypeLabel(questionnaire.type)}
                      color={getTypeColor(questionnaire.type)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={questionnaire.isActive ? 'Active' : 'Inactive'}
                      color={questionnaire.isActive ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`v${questionnaire.version}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="h6" fontWeight={600} gutterBottom noWrap title={questionnaire.title}>
                    {questionnaire.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 2,
                      minHeight: 40
                    }}
                  >
                    {questionnaire.description || 'No description'}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Questions
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {questionnaire.questionCount}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(questionnaire.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <Divider />

                <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/researcher/questionnaires/${questionnaire.id}`)}
                      title="View"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/researcher/questionnaires/${questionnaire.id}/edit`)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => questionnaire.isActive ? handleDeactivate(questionnaire.id) : handleActivate(questionnaire.id)}
                      title={questionnaire.isActive ? "Deactivate" : "Activate"}
                      color={questionnaire.isActive ? "default" : "success"}
                    >
                      <PowerIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => openDeleteDialog(questionnaire)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Questionnaire</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedQuestionnaire?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuestionnaireList;
