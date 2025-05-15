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
  MenuItem,
  FormHelperText
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
    email: '',
    whatsappNumber: '',
    businessWebsite: '',
    aiRole: '',
    aiTone: 'Professional',
    catalogFile: null,
    faqFile: null,
    businessHours: '',
    paymentProcessing: 'stripe',
    paymentMethods: [],
    receiveEmails: 'yes',
    qrCodeImage: null,
    bankName: '',
    accountNumber: '',
    accountHolderName: ''
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
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle payment method checkbox changes
  const handlePaymentMethodChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      // Limit to 3 payment methods
      if (formData.paymentMethods.length < 3) {
        setFormData(prev => ({
          ...prev,
          paymentMethods: [...prev.paymentMethods, value]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        paymentMethods: prev.paymentMethods.filter(method => method !== value)
      }));
    }
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
    
    // Validate file uploads
    if (!formData.faqFile) {
      setError('Please upload your FAQ Knowledge Base file');
      return;
    }
    
    if (!formData.catalogFile) {
      setError('Please upload your Product/Service Catalogue file');
      return;
    }
    
    // Validate file types
    const allowedFileTypes = ['.pdf', '.xls', '.xlsx', '.csv'];
    
    const faqExtension = formData.faqFile.name.substring(formData.faqFile.name.lastIndexOf('.'));
    if (!allowedFileTypes.includes(faqExtension.toLowerCase())) {
      setError('Please upload only PDF or Excel files for FAQ Knowledge Base');
      return;
    }
    
    const catalogExtension = formData.catalogFile.name.substring(formData.catalogFile.name.lastIndexOf('.'));
    if (!allowedFileTypes.includes(catalogExtension.toLowerCase())) {
      setError('Please upload only PDF or Excel files for Product/Service Catalogue');
      return;
    }
    
    // Validate payment methods (at least one must be selected)
    if (formData.paymentMethods.length === 0) {
      setError('Please select at least one payment method to offer customers');
      return;
    }
    
    // Validate QR code image if QR payment method is selected
    if (formData.paymentMethods.includes('qr') && !formData.qrCodeImage) {
      setError('Please upload your QR code image');
      return;
    }
    
    // Validate bank transfer details if bank transfer payment method is selected
    if (formData.paymentMethods.includes('bank')) {
      if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName) {
        setError('Please fill in all bank transfer details');
        return;
      }
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
            
            {/* Product/Service Catalogue */}
            <Grid item xs={12} md={6}>
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
            
            {/* FAQ Knowledge Base */}
            <Grid item xs={12} md={6}>
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
            
            {/* Receive Emails for Orders */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="receive-emails-label">Receive Email for Each Order?</InputLabel>
                <Select
                  labelId="receive-emails-label"
                  name="receiveEmails"
                  value={formData.receiveEmails}
                  onChange={handleInputChange}
                  label="Receive Email for Each Order?"
                  disabled={loading}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
                <FormHelperText>Choose if you want to receive an email notification for each order</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Payment Methods */}
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth required>
                <FormLabel component="legend">Payment Methods to Offer Customers (select up to 3)</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.paymentMethods.includes('qr')}
                        onChange={handlePaymentMethodChange}
                        value="qr"
                        disabled={loading}
                      />
                    }
                    label="QR Image"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.paymentMethods.includes('bank')}
                        onChange={handlePaymentMethodChange}
                        value="bank"
                        disabled={loading}
                      />
                    }
                    label="Bank Transfer"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.paymentMethods.includes('cod')}
                        onChange={handlePaymentMethodChange}
                        value="cod"
                        disabled={loading}
                      />
                    }
                    label="Cash on Delivery (COD)"
                  />
                </FormGroup>
                <FormHelperText>Select which payment methods you want to offer to your customers</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Conditional QR Code Upload */}
            {formData.paymentMethods.includes('qr') && (
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ py: 1.5, textAlign: 'left', justifyContent: 'flex-start' }}
                  disabled={loading}
                >
                  Upload QR Code Image
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData(prev => ({
                          ...prev,
                          qrCodeImage: e.target.files[0]
                        }));
                      }
                    }}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {formData.qrCodeImage ? `Selected file: ${formData.qrCodeImage.name}` : 'Upload your payment QR code image (JPG, JPEG, PNG)'}
                </Typography>
              </Grid>
            )}
            
            {/* Conditional Bank Transfer Details */}
            {formData.paymentMethods.includes('bank') && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., HSBC, Citibank"
                    disabled={loading}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Your bank account number"
                    disabled={loading}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Name on the bank account"
                    disabled={loading}
                    required
                  />
                </Grid>
              </>
            )}
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
