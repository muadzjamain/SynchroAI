import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Divider,
  Container,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Stack,
  Tooltip,
  Avatar,
  LinearProgress,
  Skeleton,
  AppBar,
  Toolbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter services based on status
  const filteredServices = services.filter(service => {
    if (filterStatus === 'all') return true;
    return service.status === filterStatus;
  });

  // Fetch user services
  useEffect(() => {
    const fetchServices = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const db = getFirestore();
        const q = query(
          collection(db, 'services'),
          where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const servicesList = [];
        
        querySnapshot.forEach((doc) => {
          servicesList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setServices(servicesList);
        setError('');
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load your services');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [currentUser]);

  // Toggle service status (active/paused)
  const toggleServiceStatus = async (serviceId, currentStatus) => {
    setActionLoading(true);
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const db = getFirestore();
      await updateDoc(doc(db, 'services', serviceId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setServices(services.map(service => 
        service.id === serviceId ? { ...service, status: newStatus } : service
      ));
    } catch (err) {
      console.error('Error updating service status:', err);
      setError('Failed to update service status');
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setServiceToDelete(null);
  };

  // Delete service
  const deleteService = async () => {
    if (!serviceToDelete) return;
    
    setActionLoading(true);
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'services', serviceToDelete.id));
      
      // Update local state
      setServices(services.filter(service => service.id !== serviceToDelete.id));
      closeDeleteDialog();
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service');
    } finally {
      setActionLoading(false);
    }
  };

  // Get service icon based on type
  const getServiceIcon = (type) => {
    switch (type) {
      case 'whatsapp-faq':
      case 'whatsapp-order':
        return <WhatsAppIcon />;
      case 'custom-ai':
        return <SmartToyIcon />;
      default:
        return <SmartToyIcon />;
    }
  };

  // Get service name based on type
  const getServiceName = (type) => {
    switch (type) {
      case 'whatsapp-faq':
        return 'WhatsApp FAQ AI';
      case 'whatsapp-order':
        return 'WhatsApp Order AI';
      case 'custom-ai':
        return 'Custom AI Agent';
      default:
        return 'AI Service';
    }
  };

  // Get service price based on type
  const getServicePrice = (type) => {
    switch (type) {
      case 'whatsapp-faq':
        return '$90';
      case 'whatsapp-order':
        return '$125';
      case 'custom-ai':
        return '$199+';
      default:
        return '';
    }
  };

  // Format date with time
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Format the date part: May 15, 2025
    const datePart = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    
    // Format the time part: 3:38pm
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    // Format minutes with leading zero if needed
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    // Combine into final format: May 15, 2025 (3:38pm)
    return `${datePart} (${hours}:${minutesStr}${ampm})`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Modern Header with enhanced UI */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 0, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #21CBF3 100%)',
          color: 'white',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        
        <Box sx={{ 
          p: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          <Box sx={{ mb: { xs: 3, sm: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar 
                src={currentUser?.photoURL} 
                alt={currentUser?.displayName || 'User'}
                sx={{ 
                  width: 48, 
                  height: 48, 
                  mr: 2,
                  border: '2px solid white',
                  bgcolor: 'primary.dark'
                }}
              >
                {(currentUser?.displayName || 'U')[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold" color="white">
                  My Services
                </Typography>
                <Typography variant="subtitle1" color="white" sx={{ opacity: 0.9 }}>
                  Welcome, {currentUser?.displayName || 'User'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', mt: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<SmartToyIcon />}
                sx={{ 
                  borderRadius: 8, 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  backdropFilter: 'blur(10px)',
                  px: 2
                }}
              >
                {services.length} AI {services.length === 1 ? 'Agent' : 'Agents'}
              </Button>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<AccountBalanceWalletIcon />}
                component={RouterLink}
                to="/wallet"
                sx={{ 
                  ml: 2, 
                  borderRadius: 8, 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                  backdropFilter: 'blur(10px)',
                  px: 2
                }}
              >
                Topup Wallet
              </Button>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/"
            sx={{ 
              borderRadius: 30, 
              px: 3, 
              py: 1.2,
              bgcolor: 'white', 
              color: 'primary.main',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              '&:hover': {
                bgcolor: 'white',
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
              }
            }}
          >
            Add New Service
          </Button>
        </Box>
      </Paper>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Filter Tabs - Clean Design */}
      {!loading && services.length > 0 && (
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{ bgcolor: '#f9f9f9' }}
          >
            <Tab 
              label="All Services" 
              onClick={() => setFilterStatus('all')}
              sx={{ py: 1.5 }}
            />
            <Tab 
              label="Active" 
              onClick={() => setFilterStatus('active')}
              sx={{ py: 1.5 }}
            />
            <Tab 
              label="Paused" 
              onClick={() => setFilterStatus('paused')}
              sx={{ py: 1.5 }}
            />
          </Tabs>
        </Paper>
      )}
      
      {/* Services Section */}
      <Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredServices.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
            <SmartToyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {services.length === 0 ? "You don't have any services yet" : "No services match the current filter"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              {services.length === 0 
                ? "Get started by adding your first AI service to automate your business operations"
                : "Try changing the filter to see other services"}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredServices.map((service) => (
              <Grid item xs={12} sm={6} key={service.id}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease',
                    border: '1px solid #f0f0f0',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    {/* Service Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            mr: 2, 
                            color: 'white',
                            bgcolor: service.type.includes('whatsapp') ? '#25D366' : 'primary.main',
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {getServiceIcon(service.type)}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight="medium" noWrap>
                            {service.businessName || 'Your Business'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getServiceName(service.type)}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={service.status === 'active' ? 'Active' : 'Paused'} 
                        color={service.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ 
                          fontWeight: 'medium', 
                          borderRadius: 16,
                          px: 1
                        }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Service Info */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body1" color="text.primary" fontWeight="medium">
                          {formatDate(service.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body1" color="primary.main" fontWeight="bold">
                          ${getServicePrice(service.type).replace('$', '')}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {/* Action Buttons - Styled like the first image */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button
                        variant="outlined"
                        color={service.status === 'active' ? 'warning' : 'success'}
                        onClick={() => toggleServiceStatus(service.id, service.status)}
                        disabled={actionLoading}
                        startIcon={service.status === 'active' ? <PauseCircleIcon /> : <PlayCircleIcon />}
                        sx={{ 
                          borderRadius: 30,
                          px: 3,
                          border: service.status === 'active' ? '1px solid #ed6c02' : '1px solid #2e7d32',
                          color: service.status === 'active' ? '#ed6c02' : '#2e7d32'
                        }}
                      >
                        {service.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                      
                      <Box>
                        {/* Only show View Orders button for WhatsApp Order AI service */}
                        {service.type === 'whatsapp-order' && (
                          <Button
                            variant="outlined"
                            color="info"
                            component={RouterLink}
                            to={`/view-orders/${service.id}`}
                            startIcon={<ShoppingBagIcon />}
                            sx={{ 
                              mr: 1, 
                              borderRadius: 30,
                              px: 3,
                              borderColor: '#0288d1',
                              color: '#0288d1'
                            }}
                          >
                            Orders
                          </Button>
                        )}
                        
                        <Button
                          variant="outlined"
                          color="primary"
                          component={RouterLink}
                          to={`/form-${service.type}?id=${service.id}`}
                          startIcon={<EditIcon />}
                          sx={{ 
                            mr: 1, 
                            borderRadius: 30,
                            px: 3,
                            borderColor: '#1976d2',
                            color: '#1976d2'
                          }}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => openDeleteDialog(service)}
                          disabled={actionLoading}
                          startIcon={<DeleteIcon />}
                          sx={{ 
                            borderRadius: 30,
                            px: 3,
                            borderColor: '#d32f2f',
                            color: '#d32f2f'
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
          {"Delete Service?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this service? This action cannot be undone.
            {serviceToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="body1" component="div" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                  {getServiceName(serviceToDelete.type)} - {serviceToDelete.businessName || 'Your Business'}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeDeleteDialog} 
            disabled={actionLoading}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={deleteService} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
            autoFocus
            sx={{ borderRadius: 2, px: 3 }}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
