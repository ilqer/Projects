import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Chip,
  CircularProgress,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

import ArtifactUploader from '../../../components/ArtifactUploader';
import ArtifactList from '../../../components/ArtifactList';
import { artifactService } from '../../../services/artifactService';
import { tagService } from '../../../services/tagService';

const ResearcherArtifacts = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [totalArtifacts, setTotalArtifacts] = useState(0);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [error, setError] = useState('');

  const [availableTags, setAvailableTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  useEffect(() => {
    loadArtifacts();
    loadTags();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [artifacts, searchTerm, selectedTagIds]);

  const loadArtifacts = async () => {
    try {
      setLoadingArtifacts(true);
      setError('');
      const res = await artifactService.getMyArtifacts();
      const list = res.data || [];
      setArtifacts(list);
      setTotalArtifacts(list.length);
    } catch (e) {
      console.error('Error loading artifacts:', e);
      setError('Failed to load artifacts');
    } finally {
      setLoadingArtifacts(false);
    }
  };

  const loadTags = async () => {
    try {
      const res = await tagService.getAllTags();
      setAvailableTags(res.data || []);
    } catch (e) {
      console.error('Error loading tags:', e);
    }
  };

  const applyFilters = () => {
    let filtered = [...artifacts];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(artifact =>
        artifact.originalFilename?.toLowerCase().includes(query) ||
        artifact.displayLabel?.toLowerCase().includes(query) ||
        artifact.contentType?.toLowerCase().includes(query) ||
        artifact.description?.toLowerCase().includes(query)
      );
    }

    if (selectedTagIds.length > 0) {
      filtered = filtered.filter(artifact => {
        const artifactTagIds = artifact.tags?.map(t => t.id) || [];
        return selectedTagIds.some(tagId => artifactTagIds.includes(tagId));
      });
    }

    setFilteredArtifacts(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleTagChange = (event) => {
    const { value } = event.target;
    setSelectedTagIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleUploaded = async () => {
    await loadArtifacts();
    setUploadOpen(false);
  };

  const getTagById = (id) => availableTags.find(t => t.id === id);

  const hasActiveFilters = searchTerm || selectedTagIds.length > 0;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderIcon fontSize="inherit" />
              Artifacts
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View, upload, and filter your artifacts.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadOpen(true)}
            size="large"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Upload Artifact
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search artifacts by filename, description, or content type..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={clearSearch} edge="end" size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Tags</InputLabel>
              <Select
                multiple
                value={selectedTagIds}
                onChange={handleTagChange}
                input={<OutlinedInput label="Filter by Tags" />}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const tag = getTagById(id);
                      return tag ? (
                        <Chip
                          key={id}
                          label={tag.name}
                          size="small"
                          sx={{
                            bgcolor: tag.color || '#3f51b5',
                            color: '#fff',
                            fontWeight: 600
                          }}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {availableTags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    <Checkbox checked={selectedTagIds.includes(tag.id)} />
                    <Chip
                      size="small"
                      label={tag.name}
                      sx={{
                        bgcolor: tag.color || '#3f51b5',
                        color: '#fff',
                        fontWeight: 600,
                        mr: 1
                      }}
                    />
                    <ListItemText primary={tag.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing <strong>{filteredArtifacts.length}</strong> of <strong>{totalArtifacts}</strong> artifacts
          {hasActiveFilters && ' (filtered)'}
        </Typography>
      </Box>

      {loadingArtifacts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ArtifactList
          artifacts={filteredArtifacts}
          onDeleted={loadArtifacts}
          embedded
        />
      )}

      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Box>
      )}

      <ArtifactUploader
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </Container>
  );
};

export default ResearcherArtifacts;
