import api from './api';

/**
 * Export Service - handles exporting entities to various formats
 */
const exportService = {
  /**
   * Export a study to the specified format (csv, xlsx, pdf)
   * @param {number} studyId - The study ID to export
   * @param {string} format - The export format: 'csv', 'xlsx', or 'pdf'
   */
  exportStudy: async (studyId, format) => {
    try {
      const response = await api.get(`/api/export/study/${studyId}/${format.toLowerCase()}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `study-${studyId}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
};

export default exportService;

