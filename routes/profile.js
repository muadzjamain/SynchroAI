const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const { db } = require('../config/firebase');
const { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} = require('firebase/firestore');
const axios = require('axios');

// Profile page - display user's AI services
router.get('/', checkAuth, async (req, res) => {
  try {
    // Get user's services from Firestore
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, where('userId', '==', req.session.user.uid));
    const querySnapshot = await getDocs(q);
    
    // Format services data
    const services = [];
    querySnapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    res.render('profile/index', {
      title: 'My Profile - SynchroAI',
      user: req.session.user,
      services
    });
  } catch (error) {
    console.error('Error fetching profile data:', error);
    req.flash('error', 'Failed to load profile data');
    res.render('profile/index', {
      title: 'My Profile - SynchroAI',
      user: req.session.user,
      services: []
    });
  }
});

// View service details
router.get('/service/:serviceId', checkAuth, async (req, res) => {
  const { serviceId } = req.params;
  
  try {
    // Get service details from Firestore
    const serviceRef = doc(db, 'services', serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      req.flash('error', 'Service not found');
      return res.redirect('/profile');
    }
    
    // Check if service belongs to user
    const serviceData = serviceDoc.data();
    if (serviceData.userId !== req.session.user.uid) {
      req.flash('error', 'Unauthorized access');
      return res.redirect('/profile');
    }
    
    res.render('profile/service-details', {
      title: `${serviceData.serviceName} Details - SynchroAI`,
      service: {
        id: serviceId,
        ...serviceData,
        createdAt: serviceData.createdAt?.toDate() || new Date(),
        updatedAt: serviceData.updatedAt?.toDate() || new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching service details:', error);
    req.flash('error', 'Failed to load service details');
    res.redirect('/profile');
  }
});

// Update service form
router.get('/service/:serviceId/update', checkAuth, async (req, res) => {
  const { serviceId } = req.params;
  
  try {
    // Get service details from Firestore
    const serviceRef = doc(db, 'services', serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      req.flash('error', 'Service not found');
      return res.redirect('/profile');
    }
    
    // Check if service belongs to user
    const serviceData = serviceDoc.data();
    if (serviceData.userId !== req.session.user.uid) {
      req.flash('error', 'Unauthorized access');
      return res.redirect('/profile');
    }
    
    // Determine form fields based on service type
    let formFields;
    switch (serviceData.serviceType) {
      case 'whatsapp-faq':
        formFields = [
          { name: 'businessName', label: 'Business Name', type: 'text', required: true, value: serviceData.formData.businessName },
          { name: 'whatsappNumber', label: 'WhatsApp Business Number', type: 'text', required: true, value: serviceData.formData.whatsappNumber },
          { name: 'faqItems', label: 'FAQ Items', type: 'faq-editor', required: true, value: serviceData.formData.faqItems }
        ];
        break;
      case 'whatsapp-order':
        formFields = [
          { name: 'businessName', label: 'Business Name', type: 'text', required: true, value: serviceData.formData.businessName },
          { name: 'whatsappNumber', label: 'WhatsApp Business Number', type: 'text', required: true, value: serviceData.formData.whatsappNumber },
          { name: 'paymentMethods', label: 'Payment Methods', type: 'checkbox-group', options: ['Bank Transfer', 'Cash on Delivery', 'E-wallet'], required: true, value: serviceData.formData.paymentMethods },
          { name: 'paymentVerification', label: 'Payment Verification Rules', type: 'textarea', required: true, value: serviceData.formData.paymentVerification },
          { name: 'orderTracking', label: 'Order Tracking Settings', type: 'textarea', required: true, value: serviceData.formData.orderTracking }
        ];
        break;
      case 'custom-ai':
        formFields = [
          { name: 'businessName', label: 'Business Name', type: 'text', required: true, value: serviceData.formData.businessName },
          { name: 'platformType', label: 'Platform Type', type: 'select', options: ['WhatsApp', 'Website Chat', 'Email', 'SMS', 'Other'], required: true, value: serviceData.formData.platformType },
          { name: 'aiRequirements', label: 'AI Requirements', type: 'textarea', required: true, value: serviceData.formData.aiRequirements },
          { name: 'aiTone', label: 'AI Tone', type: 'select', options: ['Professional', 'Friendly', 'Casual', 'Formal'], required: true, value: serviceData.formData.aiTone },
          { name: 'customResponses', label: 'Custom Response Examples', type: 'textarea', required: true, value: serviceData.formData.customResponses },
          { name: 'additionalFeatures', label: 'Additional Features', type: 'textarea', required: false, value: serviceData.formData.additionalFeatures }
        ];
        break;
      default:
        formFields = [];
    }
    
    res.render('profile/update-service', {
      title: `Update ${serviceData.serviceName} - SynchroAI`,
      service: {
        id: serviceId,
        ...serviceData
      },
      formFields
    });
  } catch (error) {
    console.error('Error fetching service for update:', error);
    req.flash('error', 'Failed to load service data');
    res.redirect('/profile');
  }
});

// Process service update
router.post('/service/:serviceId/update', checkAuth, async (req, res) => {
  const { serviceId } = req.params;
  const formData = req.body;
  
  try {
    // Get service details from Firestore
    const serviceRef = doc(db, 'services', serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      req.flash('error', 'Service not found');
      return res.redirect('/profile');
    }
    
    // Check if service belongs to user
    const serviceData = serviceDoc.data();
    if (serviceData.userId !== req.session.user.uid) {
      req.flash('error', 'Unauthorized access');
      return res.redirect('/profile');
    }
    
    // Update service in Firestore
    await updateDoc(serviceRef, {
      formData,
      updatedAt: serverTimestamp()
    });
    
    // Send update to n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      // Prepare data for n8n
      const n8nData = {
        action: 'update',
        userId: req.session.user.uid,
        userEmail: req.session.user.email,
        serviceId,
        serviceType: serviceData.serviceType,
        formData,
        timestamp: new Date().toISOString()
      };
      
      // Send data to n8n
      await axios.post(n8nWebhookUrl, n8nData);
    }
    
    req.flash('success', 'Service updated successfully');
    res.redirect(`/profile/service/${serviceId}`);
  } catch (error) {
    console.error('Error updating service:', error);
    req.flash('error', 'Failed to update service');
    res.redirect(`/profile/service/${serviceId}/update`);
  }
});

// Toggle service status (active/paused)
router.post('/service/:serviceId/toggle-status', checkAuth, async (req, res) => {
  const { serviceId } = req.params;
  
  try {
    // Get service details from Firestore
    const serviceRef = doc(db, 'services', serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if service belongs to user
    const serviceData = serviceDoc.data();
    if (serviceData.userId !== req.session.user.uid) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Toggle status
    const newStatus = serviceData.status === 'active' ? 'paused' : 'active';
    
    // Update service in Firestore
    await updateDoc(serviceRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    // Send update to n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      // Prepare data for n8n
      const n8nData = {
        action: 'status-change',
        userId: req.session.user.uid,
        userEmail: req.session.user.email,
        serviceId,
        serviceType: serviceData.serviceType,
        status: newStatus,
        timestamp: new Date().toISOString()
      };
      
      // Send data to n8n
      await axios.post(n8nWebhookUrl, n8nData);
    }
    
    return res.status(200).json({ 
      success: true, 
      status: newStatus,
      message: `Service ${newStatus === 'active' ? 'activated' : 'paused'} successfully`
    });
  } catch (error) {
    console.error('Error toggling service status:', error);
    return res.status(500).json({ error: 'Failed to update service status' });
  }
});

// Delete service
router.post('/service/:serviceId/delete', checkAuth, async (req, res) => {
  const { serviceId } = req.params;
  
  try {
    // Get service details from Firestore
    const serviceRef = doc(db, 'services', serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if service belongs to user
    const serviceData = serviceDoc.data();
    if (serviceData.userId !== req.session.user.uid) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Send delete notification to n8n before deleting
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      // Prepare data for n8n
      const n8nData = {
        action: 'delete',
        userId: req.session.user.uid,
        userEmail: req.session.user.email,
        serviceId,
        serviceType: serviceData.serviceType,
        timestamp: new Date().toISOString()
      };
      
      // Send data to n8n
      await axios.post(n8nWebhookUrl, n8nData);
    }
    
    // Delete service from Firestore
    await deleteDoc(serviceRef);
    
    return res.status(200).json({ 
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
