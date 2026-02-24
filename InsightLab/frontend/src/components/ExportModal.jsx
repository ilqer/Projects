import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { Download } from '@mui/icons-material';
import exportService from '../services/exportService';

/**
 * Export Modal Component
 * Allows users to export study data in CSV, XLSX, or PDF format
 */
const ExportModal = ({ open, onClose, studyId }) => {
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      await exportService.exportStudy(studyId, format);
      // Close modal after successful export
      setTimeout(() => {
        onClose();
        setFormat('csv'); // Reset format
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Export failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Download />
          <Typography variant="h6">Export Study Data</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              label="Export Format"
              disabled={loading}
            >
              <MenuItem value="csv">CSV (Comma Separated Values)</MenuItem>
              <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
              <MenuItem value="pdf">PDF Document</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading}
          startIcon={<Download />}
        >
          {loading ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportModal;

