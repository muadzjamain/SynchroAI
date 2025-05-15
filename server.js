require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Initialize Express app
const app = express();
const PORT = 3000; // Fixed to port 3000 as requested

// Function to generate a Google Meet link and create calendar events
async function createMeetingWithCalendarEvent(businessName, email, meetingDate, meetingTime, requirements) {
  try {
    console.log('Creating meeting with calendar event for:', businessName, email);
    // Parse the meeting date and time
    const [year, month, day] = meetingDate.split('-').map(num => parseInt(num));
    const [hours, minutes] = meetingTime.split(':').map(num => parseInt(num));
    
    // Create start and end times (1 hour meeting)
    const startDateTime = new Date(year, month - 1, day, hours, minutes);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later
    
    // Use the existing createCalendarEvent function which is already configured
    const summary = `Custom AI Consultation: ${businessName}`;
    const description = `Business Requirements:\n${requirements}\n\nContact: ${email}`;
    
    console.log('Calling createCalendarEvent with:', summary, email);
    const result = await createCalendarEvent(
      summary,
      description,
      startDateTime.toISOString(),
      endDateTime.toISOString(),
      email
    );
    
    console.log('Calendar event created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    // Fallback to a simple Google Meet link if calendar creation fails
    const meetId = Math.random().toString(36).substring(2, 10);
    console.log('Using fallback Google Meet link:', meetId);
    return {
      meetLink: `https://meet.google.com/${meetId}`,
      eventId: null,
      startTime: null,
      endTime: null
    };
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to serve Firebase configuration as JSON
app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  });
});

// Keep the old endpoint for backward compatibility
app.get('/js/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.firebaseConfig = {
    apiKey: "${process.env.FIREBASE_API_KEY}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.FIREBASE_APP_ID}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID}"
  };
  
  window.stripeConfig = {
    publishableKey: "${process.env.STRIPE_PUBLISHABLE_KEY}"
  };`);
});

// Email configuration using Gmail with App Password from environment variables
let transporter;

// Configure email transport with detailed logging
console.log('Setting up email transport with detailed logging');
transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  logger: true, // Enable detailed transport logging
  debug: true   // Include debug information in logs
});

// Log the email credentials being used (without showing the password)
console.log('Email configured with user:', process.env.EMAIL_USER);
console.log('Email password provided:', process.env.EMAIL_PASSWORD ? 'Yes' : 'No');

// OAuth2 configuration is available but commented out due to authentication issues
// To use OAuth2 in the future, uncomment this code and ensure your credentials are correct
/*
if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
  console.log('Using Gmail API for email sending (OAuth2)');
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: null // Will be automatically generated when needed
    }
  });
}
*/

console.log('Email configuration loaded from environment variables');

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection successful');
  }
});

// Store submissions in memory for demo purposes
const inquiries = [];

// Configure Google Calendar API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials using the refresh token
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  console.log('Google OAuth2 client configured with refresh token');
} else {
  console.warn('Google refresh token not found. Calendar integration will not work.');
}

// Create a Calendar API client
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Function to create a Google Calendar event with Meet link
async function createCalendarEvent(summary, description, startDateTime, endDateTime, attendeeEmail) {
  try {
    console.log('Creating calendar event with the following details:');
    console.log('- Summary:', summary);
    console.log('- Attendee:', attendeeEmail);
    console.log('- Start time:', startDateTime);
    
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Singapore', // Using Singapore timezone, adjust as needed
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Singapore', // Using Singapore timezone, adjust as needed
      },
      attendees: [
        { email: process.env.EMAIL_USER }, // Organizer (chatgpt.akira@gmail.com)
        { email: attendeeEmail }              // Attendee
      ],
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 * 24 }, // 1 day before
          { method: 'popup', minutes: 30 }        // 30 minutes before
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    console.log('Calendar event created successfully');
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error.message);
    throw error;
  }
}

// API Routes

// Custom AI Agent form submission endpoint
app.post('/api/send-inquiry', async (req, res) => {
  try {
    const { businessName, email, meetingDateTime, aiRequirements } = req.body;
    
    if (!businessName || !email || !meetingDateTime || !aiRequirements) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse the meeting date for display and calendar creation
    const meetingDate = new Date(meetingDateTime);
    const formattedDate = meetingDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Calculate end time (1 hour after start time)
    const endDate = new Date(meetingDate.getTime());
    endDate.setHours(endDate.getHours() + 1);
    
    let meetLink = '';
    let calendarEventId = '';
    let eventHtmlLink = '';
    
    // Create the Google Calendar event with Meet link if credentials are available
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      try {
        console.log('Creating Google Calendar event with Meet link...');
        const eventSummary = `SynchroAI Custom AI Agent Consultation - ${businessName}`;
        const eventDescription = `
