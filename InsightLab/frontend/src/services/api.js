import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      //fix for reroute to login when already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  requestReactivation: (credentials) => api.post('/api/auth/request-reactivation', credentials),
  verifyEmail: (email, code) => api.post('/api/auth/verify-email', { email, code }),
  resendCode: (email) => api.post('/api/auth/resend-verification', { email }),
};

export const userService = {
  getAllUsers: () => api.get('/api/users'),
  getUserById: (id) => api.get(`/api/users/${id}`),
  getCurrentUser: () => api.get('/api/users/me'),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
  changePassword: (id, payload) => api.post(`/api/users/${id}/change-password`, payload),
  
  // Researcher requests
  getResearcherRequests: () => api.get('/api/users/researcher-requests'),
  approveResearcher: (id) => api.post(`/api/users/${id}/approve-researcher`),
  rejectResearcher: (id) => api.post(`/api/users/${id}/reject-researcher`),
  
  // Account deactivation/reactivation
  deactivateAccount: (id) => api.post(`/api/users/${id}/deactivate`),
  getReactivationRequests: () => api.get('/api/users/reactivation-requests'),
  approveReactivation: (id) => api.post(`/api/users/${id}/approve-reactivation`),
  rejectReactivation: (id) => api.post(`/api/users/${id}/reject-reactivation`),
  adminToggleUserStatus: (id, active) => api.post(`/api/users/${id}/toggle-status`, { active }),
  
  // Admin
  adminUpdateUser: (id, userData) => api.put(`/api/users/${id}/admin-update`, userData),
};

export const studyService = {
  createStudy: (studyData) => api.post('/api/studies', studyData),
  updateStudy: (studyId, studyData) => api.put(`/api/studies/${studyId}`, studyData),
  getStudyById: (studyId) => api.get(`/api/studies/${studyId}`),
  getStudyDetails: (studyId) => api.get(`/api/studies/${studyId}`),
  getStudyEvaluationTasks: (studyId) => api.get(`/api/evaluation-tasks/study/${studyId}`),
  getAllStudies: () => api.get('/api/studies'),
  getMyStudies: () => api.get('/api/studies/my-studies'),
  getMyAssignedStudies: () => api.get('/api/studies/my-assigned-studies'),
  getMyCompletedStudies: () => api.get('/api/studies/my-completed-studies'),
  getParticipantHistory: () => api.get('/api/studies/participant-history'),
  getStudiesByStatus: (status) => api.get(`/api/studies/status/${status}`),
  getActiveStudies: () => api.get('/api/studies/active'),
  deleteStudy: (studyId) => api.delete(`/api/studies/${studyId}`),
  publishStudy: (studyId) => api.post(`/api/studies/${studyId}/publish`),
  archiveStudy: (studyId) => api.post(`/api/studies/${studyId}/archive`),
  getArchivedStudies: () => api.get('/api/studies/archived'),
  getActiveStudiesExcludingArchived: () => api.get('/api/studies/active-studies'),
  // Enrollment endpoints
  getStudyEnrollments: (studyId) => api.get(`/api/studies/${studyId}/enrollments`),
  getStudyEnrollmentStats: (studyId) => api.get(`/api/studies/${studyId}/enrollments/stats`),
  enrollParticipant: (studyId, participantId) => api.post(`/api/studies/${studyId}/enrollments`, { participantId }),
  unenrollParticipant: (studyId, enrollmentId) => api.delete(`/api/studies/${studyId}/enrollments/${enrollmentId}`),
  updateEnrollmentStatus: (studyId, enrollmentId, status) => api.put(`/api/studies/${studyId}/enrollments/${enrollmentId}/status`, { status }),
  getAvailableParticipants: (studyId) => api.get(`/api/studies/${studyId}/enrollments/available-participants`),
  // Participant invitation endpoints
  getMyInvitations: () => api.get('/api/studies/enrollments/my-invitations'),
  acceptEnrollment: (enrollmentId) => api.post(`/api/studies/enrollments/${enrollmentId}/accept`),
  declineEnrollment: (enrollmentId) => api.post(`/api/studies/enrollments/${enrollmentId}/decline`),
  // Study artifacts
  getStudyArtifacts: (studyId) => api.get(`/api/studies/${studyId}/artifacts`),
  getStudyQuizzes: (studyId) => api.get(`/api/studies/${studyId}/quizzes`),
  attachQuizToStudy: (studyId, payload) => api.post(`/api/studies/${studyId}/quizzes`, payload),
  detachQuizFromStudy: (studyId, questionnaireId) => api.delete(`/api/studies/${studyId}/quizzes/${questionnaireId}`),
  removeStudyQuiz: (studyId, studyQuizId) => api.delete(`/api/studies/${studyId}/quizzes/${studyQuizId}`),
  assignStudyQuiz: (studyId, studyQuizId, payload) => api.post(`/api/studies/${studyId}/quizzes/${studyQuizId}/assign`, payload),
  getStudyQuizAssignments: (studyId, studyQuizId) => api.get(`/api/studies/${studyId}/quizzes/${studyQuizId}/assignments`),
  deleteQuizAssignment: (assignmentId) => api.delete(`/api/quiz-assignments/${assignmentId}`),
  // Dashboard and statistics
  getDashboardOverview: () => api.get('/api/studies/dashboard/overview'),
  getStudyStatistics: (studyId) => api.get(`/api/studies/${studyId}/statistics`),
  getResearcherStatistics: () => api.get('/api/studies/statistics/researcher'),
};

