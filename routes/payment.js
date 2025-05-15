const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('../config/firebase');
const { collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Service pricing (in USD)
const PRICING = {
  'whatsapp-faq': 90,
  'whatsapp-order': 125,
  'custom-ai': 199
};

// Payment page
router.get('/:serviceType', checkAuth, (req, res) => {
  const { serviceType } = req.params;
  const pendingService = req.session.pendingService;
  
  // Check if there's pending service data
  if (!pendingService || pendingService.serviceType !== serviceType) {
    req.flash('error', 'No pending service data found');
    return res.redirect(`/services/${serviceType}`);
  }
  
  // Get service details
  let serviceName, price;
  switch (serviceType) {
    case 'whatsapp-faq':
      serviceName = 'WhatsApp FAQ AI Agent';
      price = PRICING['whatsapp-faq'];
      break;
    case 'whatsapp-order':
      serviceName = 'WhatsApp Order AI Agent';
      price = PRICING['whatsapp-order'];
      break;
    case 'custom-ai':
      serviceName = 'Custom AI Agent';
      price = PRICING['custom-ai'];
      break;
    default:
      req.flash('error', 'Invalid service type');
      return res.redirect('/');
  }
  
  res.render('payment/checkout', {
    title: 'Payment - SynchroAI',
    serviceType,
    serviceName,
    price,
    stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Process payment
router.post('/:serviceType/process', checkAuth, async (req, res) => {
  const { serviceType } = req.params;
  const { paymentMethodId } = req.body;
  const pendingService = req.session.pendingService;
  
  // Check if there's pending service data
  if (!pendingService || pendingService.serviceType !== serviceType) {
    return res.status(400).json({ error: 'No pending service data found' });
  }
  
  try {
    // Get price for service
    const price = PRICING[serviceType];
    if (!price) {
      return res.status(400).json({ error: 'Invalid service type' });
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${req.protocol}://${req.get('host')}/payment/${serviceType}/success`
    });
    
    // If payment successful, save service to Firestore
    if (paymentIntent.status === 'succeeded') {
      // Create service record in Firestore
      const servicesRef = collection(db, 'services');
      await addDoc(servicesRef, {
        userId: req.session.user.uid,
        serviceType,
        serviceName: getServiceName(serviceType),
        formData: pendingService.formData,
        paymentId: paymentIntent.id,
        paymentAmount: price,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Clear pending service from session
      delete req.session.pendingService;
      
      return res.status(200).json({ 
        success: true,
        redirectUrl: `/payment/${serviceType}/success`
      });
    } else {
      return res.status(400).json({ 
        error: 'Payment processing failed',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ 
      error: 'Payment processing error',
      message: error.message
    });
  }
});

// Payment success page
router.get('/:serviceType/success', checkAuth, (req, res) => {
  const { serviceType } = req.params;
  
  // Get service name
  const serviceName = getServiceName(serviceType);
  
  res.render('payment/success', {
    title: 'Payment Successful - SynchroAI',
    serviceType,
    serviceName
  });
});

// Helper function to get service name
function getServiceName(serviceType) {
  switch (serviceType) {
    case 'whatsapp-faq':
      return 'WhatsApp FAQ AI Agent';
    case 'whatsapp-order':
      return 'WhatsApp Order AI Agent';
    case 'custom-ai':
      return 'Custom AI Agent';
    default:
      return 'AI Service';
  }
}

module.exports = router;