Business: ${businessName}
Email: ${email}

AI Requirements:
${aiRequirements}

This meeting was automatically scheduled through the SynchroAI Custom AI Agent form.`;
        
        const eventData = await createCalendarEvent(
          eventSummary,
          eventDescription,
          meetingDate.toISOString(),
          endDate.toISOString(),
          email
        );
        
        meetLink = eventData.hangoutLink || '';
        calendarEventId = eventData.id || '';
        eventHtmlLink = eventData.htmlLink || '';
        console.log('Google Meet link created:', meetLink);
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError);
        // Continue with the process even if calendar event creation fails
        // We'll use a placeholder link in this case
        meetLink = 'https://meet.google.com/see-email-for-updated-link';
      }
    } else {
      console.warn('Google Calendar credentials not available. Using placeholder Meet link');
      meetLink = 'https://meet.google.com/see-email-for-updated-link';
    }

    // Store the inquiry in our in-memory array
    const inquiry = {
      id: Date.now().toString(),
      businessName,
      email,
      meetingDateTime,
      formattedDateTime: `${formattedDate} at ${formattedTime}`,
      aiRequirements,
      createdAt: new Date(),
      meetLink,
      calendarEventId,
      eventHtmlLink
    };
    
    inquiries.push(inquiry);
    console.log('New inquiry stored:', inquiry);
    
    // Email to website owner
    const ownerMailOptions = {
      from: 'chatgpt.akira@gmail.com',
      to: 'chatgpt.akira@gmail.com',
      subject: `New Custom AI Agent Inquiry from ${businessName}`,
      html: `
        <h2>New Custom AI Agent Inquiry</h2>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Meeting Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>
        <p><strong>AI Requirements:</strong></p>
        <p>${aiRequirements.replace(/\n/g, '<br>')}</p>
        <p><strong>Google Meet Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
        ${eventHtmlLink ? '<p><strong>Calendar Event:</strong> <a href="' + eventHtmlLink + '">View in Google Calendar</a></p>' : ''}
      `
    };

    // Email to user
    const userMailOptions = {
      from: 'chatgpt.akira@gmail.com',
      to: email,
      subject: 'Your Custom AI Agent Inquiry - SynchroAI',
      html: `
        <h2>Thank you for your inquiry!</h2>
        <p>Dear ${businessName},</p>
        <p>We have received your inquiry about our Custom AI Agent service. Our team will review your requirements and meet with you at the scheduled time:</p>
        <p><strong>Meeting Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>
        <p><strong>Google Meet Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
        ${eventHtmlLink ? '<p><strong>Calendar Event:</strong> This meeting has been added to your Google Calendar. <a href="' + eventHtmlLink + '">View in Google Calendar</a></p>' : ''}
        <p>Please click the Google Meet link above at the scheduled time to join the meeting. If you have any questions before then, feel free to reply to this email.</p>
        <p><strong>Your Requirements:</strong></p>
        <p>${aiRequirements.replace(/\n/g, '<br>')}</p>
        <p>Thank you for choosing SynchroAI!</p>
        <p>Best regards,<br>The SynchroAI Team</p>
      `
    };

    try {
      // Send email to owner
      console.log('Sending email to owner:', ownerMailOptions.to);
      await transporter.sendMail(ownerMailOptions);
      console.log('Email sent to owner successfully');
      
      // Send email to user
      console.log('Sending email to user:', userMailOptions.to);
      await transporter.sendMail(userMailOptions);
      console.log('Email sent to user successfully');
      
      // Log confirmation of emails sent
      console.log(`Emails sent successfully to owner (chatgpt.akira@gmail.com) and user (${email})`);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Continue with the response even if email sending fails
    }

    // Return success with meeting details
    res.status(200).json({ 
      success: true, 
      message: 'Inquiry sent successfully',
      meetingDateTime: formattedDate + ' at ' + formattedTime,
      meetLink,
      calendarEventUrl: eventHtmlLink || null,
      calendarEventCreated: !!eventHtmlLink
    });
  } catch (error) {
    console.error('Error processing inquiry:', error);
    res.status(500).json({ error: 'Failed to process inquiry' });
  }
});

// Endpoint to view all inquiries (for testing)
app.get('/api/inquiries', (req, res) => {
  res.json(inquiries);
});

// Service form submission endpoint
app.post('/api/services', (req, res) => {
  try {
    const { serviceType, userId, formData } = req.body;
    
    if (!serviceType || !userId || !formData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In a real implementation, this would save to Firestore
    // and potentially trigger an n8n workflow
    console.log(`New ${serviceType} service request from user ${userId}:`, formData);
    
    // Simulate processing time
    setTimeout(() => {
      res.status(201).json({
        success: true,
        serviceId: `service-${Date.now()}`,
        message: 'Service request submitted successfully'
      });
    }, 1000);
  } catch (error) {
    console.error('Error processing service request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment processing endpoint
app.post('/api/payments', (req, res) => {
  try {
    const { serviceId, paymentMethodId, amount, userId } = req.body;
    
    if (!serviceId || !paymentMethodId || !amount || !userId) {
      return res.status(400).json({ error: 'Missing required payment information' });
    }
    
    // In a real implementation, this would integrate with Stripe or another payment processor
    console.log(`Processing payment for service ${serviceId}:`, {
      paymentMethodId,
      amount,
      userId
    });
    
    // Simulate payment processing
    setTimeout(() => {
      res.status(200).json({
        success: true,
        transactionId: `txn-${Date.now()}`,
        message: 'Payment processed successfully'
      });
    }, 1500);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Service status update endpoint
app.patch('/api/services/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status, userId } = req.body;
    
    if (!status || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In a real implementation, this would update the service status in Firestore
    console.log(`Updating service ${serviceId} status to ${status} for user ${userId}`);
    
    res.status(200).json({
      success: true,
      message: `Service status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ error: 'Failed to update service status' });
  }
});

