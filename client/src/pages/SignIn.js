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
  Snackbar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Divider sx={{ my: 2 }}>or</Divider>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Sign in with Google
            </Button>
            
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2" onClick={handleOpenResetDialog}>
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/signup" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
      
      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onClose={handleCloseResetDialog}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handlePasswordReset} disabled={loading}>
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
      />
    </Container>
  );
};

export default SignIn;
