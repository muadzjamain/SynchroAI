import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
// No need for date picker imports
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const FormCustomAi = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser && !location.pathname.includes('login')) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [currentUser, navigate, location]);
  
  // Form state
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
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Load service data if editing
  useEffect(() => {
    const loadService = async () => {
      if (serviceId && currentUser) {
        try {
          setLoading(true);
          const db = getFirestore();
          const serviceRef = doc(db, 'users', currentUser.uid, 'services', serviceId);
          const serviceSnap = await getDoc(serviceRef);
          
          if (serviceSnap.exists()) {
            const serviceData = serviceSnap.data();
            setFormData(serviceData);
          } else {
            setError('Service not found');
            setTimeout(() => navigate('/profile'), 2000);
          }
        } catch (err) {
          console.error('Error loading service:', err);
          setError('Error loading service data');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadService();
  }, [serviceId, currentUser, navigate]);
  
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
      // First, save to Firestore
      const db = getFirestore();
      const userServicesRef = collection(db, 'users', currentUser.uid, 'services');
      
      const serviceData = {
        ...formData,
        type: 'custom-ai',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      let firestoreSuccess = true;
      
      if (serviceId) {
        // Update existing service
        const serviceRef = doc(db, 'users', currentUser.uid, 'services', serviceId);
        await updateDoc(serviceRef, {
          ...serviceData,
          updatedAt: new Date()
        });
      } else {
        // Create new service
        await setDoc(doc(userServicesRef), serviceData);
      }
      
      // Then, send emails with Google Meet link
      try {
        const response = await fetch('/api/custom-ai-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send emails');
        }
        
        // Show success message with Google Meet link and calendar info
        setSuccess(`Service created successfully! A confirmation email has been sent to ${formData.email} with your Google Meet link for the consultation. This meeting has also been added to your Google Calendar.`);
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        // Still show success for Firestore save, but mention email issue
        setSuccess('Service created successfully, but there was an issue sending the confirmation email. Our team will contact you shortly.');
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
      }, 3000); // Longer delay to ensure user sees the success message with Google Meet info
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
                  multiline
                  rows={4}
                  label="Describe what you want the AI agent to do"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  placeholder="Please provide as much detail as possible about your requirements..."
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : serviceId ? 'Update Service' : 'Submit Request'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default FormCustomAi;