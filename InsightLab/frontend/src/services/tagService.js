// tagService.js - Frontend service for UC2-5 Tag Management
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:8080/api',
  withCredentials: false,
});

// Attach JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const tagService = {
  /**
   * Get all tags for current user
   */
  getAllTags() {
    return client.get('/tags');
  },

  /**
   * Search tags by name
   */
  searchTags(query) {
    return client.get('/tags/search', { params: { query } });
  },

  /**
   * Get tag by ID
   */
  getTagById(tagId) {
    return client.get(`/tags/${tagId}`);
  },

  /**
   * Create new tag
   */
  createTag(tagData) {
    return client.post('/tags', tagData);
  },

  /**
   * Update tag
   */
  updateTag(tagId, tagData) {
    return client.put(`/tags/${tagId}`, tagData);
  },

  /**
   * Delete tag
   */
  deleteTag(tagId) {
    return client.delete(`/tags/${tagId}`);
  },

  /**
   * Add tags to artifact
   */
  addTagsToArtifact(artifactId, tagIds) {
  return client.post(`/artifacts/${artifactId}/tags`, { tagIds });
},

  /**
   * Remove tag from artifact
   */
  removeTagFromArtifact(artifactId, tagId) {
    return client.delete(`/artifacts/${artifactId}/tags/${tagId}`);
  },

  /**
   * Search artifacts by query and/or tags
   */
  searchArtifacts(query = null, tagIds = null) {
    const params = {};
    if (query) params.query = query;
    if (tagIds && tagIds.length > 0) params.tagIds = tagIds;
    return client.get('/artifacts/search', { params });
  },
};

export default tagService;