import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const StudyOverviewTab = () => {
  const { study, studyId } = useOutletContext();
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!study) return null;

  return (
    <Box>
      {study.description && (
        <>
          <Typography variant="h6" gutterBottom>Description</Typography>
          <Typography variant="body1" component="div">{study.description}</Typography>
        </>
      )}

      <Typography variant="h6" gutterBottom>Objective</Typography>
      <Typography variant="body1" component="div">{study.objective}</Typography>

      <Divider sx={{ my: 2 }} />

      <List>
        <ListItem>
          <ListItemText primary="Start Date" secondary={formatDate(study.startDate)} />
        </ListItem>
        {study.endDate && (
          <ListItem>
            <ListItemText primary="End Date (Deadline)" secondary={formatDate(study.endDate)} />
          </ListItem>
        )}
        {study.maxParticipants && (
          <ListItem>
            <ListItemText primary="Maximum Participants" secondary={study.maxParticipants} />
          </ListItem>
        )}
        <ListItem>
          <ListItemText primary="Created By" secondary={study.researcherName} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Created At" secondary={new Date(study.createdAt).toLocaleString()} />
        </ListItem>
      </List>

      {/* Study Artifacts Section */}
      {study.artifacts && study.artifacts.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Study Artifacts</Typography>
          <List>
            {study.artifacts.map((artifact, index) => {
              const artifactUuid = artifact.artifactId || artifact.id;
              return (
                <ListItem key={index}>
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <ListItemText
                      primary={artifact.displayLabel || artifact.originalFilename || `Artifact ${index + 1}`}
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                          <Chip label={artifact.contentType} size="small" variant="outlined" />
                          {artifact.fileSize && (
                            <Chip label={`${(artifact.fileSize / 1024).toFixed(1)} KB`} size="small" variant="outlined" />
                          )}
                        </Stack>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AnalyticsIcon />}
                      onClick={() => navigate(`/researcher/study/${studyId}/artifacts/${artifactUuid}/analytics`)}
                    >
                      Analytics
                    </Button>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </>
      )}

      {/* Quick Actions */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>Quick Actions</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {study.status !== 'ARCHIVED' && study.status !== 'COMPLETED' && study.status !== 'CANCELLED' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/researcher/studies/${studyId}/create-evaluation-task`)}
          >
            Create Evaluation Task
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default StudyOverviewTab;
