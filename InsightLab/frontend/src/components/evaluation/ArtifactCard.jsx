import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  Stack,
  Chip
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { artifactService } from '../../services/artifactService';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CODE_EXT = new Set(['java', 'js', 'ts', 'py', 'cpp', 'c', 'cs', 'go']);
const JSON_EXT = new Set(['json', 'yaml', 'yml']);
const TEXT_EXT = new Set(['txt', 'md', 'log']);
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg']);
const PDF_EXT = new Set(['pdf']);

const getExtension = (filename) => {
  if (!filename) return '';
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
};

const highlightCode = (code, extension) => {
  // Handle null/undefined/empty code
  if (!code) return '';
  
  // Escape HTML entities first
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Simple syntax highlighting for common languages
  const keywords = {
    java: /\b(public|private|protected|static|final|class|interface|extends|implements|import|package|void|int|long|double|float|boolean|String|return|if|else|for|while|try|catch|throw|new|this|super|null|true|false)\b/g,
    js: /\b(const|let|var|function|return|if|else|for|while|try|catch|throw|new|this|null|true|false|async|await|class|extends|import|export|default)\b/g,
    jsx: /\b(const|let|var|function|return|if|else|for|while|try|catch|throw|new|this|null|true|false|async|await|class|extends|import|export|default|React)\b/g,
    ts: /\b(const|let|var|function|return|if|else|for|while|try|catch|throw|new|this|null|true|false|async|await|class|extends|import|export|default|interface|type|enum)\b/g,
    tsx: /\b(const|let|var|function|return|if|else|for|while|try|catch|throw|new|this|null|true|false|async|await|class|extends|import|export|default|interface|type|enum|React)\b/g,
    py: /\b(def|class|import|from|return|if|elif|else|for|while|try|except|raise|with|as|True|False|None|self|lambda|yield)\b/g,
    cpp: /\b(public|private|protected|static|class|void|int|long|double|float|bool|return|if|else|for|while|try|catch|throw|new|this|nullptr|true|false|include|using|namespace)\b/g,
    c: /\b(static|void|int|long|double|float|char|return|if|else|for|while|switch|case|break|continue|struct|typedef|include|define)\b/g,
    cs: /\b(public|private|protected|static|class|interface|void|int|long|double|float|bool|string|return|if|else|for|while|foreach|try|catch|throw|new|this|null|true|false|using|namespace)\b/g,
    go: /\b(package|import|func|var|const|type|struct|interface|return|if|else|for|range|switch|case|break|continue|go|defer|chan|make|new|nil|true|false)\b/g
  };

  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = {
    java: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    js: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    jsx: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    ts: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    tsx: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    py: /#.*$/gm,
    cpp: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    c: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    cs: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    go: /\/\/.*$/gm
  };

  const keyword = keywords[extension];
  const comment = comments[extension];
  
  if (!keyword) return result;
  
  // Highlight comments
  if (comment) {
    result = result.replace(comment, (match) => `<span style="color: #6A9955;">${match}</span>`);
  }
  
  // Highlight strings
  result = result.replace(strings, (match) => `<span style="color: #CE9178;">${match}</span>`);
  
  // Highlight keywords
  result = result.replace(keyword, (match) => `<span style="color: #569CD6;">${match}</span>`);
  
  return result;
};

const isImage = (mimeType = '', filename = '') => {
  const ext = getExtension(filename);
  return mimeType.startsWith('image/') || IMAGE_EXT.has(ext);
};

const isPdf = (mimeType = '', filename = '') => {
  const ext = getExtension(filename);
  return mimeType === 'application/pdf' || PDF_EXT.has(ext);
};

const isText = (mimeType = '', filename = '') => {
  const ext = getExtension(filename);
  return mimeType.startsWith('text/') || mimeType.includes('json') || TEXT_EXT.has(ext) || JSON_EXT.has(ext);
};

const isCode = (mimeType = '', filename = '') => {
  const ext = getExtension(filename);
  return mimeType.includes('javascript') ||
    mimeType.includes('java') ||
    mimeType.includes('python') ||
    mimeType.includes('typescript') ||
    mimeType.includes('text/x-') ||
    mimeType.includes('csharp') ||
    mimeType.includes('c+') ||
    mimeType.includes('xml') ||
    CODE_EXT.has(ext);
};