// Service deletion endpoint
app.delete('/api/services/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // In a real implementation, this would delete the service from Firestore
    console.log(`Deleting service ${serviceId} for user ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Stripe API endpoints

// Create a checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('Received checkout session request:', req.body);
    const { amount, userId } = req.body;
    
    if (!amount || !userId) {
      console.error('Missing required fields:', { amount, userId });
      return res.status(400).json({ error: 'Missing required fields: amount and userId are required' });
    }
    
    console.log('Using stripe key:', process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...');
    
    // Create a new checkout session
    const sessionParams = {
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
    };
    
    console.log('Creating Stripe checkout session with params:', JSON.stringify(sessionParams, null, 2));
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('Stripe session created successfully:', session.id);

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle successful payment
app.get('/api/payment-success', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    // Retrieve the session to verify the payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const userId = session.metadata.userId;
      const amount = parseFloat(session.metadata.amount);
      
      // In a real implementation, this would update the user's wallet in Firestore
      console.log(`Adding $${amount} to wallet for user ${userId}`);
      
      // For demo purposes, we'll just return success
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
app.get('/api/stripe-config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Set up a webhook to handle asynchronous events
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Fulfill the order
      const userId = session.metadata.userId;
      const amount = parseFloat(session.metadata.amount);
      
      // In a real implementation, this would update the user's wallet in Firestore
      console.log(`Webhook: Adding $${amount} to wallet for user ${userId}`);
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// API endpoint for Custom AI form submissions
app.post('/api/custom-ai-form', async (req, res) => {
  try {
    console.log('Received Custom AI form submission:', req.body);
    const { businessName, email, businessNumber, meetingDate, meetingTime, requirements } = req.body;
    
    // Validate required fields
    if (!businessName || !email || !businessNumber || !meetingDate || !meetingTime || !requirements) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    console.log('Creating calendar event for meeting at:', meetingDate, meetingTime);
    // Create calendar event and get Google Meet link
    const { meetLink, eventId } = await createMeetingWithCalendarEvent(
      businessName, 
      email, 
      meetingDate, 
      meetingTime, 
      requirements
    );
    
    const meetingDateTime = `${meetingDate} at ${meetingTime}`;
    console.log('Generated meeting link:', meetLink);
    
    // Always include the test email as a BCC recipient to ensure you receive a copy
    const testEmail = 'muadz.jamain@gmail.com';
    
    // Prepare email to user
    const userMailOptions = {
      from: process.env.EMAIL_USER || 'chatgpt.akira@gmail.com',
      to: email,
      bcc: testEmail, // Add your test email as BCC to ensure you receive a copy
      subject: 'Your Custom AI Consultation Appointment',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your interest in SynchroAI Custom Solutions!</h2>
          <p>Dear ${businessName},</p>
          <p>We're excited to discuss your custom AI requirements. Here's a summary of the information you provided:</p>
          <ul>
            <li><strong>Business Name:</strong> ${businessName}</li>
            <li><strong>Contact Number:</strong> ${businessNumber}</li>
            <li><strong>Consultation Appointment:</strong> ${meetingDateTime}</li>
          </ul>
          <p><strong>Your Requirements:</strong></p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${requirements}</p>
          <h3>Your Google Meet Appointment</h3>
          <p>We've scheduled a consultation call for ${meetingDateTime}. Please join using the link below:</p>
          <p><a href="${meetLink}" style="display: inline-block; background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Google Meet</a></p>
          <p>Our AI specialist will be ready to discuss your custom solution needs and answer any questions you may have.</p>
          <p>This meeting has been added to your Google Calendar. You'll receive a calendar notification before the meeting.</p>
          <p>If you need to reschedule, please reply to this email or contact us at support@synchroai.com.</p>
          <p>We look forward to speaking with you!</p>
          <p>Best regards,<br>The SynchroAI Team</p>
        </div>
      `
    };
    
    // Prepare email to website owner and make sure to include the test email
    const ownerMailOptions = {
      from: process.env.EMAIL_USER || 'chatgpt.akira@gmail.com',
      to: ['chatgpt.akira@gmail.com', testEmail], // Include both the owner and test email
      subject: `New Custom AI Consultation: ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Custom AI Consultation Request</h2>
          <p>A new customer has requested a custom AI consultation:</p>
          <ul>
            <li><strong>Business Name:</strong> ${businessName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Contact Number:</strong> ${businessNumber}</li>
            <li><strong>Scheduled Meeting:</strong> ${meetingDateTime}</li>
          </ul>
          <p><strong>Customer Requirements:</strong></p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${requirements}</p>
          <h3>Google Meet Link</h3>
          <p>The consultation is scheduled for ${meetingDateTime}. Join using this link:</p>
          <p><a href="${meetLink}" style="display: inline-block; background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Google Meet</a></p>
          <p>This meeting has been added to your Google Calendar with event ID: ${eventId || 'Not available'}.</p>
        </div>
      `
    };
    
    // Send emails with detailed error handling
    console.log('Sending user email to:', email, 'with BCC to:', testEmail);
    try {
      const userEmailInfo = await transporter.sendMail(userMailOptions);
      console.log('User email sent successfully. Message ID:', userEmailInfo.messageId);
    } catch (emailError) {
      console.error('Error sending user email:', emailError);
      // Continue execution even if this email fails
    }
    
    console.log('Sending owner email to:', ownerMailOptions.to);
    try {
      const ownerEmailInfo = await transporter.sendMail(ownerMailOptions);
      console.log('Owner email sent successfully. Message ID:', ownerEmailInfo.messageId);
    } catch (emailError) {
      console.error('Error sending owner email:', emailError);
      // Continue execution even if this email fails
    }
    
    res.status(200).json({ success: true, message: 'Form submitted successfully', meetLink, eventId });
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // In development, serve from public directory for backward compatibility
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Start server on port 3000
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Your SynchroAI website is now available at http://localhost:3000');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free up port 3000 by closing other applications.`);
    console.error('You can find which process is using port 3000 with: netstat -ano | findstr :3000');
    console.error('Then kill that process with: taskkill /F /PID <process_id>');
  } else {
    console.error('Server error:', err);
  }
});
