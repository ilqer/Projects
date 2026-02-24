import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box } from '@mui/material';
import ParticipantEnrollment from '../ParticipantEnrollment';

const StudyParticipantsTab = () => {
  const { study, studyId } = useOutletContext();

  if (!study) return null;

  // Render the existing ParticipantEnrollment component in embedded mode
  return (
    <Box>
      <ParticipantEnrollment embedded studyIdProp={studyId} />
    </Box>
  );
};

export default StudyParticipantsTab;

