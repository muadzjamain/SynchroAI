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
  Divider
} from '@mui/material';
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

const AccountSettings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
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
    <Box sx={{ maxWidth: 800, mx: 'auto', pt: 4, pb: 8, px: 2 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Account Settings
      </Typography>
      
      {/* Change Password or Set Up Password */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {hasPassword ? 'Change Password' : 'Set Up Password'}
          </Typography>
          {isGoogleUser && !hasPassword && (
            <Alert severity="info" sx={{ mb: 2 }}>
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
                    type="password"
                    label="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Grid>
              
              {passwordError && (
                <Grid item xs={12}>
                  <Alert severity="error">{passwordError}</Alert>
                </Grid>
              )}
              
              {passwordSuccess && (
                <Grid item xs={12}>
                  <Alert severity="success">{passwordSuccess}</Alert>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : (hasPassword ? 'Change Password' : 'Set Up Password')}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      {/* Change Email */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Change Email
          </Typography>
          <form onSubmit={handleEmailChange}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={passwordForEmail}
                  onChange={(e) => setPasswordForEmail(e.target.value)}
                  required
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
                  <Alert severity="error">{emailError}</Alert>
                </Grid>
              )}
              
              {emailSuccess && (
                <Grid item xs={12}>
                  <Alert severity="success">{emailSuccess}</Alert>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Change Email'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      {/* Delete Account */}
      <Card sx={{ bgcolor: '#fff9f9', borderColor: '#ffdddd' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold" color="error">
            Delete Account
          </Typography>
          <Typography variant="body2" paragraph>
            Warning: This action is permanent and cannot be undone. All your data will be permanently deleted.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={openDeleteDialog}
            disabled={loading}
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>
      
      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>
          Delete Account Permanently
        </DialogTitle>
        <DialogContent>
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
          />
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            variant="contained" 
            color="error"
            disabled={loading || deleteConfirmText !== 'DELETE' || !passwordForDelete}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountSettings;
