import React, { useState } from 'react';
import { Box, Container, Tabs, Tab } from '@mui/material';
import {
  Dashboard,
  Settings,
  People,
  Assessment,
  Folder,
  Assignment,
  History,
  AutoAwesome,
  Leaderboard,
  Science,
  CheckCircle,
  LibraryBooks,
} from '@mui/icons-material';

import AdminOverview from '../admin/dashboard/AdminOverview';
import UserManagement from '../admin/dashboard/UserManagement';
import ArtifactManagement from '../admin/dashboard/ArtifactManagement';
import SystemSettings from '../admin/dashboard/SystemSettings';
import MonitorStudies from '../admin/MonitorStudies';

import ReviewerOverview from '../reviewer/dashboard/ReviewerOverview';
import AssignedReviews from '../reviewer/AssignedReviews';
import ReviewHistory from '../reviewer/ReviewHistory';

import ParticipantOverview from '../participant/dashboard/ParticipantOverview';
import ParticipantHistory from '../participant/dashboard/ParticipantHistory';
import ResultsFeedback from '../participant/ResultsFeedback';

import ResearcherOverview from '../researcher/dashboard/ResearcherOverview';
import MyStudies from '../researcher/dashboard/MyStudies';
import AIArtifactGenerator from '../researcher/AIArtifactGenerator';
import StudyResults from '../researcher/StudyResults';
import StudyStatistics from '../researcher/StudyStatistics';
import QuestionnaireList from '../researcher/questionnaires/QuestionnaireList';
import AIQuestionGeneration from '../researcher/AIQuestionGeneration';
import AIQuestionApproval from '../researcher/AIQuestionApproval';
import AIArtifactApproval from '../researcher/AIArtifactApproval';

/* ---------------- RESEARCHER ---------------- */

const ResearcherContent = ({ user, onNavigateToProfile }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<Science />} label="Studies" iconPosition="start" />
            <Tab icon={<LibraryBooks />} label="Questionnaires" iconPosition="start" />
            <Tab icon={<AutoAwesome />} label="AI Artifacts" iconPosition="start" />
            <Tab icon={<CheckCircle />} label="Artifact Approval" iconPosition="start" />
            <Tab icon={<AutoAwesome />} label="AI Questions" iconPosition="start" />
            <Tab icon={<CheckCircle />} label="Question Approval" iconPosition="start" />
            <Tab icon={<Assessment />} label="Results" iconPosition="start" />
            <Tab icon={<Leaderboard />} label="Statistics" iconPosition="start" />
          </Tabs>
        </Container>
      </Box>

      <Box sx={{ py: 3 }}>
        {activeTab === 0 && <ResearcherOverview user={user} />}
        {activeTab === 1 && <MyStudies user={user} />}
        {activeTab === 2 && <QuestionnaireList embedded />}
        {activeTab === 3 && <AIArtifactGenerator embedded />}
        {activeTab === 4 && <AIArtifactApproval embedded />}
        {activeTab === 5 && <AIQuestionGeneration embedded onNavigateToProfile={onNavigateToProfile} />}
        {activeTab === 6 && <AIQuestionApproval embedded />}
        {activeTab === 7 && <StudyResults embedded />}
        {activeTab === 8 && <StudyStatistics embedded />}
      </Box>
    </Box>
  );
};

/* ---------------- ADMIN ---------------- */

const AdminContent = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<People />} label="Users" iconPosition="start" />
            <Tab icon={<Assessment />} label="Studies" iconPosition="start" />
            <Tab icon={<Folder />} label="Artifacts" iconPosition="start" />
            <Tab icon={<Settings />} label="Settings" iconPosition="start" />
          </Tabs>
        </Container>
      </Box>

      <Box sx={{ py: 3 }}>
        {activeTab === 0 && <AdminOverview user={user} />}
        {activeTab === 1 && <UserManagement />}
        {activeTab === 2 && <MonitorStudies embedded />}
        {activeTab === 3 && <ArtifactManagement />}
        {activeTab === 4 && <SystemSettings />}
      </Box>
    </Box>
  );
};

/* ---------------- PARTICIPANT ---------------- */

const ParticipantContent = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<Assessment />} label="Results" iconPosition="start" />
            <Tab icon={<History />} label="History" iconPosition="start" />
          </Tabs>
        </Container>
      </Box>

      <Box sx={{ py: 3 }}>
        {activeTab === 0 && <ParticipantOverview user={user} />}
        {activeTab === 1 && <ResultsFeedback embedded />}
        {activeTab === 2 && <ParticipantHistory />}
      </Box>
    </Box>
  );
};

/* ---------------- REVIEWER ---------------- */

const ReviewerContent = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<Assignment />} label="Assigned Reviews" iconPosition="start" />
            <Tab icon={<History />} label="Review History" iconPosition="start" />
          </Tabs>
        </Container>
      </Box>

      <Box sx={{ py: 3 }}>
        {activeTab === 0 && <ReviewerOverview user={user} />}
        {activeTab === 1 && <AssignedReviews embedded />}
        {activeTab === 2 && <ReviewHistory embedded />}
      </Box>
    </Box>
  );
};

/* ---------------- SWITCH ---------------- */

const RoleDashboard = ({ user, onNavigateToProfile }) => {
  switch (user?.role) {
    case 'RESEARCHER':
      return <ResearcherContent user={user} onNavigateToProfile={onNavigateToProfile} />;
    case 'ADMIN':
      return <AdminContent user={user} />;
    case 'PARTICIPANT':
      return <ParticipantContent user={user} />;
    case 'REVIEWER':
      return <ReviewerContent user={user} />;
    default:
      return <ParticipantContent user={user} />;
  }
};

export default RoleDashboard;
