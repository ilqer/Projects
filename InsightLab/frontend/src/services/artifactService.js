// src/services/artifactService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: false,
});

// JWT ekle (api.js ile aynı mantık)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Content-Disposition header’dan dosya adını almak için yardımcı fonksiyon
 */
export const getFilenameFromResponse = (res, fallback) => {
  const cd =
    res?.headers?.['content-disposition'] ||
    res?.headers?.['Content-Disposition'];
  if (!cd) return fallback;

  const m = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const raw = m?.[1] || m?.[2];
  if (!raw) return fallback;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export const artifactService = {
  /**
   * Bir veya birden fazla artifact upload et.
   * studyId verilirse backend tarafında bu study’ye bağlanır.
   */
  upload(files, studyId = null) {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    if (studyId) {
      form.append('studyId', studyId);
    }
    return client.post('/artifacts', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Kullanıcının kendi artifact’ları */
  getMyArtifacts() {
    return client.get('/artifacts/mine');
  },

  /** Tekil artifact detayı (UC2-7) */
  getById(artifactId) {
    return client.get(`/artifacts/${artifactId}`);
  },

  /** Dosyayı indirmek için (blob döner) */
  download(artifactId) {
    return client.get(`/artifacts/${artifactId}/download`, {
      responseType: 'blob',
    });
  },

  /** Artifact sil */
  delete(artifactId) {
    return client.delete(`/artifacts/${artifactId}`);
  },

  /**
   * Var olan bir artifact’ı bir study’ye bağla (UC2-6)
   */
  assignToStudy(artifactId, studyId, displayLabel = null) {
    const params = displayLabel ? { displayLabel } : {};
    return client.post(
      `/artifacts/${artifactId}/assign-to-study/${studyId}`,
      null,
      { params }
    );
  },

  /** Study’den artifact’ı ayır (UC2-6) */
  unassignFromStudy(artifactId, studyId) {
    return client.delete(
      `/artifacts/${artifactId}/unassign-from-study/${studyId}`
    );
  },

  /** Artifact’ın bağlı olduğu studylere bak (UC2-6) */
  getArtifactStudies(artifactId) {
    return client.get(`/artifacts/${artifactId}/studies`);
  },

  /** Tek artifact için analytics */
  getAnalytics(artifactId) {
    return client.get(`/artifacts/${artifactId}/analytics`);
  },
};

// named + default export
export default artifactService;
