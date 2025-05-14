const express = require('express');
const router = express.Router();
const { attachCurrentUser } = require('../middleware/auth');

// Apply middleware to all routes
router.use(attachCurrentUser);

// Home page - Display the three AI service options
router.get('/', (req, res) => {
  const services = [
    {
      id: 'whatsapp-faq',
      name: 'WhatsApp FAQ AI Agent',
      description: 'Automate responses to frequently asked questions via WhatsApp',
      icon: 'chat-dots',
      features: [
        'Automatic responses to common questions',
        'Customizable FAQ database',
        'Easy integration with your WhatsApp Business account'
      ]
    },
    {
      id: 'whatsapp-order',
      name: 'WhatsApp Order AI Agent',
      description: 'Process and track orders through WhatsApp',
      icon: 'cart',
      features: [
        'Automated order processing',
        'Payment verification',
        'Order status tracking'
      ]
    },
    {
      id: 'custom-ai',
      name: 'Custom AI Agent',
      description: 'Build a custom AI solution tailored to your business needs',
      icon: 'gear',
      features: [
        'Fully customizable AI behavior',
        'Specialized for your business requirements',
        'Advanced integration options'
      ]
    }
  ];

  res.render('index', { 
    title: 'SynchroAI - AI Automation Services',
    services
  });
});

module.exports = router;
