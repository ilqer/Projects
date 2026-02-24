import React, { useState } from 'react';
import { Box, Paper, Stack, Chip, Button, Typography } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { Document, Page } from 'react-pdf';

const PdfArtifactViewer = ({ artifact }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
  }

  // TODO: Replace with actual PDF fetching endpoint
  const pdfUrl = artifact.fileUrl || `/api/artifacts/files/${artifact.fileId}`;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" justifyContent="space-between">
        <Chip icon={<PictureAsPdf />} label={artifact.fileName || 'PDF Document'} color="primary" size="small" />
        {numPages && (
          <Box>
            <Button
              size="small"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(p => p - 1)}
            >
              Previous
            </Button>
            <Typography component="span" variant="body2" sx={{ mx: 2 }}>
              Page {pageNumber} of {numPages}
            </Typography>
            <Button
              size="small"
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber(p => p + 1)}
            >
              Next
            </Button>
          </Box>
        )}
      </Stack>

      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 2, bgcolor: 'background.paper' }}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error('Error loading PDF:', error);
          }}
          loading={
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Loading PDF...</Typography>
            </Box>
          }
          error={
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PictureAsPdf sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                Unable to load PDF document
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {artifact.fileName || 'PDF file'}
              </Typography>
            </Box>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </Paper>
    </Box>
  );
};

export default PdfArtifactViewer;
