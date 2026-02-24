import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import './styles/App.css';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import VerifyEmail from './pages/VerifyEmail';

import AdminUsers from './pages/AdminUsers';
import PendingApproval from './pages/PendingApproval';
import Rejected from './pages/Rejected';

// ==================== NEW IMPORTS - Researcher Pages ====================
import CreateEditStudy from './pages/researcher/CreateEditStudy';
import StudyPreview from './pages/researcher/StudyPreview';
import StudyLayout from './pages/researcher/StudyLayout';
import StudyOverviewTab from './pages/researcher/study/StudyOverviewTab';
import StudyEditTab from './pages/researcher/study/StudyEditTab';
import StudyEvaluationTasksTab from './pages/researcher/study/StudyEvaluationTasksTab';
import StudyParticipantsTab from './pages/researcher/study/StudyParticipantsTab';
import StudyReviewersTab from './pages/researcher/study/StudyReviewersTab';
import StudyQuizzesTab from './pages/researcher/study/StudyQuizzesTab';

import ParticipantEnrollment from './pages/researcher/ParticipantEnrollment';
import StudyStatistics from './pages/researcher/StudyStatistics';
import AIArtifactGenerator from './pages/researcher/AIArtifactGenerator';
import AIQuestionGeneration from './pages/researcher/AIQuestionGeneration';
import AIQuestionApproval from './pages/researcher/AIQuestionApproval';
import CreateQuiz from './pages/researcher/CreateQuiz';
import StudyResults from './pages/researcher/StudyResults';
import StudyQuizResults from './pages/researcher/StudyQuizResults';
import ArtifactDetails from './pages/researcher/ArtifactDetails';
import QuestionnaireList from './pages/researcher/questionnaires/QuestionnaireList';
import QuestionnaireBuilder from './pages/researcher/questionnaires/QuestionnaireBuilder';
import QuestionnaireView from './pages/researcher/questionnaires/QuestionnaireView';
import AssignQuiz from './pages/researcher/AssignQuiz';
import GradeSubmissions from './pages/researcher/GradeSubmissions';
import GradeSubmissionDetail from './pages/researcher/GradeSubmissionDetail';
import AssignReviewers from './pages/researcher/AssignReviewers';
import CreateEvaluationTask from './pages/researcher/CreateEvaluationTask';
import CreateCustomEvaluationTask from './pages/researcher/CreateCustomEvaluationTask';
import ResearcherEvaluationTasks from './pages/researcher/ResearcherEvaluationTasks';
import ResearcherEvaluationTaskDetail from './pages/researcher/EvaluationTaskDetail';
import EvaluationTaskParticipants from './pages/researcher/EvaluationTaskParticipants';
import EvaluationTaskSubmissions from './pages/researcher/EvaluationTaskSubmissions';
import SubmissionReviewDetail from './pages/researcher/SubmissionReviewDetail';


// ==================== NEW IMPORTS - Participant Pages ====================
import AssignedStudyDetail from './pages/participant/AssignedStudyDetail';
import QuizPage from './pages/participant/QuizPage';
import ResultsFeedback from './pages/participant/ResultsFeedback';

import ParticipantEvaluationTaskDetail from './pages/participant/EvaluationTaskDetail';
import QuizResult from './pages/participant/QuizResult';

// ==================== NEW IMPORTS - Reviewer Pages ====================
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import AssignedReviews from './pages/reviewer/AssignedReviews';
import ArtifactReview from './pages/reviewer/ArtifactReview';
import ReviewHistory from './pages/reviewer/ReviewHistory';
import ReviewerEvaluationView from './pages/reviewer/ReviewerEvaluationView';
import ReviewerStudyDashboard from './pages/reviewer/ReviewerStudyDashboard';
import ReviewerEvaluationComparison from './pages/reviewer/ReviewerEvaluationComparison';

// ==================== NEW IMPORTS - Admin Pages (additional) ====================
import MonitorStudies from './pages/admin/MonitorStudies';
import AdminStudyDetails from './pages/admin/StudyDetails';

// ==================== NEW IMPORTS - Shared Pages ====================
import SideBySideComparator from './pages/shared/SideBySideComparator';
import NotificationsPage from './pages/shared/NotificationsPage';
import StudyHistory from './pages/shared/StudyHistory';
import ErrorPage from './pages/shared/ErrorPage';
import AccessDenied from './pages/shared/AccessDenied';
import NotFound from './pages/shared/NotFound';
import ArtifactAnalyticsPage from './pages/shared/ArtifactAnalyticsPage';

import './styles/App.css';

// ==================== ROUTE GUARDS ====================
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (user.researcherRequested && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }
  
  if (user.researcherRejected && location.pathname !== '/rejected') {
    return <Navigate to="/rejected" replace />;
  }
  
  // Allow ADMIN to access all pages, or check if user role is in allowedRoles
  if (allowedRoles && user.role !== 'ADMIN' && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading">Loading...</div>;
  return user ? <Navigate to="/dashboard" /> : children;
};