const normalizeAnnotations = (annotationList, artifactId) => {
  if (!Array.isArray(annotationList)) {
    return [];
  }
  return annotationList
    .filter((annotation) => {
      const targetId = annotation?.artifactId || annotation?.artifact?.id || annotation?.artifactUUID;
      return !artifactId || (targetId && String(targetId) === String(artifactId));
    })
    .map((annotation) => {
      const range = annotation.range || (annotation.startOffset != null && annotation.endOffset != null
        ? { start: annotation.startOffset, end: annotation.endOffset }
        : null);
      const region = annotation.region || (annotation.coordinates ? {
        x: annotation.coordinates.x,
        y: annotation.coordinates.y,
        width: annotation.coordinates.width,
        height: annotation.coordinates.height
      } : null);
      const tags = Array.isArray(annotation.tags)
        ? annotation.tags
        : annotation.tags
          ? String(annotation.tags).split(',').map((tag) => tag.trim()).filter(Boolean)
          : [];
      return {
        ...annotation,
        id: annotation.id || annotation.annotationId || annotation.uuid || `${annotation.artifactId}-${annotation.startLine || ''}-${annotation.startOffset || ''}`,
        artifactId: annotation.artifactId || artifactId,
        text: annotation.text || annotation.content || '',
        tags,
        range,
        region,
        annotationType: annotation.annotationType || (region ? 'REGION' : 'HIGHLIGHT')
      };
    });
};

const buildSegments = (content = '', annotations = []) => {
  if (!content || !annotations.length) {
    return [{ text: content, highlight: false }];
  }
  const text = String(content);
  const sorted = annotations
    .filter((annotation) => annotation.range && annotation.range.start != null && annotation.range.end != null)
    .sort((a, b) => (a.range.start || 0) - (b.range.start || 0));

  const segments = [];
  let cursor = 0;
  sorted.forEach((annotation) => {
    const start = Math.max(0, annotation.range.start);
    const end = Math.min(text.length, annotation.range.end);
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlight: false });
    }
    segments.push({
      text: text.slice(start, end),
      highlight: true,
      annotation
    });
    cursor = end;
  });
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false });
  }
  return segments;
};

