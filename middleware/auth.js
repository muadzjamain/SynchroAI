const { auth } = require('../config/firebase');
const { onAuthStateChanged } = require('firebase/auth');

// Middleware to check if user is authenticated
const checkAuth = (req, res, next) => {
  // Check if user session exists
  if (req.session && req.session.user) {
    return next();
  }
  
  // If no session, redirect to login
  req.flash('error', 'Please log in to access this page');
  return res.redirect('/auth/login');
};

// Middleware to attach current user to response locals
const attachCurrentUser = (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
};

module.exports = {
  checkAuth,
  attachCurrentUser
};
