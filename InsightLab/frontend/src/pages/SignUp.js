import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignUp(props) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'PARTICIPANT',
  });

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = React.useState('');
  const [fullNameError, setFullNameError] = React.useState(false);
  const [fullNameErrorMessage, setFullNameErrorMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === 'password') {
      setPasswordError(false);
      setPasswordErrorMessage('');
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage('');
    }
    if (e.target.name === 'confirmPassword') {
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage('');
    }
  };

  const validateInputs = () => {
    let isValid = true;

    if (formData.password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters.');
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    const { confirmPassword, ...payload } = formData;
    const result = await register(payload);

    if (result.success) {
      navigate('/verify-email', { state: { email: formData.email } });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign up
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

          <Box 
            component="form" 
            onSubmit={handleSubmit}
            noValidate
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              width: '100%',
              gap: 2 
            }}
          >
            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>
              <TextField 
                id="username"
                name="username"
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                required
                fullWidth
                variant="outlined"
                value={formData.username}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="fullName">Full Name</FormLabel>
              <TextField 
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                autoComplete="name"
                required
                fullWidth
                variant="outlined"
                value={formData.fullName}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField 
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                required
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField 
                id="password"
                name="password"
                placeholder="••••••"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                variant="outlined"
                value={formData.password}
                error={passwordError}
                helperText={passwordErrorMessage}
                onChange={handleChange}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
              <TextField 
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                variant="outlined"
                value={formData.confirmPassword}
                error={confirmPasswordError}
                helperText={confirmPasswordErrorMessage}
                onChange={handleChange}
                color={confirmPasswordError ? 'error' : 'primary'}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="role">Role</FormLabel>
              <Select 
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="PARTICIPANT">Participant</MenuItem>
                <MenuItem value="RESEARCHER">Researcher</MenuItem>
                <MenuItem value="REVIEWER">Reviewer</MenuItem>
              </Select>
            </FormControl>

            <Button 
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign up'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link
                href="/login"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
