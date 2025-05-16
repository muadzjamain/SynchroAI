import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Container,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HistoryIcon from '@mui/icons-material/History';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Styled components
const WalletCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1976d2 0%, #21CBF3 100%)',
  color: theme.palette.primary.contrastText,
  borderRadius: 16,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  boxShadow: '0 10px 30px rgba(67, 97, 238, 0.2)',
  position: 'relative',
  overflow: 'hidden',
}));

const WalletCardOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.05,
  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
  backgroundSize: '24px 24px',
}));

const PricingOption = styled(Paper)(({ theme, selected }) => ({
  border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: 12,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2.5),
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  backgroundColor: selected ? 'rgba(67, 97, 238, 0.05)' : theme.palette.background.paper,
  boxShadow: selected ? '0 0 0 2px rgba(67, 97, 238, 0.5)' : '0 2px 8px rgba(0,0,0,0.05)',
  transform: selected ? 'translateY(-2px)' : 'none',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
  },
}));

const TransactionItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(2, 1),
  borderRadius: 8,
  marginBottom: theme.spacing(1),
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Wallet = () => {
  const { currentUser } = useAuth();
  const { walletBalance, transactions, loading, error, fetchTransactionHistory } = useWallet();
  
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  
  // Predefined amounts
  const amounts = [
    { value: 10, label: 'Quick top-up for occasional use' },
    { value: 25, label: 'Popular! Great for regular users' },
    { value: 50, label: 'Best value! Perfect for business needs' }
  ];

  // Fetch transaction history when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchTransactionHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d{0,2}$/.test(value) && parseFloat(value) <= 1000)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const handleCheckout = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || isNaN(amount) || amount < 5 || amount > 1000) {
      setCheckoutError('Please select a valid amount between $5 and $1000');
      return;
    }
    
    setCheckoutLoading(true);
    setCheckoutError('');
    
    try {
      // Fetch Stripe publishable key
      const stripeResponse = await fetch('/api/stripe-config');
      const stripeConfig = await stripeResponse.json();
      const stripe = await loadStripe(stripeConfig.publishableKey);
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          userId: currentUser.uid,
        }),
      });
      
      const session = await response.json();
      
      if (session.error) {
        throw new Error(session.error);
      }
      
      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Failed to process checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        My Wallet
      </Typography>
      
      {/* Wallet Balance Card */}
      <WalletCard>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Available Balance
        </Typography>
        <Typography variant="h3" component="div" fontWeight="bold" sx={{ my: 1 }}>
          ${walletBalance.toFixed(2)}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Use your wallet to pay for AI services on SynchroAI
        </Typography>
      </WalletCard>
      
      {/* Top Up Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Add Funds to Your Wallet
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {amounts.map((option) => (
              <Grid item xs={12} md={4} key={option.value}>
                <PricingOption 
                  selected={selectedAmount === option.value}
                  onClick={() => handleAmountSelect(option.value)}
                >
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    ${option.value}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Add ${option.value} to Wallet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.label}
                  </Typography>
                </PricingOption>
              </Grid>
            ))}
          </Grid>
          
          {/* Custom Amount Option */}
          <PricingOption 
            selected={customAmount !== ''}
            onClick={() => document.getElementById('custom-amount').focus()}
            sx={{ mt: 2 }}
          >
            <Typography variant="h5" color="primary" fontWeight="bold">
              ${customAmount || '__'}
            </Typography>
            <Typography variant="subtitle1" fontWeight="medium">
              Custom Amount
            </Typography>
            <Box sx={{ mt: 1 }}>
              <TextField
                id="custom-amount"
                variant="outlined"
                size="small"
                placeholder="Enter amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                onClick={(e) => e.stopPropagation()}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{
                  min: 5,
                  max: 1000,
                }}
                sx={{ width: 150 }}
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                Min: $5, Max: $1000
              </Typography>
            </Box>
          </PricingOption>
          
          {checkoutError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {checkoutError}
            </Alert>
          )}
          
          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
            disabled={(!selectedAmount && !customAmount) || checkoutLoading}
            onClick={handleCheckout}
          >
            {checkoutLoading ? <CircularProgress size={24} color="inherit" /> : 'Proceed to Checkout'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Transaction History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Transaction History
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : transactions.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No transactions yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%' }}>
              {transactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <TransactionItem alignItems="flex-start">
                    <ListItemText
                      primary={transaction.description || 'Transaction'}
                      secondary={formatDate(transaction.timestamp)}
                      sx={{ mr: 2 }}
                    />
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      color={transaction.type === 'deposit' ? 'success.main' : 'error.main'}
                    >
                      {transaction.type === 'deposit' ? '+' : '-'}
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </Typography>
                  </TransactionItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Wallet;
