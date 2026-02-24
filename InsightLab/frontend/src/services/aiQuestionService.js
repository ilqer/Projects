import api from './api';

export const aiQuestionService = {
  // Generate AI questions
  generateQuestions: (requestData) => 
    api.post('/api/ai-questions/generate', requestData),
  
  // Get all jobs for current researcher
  getMyJobs: () => 
    api.get('/api/ai-questions/jobs'),
  
  // Get job by ID
  getJobById: (jobId) => 
    api.get(`/api/ai-questions/jobs/${jobId}`),
  
  // Get drafts by job ID
  getDraftsByJob: (jobId) => 
    api.get(`/api/ai-questions/jobs/${jobId}/drafts`),
  
  // Get pending drafts for a questionnaire
  getPendingDrafts: (questionnaireId) => 
    api.get(`/api/ai-questions/questionnaires/${questionnaireId}/pending-drafts`),
  
  // Approve a draft (converts to actual question)
  approveDraft: (draftId) => 
    api.post(`/api/ai-questions/drafts/${draftId}/approve`),
  
  // Discard a draft
  discardDraft: (draftId) => 
    api.post(`/api/ai-questions/drafts/${draftId}/discard`),
  
  // Update/edit a draft
  updateDraft: (draftId, updateData) => 
    api.put(`/api/ai-questions/drafts/${draftId}`, updateData),
};

