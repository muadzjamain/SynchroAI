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
  InputLabel,
  Select,
  MenuItem,
  Container
} from '@mui/material';
// No need for date picker imports
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const FormCustomAi = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [serviceId, setServiceId] = useState(null);
  
  // Check if user is logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
    }
    
    // Check if editing existing service
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setServiceId(id);
    }
  }, [currentUser, navigate, location]);
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    businessNumber: '',
    meetingDate: '',
    meetingTime: '',
    requirements: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch service data if editing
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId || !currentUser) return;
      
      try {
        const db = getFirestore();
        const serviceDoc = doc(db, 'users', currentUser.uid, 'services', serviceId);
        const serviceSnapshot = await getDoc(serviceDoc);
        
        if (serviceSnapshot.exists()) {
          const serviceData = serviceSnapshot.data();
          
          // Set form data
          setFormData({
            businessName: serviceData.businessName || '',
            email: serviceData.email || '',
            businessNumber: serviceData.businessNumber || '',
            meetingDate: serviceData.meetingDate || '',
            meetingTime: serviceData.meetingTime || '',
            requirements: serviceData.requirements || ''
          });
        } else {
          setError('Service not found');
        }
      } catch (err) {
        console.error('Error fetching service:', err);
        setError('Failed to load service data');
      }
    };
    
    fetchServiceData();
  }, [serviceId, currentUser]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // No longer needed with regular text fields
  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.businessName || !formData.email || !formData.businessNumber || !formData.meetingDate || !formData.meetingTime || !formData.requirements) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // First, save the service data to Firestore
      const db = getFirestore();
      const userServicesRef = collection(db, 'users', currentUser.uid, 'services');
      
      const serviceData = {
        ...formData,
        type: 'custom-ai',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      let serviceRef;
      
      if (serviceId) {
        // Update existing service
        serviceRef = doc(db, 'users', currentUser.uid, 'services', serviceId);
        await updateDoc(serviceRef, {
          ...serviceData,
          updatedAt: new Date()
        });
      } else {
        // Create new service
        serviceRef = doc(userServicesRef);
        await setDoc(serviceRef, serviceData);
      }
      
      // Then, send the Google Meet link to the user's email
      try {
        const response = await fetch('/api/send-meet-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send Google Meet link');
        }
        
        // Update the service with the meet link
        await updateDoc(serviceRef, {
          meetLink: data.meetLink,
          updatedAt: new Date()
        });
        
        setSuccess('Service created successfully! A Google Meet link has been sent to your email.');
      } catch (emailError) {
        console.error('Error sending Google Meet link:', emailError);
        // Still show success even if email fails, but with a different message
        setSuccess('Service created successfully! We will contact you shortly with meeting details.');
      }
      
      // Reset form after successful submission
      if (!serviceId) {
        setFormData({
          businessName: '',
          email: '',
          businessNumber: '',
          meetingDate: '',
          meetingTime: '',
          requirements: ''
        });
      }
      
      // Redirect to profile after a delay
      setTimeout(() => {
        navigate('/profile');
      }, 3000); // Increased to 3 seconds to give users time to read the success message
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ py: 5 }}>
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom>
          {serviceId ? 'Edit Custom AI Agent' : 'Create Custom AI Agent'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Tell us what you need, and we'll create a fully customized AI solution for your business.
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        
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
                <TextField
                  fullWidth
                  required
                  label="Business Number"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  helperText="Include country code (e.g., +1 for US)"
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Meeting Date"
                  name="meetingDate"
                  type="date"
                  value={formData.meetingDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Select a date for your consultation call"
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Meeting Time"
                  name="meetingTime"
                  type="time"
                  value={formData.meetingTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Select a time for your consultation call"
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Describe what you want the AI agent to do"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  multiline
                  rows={6}
                  placeholder="Please provide details about your business needs and how you'd like the AI agent to help (e.g., customer support, order processing, appointment scheduling, etc.)"
                  disabled={loading}
                />
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
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {serviceId ? 'Update' : 'Submit'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default FormCustomAi;
