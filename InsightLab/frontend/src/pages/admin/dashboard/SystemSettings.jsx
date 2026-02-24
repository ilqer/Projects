import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Switch,
  Button,
  Stack,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import { Settings, Email, Notifications } from '@mui/icons-material';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure system-wide settings and preferences
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab icon={<Settings />} label="General" iconPosition="start" />
          <Tab icon={<Email />} label="Email" iconPosition="start" />
          <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
        </Tabs>
      </Box>

      {/* GENERAL */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" mb={3}>
                System Information
              </Typography>

              <Stack spacing={3}>
                <TextField label="System Name" defaultValue="Artifact Comparator" fullWidth />
                <TextField label="System Version" defaultValue="1.0.0" fullWidth disabled />

                <TextField select label="Deployment Mode" defaultValue="hosted" fullWidth>
                  <MenuItem value="local">Local</MenuItem>
                  <MenuItem value="hosted">Hosted</MenuItem>
                </TextField>

                <TextField select label="Time Zone" defaultValue="utc" fullWidth>
                  <MenuItem value="utc">UTC</MenuItem>
                  <MenuItem value="est">Eastern Time</MenuItem>
                  <MenuItem value="pst">Pacific Time</MenuItem>
                </TextField>

                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'warning.50',
                    border: 1,
                    borderColor: 'warning.light',
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Maintenance Mode
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Temporarily disable user access
                      </Typography>
                    </Box>
                    <Switch
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                    />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* EMAIL */}
      {activeTab === 1 && (
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>
              Email Configuration
            </Typography>

            <Stack spacing={3}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.50',
                  border: 1,
                  borderColor: 'primary.light',
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Email Service
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enable or disable email functionality
                    </Typography>
                  </Box>
                  <Switch checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
                </Stack>
              </Box>

              {emailEnabled && (
                <>
                  <TextField label="SMTP Host" placeholder="smtp.gmail.com" fullWidth />
                  <TextField label="SMTP Port" type="number" placeholder="587" fullWidth />
                  <TextField
                    label="Email Address"
                    type="email"
                    placeholder="noreply@artifactcomparator.com"
                    fullWidth
                  />
                  <TextField label="SMTP Username" placeholder="username" fullWidth />
                  <TextField label="SMTP Password" type="password" placeholder="••••••••" fullWidth />

                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined">Test Connection</Button>
                    <Button variant="contained">Save Email Settings</Button>
                  </Stack>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === 2 && (
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>
              Notification Preferences
            </Typography>

            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.50',
                  border: 1,
                  borderColor: 'primary.light',
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      In-App Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enable notification system
                    </Typography>
                  </Box>
                  <Switch
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                </Stack>
              </Box>

              {notificationsEnabled && (
                <>
                  {[
                    'Task Assignments',
                    'Deadline Reminders',
                    'Study Invitations',
                    'Researcher Request Alerts',
                    'Flagged Evaluation Alerts',
                  ].map((item) => (
                    <Box key={item} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{item}</Typography>
                        <Switch defaultChecked />
                      </Stack>
                    </Box>
                  ))}
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SystemSettings;
