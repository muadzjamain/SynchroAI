import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

const FormWhatsappFaq = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get service ID from URL if editing existing service
  const params = new URLSearchParams(location.search);
  const serviceId = params.get('id');
  const isEditing = !!serviceId;
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    whatsappNumber: '',
    businessWebsite: '',
    aiRole: '',
    aiTone: 'Professional',
    catalogFile: null,
    faqFile: null,
    businessHours: '',
    paymentProcessing: 'stripe',
    receiveEmails: 'yes'
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
            welcomeMessage: serviceData.welcomeMessage || '',
            faqItems: serviceData.faqItems || [{ question: '', answer: '' }]
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
    
    // Validation for required fields
    if (!formData.businessName || !formData.whatsappNumber || !formData.email || !formData.aiRole) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate Product/Service Catalogue upload
    if (!formData.catalogFile) {
      setError('Please upload your Product/Service Catalogue');
      return;
    }
    
    // Validate FAQ file upload
    if (!formData.faqFile) {
      setError('Please upload your FAQ Knowledge Base file');
      return;
    }
    
    // Validate FAQ file type
    const allowedFileTypes = ['.pdf', '.xls', '.xlsx', '.csv'];
    const faqFileExtension = formData.faqFile.name.substring(formData.faqFile.name.lastIndexOf('.'));
    if (!allowedFileTypes.includes(faqFileExtension.toLowerCase())) {
      setError('Please upload only PDF or Excel files for FAQ Knowledge Base');
      return;
    }
    
    // Validate Product/Service Catalogue file type if provided
    if (formData.catalogFile) {
      const catalogFileExtension = formData.catalogFile.name.substring(formData.catalogFile.name.lastIndexOf('.'));
      if (!allowedFileTypes.includes(catalogFileExtension.toLowerCase())) {
        setError('Please upload only PDF or Excel files for Product/Service Catalogue');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const db = getFirestore();
      const storage = getStorage();
      
      // Create a copy of form data without the file objects
      const serviceData = {
        businessName: formData.businessName,
        email: formData.email,
        whatsappNumber: formData.whatsappNumber,
        businessWebsite: formData.businessWebsite,
        aiRole: formData.aiRole,
        aiTone: formData.aiTone,
        businessHours: formData.businessHours,
        paymentProcessing: formData.paymentProcessing,
        receiveEmails: formData.receiveEmails,
        userId: currentUser.uid,
        type: 'whatsapp-faq',
        status: isEditing ? undefined : 'active', // Keep existing status if editing
        updatedAt: new Date()
      };
      
      let docRef;
      if (isEditing) {
        docRef = doc(db, 'services', serviceId);
      } else {
        docRef = doc(collection(db, 'services'));
        serviceData.createdAt = new Date();
      }
      
      // Upload catalog file to Firebase Storage
      if (formData.catalogFile) {
        const catalogFileRef = ref(storage, `services/${docRef.id}/catalog-${Date.now()}-${formData.catalogFile.name}`);
        await uploadBytes(catalogFileRef, formData.catalogFile);
        const catalogFileUrl = await getDownloadURL(catalogFileRef);
        
        // Store file metadata instead of the File object
        serviceData.catalogFileInfo = {
          name: formData.catalogFile.name,
          type: formData.catalogFile.type,
          size: formData.catalogFile.size,
          url: catalogFileUrl,
          uploadedAt: new Date()
        };
      }
      
      // Upload FAQ file to Firebase Storage
      if (formData.faqFile) {
        const faqFileRef = ref(storage, `services/${docRef.id}/faq-${Date.now()}-${formData.faqFile.name}`);
        await uploadBytes(faqFileRef, formData.faqFile);
        const faqFileUrl = await getDownloadURL(faqFileRef);
        
        // Store file metadata instead of the File object
        serviceData.faqFileInfo = {
          name: formData.faqFile.name,
          type: formData.faqFile.type,
          size: formData.faqFile.size,
          url: faqFileUrl,
          uploadedAt: new Date()
        };
      }
      
      if (isEditing) {
        // Update existing service
        await updateDoc(docRef, serviceData);
        setSuccess('Service updated successfully');
      } else {
        // Create new service
        await setDoc(docRef, serviceData);
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
        {isEditing ? 'Edit WhatsApp FAQ AI' : 'Create WhatsApp FAQ AI'}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Set up an AI agent that will automatically answer frequently asked questions through WhatsApp.
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
            {/* Business Name */}
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
            
            {/* Email */}
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

            {/* WhatsApp Business Number */}
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
            
            {/* Business Website */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Website / Online Store Link"
                name="businessWebsite"
                value={formData.businessWebsite}
                onChange={handleInputChange}
                placeholder="https://your-store.com or your Shopee/Alibaba link"
                helperText="Optional: Your official website or online marketplace"
                disabled={loading}
              />
            </Grid>
            
            {/* Role of AI Agent */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Role of AI Agent"
                name="aiRole"
                value={formData.aiRole}
                onChange={handleInputChange}
                placeholder="Restaurant owner / gadget seller / print shop owner"
                helperText="Define what type of business the AI agent will represent"
                disabled={loading}
              />
            </Grid>
            
            {/* AI Tone */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="ai-tone-label">Tone</InputLabel>
                <Select
                  labelId="ai-tone-label"
                  name="aiTone"
                  value={formData.aiTone}
                  onChange={handleInputChange}
                  label="Tone"
                  disabled={loading}
                >
                  <MenuItem value="Formal">Formal</MenuItem>
                  <MenuItem value="Cheerful">Cheerful</MenuItem>
                  <MenuItem value="Casual">Casual</MenuItem>
                  <MenuItem value="Professional">Professional</MenuItem>
                  <MenuItem value="Friendly">Friendly</MenuItem>
                </Select>
                <FormHelperText>Select the tone of voice for your AI assistant</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Product/Service Catalogue Upload */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ py: 1.5, textAlign: 'left', justifyContent: 'flex-start' }}
                disabled={loading}
              >
                Product/Service Catalogue (PDF or Excel)
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
                {formData.catalogFile ? `Selected file: ${formData.catalogFile.name}` : 'Required: Upload your product/service catalogue'}
              </Typography>
            </Grid>
            
            {/* FAQ Knowledge Base Upload */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ py: 1.5, textAlign: 'left', justifyContent: 'flex-start' }}
                disabled={loading}
              >
                FAQ Knowledge Base (PDF or Excel)
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
                {formData.faqFile ? `Selected file: ${formData.faqFile.name}` : 'Required: Upload your FAQs and company information'}
              </Typography>
            </Grid>
            
            {/* Business Hours */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Hours"
                name="businessHours"
                value={formData.businessHours}
                onChange={handleInputChange}
                placeholder="Mon-Fri: 9AM-5PM, Sat: 10AM-3PM, Sun: Closed"
                helperText="Optional: The AI will inform customers when your business is available"
                disabled={loading}
              />
            </Grid>
            
            {/* Agent Payment Processing */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="payment-processing-label">Agent Payment Processing</InputLabel>
                <Select
                  labelId="payment-processing-label"
                  name="paymentProcessing"
                  value={formData.paymentProcessing}
                  onChange={handleInputChange}
                  label="Agent Payment Processing"
                  disabled={loading}
                >
                  <MenuItem value="stripe">Stripe</MenuItem>
                  <MenuItem value="wallet">SynchroAI Wallet</MenuItem>
                </Select>
                <FormHelperText>Choose how you want to process payments</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Receive Emails for Questions */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="receive-emails-label">Receive Email for Each Question?</InputLabel>
                <Select
                  labelId="receive-emails-label"
                  name="receiveEmails"
                  value={formData.receiveEmails}
                  onChange={handleInputChange}
                  label="Receive Email for Each Question?"
                  disabled={loading}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
                <FormHelperText>Choose if you want to receive an email notification for each question</FormHelperText>
              </FormControl>
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

export default FormWhatsappFaq;
