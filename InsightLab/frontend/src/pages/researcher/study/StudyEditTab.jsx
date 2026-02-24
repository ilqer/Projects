import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import CreateEditStudy from '../CreateEditStudy';

const StudyEditTab = () => {
  const { study, loadStudy, studyId } = useOutletContext();

  if (!study) return null;

  const isEditable = study.status !== 'ARCHIVED' && study.status !== 'COMPLETED' && study.status !== 'CANCELLED';

  if (!isEditable) {
    return (
      <Box>
        <Alert severity="warning">
          This study cannot be edited because its status is {study.status}.
        </Alert>
      </Box>
    );
  }

  // Render the existing CreateEditStudy component in embedded mode
  return (
    <Box>
      <CreateEditStudy embedded studyIdProp={studyId} onSave={loadStudy} />
    </Box>
  );
};

export default StudyEditTab;