export const artifactService = {
  uploadArtifacts: (files, studyId = null) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (studyId) {
      formData.append('studyId', studyId);
    }
    return api.post('/api/artifacts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getMyArtifacts: () => api.get('/api/artifacts/mine'),
  // ADMIN/LIST PAGE İÇİN EKLE
  // Not: backend destekliyorsa params ile filter gönder (q, type, source vs.)
  getAllArtifacts: (params = {}) => api.get('/api/artifacts', { params }),

  // VIEW (detay)
  getArtifactById: (id) => api.get(`/api/artifacts/${id}`),

  // DELETE
  deleteArtifact: (id) => api.delete(`/api/artifacts/${id}`),

  // DOWNLOAD
  downloadArtifact: (id) =>
    api.get(`/api/artifacts/${id}/download`, { responseType: 'blob' }),

  getArtifactStudies: (id) => api.get(`/api/artifacts/${id}/studies`),
  getArtifactAnalytics: (id) => api.get(`/api/artifacts/${id}/analytics`),

};

export const notificationService = {
  getMyNotifications: () => api.get('/api/notifications'),
  getUnreadNotifications: () => api.get('/api/notifications/unread'),
  getReadNotifications: () => api.get('/api/notifications/read'),
  getUnreadCount: () => api.get('/api/notifications/unread/count'),
  getNotificationById: (id) => api.get(`/api/notifications/${id}`),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAsUnread: (id) => api.put(`/api/notifications/${id}/unread`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/api/notifications'),
};

export const quizAssignmentService = {
  assignQuiz: (assignmentData) => api.post('/api/quiz-assignments', assignmentData),
  getMyQuizAssignments: () => api.get('/api/quiz-assignments'),
  getAssignmentsByStatus: (status) => api.get(`/api/quiz-assignments/status/${status}`),
  getAssignmentById: (id) => api.get(`/api/quiz-assignments/${id}`),
  getAssignmentsByQuestionnaire: (questionnaireId) => api.get(`/api/quiz-assignments/questionnaire/${questionnaireId}`),
  getAssignmentsByStudy: (studyId) => api.get(`/api/quiz-assignments/study/${studyId}`),
  deleteAssignment: (id) => api.delete(`/api/quiz-assignments/${id}`),
};

// Quiz submission service (for participants taking quizzes)
export const quizSubmissionService = {
  startQuizAttempt: (assignmentId) => api.post(`/api/quiz-submissions/start/${assignmentId}`),
  getQuizForTaking: (submissionId) => api.get(`/api/quiz-submissions/${submissionId}/quiz`),
  submitAnswer: (answerData) => api.post('/api/quiz-submissions/answer', answerData),
  submitQuiz: (submissionId) => api.post(`/api/quiz-submissions/${submissionId}/submit`),
  getSubmissionResult: (submissionId) => api.get(`/api/quiz-submissions/${submissionId}/result`),
};

// Grading service (for researchers grading quizzes)
export const gradingService = {
  autoGradeSubmission: (submissionId) => api.post(`/api/grading/submissions/${submissionId}/auto-grade`),
  manuallyGradeAnswer: (gradeData) => api.post('/api/grading/answers/manual-grade', gradeData),
  bulkGradeSubmission: (bulkGradeData) => api.post('/api/grading/submissions/bulk-grade', bulkGradeData),
  finalizeGrading: (submissionId, finalizeData) => api.post(`/api/grading/submissions/${submissionId}/finalize`, finalizeData),
  getSubmissions: () => api.get('/api/grading/submissions'),
  getPendingManualGrading: () => api.get('/api/grading/submissions/pending'),
  getSubmissionDetails: (submissionId) => api.get(`/api/grading/submissions/${submissionId}`),
  getGradingHistory: (submissionId) => api.get(`/api/grading/submissions/${submissionId}/history`),
  exportGradingActionsAsPDF: () => api.get('/api/grading/export/pdf', { responseType: 'blob' }),
  exportGradingActionsAsExcel: () => api.get('/api/grading/export/excel', { responseType: 'blob' }),
};

export const reviewerAssignmentService = {
  // Researcher: assign reviewers to study
  assignReviewersToStudy: (data) => api.post('/api/reviewer-assignments', data),

  // Reviewer: my assignments (hepsi)
  getMyAssignments: () => api.get('/api/reviewer-assignments'),

  // Reviewer: pending assignments
  getPendingAssignments: () => api.get('/api/reviewer-assignments/pending'),

  // Reviewer: active (accepted / in-progress)
  getActiveAssignments: () => api.get('/api/reviewer-assignments/active'),

  // Researcher: assignments for a study
  getAssignmentsByStudy: (studyId) =>
    api.get(`/api/reviewer-assignments/study/${studyId}`),

  // Reviewer: accept / decline
  acceptAssignment: (id) => api.put(`/api/reviewer-assignments/${id}/accept`),
  declineAssignment: (id, reason) =>
    api.put(`/api/reviewer-assignments/${id}/decline`, { reason }),

  // Researcher: delete assignment
  deleteAssignment: (id) => api.delete(`/api/reviewer-assignments/${id}`),
};

// Participant evaluation reviews (for reviewers)
export const evaluationReviewService = {
  // Reviewer: kendisine atanmış participant değerlendirmeleri listesi
  getAssignedReviews: () => api.get('/api/reviewer/evaluations/history'),

  // Reviewer: tek bir evaluation review detay
  getReviewDetail: (reviewId) =>
    api.get(`/api/reviewer/evaluations/assignments/${reviewId}`),

  // Reviewer: evaluation için karar (approve / reject / flag) gönderme
  submitReviewDecision: (reviewId, payload) =>
    api.post(`/api/reviewer/evaluations/assignments/${reviewId}/decision`, payload),

  // Reviewer: geçmişte tamamladığı review'lar
  getReviewHistory: () => api.get('/api/reviewer/evaluations/history'),
};

// Evaluation Task Service (UC5 - New Evaluation System)
export const evaluationService = {
  // UC5-1: Get assigned evaluation tasks
  getMyTasks: (page = 0, size = 20, status = 'ALL') =>
    api.get('/api/participant/evaluations/tasks', { params: { page, size, status } }),

  // UC5-2: Get task details with artifacts and criteria
  getTaskDetails: (assignmentId) =>
    api.get(`/api/participant/evaluations/tasks/${assignmentId}`),

  // UC5-6: Start evaluation task
  startTask: (assignmentId) =>
    api.post(`/api/participant/evaluations/tasks/${assignmentId}/start`),

  // UC5-3: Annotations - Create/Read/Delete
  createAnnotation: (assignmentId, annotationData) =>
    api.post(`/api/participant/evaluations/tasks/${assignmentId}/annotations`, annotationData),

  getAnnotations: (assignmentId) =>
    api.get(`/api/participant/evaluations/tasks/${assignmentId}/annotations`),

  deleteAnnotation: (annotationId) =>
    api.delete(`/api/participant/evaluations/annotations/${annotationId}`),

  // UC5-4: Scoring - Save/Get scores
  saveScore: (assignmentId, scoreData) =>
    api.post(`/api/participant/evaluations/tasks/${assignmentId}/scores`, scoreData),

  getScores: (assignmentId) =>
    api.get(`/api/participant/evaluations/tasks/${assignmentId}/scores`),

  // UC5-3b: Draft - Autosave/Restore
  saveDraft: (assignmentId, draftData) =>
    api.post(`/api/participant/evaluations/tasks/${assignmentId}/draft`, draftData),

  getDraft: (assignmentId) =>
    api.get(`/api/participant/evaluations/tasks/${assignmentId}/draft`),

  // UC5-5: Submit evaluation
  submitEvaluation: (assignmentId, submissionData) =>
    api.post(`/api/participant/evaluations/tasks/${assignmentId}/submit`, submissionData),

  getSubmission: (assignmentId) =>
    api.get(`/api/participant/evaluations/tasks/${assignmentId}/submission`),

  getEvaluationImage: (imageId) =>
    api.get(`/api/participant/evaluations/images/${imageId}`, {
      responseType: 'blob',
    }),
};

export const reviewerEvaluationService = {
  getEvaluationDetail: (studyId, assignmentId) =>
    api.get(`/api/reviewer/studies/${studyId}/evaluations/${assignmentId}`),

  submitReviewerDecision: (studyId, assignmentId, payload) =>
    api.post(`/api/reviewer/studies/${studyId}/evaluations/${assignmentId}/decision`, payload),

  getDashboard: (studyId, params = {}) =>
    api.get(`/api/reviewer/studies/${studyId}/reviewer-dashboard`, { params }),

  getComparison: (studyId, taskId, params = {}) =>
    api.get(`/api/reviewer/studies/${studyId}/evaluate-comparison`, {
      params: { taskId, ...params },
    }),

  getEvaluationImage: (imageId) =>
    api.get(`/api/reviewer/images/${imageId}`, {
      responseType: 'blob',
    }),
};

// Researcher Evaluation Service (Task Creation & Management)
export const researcherEvaluationService = {
  // Task Type Management
  createTaskType: (taskTypeData) =>
    api.post('/api/researcher/evaluations/task-types', taskTypeData),

  getAllTaskTypes: () =>
    api.get('/api/researcher/evaluations/task-types'),

  getTaskType: (id) =>
    api.get(`/api/researcher/evaluations/task-types/${id}`),

  deleteTaskType: (id) =>
    api.delete(`/api/researcher/evaluations/task-types/${id}`),

  // Evaluation Task Management
  createTask: (taskData) =>
    api.post('/api/researcher/evaluations/tasks', taskData),

  getMyTasks: () =>
    api.get('/api/researcher/evaluations/tasks'),

  getTask: (id) =>
    api.get(`/api/researcher/evaluations/tasks/${id}`),

  deleteTask: (id) =>
    api.delete(`/api/researcher/evaluations/tasks/${id}`),

  getTaskParticipants: (taskId) =>
    api.get(`/api/researcher/evaluations/tasks/${taskId}/participants`),
  removeTaskParticipant: (taskId, assignmentId) =>
    api.delete(`/api/researcher/evaluations/tasks/${taskId}/participants/${assignmentId}`),
  exportTaskParticipantsAsPDF: (taskId) =>
    api.get(`/api/researcher/evaluations/tasks/${taskId}/participants/export/pdf`, { responseType: 'blob' }),
  exportTaskParticipantsAsExcel: (taskId) =>
    api.get(`/api/researcher/evaluations/tasks/${taskId}/participants/export/excel`, { responseType: 'blob' }),

  getTaskSubmissions: (taskId) =>
    api.get(`/api/researcher/evaluations/tasks/${taskId}/submissions`),

  getSubmissionDetail: (taskId, assignmentId) =>
    api.get(`/api/researcher/evaluations/tasks/${taskId}/submissions/${assignmentId}`),

  exportTaskSubmissions: (taskId, format = 'csv') =>
    api.get(`/api/researcher/evaluations/tasks/${taskId}/submissions/export`, {
      params: { format },
      responseType: 'blob',
    }),
  createCustomTask: (studyId, payload) =>
    api.post(`/api/studies/${studyId}/evaluation-tasks/custom`, payload),
  addTaskParticipants: (taskId, payload) =>
    api.post(`/api/evaluation-tasks/${taskId}/participants`, payload),
  getEvaluationTaskDetail: (taskId) =>
    api.get(`/api/evaluation-tasks/${taskId}`),
  getEvaluationTemplates: () =>
    api.get('/api/evaluation-task-templates'),
  applyEvaluationTemplate: (templateId) =>
    api.post('/api/evaluation-task-templates/apply', { templateId }),

  // Image Upload for Snapshot Artifacts
  uploadImage: (formData) =>
    api.post('/api/researcher/evaluations/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getImage: (imageId) =>
    api.get(`/api/researcher/evaluations/images/${imageId}`, {
      responseType: 'blob',
    }),
};

export default api;
