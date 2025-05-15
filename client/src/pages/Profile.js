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
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Services
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/"
          sx={{ borderRadius: 2 }}
        >
          Add New Service
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : services.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              You don't have any services yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Get started by adding your first AI service
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={RouterLink}
              to="/"
              sx={{ mt: 2 }}
            >
              Browse Services
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid item xs={12} md={6} key={service.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        mr: 2, 
                        bgcolor: 'primary.light', 
                        color: 'white', 
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getServiceIcon(service.type)}
                      </Box>
                      <Box>
                        <Typography variant="h6" component="div">
                          {getServiceName(service.type)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {service.businessName || 'Your Business'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={service.status === 'active' ? 'Active' : 'Paused'} 
                      color={service.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(service.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Price
                      </Typography>
                      <Typography variant="body1" color="primary.main" fontWeight="medium">
                        {getServicePrice(service.type)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      color={service.status === 'active' ? 'warning' : 'success'}
                      onClick={() => toggleServiceStatus(service.id, service.status)}
                      disabled={actionLoading}
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
                          sx={{ mr: 1 }}
                        >
                          View Orders
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="primary"
                        component={RouterLink}
                        to={`/form-${service.type}?id=${service.id}`}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => openDeleteDialog(service)}
                        disabled={actionLoading}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Service?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this service? This action cannot be undone.
            {serviceToDelete && (
              <Typography variant="body1" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
                {getServiceName(serviceToDelete.type)} - {serviceToDelete.businessName || 'Your Business'}
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={deleteService} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
            autoFocus
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