// ==================== MAIN APP COMPONENT ====================
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />
            <Route
              path="/verify-email"
              element={
                <PublicRoute>
                  <VerifyEmail />
                </PublicRoute>
              }
            />

            {/* ==================== MAIN DASHBOARD ==================== */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* ==================== AUTH STATUS PAGES ==================== */}
            <Route
              path="/pending-approval"
              element={
                <PrivateRoute>
                  <PendingApproval />
                </PrivateRoute>
              }
            />
            <Route
              path="/rejected"
              element={
                <PrivateRoute>
                  <Rejected />
                </PrivateRoute>
              }
            />

            {/* ==================== RESEARCHER ROUTES ==================== */}
            <Route
              path="/researcher/create-evaluation-task"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <CreateCustomEvaluationTask />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/studies/:studyId/create-evaluation-task"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <CreateCustomEvaluationTask />
                </PrivateRoute>
              }
            />
            <Route
              path="/studies/:studyId/tasks/create-custom"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <CreateCustomEvaluationTask />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/evaluation-tasks"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <ResearcherEvaluationTasks />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/evaluation-tasks/:id"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <ResearcherEvaluationTaskDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/evaluation-tasks/:id/participants"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <EvaluationTaskParticipants />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/evaluation-tasks/:taskId/submissions"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <EvaluationTaskSubmissions />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/evaluation-tasks/:taskId/submissions/:assignmentId"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <SubmissionReviewDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/create-study"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <CreateEditStudy />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/study/:studyId"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <StudyLayout />
                </PrivateRoute>
              }
            >
              {/* Nested routes for study tabs */}
              <Route index element={<StudyOverviewTab />} />
              <Route path="edit" element={<StudyEditTab />} />
              <Route path="evaluation-tasks" element={<StudyEvaluationTasksTab />} />
              <Route path="participants" element={<StudyParticipantsTab />} />
              <Route path="reviewers" element={<StudyReviewersTab />} />
              <Route path="quizzes" element={<StudyQuizzesTab />} />
            </Route>

            <Route
              path="/researcher/study/:studyId/enrollments"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <ParticipantEnrollment />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/study/:studyId/statistics"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <StudyStatistics />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/statistics"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <StudyStatistics />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/study/:studyId/results"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <StudyResults />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/study/:studyId/quiz-results"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <StudyQuizResults />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/ai-generator"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <AIArtifactGenerator />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/ai-questions"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <AIQuestionGeneration />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/ai-questions/approval"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <AIQuestionApproval />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/artifact/:artifactId"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <ArtifactDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/artifact/:artifactId/analytics"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <ArtifactAnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/study/:studyId/artifacts/:artifactId/analytics"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <ArtifactAnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/artifact/:artifactId"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <ArtifactDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/create-quiz"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <CreateQuiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <QuestionnaireList />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires/create"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <QuestionnaireBuilder />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires/:id/edit"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <QuestionnaireBuilder />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <QuestionnaireList />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires/create"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <QuestionnaireBuilder />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires/:id"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <QuestionnaireView />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires/:id/edit"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <QuestionnaireBuilder />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/questionnaires/:questionnaireId/assign"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <AssignQuiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/study/:studyId/quizzes/:studyQuizId/assign"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <AssignQuiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/grading"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <GradeSubmissions />
                </PrivateRoute>
              }
            />
            <Route
              path="/researcher/grading/:submissionId"
              element={
                <PrivateRoute allowedRoles={['RESEARCHER']}>
                  <GradeSubmissionDetail />
                </PrivateRoute>
              }
            />
            {/* ==================== PARTICIPANT ROUTES ==================== */}

            <Route
              path="/participant/evaluation/:assignmentId"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <ParticipantEvaluationTaskDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/evaluation-tasks/:studyId"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <AssignedStudyDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/study/:studyId"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <AssignedStudyDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/study/:studyId/task/:taskId"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <SideBySideComparator />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/quiz/:quizId"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <QuizPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/results"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <ResultsFeedback />
                </PrivateRoute>
              }
            />
            <Route
              path="/participant/quiz-result/:assignmentId"
              element={
                <PrivateRoute allowedRoles={['PARTICIPANT']}>
                  <QuizResult />
                </PrivateRoute>
              }
            />

            {/* ==================== REVIEWER ROUTES ==================== */}
            <Route path="/reviewer/dashboard" element={<PrivateRoute><ReviewerDashboard /></PrivateRoute>} />
            <Route path="/reviewer/reviews" element={<PrivateRoute><AssignedReviews /></PrivateRoute>} />
            <Route path="/reviewer/review/:reviewId" element={<PrivateRoute><ArtifactReview /></PrivateRoute>} />
            <Route path="/reviewer/history" element={<PrivateRoute><ReviewHistory /></PrivateRoute>} />
            <Route
              path="/reviewer/studies/:studyId/reviewer-dashboard"
              element={
                <PrivateRoute allowedRoles={['REVIEWER']}>
                  <ReviewerStudyDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/reviewer/studies/:studyId/evaluations/:assignmentId"
              element={
                <PrivateRoute allowedRoles={['REVIEWER']}>
                  <ReviewerEvaluationView />
                </PrivateRoute>
              }
            />
            <Route
              path="/studies/:studyId/reviewer/evaluations/:assignmentId"
              element={
                <PrivateRoute allowedRoles={['REVIEWER']}>
                  <ReviewerEvaluationView />
                </PrivateRoute>
              }
            />
            <Route
              path="/reviewer/studies/:studyId/comparison"
              element={
                <PrivateRoute allowedRoles={['REVIEWER']}>
                  <ReviewerEvaluationComparison />
                </PrivateRoute>
              }
            />

            {/* ==================== ADMIN ROUTES ==================== */}
            <Route
              path="/admin/users"
              element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                  <AdminUsers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/studies"
              element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                  <MonitorStudies />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/studies/:studyId"
              element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                  <AdminStudyDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/artifact/:artifactId"
              element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                  <ArtifactDetails />
                </PrivateRoute>
              }
            />


            {/* ==================== SHARED ROUTES ==================== */}
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <NotificationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <StudyHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/comparator/:studyId/:taskId"
              element={
                <PrivateRoute>
                  <SideBySideComparator />
                </PrivateRoute>
              }
            />

            {/* ==================== ERROR PAGES ==================== */}
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/error" element={<ErrorPage />} />

            {/* ==================== CATCH-ALL (404) ==================== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
