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
  MenuItem
} from '@mui/material';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const FormCustomAi = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get service ID from URL if editing existing service
  const params = new URLSearchParams(location.search);
  const serviceId = params.get('id');
  const isEditing = !!serviceId;
  
  const [formData, setFormData] = useState({
    businessName: '',
    platformType: 'website',
    aiRequirements: '',
    aiTone: 'professional',
    customResponses: '',
    additionalFeatures: ''
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
            platformType: serviceData.platformType || 'website',
            aiRequirements: serviceData.aiRequirements || '',
            aiTone: serviceData.aiTone || 'professional',
            customResponses: serviceData.customResponses || '',
            additionalFeatures: serviceData.additionalFeatures || ''
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
    if (!formData.businessName || !formData.aiRequirements) {
      setError('Please fill in all required fields');
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
        type: 'custom-ai',
        status: isEditing ? undefined : 'pending', // Custom AI starts as pending until approved
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
        setSuccess('Service request submitted successfully. Our team will contact you shortly.');
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
        {isEditing ? 'Edit Custom AI Agent' : 'Request Custom AI Agent'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Tell us about your business needs and we'll create a custom AI solution tailored specifically for you.
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
              <FormControl fullWidth>
                <InputLabel id="platform-type-label">Platform Type</InputLabel>
                <Select
                  labelId="platform-type-label"
                  name="platformType"
                  value={formData.platformType}
                  onChange={handleInputChange}
                  label="Platform Type"
                  disabled={loading}
                >
                  <MenuItem value="website">Website</MenuItem>
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  <MenuItem value="facebook">Facebook</MenuItem>
                  <MenuItem value="telegram">Telegram</MenuItem>
                  <MenuItem value="slack">Slack</MenuItem>
                  <MenuItem value="discord">Discord</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="AI Requirements"
                name="aiRequirements"
                value={formData.aiRequirements}
                onChange={handleInputChange}
                multiline
                rows={5}
                placeholder="Describe what you want your AI agent to do. Be as specific as possible."
                helperText="Describe your business needs, the problems you want to solve, and any specific features you need."
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="ai-tone-label">AI Tone</InputLabel>
                <Select
                  labelId="ai-tone-label"
                  name="aiTone"
                  value={formData.aiTone}
                  onChange={handleInputChange}
                  label="AI Tone"
                  disabled={loading}
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="friendly">Friendly & Casual</MenuItem>
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="humorous">Humorous</MenuItem>
                  <MenuItem value="empathetic">Empathetic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custom Responses"
                name="customResponses"
                value={formData.customResponses}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Examples of specific responses you want your AI to use"
                helperText="Optional: Provide examples of how you want your AI to respond in certain situations"
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Features"
                name="additionalFeatures"
                value={formData.additionalFeatures}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Any other features or integrations you need"
                helperText="Optional: Describe any additional features, integrations, or special requirements"
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
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : isEditing ? (
                'Update Request'
              ) : (
                'Submit Request'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FormCustomAi;
