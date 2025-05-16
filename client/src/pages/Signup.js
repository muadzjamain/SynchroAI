
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAuth } from '../contexts/AuthContext';

// Styled components
const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(-1),
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #3861fb 0%, #4364f7 50%, #4a66f7 100%)',
  }
}));

const GoogleButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: '#757575',
  border: '1px solid #dadce0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
    border: '1px solid #d2d2d2',
  },
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1),
  }
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  '&::before, &::after': {
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  '& .MuiDivider-wrapper': {
    color: theme.palette.text.secondary,
    fontSize: '0.85rem',
  }
}));

const Signup = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { email, password, confirmPassword, displayName } = formData;
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName);
      navigate('/profile');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create an account. ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/profile');
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <AuthPaper elevation={3}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}>
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: theme.palette.primary.main,
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)',
                mb: 2
              }}
            >
              <LockOutlinedIcon fontSize="large" />
            </Avatar>
            <Typography 
              component="h1" 
              variant="h4" 
              fontWeight="bold"
              color="text.primary"
            >
              Create Account
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              align="center"
              sx={{ mt: 1 }}
            >
              Sign up to get started with SynchroAI
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                width: '100%',
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' }
              }}
            >
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="displayName"
              label="Display Name (optional)"
              name="displayName"
              autoComplete="name"
              value={formData.displayName}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <LockIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Password must be at least 6 characters
              </Typography>
              <Tooltip title="Choose a strong password with at least 6 characters. Consider using a mix of letters, numbers, and symbols for better security.">
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 3, 
                mb: 3, 
                py: 1.5,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(67, 97, 238, 0.3)',
                }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            
            <StyledDivider sx={{ my: 3 }}>or continue with</StyledDivider>
            
            <GoogleButton
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon style={{ color: '#4285F4' }} />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ 
                mb: 3,
                py: 1.5,
                borderRadius: 8,
                fontWeight: 500
              }}
            >
              Google
            </GoogleButton>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" display="inline">
                Already have an account?
              </Typography>
              <Link 
                component={RouterLink} 
                to="/login" 
                variant="body2"
                sx={{ 
                  ml: 1, 
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}
              >
                Sign In
              </Link>
            </Box>
          </Box>
        </Box>
      </AuthPaper>
    </Container>
  );
};

export default Signup;
