import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box } from '@mui/material';
import AssignReviewers from '../AssignReviewers';

const StudyReviewersTab = () => {
  const { study, studyId } = useOutletContext();

  if (!study) return null;

  // Render the existing AssignReviewers component in embedded mode
  return (
    <Box>
      <AssignReviewers embedded studyIdProp={studyId} />
    </Box>
  );
};

export default StudyReviewersTab;

