import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

const WalletSuccess = () => {
  const { currentUser } = useAuth();
  const { refreshWalletData } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState(0);
  
  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get session ID and amount from URL query parameters
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        const paymentAmount = parseFloat(params.get('amount') || '0');
        
        setAmount(paymentAmount);
        
        if (!sessionId) {
          throw new Error('No session ID found');
        }
        
        // Verify payment with backend
        const response = await fetch(`/api/payment-success?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Payment verification failed');
        }
        
        // Refresh wallet data to show updated balance
        await refreshWalletData();
        
        setLoading(false);
      } catch (err) {
        console.error('Error processing payment success:', err);
        setError(err.message || 'Failed to process payment');
        setLoading(false);
      }
    };
    
    if (currentUser) {
      processPayment();
    } else {
      navigate('/login');
    }
  }, [currentUser, location.search, navigate, refreshWalletData]);

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, textAlign: 'center', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6">
              Processing your payment...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/wallet')}
            >
              Return to Wallet
            </Button>
          </Box>
        ) : (
          <Box sx={{ py: 4 }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="h6" color="primary.main" gutterBottom>
              ${amount.toFixed(2)} has been added to your wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              Your wallet has been successfully topped up. You can now use these funds to purchase AI services.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/wallet')}
              sx={{ mr: 2 }}
            >
              View My Wallet
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/profile')}
            >
              My Services
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default WalletSuccess;
