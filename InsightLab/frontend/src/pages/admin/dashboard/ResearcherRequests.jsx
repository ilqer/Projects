import React, { useEffect, useState } from 'react';
import { userService } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';

const ResearcherRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.getResearcherRequests();
      setRequests(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      await userService.approveResearcher(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Approval failed');
    }
  };

  const reject = async (id) => {
    try {
      await userService.rejectResearcher(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Rejection failed');
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!user || user.role !== 'ADMIN') {
    return <div>Unauthorized</div>;
  }

  return (
    <Container maxWidth="lg" sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 800, maxWidth: '100%' }}>
          <Paper sx={{ p: 3 }} elevation={3}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Pending Researcher Requests
            </Typography>
            {error && (
              <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>
            )}
            {loading ? (
              <Box sx={{ p: 1 }}>Loading...</Box>
            ) : requests.length === 0 ? (
              <Box sx={{ p: 1 }}>No pending requests.</Box>
            ) : (
              <List disablePadding>
                {requests.map((u, idx) => (
                  <React.Fragment key={u.id}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" color="error" onClick={() => reject(u.id)}>
                            Reject
                          </Button>
                          <Button size="small" variant="contained" onClick={() => approve(u.id)}>
                            Approve
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>{(u.fullName || u.username || 'U').charAt(0).toUpperCase()}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={u.fullName || u.username}
                        secondary={`${u.email} • ${u.username} • ${u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}`}
                      />
                    </ListItem>
                    {idx < requests.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default ResearcherRequests;