// This file loads the Firebase configuration from the server
// The server dynamically generates the configuration using environment variables

// Define a global function to notify when Firebase config is ready
window.firebaseConfigReady = false;
window.onFirebaseConfigReady = function(callback) {
  if (window.firebaseConfigReady) {
    callback();
  } else {
    // Check every 100ms until config is ready
    const checkInterval = setInterval(function() {
      if (window.firebaseConfigReady) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100);
  }
};

// Fetch the Firebase configuration from the server
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
    // Set the global firebaseConfig variable
    window.firebaseConfig = config;
    console.log('Firebase configuration loaded successfully');
    
    // Mark config as ready
    window.firebaseConfigReady = true;
    
    // Try to initialize Firebase if main.js has already loaded
    if (typeof initializeFirebaseIfNeeded === 'function') {
      initializeFirebaseIfNeeded();
    }
  })
  .catch(error => {
    console.error('Error loading Firebase configuration:', error);
    // Fallback configuration for development only
    window.firebaseConfig = {
      apiKey: "AIzaSyCeX1jXKKXLd0SrjUCnElMmQPsvQ_eMZaw",
      authDomain: "syncroai1.firebaseapp.com",
      projectId: "syncroai1",
      storageBucket: "syncroai1.firebasestorage.app",
      messagingSenderId: "230755461319",
      appId: "1:230755461319:web:a5b750a2daade9dea1b6e2",
      measurementId: "G-K143JY5CMM"
    };
    
    // Mark config as ready
    window.firebaseConfigReady = true;
    
    // Try to initialize Firebase if main.js has already loaded
    if (typeof initializeFirebaseIfNeeded === 'function') {
      initializeFirebaseIfNeeded();
    }
  });
