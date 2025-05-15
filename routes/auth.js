const express = require('express');
const router = express.Router();
const { auth } = require('../config/firebase');
const { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} = require('firebase/auth');

// Sign In page
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Sign In - SynchroAI' });
});

// Register page
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register - SynchroAI' });
});

// Handle sign in
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user in session
    req.session.user = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0]
    };
    
    req.flash('success', 'Successfully logged in!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Sign in error:', error);
    req.flash('error', 'Invalid email or password');
    res.redirect('/auth/login');
  }
});

// Handle registration
router.post('/register', async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  
  // Validate password match
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/auth/register');
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user in session
    req.session.user = {
      uid: user.uid,
      email: user.email,
      displayName: email.split('@')[0]
    };
    
    req.flash('success', 'Account created successfully!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', error.message);
    res.redirect('/auth/register');
  }
});

// Google sign-in
router.get('/google', async (req, res) => {
  const provider = new GoogleAuthProvider();
  
  try {
    // Note: This won't work directly in a server environment
    // In a real app, you'd use Firebase client SDK in the browser
    // This route is just a placeholder for the server-side flow
    res.redirect('/');
  } catch (error) {
    console.error('Google sign-in error:', error);
    req.flash('error', 'Failed to sign in with Google');
    res.redirect('/auth/login');
  }
});

// Logout
router.get('/logout', async (req, res) => {
  try {
    await signOut(auth);
    req.session.destroy();
    res.redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    res.redirect('/');
  }
});

module.exports = router;
