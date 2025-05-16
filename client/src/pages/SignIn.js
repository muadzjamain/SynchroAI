import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  InputAdornment,
  IconButton,
  useTheme,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
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
    marginRight: theme.spacing(1.5),
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

const SignIn = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const { login, loginWithGoogle, sendPasswordResetEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to profile
  const from = location.state?.from?.pathname || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to Sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenResetDialog = () => {
    setResetEmail(email); // Pre-fill with login email if available
    setResetEmailError('');
    setResetDialogOpen(true);
  };
  
  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
  };
  
  const handlePasswordReset = async () => {
    // Basic email validation
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      setResetEmailError('');
      await sendPasswordResetEmail(resetEmail);
      setResetDialogOpen(false);
      setResetSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setResetEmailError('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setResetSuccess(false);
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
              Welcome Back
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              align="center"
              sx={{ mt: 1 }}
            >
              Sign in to continue to SynchroAI
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    value="remember" 
                    color="primary" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                }
                label="Remember me"
              />
              <Link 
                href="#" 
                variant="body2" 
                onClick={handleOpenResetDialog}
                sx={{ color: theme.palette.primary.main }}
              >
                Forgot password?
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 2, 
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
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
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
                Don't have an account?
              </Typography>
              <Link 
                component={RouterLink} 
                to="/signup" 
                variant="body2"
                sx={{ 
                  ml: 1, 
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}
              >
                Sign Up
              </Link>
            </Box>
          </Box>
        </Box>
      </AuthPaper>
      
      {/* Password Reset Dialog */}
      <Dialog 
        open={resetDialogOpen} 
        onClose={handleCloseResetDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }
        }}
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            Reset Password
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ mb: 3 }}>
            Enter your email address below. We'll send you a link to reset your password.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reset-email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            error={!!resetEmailError}
            helperText={resetEmailError}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={handleCloseResetDialog} 
            disabled={loading}
            sx={{ borderRadius: 8 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordReset} 
            disabled={loading}
            variant="contained"
            sx={{ 
              borderRadius: 8,
              px: 3
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Message */}
      <Snackbar
        open={resetSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Password reset email sent! Check your inbox for further instructions."
        ContentProps={{
          sx: {
            bgcolor: theme.palette.success.main,
            borderRadius: 2
          }
        }}
      />
    </Container>
  );
};

export default SignIn;
