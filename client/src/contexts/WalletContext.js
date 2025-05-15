import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { currentUser, firebaseInitialized } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch wallet balance when user changes
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!currentUser || !firebaseInitialized) return;
      
      setLoading(true);
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setWalletBalance(userData.walletBalance || 0);
        } else {
          setWalletBalance(0);
        }
        setError('');
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
        setError('Failed to load wallet balance');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletBalance();
  }, [currentUser, firebaseInitialized]);

  // Function to fetch transaction history
  const fetchTransactionHistory = async () => {
    if (!currentUser || !firebaseInitialized) return;
    
    setLoading(true);
    try {
      const db = getFirestore();
      
      // Approach 1: Get all transactions for the user without sorting
      // This avoids the need for a composite index
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let transactionsList = [];
      
      querySnapshot.forEach((doc) => {
        transactionsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort the transactions client-side by timestamp
      transactionsList = transactionsList.sort((a, b) => {
        const timestampA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const timestampB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return timestampB - timestampA; // Descending (newest first)
      });
      
      // Limit to 10 transactions after sorting
      transactionsList = transactionsList.slice(0, 10);
      
      setTransactions(transactionsList);
      setError('');
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Refresh wallet data
  const refreshWalletData = async () => {
    if (currentUser) {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setWalletBalance(userData.walletBalance || 0);
        }
        
        await fetchTransactionHistory();
        setError('');
      } catch (err) {
        console.error('Error refreshing wallet data:', err);
        setError('Failed to refresh wallet data');
      }
    }
  };

  const value = {
    walletBalance,
    transactions,
    loading,
    error,
    fetchTransactionHistory,
    refreshWalletData
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
