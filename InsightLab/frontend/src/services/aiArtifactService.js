import api from './api';

export const aiArtifactService = {
  // Generate AI artifact
  generateArtifact: (requestData) => 
    api.post('/api/ai-artifacts/generate', requestData),
  
  // Get all jobs for current researcher
  getMyJobs: () => 
    api.get('/api/ai-artifacts/jobs'),
  
  // Get job by ID
  getJobById: (jobId) => 
    api.get(`/api/ai-artifacts/jobs/${jobId}`),
  
  // Get pending drafts
  getPendingDrafts: () => 
    api.get('/api/ai-artifacts/drafts/pending'),
  
  // Approve a draft (converts to actual artifact)
  approveDraft: (draftId) => 
    api.post(`/api/ai-artifacts/drafts/${draftId}/approve`),
  
  // Discard a draft
  discardDraft: (draftId) => 
    api.post(`/api/ai-artifacts/drafts/${draftId}/discard`),
  
  // Update/edit a draft
  updateDraft: (draftId, updateData) => 
    api.put(`/api/ai-artifacts/drafts/${draftId}`, updateData),
};
