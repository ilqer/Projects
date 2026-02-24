import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationReviewService } from '../../services/api';
import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material';

/**
 * Legacy route shim for /reviewer/review/:reviewId
 *
 * Older links pass only the participant assignment ID. We fetch the review detail
 * through the reviewer evaluation API and forward the user to the modern
 * ReviewerEvaluationView route so the submission (custom or legacy) can be inspected.
 */
const LegacyArtifactReviewRedirect = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const redirect = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await evaluationReviewService.getReviewDetail(reviewId);
        const detail = res.data;
        const studyId = detail?.studyId || detail?.task?.studyId;
        const assignmentId = detail?.assignment?.id || reviewId;

        if (!studyId || !assignmentId) {
          setError('Review detail is missing study information.');
          return;
        }

        navigate(
          `/reviewer/studies/${studyId}/evaluations/${assignmentId}`,
          {
            replace: true,
            state: { redirectedFromLegacyReview: true }
          }
        );
      } catch (err) {
        console.error('Failed to load review detail', err);
        setError(
          err.response?.data?.message ||
            'Unable to open the requested review.'
        );
      } finally {
        setLoading(false);
      }
    };

    redirect();
  }, [reviewId, navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading review…
          </Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/reviewer/reviews')}>
              Back
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}
    </Container>
  );
};

export default LegacyArtifactReviewRedirect;
