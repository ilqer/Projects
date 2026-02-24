import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Divider, IconButton, Tooltip, Stack, Chip, Button,
  ToggleButtonGroup, ToggleButton, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  ZoomIn, ZoomOut, ZoomOutMap, ViewColumn, ViewDay, ViewModule,
  Image as ImageIcon, ContentCopy, OpenInFull, Fullscreen, Close as CloseIcon,
  Sync, SyncDisabled
} from '@mui/icons-material';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PdfArtifactViewer from './PdfArtifactViewer';
import { evaluationService } from '../../services/api';

const SnapshotImage = ({ imageId, label, accent = 'text.secondary', style = {}, fetchImage }) => {
  const [imageState, setImageState] = useState({
    status: imageId ? 'loading' : 'idle',
    url: ''
  });

  useEffect(() => {
    if (!imageId) {
      setImageState({ status: 'idle', url: '' });
      return;
    }

    let isMounted = true;
    let objectUrl = null;

    setImageState(prev => ({ ...prev, status: 'loading', url: '' }));

    const loader = fetchImage || evaluationService.getEvaluationImage;

    loader(imageId)
      .then(response => {
        if (!isMounted) return;
        objectUrl = URL.createObjectURL(response.data);
        setImageState({ status: 'loaded', url: objectUrl });
      })
      .catch(() => {
        if (isMounted) {
          setImageState({ status: 'error', url: '' });
        }
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId]);

  if (!imageId) {
    return (
      <Typography variant="body2" color="text.secondary">
        No {label.toLowerCase()}
      </Typography>
    );
  }

  if (imageState.status === 'loading') {
    return (
      <Paper elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider', p: 3, textAlign: 'center' }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading {label}...
        </Typography>
      </Paper>
    );
  }

  if (imageState.status === 'error') {
    return (
      <Paper elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider', p: 2, textAlign: 'center', bgcolor: 'background.paper', ...style }}>
        <ImageIcon sx={{ fontSize: 48, color: accent }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Image ID: {imageId}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Unable to load image
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider', p: 2, textAlign: 'center', bgcolor: 'background.paper', ...style }}>
      <img
        src={imageState.url}
        alt={label}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          margin: '0 auto'
        }}
      />
    </Paper>
  );
};

const ArtifactViewer = ({
  artifacts,
  layoutMode,
  onAnnotationCreate,
  annotations,
  readOnly,
  imageLoader
}) => {
  // State for panel management
  const [selectedText, setSelectedText] = useState(null);
  const [selectionInfo, setSelectionInfo] = useState(null);
  const [currentLayout, setCurrentLayout] = useState(layoutMode);

  // Per-panel zoom and scroll state
  const [panelStates, setPanelStates] = useState(() => {
    const initialStates = {};
    (artifacts || []).forEach((_, index) => {
      initialStates[index] = {
        zoom: 1.0,
        scrollTop: 0,
        scrollLeft: 0
      };
    });
    return initialStates;
  });
  const [cloneViewerState, setCloneViewerState] = useState({});
  const cloneScrollRefs = useRef({});
  const isSyncingCloneScroll = useRef(false);

  const getDefaultCloneState = () => ({
    expandedPanel: null,
    syncScroll: true,
    fullscreenPanel: null
  });

  const getCloneState = (artifactId) => {
    return cloneViewerState[artifactId] || getDefaultCloneState();
  };

  const updateCloneState = (artifactId, updates) => {
    setCloneViewerState((prev) => ({
      ...prev,
      [artifactId]: {
        ...getDefaultCloneState(),
        ...(prev[artifactId] || {}),
        ...updates
      }
    }));
  };

  const assignCloneScrollRef = (artifactId, panelKey, element) => {
    if (!cloneScrollRefs.current[artifactId]) {
      cloneScrollRefs.current[artifactId] = {};
    }
    cloneScrollRefs.current[artifactId][panelKey] = element;
  };

  const handleCloneScrollSync = (artifactId, panelKey, event) => {
    const state = getCloneState(artifactId);
    if (!state.syncScroll || isSyncingCloneScroll.current) {
      return;
    }

    const otherKey = panelKey === 'ORIGINAL' ? 'CLONE' : 'ORIGINAL';
    const targetElement = cloneScrollRefs.current[artifactId]?.[otherKey];
    if (!targetElement) {
      return;
    }

    isSyncingCloneScroll.current = true;
    targetElement.scrollTop = event.currentTarget.scrollTop;
    requestAnimationFrame(() => {
      isSyncingCloneScroll.current = false;
    });
  };

  // Update layout when prop changes
  useEffect(() => {
    setCurrentLayout(layoutMode);
  }, [layoutMode]);

  const handleZoomIn = (panelIndex) => {
    setPanelStates(prev => ({
      ...prev,
      [panelIndex]: {
        ...prev[panelIndex],
        zoom: Math.min((prev[panelIndex]?.zoom || 1.0) + 0.1, 3.0)
      }
    }));
  };

  const handleZoomOut = (panelIndex) => {
    setPanelStates(prev => ({
      ...prev,
      [panelIndex]: {
        ...prev[panelIndex],
        zoom: Math.max((prev[panelIndex]?.zoom || 1.0) - 0.1, 0.5)
      }
    }));
  };

  const handleZoomReset = (panelIndex) => {
    setPanelStates(prev => ({
      ...prev,
      [panelIndex]: {
        ...prev[panelIndex],
        zoom: 1.0
      }
    }));
  };

  const handleLayoutChange = (event, newLayout) => {
    if (newLayout !== null) {
      setCurrentLayout(newLayout);
    }
  };

  const handleTextSelection = (artifactId, panelNumber) => {
    if (readOnly) return;

    const selection = window.getSelection();
    const text = selection.toString();

    if (text.trim().length > 0) {
      setSelectedText(text);
      setSelectionInfo({ artifactId, panelNumber });
    } else {
      setSelectedText(null);
      setSelectionInfo(null);
    }
  };

  const handleCreateAnnotation = (type, color) => {
    if (!selectedText || !selectionInfo || readOnly) return;

    const annotationData = {
      artifactId: selectionInfo.artifactId,
      panelNumber: selectionInfo.panelNumber,
      annotationType: type,
      content: selectedText,
      color: color || '#ffeb3b',
      startLine: 0,
      endLine: 0
    };

    onAnnotationCreate(annotationData);
    setSelectedText(null);
    setSelectionInfo(null);
    window.getSelection().removeAllRanges();
  };

  const renderBugReportArtifact = (artifact, panelNumber) => {
    const rawJson = artifact.additionalData || artifact.metadata;
    let prettyJson = null;
    if (rawJson) {
      if (typeof rawJson === 'string') {
        try {
          prettyJson = JSON.stringify(JSON.parse(rawJson), null, 2);
        } catch (err) {
          prettyJson = rawJson;
        }
      } else {
        try {
          prettyJson = JSON.stringify(rawJson, null, 2);
        } catch (err) {
          prettyJson = String(rawJson);
        }
      }
    }

    return (
      <Box>
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip label={artifact.severity ? `Severity: ${artifact.severity}` : 'Severity: N/A'} color="error" size="small" />
          <Chip label={artifact.priority ? `Priority: ${artifact.priority}` : 'Priority: N/A'} color="warning" size="small" />
          <Chip label={artifact.status || 'Open'} size="small" variant="outlined" />
        </Stack>

        <Typography variant="h6" gutterBottom fontWeight={600}>
          {artifact.title || 'Bug Report Artifact'}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Description:
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
            onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
          >
            {artifact.description || 'No description provided'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Steps to Reproduce:
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, p: 2, bgcolor: 'action.hover', borderRadius: 1, whiteSpace: 'pre-wrap' }}
            onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
          >
            {artifact.stepsToReproduce || 'No steps provided'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Expected Result:
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
            onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
          >
            {artifact.expectedResult || 'No expected result provided'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Actual Result:
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
            onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
          >
            {artifact.actualResult || 'No actual result provided'}
          </Typography>
        </Box>

        {artifact.environment && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Environment:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {artifact.environment}
            </Typography>
          </Box>
        )}

        {prettyJson && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Bug Report JSON
            </Typography>
            <Paper elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{ margin: 0, maxHeight: 420 }}
                onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
              >
                {prettyJson}
              </SyntaxHighlighter>
            </Paper>
          </Box>
        )}

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Legend
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This bug report bundles information such as title, steps to reproduce, environment, expected behavior, and
            actual behavior. Review it carefully before answering the evaluation criteria.
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderCodeCloneArtifact = (artifact, panelNumber) => {
    const cloneState = getCloneState(artifact.id);
    const language = (artifact.language || artifact.programmingLanguage || 'javascript').toLowerCase();
    const similarityScore = typeof artifact.similarityScore === 'number'
      ? (artifact.similarityScore > 1 ? artifact.similarityScore : artifact.similarityScore * 100)
      : null;

    const gridTemplateColumns = cloneState.expandedPanel === 'ORIGINAL'
      ? 'minmax(0, 2fr) minmax(0, 1fr)'
      : cloneState.expandedPanel === 'CLONE'
        ? 'minmax(0, 1fr) minmax(0, 2fr)'
        : 'minmax(0, 1fr) minmax(0, 1fr)';

    const handleCopy = async (code) => {
      if (!navigator?.clipboard) return;
      try {
        await navigator.clipboard.writeText(code || '');
      } catch (err) {
        console.error('Unable to copy code', err);
      }
    };

    const openFullscreen = (panelKey) => {
      updateCloneState(artifact.id, { fullscreenPanel: panelKey });
    };

    const closeFullscreen = () => {
      updateCloneState(artifact.id, { fullscreenPanel: null });
    };

    const fullscreenKey = cloneState.fullscreenPanel;
    const fullscreenLabel = fullscreenKey === 'ORIGINAL' ? 'Original Code' : 'Clone Code';
    const fullscreenContent = fullscreenKey === 'ORIGINAL'
      ? artifact.codeSnippet1
      : artifact.codeSnippet2;

    const renderPanel = (panelKey, title, code) => (
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 360
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {title}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Copy code">
                <IconButton size="small" onClick={() => handleCopy(code)}>
                  <ContentCopy fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title={cloneState.expandedPanel === panelKey ? 'Reset width' : 'Expand panel'}>
                <IconButton
                  size="small"
                  onClick={() =>
                    updateCloneState(artifact.id, {
                      expandedPanel: cloneState.expandedPanel === panelKey ? null : panelKey
                    })
                  }
                >
                  <OpenInFull fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open fullscreen">
                <IconButton size="small" onClick={() => openFullscreen(panelKey)}>
                  <Fullscreen fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
        <Box
          ref={(el) => assignCloneScrollRef(artifact.id, panelKey, el)}
          onScroll={(event) => handleCloneScrollSync(artifact.id, panelKey, event)}
          sx={{
            flex: 1,
            overflow: 'auto',
            bgcolor: 'background.default'
          }}
        >
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{ margin: 0 }}
            onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
          >
            {code || '// No code provided'}
          </SyntaxHighlighter>
        </Box>
      </Paper>
    );

    return (
      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Chip label={artifact.language || artifact.programmingLanguage || 'Unknown'} color="primary" size="small" />
          {typeof similarityScore === 'number' && (
            <Chip label={`Similarity: ${similarityScore.toFixed(1)}%`} color="info" size="small" />
          )}
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={cloneState.syncScroll ? 'Disable scroll sync' : 'Enable scroll sync'}>
              <IconButton onClick={() => updateCloneState(artifact.id, { syncScroll: !cloneState.syncScroll })}>
                {cloneState.syncScroll ? <Sync color="primary" /> : <SyncDisabled color="action" />}
              </IconButton>
            </Tooltip>
            <Typography variant="body2" color="text.secondary">
              Scroll Sync {cloneState.syncScroll ? 'On' : 'Off'}
            </Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns,
            gap: 2,
            alignItems: 'stretch'
          }}
        >
          {renderPanel('ORIGINAL', 'Original Code', artifact.codeSnippet1)}
          {renderPanel('CLONE', 'Clone Code', artifact.codeSnippet2)}
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Legend
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare the two code artifacts and evaluate their similarity or quality according to the criteria.
          </Typography>
        </Box>

        <Dialog
          open={Boolean(fullscreenKey)}
          onClose={closeFullscreen}
          fullWidth
          maxWidth="lg"
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {fullscreenLabel}
            <IconButton onClick={closeFullscreen} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{ margin: 0 }}
            >
              {fullscreenContent || '// No code provided'}
            </SyntaxHighlighter>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeFullscreen}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  const renderSolidViolationArtifact = (artifact, panelNumber) => {
    const extra = artifact.additionalData || artifact.metadata;
    let prettyJson = null;
    if (extra) {
      if (typeof extra === 'string') {
        try {
          prettyJson = JSON.stringify(JSON.parse(extra), null, 2);
        } catch (err) {
          prettyJson = extra;
        }
      } else {
        try {
          prettyJson = JSON.stringify(extra, null, 2);
        } catch (err) {
          prettyJson = String(extra);
        }
      }
    }

    return (
      <Box>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={artifact.language || artifact.programmingLanguage || 'Unknown'} color="primary" size="small" />
          <Chip label={artifact.correctViolationType || artifact.violationType || 'Unknown'} color="warning" size="small" />
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>
            Code Snippet:
          </Typography>
          <Paper elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
            <SyntaxHighlighter
              language={(artifact.language || artifact.programmingLanguage)?.toLowerCase() || 'javascript'}
              style={vscDarkPlus}
              showLineNumbers
              onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
            >
              {artifact.codeSnippet || '// No code provided'}
            </SyntaxHighlighter>
          </Paper>
        </Box>

        {artifact.llmExplanation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Analysis:
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
              onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
            >
              {artifact.llmExplanation}
            </Typography>
          </Box>
        )}

        {artifact.llmSuggestedFix && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Suggested Fix:
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
              onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
            >
              {artifact.llmSuggestedFix}
            </Typography>
          </Box>
        )}

        {prettyJson && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              SOLID Artifact JSON
            </Typography>
            <Paper elevation={0} sx={{ mt: 1, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{ margin: 0, maxHeight: 420 }}
                onMouseUp={() => handleTextSelection(artifact.id, panelNumber)}
              >
                {prettyJson}
              </SyntaxHighlighter>
            </Paper>
          </Box>
        )}

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Legend
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This artifact is designed to evaluate SOLID principle understanding. Review the code and accompanying
            metadata to determine which principle is violated.
          </Typography>
        </Box>
      </Box>
    );
  };

  const snapshotImageLoader = imageLoader || evaluationService.getEvaluationImage;

  const renderSnapshotArtifact = (artifact, panelNumber) => {
    return (
      <Box>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={artifact.testName || 'Snapshot Test'} color="info" size="small" />
          {artifact.testFramework && (
            <Chip label={artifact.testFramework} size="small" variant="outlined" />
          )}
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>
              Reference Image (Expected UI)
            </Typography>
            <SnapshotImage
              imageId={artifact.referenceImageId}
              label="Reference Image"
              fetchImage={snapshotImageLoader}
              style={{ minHeight: 260 }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>
              Failure Image (Captured Output)
            </Typography>
            <SnapshotImage
              imageId={artifact.failureImageId}
              label="Failure Image"
              accent="#f44336"
              fetchImage={snapshotImageLoader}
              style={{ minHeight: 260 }}
            />
          </Box>

          {artifact.diffImageId && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>
                Diff Image (Pixel Comparison)
              </Typography>
            <SnapshotImage
              imageId={artifact.diffImageId}
              label="Diff Image"
              accent="#ff9800"
              fetchImage={snapshotImageLoader}
              style={{ minHeight: 260 }}
            />
            </Box>
          )}
        </Stack>

        {artifact.metadata && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Test Metadata:
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, p: 2, bgcolor: 'action.hover', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
            >
              {JSON.stringify(artifact.metadata, null, 2)}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Legend
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Reference:</strong> Expected correct UI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Failure:</strong> UI captured in the test run
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Diff:</strong> Pixel differences between Reference and Failure
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderPdfArtifact = (artifact) => {
    return <PdfArtifactViewer artifact={artifact} />;
  };

  const renderArtifact = (artifact, panelNumber) => {
    if (!artifact) return <Typography color="text.secondary">No artifact</Typography>;

    const artifactTypeMap = {
      'BUG_REPORT': renderBugReportArtifact,
      'CODE_CLONE': renderCodeCloneArtifact,
      'SOLID_VIOLATION': renderSolidViolationArtifact,
      'SNAPSHOT': renderSnapshotArtifact,
      'PDF': renderPdfArtifact
    };

    const renderer = artifactTypeMap[artifact.artifactType];
    return renderer ? renderer(artifact, panelNumber) : (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Unsupported Artifact Type
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Type: {artifact.artifactType}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This artifact format is not yet supported for viewing.
        </Typography>
      </Box>
    );
  };

  const renderPanel = (artifact, index) => {
    const zoom = panelStates[index]?.zoom || 1.0;
    const panelLabel = artifact?.displayLabel || `Panel ${index + 1}`;
    const isBlinded = Boolean(artifact?.blinded);

    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper'
        }}
      >
        {/* Panel Header with Zoom Controls */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" color="primary" fontWeight={600}>
                {panelLabel}
              </Typography>
              {isBlinded && (
                <Chip size="small" label="Blinded" color="info" variant="outlined" />
              )}
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Zoom Out">
                <IconButton size="small" onClick={() => handleZoomOut(index)} disabled={zoom <= 0.5}>
                  <ZoomOut fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset Zoom">
                <IconButton size="small" onClick={() => handleZoomReset(index)}>
                  <ZoomOutMap fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom In">
                <IconButton size="small" onClick={() => handleZoomIn(index)} disabled={zoom >= 3.0}>
                  <ZoomIn fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" sx={{ ml: 1, alignSelf: 'center', minWidth: 45, textAlign: 'center' }}>
                {(zoom * 100).toFixed(0)}%
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Panel Content with Zoom */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`
          }}
        >
          {renderArtifact(artifact, index + 1)}
        </Box>
      </Box>
    );
  };

  const renderLayout = () => {
    if (!artifacts || artifacts.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No artifacts to display
          </Typography>
        </Box>
      );
    }

    if (currentLayout === 'THREE_PANEL' && artifacts.length >= 3) {
      return (
        <Allotment>
          {artifacts.slice(0, 3).map((artifact, index) => (
            <Allotment.Pane key={artifact.id} minSize={200}>
              {renderPanel(artifact, index)}
            </Allotment.Pane>
          ))}
        </Allotment>
      );
    } else if (currentLayout === 'TWO_PANEL' && artifacts.length >= 2) {
      return (
        <Allotment>
          {artifacts.slice(0, 2).map((artifact, index) => (
            <Allotment.Pane key={artifact.id} minSize={300}>
              {renderPanel(artifact, index)}
            </Allotment.Pane>
          ))}
        </Allotment>
      );
    } else {
      // Single panel
      return (
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
          {renderPanel(artifacts[0], 0)}
        </Paper>
      );
    }
  };

  const visiblePanelCount =
    currentLayout === 'THREE_PANEL' ? Math.min(3, artifacts?.length || 0) :
    currentLayout === 'TWO_PANEL' ? Math.min(2, artifacts?.length || 0) :
    1;

  return (
    <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Layout Controls */}
      {artifacts && artifacts.length > 1 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Layout Mode
          </Typography>
          <ToggleButtonGroup
            value={currentLayout}
            exclusive
            onChange={handleLayoutChange}
            aria-label="layout mode"
            size="small"
          >
            <ToggleButton value="SINGLE_PANEL" aria-label="single panel">
              <Tooltip title="Single Panel">
                <ViewDay />
              </Tooltip>
            </ToggleButton>
            {artifacts.length >= 2 && (
              <ToggleButton value="TWO_PANEL" aria-label="two panel">
                <Tooltip title="Two Panel">
                  <ViewColumn />
                </Tooltip>
              </ToggleButton>
            )}
            {artifacts.length >= 3 && (
              <ToggleButton value="THREE_PANEL" aria-label="three panel">
                <Tooltip title="Three Panel">
                  <ViewModule />
                </Tooltip>
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Annotation Dialog */}
      {selectedText && !readOnly && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 2,
            zIndex: 1300,
            minWidth: 300
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Create Annotation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxHeight: 100, overflow: 'auto' }}>
            "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              onClick={() => handleCreateAnnotation('HIGHLIGHT', '#ffeb3b')}
            >
              Highlight
            </Button>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={() => handleCreateAnnotation('NOTE', '#b39ddb')}
            >
              Add Note
            </Button>
            <Button
              size="small"
              onClick={() => {
                setSelectedText(null);
                setSelectionInfo(null);
                window.getSelection().removeAllRanges();
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Main Viewer Area */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {renderLayout()}
      </Box>
    </Box>
  );
};

export default ArtifactViewer;
