import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const ViewOrders = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [service, setService] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
  
  // Fetch service details and orders
  useEffect(() => {
    const fetchServiceAndOrders = async () => {
      if (!serviceId || !currentUser) {
        navigate('/profile');
        return;
      }
      
      setLoading(true);
      try {
        const db = getFirestore();
        
        // Fetch service details
        const serviceDoc = await getDoc(doc(db, 'services', serviceId));
        
        if (!serviceDoc.exists()) {
          setError('Service not found');
          navigate('/profile');
          return;
        }
        
        const serviceData = serviceDoc.data();
        
        // Verify this service belongs to the current user
        if (serviceData.userId !== currentUser.uid) {
          setError('You do not have permission to view these orders');
          navigate('/profile');
          return;
        }
        
        setService(serviceData);
        
        // Fetch orders for this service
        const ordersQuery = query(
          collection(db, 'orders'),
          where('serviceId', '==', serviceId)
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersList = [];
        
        ordersSnapshot.forEach((doc) => {
          ordersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort orders by time received (newest first)
        ordersList.sort((a, b) => {
          return b.createdAt?.toDate() - a.createdAt?.toDate();
        });
        
        setOrders(ordersList);
        setError('');
      } catch (err) {
        console.error('Error fetching service and orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceAndOrders();
  }, [serviceId, currentUser, navigate]);
  
  const handleOpenPaymentProof = (paymentProofUrl) => {
    setSelectedPaymentProof(paymentProofUrl);
  };
  
  const handleClosePaymentProof = () => {
    setSelectedPaymentProof(null);
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Return to profile page
  const handleBack = () => {
    navigate('/profile');
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack} 
        sx={{ mb: 3 }}
      >
        Back to Profile
      </Button>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Orders for {service?.businessName || 'Your Business'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Showing all customer orders for your WhatsApp Order AI service
            </Typography>
          </Paper>
          
          {orders.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6">No Orders Yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  When customers place orders through your WhatsApp Order AI, they will appear here.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="orders table">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer Phone</TableCell>
                    <TableCell>Product/Service</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Payment Proof</TableCell>
                    <TableCell>Time Received</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {order.customerPhone || 'N/A'}
                      </TableCell>
                      <TableCell>{order.productName || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.paymentStatus || 'Pending'} 
                          color={
                            order.paymentStatus === 'Confirmed' ? 'success' :
                            order.paymentStatus === 'Rejected' ? 'error' : 'warning'
                          } 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {order.paymentProofUrl ? (
                          <Button
                            startIcon={<VisibilityIcon />}
                            size="small"
                            onClick={() => handleOpenPaymentProof(order.paymentProofUrl)}
                          >
                            View Proof
                          </Button>
                        ) : (
                          'No proof provided'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Payment Proof Dialog */}
          <Dialog 
            open={Boolean(selectedPaymentProof)} 
            onClose={handleClosePaymentProof}
            maxWidth="md"
            fullWidth
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={handleClosePaymentProof}>
                <CloseIcon />
              </IconButton>
            </Box>
            <DialogContent>
              {selectedPaymentProof && (
                <Box 
                  component="iframe" 
                  src={selectedPaymentProof} 
                  width="100%" 
                  height="600px" 
                  sx={{ border: 'none' }}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ViewOrders;
