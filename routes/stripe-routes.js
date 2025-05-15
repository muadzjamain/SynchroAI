const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, userId } = req.body;
    
    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SynchroAI Wallet Top-up',
              description: `Add $${amount} to your wallet`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/wallet-success.html?session_id={CHECKOUT_SESSION_ID}&amount=${amount}`,
      cancel_url: `${req.headers.origin}/wallet.html`,
      client_reference_id: userId, // Store the user ID
      metadata: {
        userId: userId,
        amount: amount
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle successful payment
router.get('/payment-success', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    // Retrieve the session to verify the payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const userId = session.metadata.userId;
      const amount = parseFloat(session.metadata.amount);
      
      // Update user's wallet in Firestore
      const db = admin.firestore();
      
      // Update wallet balance
      await db.collection('users').doc(userId).update({
        walletBalance: admin.firestore.FieldValue.increment(amount)
      });
      
      // Record the transaction
      await db.collection('transactions').add({
        userId: userId,
        amount: amount,
        type: 'credit',
        description: 'Wallet Top Up',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        paymentId: session.id
      });
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error processing successful payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Expose Stripe publishable key
router.get('/stripe-config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Set up a webhook to handle asynchronous events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Fulfill the order
      const userId = session.metadata.userId;
      const amount = parseFloat(session.metadata.amount);
      
      // Update user's wallet in Firestore
      const db = admin.firestore();
      
      // Update wallet balance
      await db.collection('users').doc(userId).update({
        walletBalance: admin.firestore.FieldValue.increment(amount)
      });
      
      // Record the transaction
      await db.collection('transactions').add({
        userId: userId,
        amount: amount,
        type: 'credit',
        description: 'Wallet Top Up',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        paymentId: session.id
      });
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
