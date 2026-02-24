import api from './api';

export const questionnaireService = {
  // Create a new questionnaire
  createQuestionnaire: (questionnaireData) => 
    api.post('/api/questionnaires', questionnaireData),
  
  // Update an existing questionnaire
  updateQuestionnaire: (id, questionnaireData) => 
    api.put(`/api/questionnaires/${id}`, questionnaireData),
  
  // Import questionnaire from JSON file
  importQuestionnaireFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/questionnaires/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Import questionnaire from JSON object
  importQuestionnaireJson: (jsonData) => 
    api.post('/api/questionnaires/import/json', jsonData),
  
  // Get questionnaire by ID
  getQuestionnaireById: (id) => 
    api.get(`/api/questionnaires/${id}`),
  
  // Get researcher's questionnaires
  getMyQuestionnaires: () => 
    api.get('/api/questionnaires/my-questionnaires'),
  
  // Get active questionnaires
  getActiveQuestionnaires: () => 
    api.get('/api/questionnaires/active'),
  
  // Delete questionnaire
  deleteQuestionnaire: (id) => 
    api.delete(`/api/questionnaires/${id}`),
  
  // Deactivate questionnaire
  deactivateQuestionnaire: (id) => 
    api.post(`/api/questionnaires/${id}/deactivate`),
  
  // Activate questionnaire
  activateQuestionnaire: (id) => 
    api.post(`/api/questionnaires/${id}/activate`)
};