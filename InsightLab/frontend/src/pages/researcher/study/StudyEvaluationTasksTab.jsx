import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box } from '@mui/material';
import ResearcherEvaluationTasks from '../ResearcherEvaluationTasks';

const StudyEvaluationTasksTab = () => {
  const { study, studyId } = useOutletContext();

  if (!study) return null;

  // Render the existing ResearcherEvaluationTasks component in embedded mode
  return (
    <Box>
      <ResearcherEvaluationTasks embedded studyIdProp={studyId} />
    </Box>
  );
};

export default StudyEvaluationTasksTab;

