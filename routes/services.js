const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const axios = require('axios');

// Service form pages - protected by authentication
router.get('/:serviceType', checkAuth, (req, res) => {
  const { serviceType } = req.params;
  
  // Validate service type
  const validServices = ['whatsapp-faq', 'whatsapp-order', 'custom-ai'];
  if (!validServices.includes(serviceType)) {
    req.flash('error', 'Invalid service type');
    return res.redirect('/');
  }
  
  // Render appropriate form based on service type
  let title, formFields;
  
  switch (serviceType) {
    case 'whatsapp-faq':
      title = 'WhatsApp FAQ AI Agent Setup';
      formFields = [
        { name: 'businessName', label: 'Business Name', type: 'text', required: true },
        { name: 'whatsappNumber', label: 'WhatsApp Business Number', type: 'text', required: true },
        { name: 'faqItems', label: 'FAQ Items', type: 'faq-editor', required: true }
      ];
      break;
    case 'whatsapp-order':
      title = 'WhatsApp Order AI Agent Setup';
      formFields = [
        { name: 'businessName', label: 'Business Name', type: 'text', required: true },
        { name: 'whatsappNumber', label: 'WhatsApp Business Number', type: 'text', required: true },
        { name: 'paymentMethods', label: 'Payment Methods', type: 'checkbox-group', options: ['Bank Transfer', 'Cash on Delivery', 'E-wallet'], required: true },
        { name: 'paymentVerification', label: 'Payment Verification Rules', type: 'textarea', required: true },
        { name: 'orderTracking', label: 'Order Tracking Settings', type: 'textarea', required: true }
      ];
      break;
    case 'custom-ai':
      title = 'Custom AI Agent Setup';
      formFields = [
        { name: 'businessName', label: 'Business Name', type: 'text', required: true },
        { name: 'platformType', label: 'Platform Type', type: 'select', options: ['WhatsApp', 'Website Chat', 'Email', 'SMS', 'Other'], required: true },
        { name: 'aiRequirements', label: 'AI Requirements', type: 'textarea', required: true },
        { name: 'aiTone', label: 'AI Tone', type: 'select', options: ['Professional', 'Friendly', 'Casual', 'Formal'], required: true },
        { name: 'customResponses', label: 'Custom Response Examples', type: 'textarea', required: true },
        { name: 'additionalFeatures', label: 'Additional Features', type: 'textarea', required: false }
      ];
      break;
  }
  
  res.render('services/form', { 
    title,
    serviceType,
    formFields
  });
});

// Handle form submission
router.post('/:serviceType/submit', checkAuth, async (req, res) => {
  const { serviceType } = req.params;
  const formData = req.body;
  
  try {
    // Store form data in session for payment process
    req.session.pendingService = {
      serviceType,
      formData,
      timestamp: new Date().toISOString()
    };
    
    // Redirect to confirmation page
    res.redirect(`/services/${serviceType}/confirm`);
  } catch (error) {
    console.error('Form submission error:', error);
    req.flash('error', 'Failed to process your form. Please try again.');
    res.redirect(`/services/${serviceType}`);
  }
});

// Confirmation page
router.get('/:serviceType/confirm', checkAuth, (req, res) => {
  const { serviceType } = req.params;
  const pendingService = req.session.pendingService;
  
  // Check if there's pending service data
  if (!pendingService || pendingService.serviceType !== serviceType) {
    req.flash('error', 'No pending service data found');
    return res.redirect(`/services/${serviceType}`);
  }
  
  // Get service name based on type
  let serviceName;
  switch (serviceType) {
    case 'whatsapp-faq':
      serviceName = 'WhatsApp FAQ AI Agent';
      break;
    case 'whatsapp-order':
      serviceName = 'WhatsApp Order AI Agent';
      break;
    case 'custom-ai':
      serviceName = 'Custom AI Agent';
      break;
    default:
      serviceName = 'AI Service';
  }
  
  res.render('services/confirm', {
    title: 'Confirm Your Order',
    serviceType,
    serviceName,
    formData: pendingService.formData
  });
});

// Process form data and send to n8n
router.post('/:serviceType/process', checkAuth, async (req, res) => {
  const { serviceType } = req.params;
  const pendingService = req.session.pendingService;
  
  // Check if there's pending service data
  if (!pendingService || pendingService.serviceType !== serviceType) {
    req.flash('error', 'No pending service data found');
    return res.redirect(`/services/${serviceType}`);
  }
  
  try {
    // Send data to n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      throw new Error('N8N webhook URL not configured');
    }
    
    // Prepare data for n8n
    const n8nData = {
      userId: req.session.user.uid,
      userEmail: req.session.user.email,
      serviceType,
      formData: pendingService.formData,
      timestamp: pendingService.timestamp
    };
    
    // Send data to n8n
    await axios.post(n8nWebhookUrl, n8nData);
    
    // Redirect to payment page
    res.redirect(`/payment/${serviceType}`);
  } catch (error) {
    console.error('n8n integration error:', error);
    req.flash('error', 'Failed to process your request. Please try again.');
    res.redirect(`/services/${serviceType}/confirm`);
  }
});

module.exports = router;
