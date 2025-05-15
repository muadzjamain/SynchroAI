import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Create context
const AuthContext = createContext();

// Context Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  
  // Initialize Firebase when config is available
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Fetch Firebase config from server
        const response = await fetch('/api/firebase-config');
        if (!response.ok) {
          throw new Error('Failed to fetch Firebase configuration');
        }
        
        const firebaseConfig = await response.json();
        
        // Initialize Firebase
        initializeApp(firebaseConfig);
        setFirebaseInitialized(true);
        
        // Set up auth state observer
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        });
        
        // Cleanup subscription
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setError('Failed to initialize Firebase');
        setLoading(false);
      }
    };
    
    initializeFirebase();
  }, []);
  
  // Sign up function
  const signup = async (email, password, displayName) => {
    setError('');
    try {
      const auth = getAuth();
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Create user document in Firestore
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName || user.email,
        walletBalance: 0,
        createdAt: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  // Sign in function
  const login = async (email, password) => {
    setError('');
    try {
      const auth = getAuth();
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  // Sign in with Google
  const loginWithGoogle = async () => {
    setError('');
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user document exists, create if not
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || user.email,
          walletBalance: 0,
          createdAt: serverTimestamp()
        });
      }
      
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  // Sign out function
  const logout = async () => {
    setError('');
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  const value = {
    currentUser,
    firebaseInitialized,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}
