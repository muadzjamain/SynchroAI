import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Divider,
  Container,
  Paper,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
  InputAdornment,
  Chip,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  getAuth,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  linkWithCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Icons
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import GoogleIcon from '@mui/icons-material/Google';
import WarningIcon from '@mui/icons-material/Warning';

// Styled components
const SettingsCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 25px rgba(0,0,0,0.1)',
  },
}));

const CardHeader = styled(Box)(({ theme, color }) => ({
  padding: theme.spacing(2, 3),
  background: color === 'error' 
    ? 'linear-gradient(90deg, #ff4d4d 0%, #ff8080 100%)' 
    : 'linear-gradient(90deg, #3861fb 0%, #4364f7 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AccountSettings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Check if user has password or is Google user
  useEffect(() => {
    const checkAuthMethods = async () => {
      if (currentUser) {
        try {
          const auth = getAuth();
          const methods = await fetchSignInMethodsForEmail(auth, currentUser.email);
          
          // Check if user can sign in with password
          setHasPassword(methods.includes('password'));
          
          // Check if user can sign in with Google
          setIsGoogleUser(methods.includes('google.com'));
          
        } catch (error) {
          console.error('Error checking auth methods:', error);
        }
      }
    };
    
    checkAuthMethods();
  }, [currentUser]);
  
  // Email change state
  const [passwordForEmail, setPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
  // Delete account state
  const [passwordForDelete, setPasswordForDelete] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Handle password change or setup
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Reset states
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validation for new password
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      const auth = getAuth();
      
      // Different logic for users with password vs Google-only users
      if (hasPassword) {
        // Validation for users that already have a password
        if (!currentPassword) {
          setPasswordError('Please enter your current password');
          setLoading(false);
          return;
        }
        
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );
        
        // Re-authenticate user
        await reauthenticateWithCredential(currentUser, credential);
        
        // Change password
        await updatePassword(currentUser, newPassword);
        
        // Clear form and show success message
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('Password changed successfully');
      } else {
        // For Google users or users without a password
        // Link their account with email/password provider
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          newPassword
        );
        
        // Link the accounts
        await linkWithCredential(currentUser, credential);
        
        // Update state
        setHasPassword(true);
        
        // Clear form and show success message
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('Password set up successfully');
      }
    } catch (error) {
      console.error('Error with password operation:', error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect current password');
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError('For security reasons, please log out and log in again before changing your password');
      } else if (error.code === 'auth/provider-already-linked') {
        setPasswordError('This account already has a password set up');
        setHasPassword(true);
      } else {
        setPasswordError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle email change
  const handleEmailChange = async (e) => {
    e.preventDefault();
    
    // Reset states
    setEmailError('');
    setEmailSuccess('');
    
    // Validation
    if (!passwordForEmail) {
      setEmailError('Please enter your password');
      return;
    }
    
    if (!newEmail) {
      setEmailError('Please enter a new email');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (newEmail === currentUser.email) {
      setEmailError('New email is the same as current email');
      return;
    }
    
    setLoading(true);
    
    try {
      const auth = getAuth();
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForEmail
      );
      
      // Re-authenticate user
      await reauthenticateWithCredential(currentUser, credential);
      
      // Change email
      await updateEmail(currentUser, newEmail);
      
      // Clear form and show success message
      setPasswordForEmail('');
      setNewEmail('');
      setEmailSuccess('Email changed successfully');
      
    } catch (error) {
      console.error('Error changing email:', error);
      if (error.code === 'auth/wrong-password') {
        setEmailError('Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailError('This email is already in use');
      } else {
        setEmailError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Open delete account dialog
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    setDeleteError('');
  };
  
  // Close delete account dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPasswordForDelete('');
    setDeleteConfirmText('');
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    // Reset error state
    setDeleteError('');
    
    // Validation
    if (!passwordForDelete) {
      setDeleteError('Please enter your password');
      return;
    }
    
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    
    setLoading(true);
    
    try {
      const auth = getAuth();
      const db = getFirestore();
      
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForDelete
      );
      
      // Re-authenticate user
      await reauthenticateWithCredential(currentUser, credential);
      
      // Delete user data from Firestore
      try {
        // Delete user document
        await deleteDoc(doc(db, 'users', currentUser.uid));
        
        // Delete user's services
        const servicesQuery = query(
          collection(db, 'services'), 
          where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(servicesQuery);
        
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
      } catch (firestoreError) {
        console.error('Error deleting user data from Firestore:', firestoreError);
      }
      
      // Delete Firebase authentication account
      await deleteUser(currentUser);
      
      // Redirect to home page (user will be logged out)
      navigate('/');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        setDeleteError('Incorrect password');
      } else {
        setDeleteError(error.message);
      }
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      {/* Header Section with User Info */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={currentUser?.photoURL}
            sx={{ 
              width: 64, 
              height: 64, 
              bgcolor: theme.palette.primary.main,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              mr: 2
            }}
          >
            {currentUser?.displayName?.[0] || currentUser?.email?.[0] || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Account Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {currentUser?.displayName || currentUser?.email}
              {isGoogleUser && (
                <Chip 
                  icon={<GoogleIcon />} 
                  label="Google Account" 
                  size="small" 
                  sx={{ ml: 1, bgcolor: 'rgba(66, 133, 244, 0.1)', color: '#4285F4' }} 
                />
              )}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 2, mb: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          aria-label="account settings tabs"
        >
          <Tab 
            icon={<LockIcon />} 
            label="Password" 
            iconPosition="start" 
            sx={{ py: 2 }} 
          />
          <Tab 
            icon={<EmailIcon />} 
            label="Email" 
            iconPosition="start" 
            sx={{ py: 2 }} 
          />
          <Tab 
            icon={<DeleteIcon />} 
            label="Account" 
            iconPosition="start" 
            sx={{ py: 2 }} 
          />
        </Tabs>
      </Paper>
      
      {/* Password Tab */}
      <TabPanel value={tabValue} index={0}>
        <SettingsCard>
          <CardHeader>
            <LockIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              {hasPassword ? 'Change Password' : 'Set Up Password'}
            </Typography>
          </CardHeader>
          <CardContent sx={{ p: 3 }}>
            {isGoogleUser && !hasPassword && (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
              >
                You're signed in with Google. Setting up a password will allow you to sign in with either 
                Google or your email and password.
              </Alert>
            )}
            <form onSubmit={handlePasswordChange}>
              <Grid container spacing={3}>
                {hasPassword && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type={showCurrentPassword ? 'text' : 'password'}
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              edge="end"
                            >
                              {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {passwordError && (
                  <Grid item xs={12}>
                    <Alert 
                      severity="error"
                      sx={{ borderRadius: 2 }}
                    >
                      {passwordError}
                    </Alert>
                  </Grid>
                )}
                
                {passwordSuccess && (
                  <Grid item xs={12}>
                    <Alert 
                      severity="success"
                      sx={{ borderRadius: 2 }}
                    >
                      {passwordSuccess}
                    </Alert>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={<LockIcon />}
                    sx={{ 
                      mt: 1, 
                      py: 1, 
                      px: 3, 
                      borderRadius: 8,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : (hasPassword ? 'Update Password' : 'Set Up Password')}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </SettingsCard>
      </TabPanel>
      
      {/* Email Tab */}
      <TabPanel value={tabValue} index={1}>
        <SettingsCard>
          <CardHeader>
            <EmailIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Change Email Address
            </Typography>
          </CardHeader>
          <CardContent sx={{ p: 3 }}>
            <form onSubmit={handleEmailChange}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body1">
                      Current email: <strong>{currentUser?.email}</strong>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type={showCurrentPassword ? 'text' : 'password'}
                    label="Current Password"
                    value={passwordForEmail}
                    onChange={(e) => setPasswordForEmail(e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="email"
                    label="New Email Address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </Grid>
                
                {emailError && (
                  <Grid item xs={12}>
                    <Alert 
                      severity="error"
                      sx={{ borderRadius: 2 }}
                    >
                      {emailError}
                    </Alert>
                  </Grid>
                )}
                
                {emailSuccess && (
                  <Grid item xs={12}>
                    <Alert 
                      severity="success"
                      sx={{ borderRadius: 2 }}
                    >
                      {emailSuccess}
                    </Alert>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={<EmailIcon />}
                    sx={{ 
                      mt: 1, 
                      py: 1, 
                      px: 3, 
                      borderRadius: 8,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Update Email'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </SettingsCard>
      </TabPanel>
      
      {/* Account Tab */}
      <TabPanel value={tabValue} index={2}>
        <SettingsCard>
          <CardHeader color="error">
            <DeleteIcon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Delete Account
            </Typography>
          </CardHeader>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <WarningIcon color="error" sx={{ mr: 2, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Warning: This action is permanent
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Deleting your account will permanently remove all your data, including your profile,
                  services, and settings. This action cannot be undone.
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="outlined"
              color="error"
              onClick={openDeleteDialog}
              disabled={loading}
              startIcon={<DeleteIcon />}
              sx={{ 
                mt: 2, 
                py: 1, 
                px: 3, 
                borderRadius: 8,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              Delete My Account
            </Button>
          </CardContent>
        </SettingsCard>
      </TabPanel>
      
      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Account Permanently
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText paragraph>
            This action cannot be undone. Your account, services, and all associated data will be permanently deleted.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Your Password"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordForDelete}
            onChange={(e) => setPasswordForDelete(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="body2" gutterBottom>
            Type <strong>DELETE</strong> to confirm:
          </Typography>
          <TextField
            margin="dense"
            fullWidth
            variant="outlined"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE in all caps"
          />
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={closeDeleteDialog}
            variant="outlined"
            sx={{ borderRadius: 8 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            variant="contained" 
            color="error"
            disabled={loading || deleteConfirmText !== 'DELETE' || !passwordForDelete}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{ borderRadius: 8, px: 3 }}
          >
            {loading ? 'Processing...' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountSettings;
