import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import { questionnaireService } from '../../services/questionnaireService';
import { aiQuestionService } from '../../services/aiQuestionService';
import { Edit, Check, Close, Delete } from '@mui/icons-material';

function AIQuestionApproval({ embedded = false }) {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  useEffect(() => {
    if (selectedQuestionnaire) {
      loadDrafts(selectedQuestionnaire);
    }
  }, [selectedQuestionnaire]);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      const response = await questionnaireService.getMyQuestionnaires();
      setQuestionnaires(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const loadDrafts = async (questionnaireId) => {
    try {
      setLoading(true);
      const response = await aiQuestionService.getPendingDrafts(questionnaireId);
      setDrafts(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draftId) => {
    if (!window.confirm('Approve this question and add it to the questionnaire?')) {
      return;
    }

    try {
      setProcessing(true);
      await aiQuestionService.approveDraft(draftId);
      setMessage('Question approved and added to questionnaire!');
      if (selectedQuestionnaire) {
        loadDrafts(selectedQuestionnaire);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve question');
    } finally {
      setProcessing(false);
    }
  };

  const handleDiscard = async (draftId) => {
    if (!window.confirm('Discard this question? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);
      await aiQuestionService.discardDraft(draftId);
      if (selectedQuestionnaire) {
        loadDrafts(selectedQuestionnaire);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to discard question');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (draft) => {
    setEditingDraft(draft);
    setEditFormData({
      questionText: draft.questionText,
      correctAnswer: draft.correctAnswer || '',
      points: draft.points || 1,
      options: draft.options?.map(opt => ({
        optionText: opt.optionText,
        isCorrect: opt.isCorrect || false,
        displayOrder: opt.displayOrder || 0,
      })) || [],
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      setProcessing(true);
      await aiQuestionService.updateDraft(editingDraft.id, editFormData);
      setEditDialog(false);
      setEditingDraft(null);
      if (selectedQuestionnaire) {
        loadDrafts(selectedQuestionnaire);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update question');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !drafts.length) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: embedded ? '100%' : 1200, mx: 'auto', p: embedded ? 0 : 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Question Approval
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review, edit, approve, or discard AI-generated questions before adding them to your questionnaires.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Questionnaire
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {questionnaires.map((q) => (
              <Chip
                key={q.id}
                label={q.title}
                onClick={() => setSelectedQuestionnaire(q.id)}
                color={selectedQuestionnaire === q.id ? 'primary' : 'default'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {selectedQuestionnaire && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Pending Questions ({drafts.length})
          </Typography>
          {drafts.length === 0 ? (
            <Alert severity="info">No pending questions for this questionnaire.</Alert>
          ) : (
            <Grid container spacing={2}>
              {drafts.map((draft) => (
                <Grid item xs={12} key={draft.id}>
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box flex={1}>
                            <Typography variant="h6">{draft.questionText}</Typography>
                            <Stack direction="row" spacing={1} mt={1}>
                              <Chip label={draft.type} size="small" />
                              <Chip label={`${draft.points} points`} size="small" />
                            </Stack>
                            {draft.correctAnswer && (
                              <Typography variant="body2" color="text.secondary" mt={1}>
                                Correct Answer: {draft.correctAnswer}
                              </Typography>
                            )}
                            {draft.options && draft.options.length > 0 && (
                              <Box mt={2}>
                                <Typography variant="subtitle2">Options:</Typography>
                                {draft.options.map((opt, idx) => (
                                  <Box key={idx} display="flex" alignItems="center" mt={0.5}>
                                    <Checkbox checked={opt.isCorrect} disabled size="small" />
                                    <Typography variant="body2">{opt.optionText}</Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              color="primary"
                              onClick={() => handleEdit(draft)}
                              disabled={processing}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="success"
                              onClick={() => handleApprove(draft.id)}
                              disabled={processing}
                            >
                              <Check />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDiscard(draft.id)}
                              disabled={processing}
                            >
                              <Close />
                            </IconButton>
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Question</DialogTitle>
        <DialogContent>
          {editFormData && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Question Text"
                value={editFormData.questionText}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, questionText: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Correct Answer"
                value={editFormData.correctAnswer}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, correctAnswer: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Points"
                type="number"
                value={editFormData.points}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, points: parseInt(e.target.value) || 1 })
                }
                fullWidth
              />
              {editFormData.options && editFormData.options.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Options:
                  </Typography>
                  {editFormData.options.map((opt, idx) => (
                    <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                      <Checkbox
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const newOptions = [...editFormData.options];
                          newOptions[idx].isCorrect = e.target.checked;
                          setEditFormData({ ...editFormData, options: newOptions });
                        }}
                      />
                      <TextField
                        value={opt.optionText}
                        onChange={(e) => {
                          const newOptions = [...editFormData.options];
                          newOptions[idx].optionText = e.target.value;
                          setEditFormData({ ...editFormData, options: newOptions });
                        }}
                        fullWidth
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={processing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AIQuestionApproval;