const ArtifactCard = ({
  artifact,
  annotations = [],
  allowHighlight = false,
  allowAnnotation = false,
  allowTagging = false,
  readOnly = false,
  onStartHighlight,
  onFinishHighlight,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onTagAnnotation
}) => {
  const artifactId = artifact?.artifactId || artifact?.id;
  const [preview, setPreview] = useState({ status: 'idle', content: null });
  const textRef = useRef(null);
  const regionRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    console.log('ArtifactCard: Artifact data:', artifact);
    if (artifact?.tags) {
      console.log('ArtifactCard: Tags found:', artifact.tags);
    } else {
      console.log('ArtifactCard: No tags found');
    }
  }, [artifact]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const loadPreview = async () => {
      if (!artifactId) {
        console.log('ArtifactCard: No artifactId found', { artifact });
        setPreview({ status: 'idle', content: null });
        return;
      }

      const filename = artifact?.displayName || '';
      const mimeType = artifact?.mimeType || '';
      const artifactUrl = artifact?.url;

      console.log('ArtifactCard: Loading preview', { artifactId, filename, mimeType, artifactUrl });

      try {
        setPreview({ status: 'loading', content: null });
        
        let blob;
        
        // If artifact has a URL, use it directly (for participant access)
        if (artifactUrl) {
          console.log('ArtifactCard: Using artifact URL');
          // Convert relative URL to absolute backend URL
          const fullUrl = artifactUrl.startsWith('http') 
            ? artifactUrl 
            : `http://localhost:8080${artifactUrl}`;
          
          const response = await axios.get(fullUrl, {
            responseType: 'blob',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (cancelled) return;
          blob = response.data;
        } else {
          // Otherwise use artifactService.download (for researcher access)
          console.log('ArtifactCard: Using artifactService.download');
          const response = await artifactService.download(artifactId);
          if (cancelled) return;
          blob = response.data;
        }

        console.log('ArtifactCard: Download successful', { 
          size: blob.size,
          type: blob.type 
        });

        // Handle text/code files
        if (isText(mimeType, filename) || isCode(mimeType, filename)) {
          const rawText = await blob.text();
          const text = rawText.replace(/\r\n/g, '\n');
          console.log('ArtifactCard: Loaded as text/code', { length: text.length });
          setPreview({ status: 'ready', content: text });
          return;
        }

        // Handle images and PDFs
        objectUrl = URL.createObjectURL(blob);
        console.log('ArtifactCard: Loaded as binary', { objectUrl });
        setPreview({ status: 'ready', content: objectUrl });
      } catch (error) {
        console.error('ArtifactCard: Preview load failed', { 
          artifactId, 
          error,
          message: error.message,
          response: error.response?.data 
        });
        if (!cancelled) {
          setPreview({ status: 'error', content: null });
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [artifactId, artifact?.mimeType, artifact?.displayName, artifact?.url, artifact]);

  const artifactAnnotations = useMemo(
    () => normalizeAnnotations(annotations, artifactId),
    [annotations, artifactId]
  );

  const textSegments = useMemo(() => {
    const filename = artifact?.displayName || '';
    const mimeType = artifact?.mimeType || '';
    return preview.status === 'ready' && (isText(mimeType, filename) || isCode(mimeType, filename))
      ? buildSegments(preview.content, artifactAnnotations)
      : [{ text: preview.content, highlight: false }];
  }, [preview, artifact?.mimeType, artifact?.displayName, artifactAnnotations]);

  const handleTextMouseDown = (event) => {
    if (!allowHighlight || readOnly || !textRef.current) return;
    if (!textRef.current.contains(event.target)) return;
    onStartHighlight?.({
      artifactId,
      artifactDisplayName: artifact.displayName,
      type: 'text'
    });
  };

  const handleTextMouseUp = () => {
    if (!allowHighlight || readOnly || !textRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const text = selection.toString();
    if (!text.trim()) return;

    const range = selection.getRangeAt(0);
    if (!textRef.current.contains(range.commonAncestorContainer)) {
      return;
    }
    
    // Get plain text content
    const fullText = textRef.current.textContent || '';
    const selectedText = text;
    
    // Walk the DOM tree to calculate actual text offset
    const getTextOffset = (container, node, offset) => {
      let textOffset = 0;
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let currentNode;
      while ((currentNode = walker.nextNode())) {
        if (currentNode === node) {
          return textOffset + offset;
        }
        textOffset += currentNode.textContent.length;
      }
      return textOffset;
    };
    
    const start = getTextOffset(textRef.current, range.startContainer, range.startOffset);
    const end = getTextOffset(textRef.current, range.endContainer, range.endOffset);
    
    selection.removeAllRanges();

    onFinishHighlight?.({
      artifactId,
      artifactDisplayName: artifact.displayName,
      range: { start, end },
      text: selectedText,
      mimeType: artifact.mimeType
    });
  };

  const handleRegionPointerDown = (event) => {
    if (!allowAnnotation || readOnly || !regionRef.current) return;
    if (event.button !== 0) return;
    const rect = regionRef.current.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;
    setDragState({ startX, startY, currentX: startX, currentY: startY, rect });
    onStartHighlight?.({
      artifactId,
      artifactDisplayName: artifact.displayName,
      type: 'region'
    });
    event.preventDefault();
  };

  const handleRegionPointerMove = (event) => {
    if (!dragState) return;
    const currentX = event.clientX - dragState.rect.left;
    const currentY = event.clientY - dragState.rect.top;
    setDragState({ ...dragState, currentX, currentY });
  };

  const commitRegion = () => {
    if (!dragState || !regionRef.current) return;
    const { startX, startY, currentX, currentY, rect } = dragState;
    setDragState(null);
    const width = currentX - startX;
    const height = currentY - startY;
    if (Math.abs(width) < 8 || Math.abs(height) < 8) {
      return;
    }
    const normalized = {
      x: Math.min(startX, currentX) / rect.width,
      y: Math.min(startY, currentY) / rect.height,
      width: Math.abs(width) / rect.width,
      height: Math.abs(height) / rect.height
    };
    onFinishHighlight?.({
      artifactId,
      artifactDisplayName: artifact.displayName,
      region: normalized,
      mimeType: artifact.mimeType
    });
  };

  const handleRegionPointerUp = () => {
    if (!dragState) return;
    commitRegion();
  };

  const handleRegionPointerLeave = () => {
    if (!dragState) return;
    commitRegion();
  };

  const handleAnnotationAction = (event, annotation, action = 'edit') => {
    event.preventDefault();
    event.stopPropagation();
    if (action === 'delete') {
      if (readOnly) return;
      onDeleteAnnotation?.(annotation.id);
      return;
    }
    if (action === 'tag') {
      if (!allowTagging || readOnly) return;
      const nextTags = window.prompt(
        'Enter tags separated by commas',
        (annotation.tags || []).join(', ')
      );
      if (nextTags !== null) {
        const parsed = nextTags.split(',').map((tag) => tag.trim()).filter(Boolean);
        onTagAnnotation?.(annotation.id, parsed);
      }
      return;
    }
    onUpdateAnnotation?.(annotation);
  };

  const renderTextPreview = () => {
    const filename = artifact?.displayName || '';
    const mimeType = artifact?.mimeType || '';
    const ext = getExtension(filename);
    
    if (preview.status === 'loading') {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={24} />
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Loading preview...
          </Typography>
        </Box>
      );
    }
    if (preview.status === 'error') {
      return <Alert severity="error">Unable to load content preview.</Alert>;
    }
    
    // For code files, use syntax highlighting (but not if annotation is enabled)
    if (isCode(mimeType, filename) && !allowHighlight && !allowAnnotation) {
      const languageMap = {
        'java': 'java',
        'js': 'javascript',
        'jsx': 'jsx',
        'ts': 'typescript',
        'tsx': 'tsx',
        'py': 'python',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'go': 'go',
        'xml': 'xml',
        'html': 'html',
        'css': 'css'
      };
      
      const language = languageMap[ext] || 'text';
      
      return (
        <Box sx={{ 
          maxHeight: 500, 
          overflow: 'auto',
          borderRadius: 1,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          '& pre': { margin: 0 }
        }}>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{
              margin: 0,
              borderRadius: '4px',
              fontSize: '13px',
              lineHeight: '1.6',
              maxHeight: '500px',
              padding: '16px'
            }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {preview.content}
          </SyntaxHighlighter>
        </Box>
      );
    }
    
    // For plain text/JSON files or code with annotation enabled
    const isCodeFile = isCode(mimeType, filename);
    
    return (
      <Box
        ref={textRef}
        component="pre"
        onMouseDown={handleTextMouseDown}
        onMouseUp={handleTextMouseUp}
        sx={{
          p: 2,
          bgcolor: '#1E1E1E',
          color: '#D4D4D4',
          borderRadius: 1,
          maxHeight: 500,
          overflow: 'auto',
          fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          cursor: allowHighlight && !readOnly ? 'text' : 'default',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          '& span': {
            fontFamily: 'inherit'
          }
        }}
      >
        {textSegments.map((segment, index) => {
          if (!segment.highlight) {
            // Apply syntax highlighting for code files
            if (isCodeFile) {
              const highlighted = highlightCode(segment.text, ext);
              return (
                <span 
                  key={`plain-${index}`}
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              );
            }
            return <React.Fragment key={`plain-${index}`}>{segment.text}</React.Fragment>;
          }
          return (
            <Tooltip
              key={`${segment.annotation.id}-${index}`}
              title={segment.annotation.text || 'Annotation'}
            >
              <Box
                component="span"
                sx={{
                  backgroundColor: 'rgba(255, 235, 59, 0.4)',
                  borderRadius: 0.5,
                  px: 0.25,
                  cursor: readOnly ? 'default' : 'pointer',
                  boxShadow: '0 0 0 1px rgba(255, 235, 59, 0.6)'
                }}
                onDoubleClick={(event) => handleAnnotationAction(event, segment.annotation, 'edit')}
                onContextMenu={(event) => handleAnnotationAction(event, segment.annotation, 'delete')}
                onClick={(event) => {
                  if (event.shiftKey) {
                    handleAnnotationAction(event, segment.annotation, 'tag');
                  }
                }}
              >
                {segment.text}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  const renderVisualPreview = () => {
    const filename = artifact?.displayName || '';
    
    if (preview.status === 'loading') {
      return (
        <Box sx={{ 
          py: 6, 
          textAlign: 'center',
          bgcolor: '#F5F5F5',
          borderRadius: 1
        }}>
          <CircularProgress size={40} thickness={4} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading {filename}...
          </Typography>
        </Box>
      );
    }
    if (preview.status === 'error') {
      return (
        <Box sx={{ 
          textAlign: 'center', 
          py: 6, 
          bgcolor: '#FFF3E0',
          borderRadius: 1,
          border: '1px solid #FFB74D'
        }}>
          <Typography variant="body1" color="warning.dark" sx={{ fontWeight: 500 }}>
            Preview not available
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Download the file to view its contents
          </Typography>
        </Box>
      );
    }
    return (
      <Box
        ref={regionRef}
        sx={{
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
          minHeight: 300,
          bgcolor: '#F8F9FA',
          border: '1px solid #E0E0E0',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}
        onMouseDown={handleRegionPointerDown}
        onMouseMove={handleRegionPointerMove}
        onMouseUp={handleRegionPointerUp}
        onMouseLeave={handleRegionPointerLeave}
      >
        {isImage(artifact.mimeType) && (
          <Box
            component="img"
            src={preview.content}
            alt={artifact.displayName}
            sx={{ 
              width: '100%', 
              display: 'block',
              objectFit: 'contain',
              maxHeight: 500
            }}
          />
        )}
        {isPdf(artifact.mimeType) && preview.content && (
          <Box
            component="object"
            data={preview.content}
            type="application/pdf"
            sx={{ 
              width: '100%', 
              height: 500, 
              border: 0,
              bgcolor: 'white'
            }}
          />
        )}
        {dragState && (
          <Box
            sx={{
              position: 'absolute',
              border: '2px dashed',
              borderColor: 'warning.main',
              backgroundColor: 'rgba(255, 193, 7, 0.25)',
              left: `${Math.min(dragState.startX, dragState.currentX)}px`,
              top: `${Math.min(dragState.startY, dragState.currentY)}px`,
              width: `${Math.abs(dragState.currentX - dragState.startX)}px`,
              height: `${Math.abs(dragState.currentY - dragState.startY)}px`,
              pointerEvents: 'none'
            }}
          />
        )}
        {artifactAnnotations
          .filter((annotation) => annotation.region)
          .map((annotation) => (
            <Tooltip
              key={annotation.id}
              title={annotation.text || 'Annotation'}
            >
              <Box
                sx={{
                  position: 'absolute',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(33, 150, 243, 0.15)',
                  left: `${annotation.region.x * 100}%`,
                  top: `${annotation.region.y * 100}%`,
                  width: `${annotation.region.width * 100}%`,
                  height: `${annotation.region.height * 100}%`,
                  cursor: readOnly ? 'default' : 'pointer'
                }}
                onDoubleClick={(event) => handleAnnotationAction(event, annotation, 'edit')}
                onContextMenu={(event) => handleAnnotationAction(event, annotation, 'delete')}
                onClick={(event) => {
                  if (event.shiftKey) {
                    handleAnnotationAction(event, annotation, 'tag');
                  }
                }}
              >
                {!readOnly && (
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 4,
                      top: 4,
                      display: 'flex',
                      gap: 0.5
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(event) => handleAnnotationAction(event, annotation, 'edit')}
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(event) => handleAnnotationAction(event, annotation, 'delete')}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                    {allowTagging && (
                      <IconButton
                        size="small"
                        onClick={(event) => handleAnnotationAction(event, annotation, 'tag')}
                      >
                        <LocalOfferIcon fontSize="inherit" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            </Tooltip>
          ))}
      </Box>
    );
  };

  const renderPreview = () => {
    const filename = artifact?.displayName || '';
    const mimeType = artifact?.mimeType || '';
    
    if (isText(mimeType, filename) || isCode(mimeType, filename)) {
      return renderTextPreview();
    }
    if (isImage(mimeType, filename) || isPdf(mimeType, filename)) {
      return renderVisualPreview();
    }
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <InsertDriveFileIcon sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="body2">Preview not supported. Use the open button.</Typography>
      </Box>
    );
  };

  const getIcon = () => {
    const filename = artifact?.displayName || '';
    const mimeType = artifact?.mimeType || '';
    
    if (isImage(mimeType, filename)) return <ImageIcon />;
    if (isPdf(mimeType, filename)) return <PictureAsPdfIcon />;
    if (isCode(mimeType, filename)) return <CodeIcon />;
    if (isText(mimeType, filename)) return <DescriptionIcon />;
    return <InsertDriveFileIcon />;
  };

  const handleDownload = async () => {
    console.log('ArtifactCard: Download clicked', { artifactId, artifact });
    const artifactUrl = artifact?.url;
    
    try {
      let blob;
      
      // If artifact has a URL, use it directly (for participant access)
      if (artifactUrl) {
        console.log('ArtifactCard: Downloading via URL');
        // Convert relative URL to absolute backend URL
        const fullUrl = artifactUrl.startsWith('http') 
          ? artifactUrl 
          : `http://localhost:8080${artifactUrl}`;
          
        const res = await axios.get(fullUrl, {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        blob = res.data;
      } else {
        // Otherwise use artifactService.download (for researcher access)
        console.log('ArtifactCard: Downloading via artifactService');
        const res = await artifactService.download(artifactId);
        blob = res.data;
      }
      
      console.log('ArtifactCard: Download response', { 
        size: blob.size, 
        type: blob.type 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact?.displayName || 'artifact';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log('ArtifactCard: Download successful');
    } catch (err) {
      console.error('ArtifactCard: Download failed', { 
        artifactId, 
        error: err,
        message: err.message,
        response: err.response?.data 
      });
      alert('Failed to download artifact.');
    }
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardHeader
        avatar={
          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {getIcon()}
          </Box>
        }
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#000' }}>
            {artifact.displayName || 'Artifact'}
          </Typography>
        }
        subheader={
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            {artifact.mimeType || 'Unknown type'}
          </Typography>
        }
        sx={{
          bgcolor: '#FAFAFA',
          borderBottom: '1px solid #E0E0E0'
        }}
      />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {artifact.tags && artifact.tags.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {artifact.tags.map((tag) => (
              <Chip 
                key={tag.id} 
                label={tag.name} 
                size="small" 
                sx={{ 
                  bgcolor: tag.color || '#e0e0e0',
                  color: tag.color ? '#fff' : 'inherit',
                  fontWeight: 500
                }} 
              />
            ))}
          </Stack>
        )}
        {renderPreview()}
      </CardContent>
      <CardActions sx={{ 
        borderTop: '1px solid #E0E0E0',
        bgcolor: '#FAFAFA',
        px: 2,
        py: 1.5
      }}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={handleDownload}
          startIcon={<DescriptionIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }
          }}
        >
          Download
        </Button>
      </CardActions>
    </Card>
  );
};

ArtifactCard.propTypes = {
  artifact: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    artifactId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    displayName: PropTypes.string,
    mimeType: PropTypes.string,
    url: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
    }))
  }).isRequired,
  annotations: PropTypes.arrayOf(PropTypes.object),
  allowHighlight: PropTypes.bool,
  allowAnnotation: PropTypes.bool,
  allowTagging: PropTypes.bool,
  readOnly: PropTypes.bool,
  onStartHighlight: PropTypes.func,
  onFinishHighlight: PropTypes.func,
  onDeleteAnnotation: PropTypes.func,
  onUpdateAnnotation: PropTypes.func,
  onTagAnnotation: PropTypes.func
};

export default ArtifactCard;
