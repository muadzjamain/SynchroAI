import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const FormWhatsappOrder = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get service ID from URL if editing existing service
  const params = new URLSearchParams(location.search);
  const serviceId = params.get('id');
  const isEditing = !!serviceId;
  
  const [formData, setFormData] = useState({
    businessName: '',
    whatsappNumber: '',
    email: '',
    faqFile: null,
    catalogFile: null
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  

  
  // Fetch service data if editing
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId || !currentUser) return;
      
      try {
        const db = getFirestore();
        const serviceDoc = await getDoc(doc(db, 'services', serviceId));
        
        if (serviceDoc.exists()) {
          const serviceData = serviceDoc.data();
          
          // Verify this service belongs to the current user
          if (serviceData.userId !== currentUser.uid) {
            setError('You do not have permission to edit this service');
            navigate('/profile');
            return;
          }
          
          // Set form data
          setFormData({
            businessName: serviceData.businessName || '',
            whatsappNumber: serviceData.whatsappNumber || '',
            paymentMethods: serviceData.paymentMethods || [],
            paymentVerification: serviceData.paymentVerification || 'manual',
            orderTracking: serviceData.orderTracking || 'manual',
            welcomeMessage: serviceData.welcomeMessage || '',
            productCatalog: serviceData.productCatalog || []
          });
        } else {
          setError('Service not found');
          navigate('/profile');
        }
      } catch (err) {
        console.error('Error fetching service data:', err);
        setError('Failed to load service data');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchServiceData();
  }, [serviceId, currentUser, navigate]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  

  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.businessName || !formData.whatsappNumber || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate file uploads
    if (!formData.faqFile) {
      setError('Please upload your FAQ & Company Overview file');
      return;
    }
    
    if (!formData.catalogFile) {
      setError('Please upload your Product/Services Catalogue file');
      return;
    }
    
    // Validate file types
    const allowedFileTypes = ['.pdf', '.xls', '.xlsx', '.csv'];
    
    const faqExtension = formData.faqFile.name.substring(formData.faqFile.name.lastIndexOf('.'));
    if (!allowedFileTypes.includes(faqExtension.toLowerCase())) {
      setError('Please upload only PDF or Excel files for FAQ & Company Overview');
      return;
    }
    
    const catalogExtension = formData.catalogFile.name.substring(formData.catalogFile.name.lastIndexOf('.'));
    if (!allowedFileTypes.includes(catalogExtension.toLowerCase())) {
      setError('Please upload only PDF or Excel files for Product/Services Catalogue');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const db = getFirestore();
      const serviceData = {
        ...formData,
        userId: currentUser.uid,
        type: 'whatsapp-order',
        status: isEditing ? undefined : 'active', // Keep existing status if editing
        updatedAt: new Date()
      };
      
      if (isEditing) {
        // Update existing service
        await updateDoc(doc(db, 'services', serviceId), serviceData);
        setSuccess('Service updated successfully');
      } else {
        // Create new service
        const newServiceRef = doc(collection(db, 'services'));
        serviceData.createdAt = new Date();
        await setDoc(newServiceRef, serviceData);
        setSuccess('Service created successfully');
      }
      
      // Redirect to profile after short delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Failed to save service');
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        {isEditing ? 'Edit WhatsApp Order AI' : 'Create WhatsApp Order AI'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Set up an AI agent that will process orders and handle payments through WhatsApp.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="WhatsApp Business Number"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleInputChange}
                placeholder="+1234567890"
                helperText="Include country code (e.g., +1 for US)"
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ py: 1.5, textAlign: 'left', justifyContent: 'flex-start' }}
                disabled={loading}
              >
                FAQ & Company Overview (PDF or Excel)
                <input
                  type="file"
                  hidden
                  accept=".pdf,.xls,.xlsx,.csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData(prev => ({
                        ...prev,
                        faqFile: e.target.files[0]
                      }));
                    }
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                {formData.faqFile ? `Selected file: ${formData.faqFile.name}` : 'Upload your PDF or Excel file containing FAQs and company information'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ py: 1.5, textAlign: 'left', justifyContent: 'flex-start' }}
                disabled={loading}
              >
                Product/Services Catalogue (PDF or Excel)
                <input
                  type="file"
                  hidden
                  accept=".pdf,.xls,.xlsx,.csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData(prev => ({
                        ...prev,
                        catalogFile: e.target.files[0]
                      }));
                    }
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                {formData.catalogFile ? `Selected file: ${formData.catalogFile.name}` : 'Upload your PDF or Excel file containing your products or services catalogue'}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/profile')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : isEditing ? (
                'Update Service'
              ) : (
                'Create Service'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FormWhatsappOrder;
