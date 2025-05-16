const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
const os = require('os');
const fs = require('fs');

admin.initializeApp();

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  functions.config().gmail.client_id,
  functions.config().gmail.client_secret,
  functions.config().gmail.redirect_url
);

oauth2Client.setCredentials({
  refresh_token: functions.config().gmail.refresh_token
});

// Create Google Calendar API client
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Function to generate a Google Meet link
async function createGoogleMeetEvent(summary, description, startTime, endTime, attendeeEmails) {
  try {
    // Calculate end time (1 hour after start time if not specified)
    if (!endTime) {
      endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000);
    }

    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime,
        timeZone: 'Asia/Singapore',
      },
      end: {
        dateTime: endTime,
        timeZone: 'Asia/Singapore',
      },
      attendees: attendeeEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `synchroai-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    return response.data;
  } catch (error) {
    console.error('Error creating Google Meet event:', error);
    throw new Error('Failed to create Google Meet event');
  }
}

// Function to send email
async function sendEmail(to, subject, html) {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'chatgpt.akira@gmail.com',
        clientId: functions.config().gmail.client_id,
        clientSecret: functions.config().gmail.client_secret,
        refreshToken: functions.config().gmail.refresh_token,
        accessToken: accessToken
      }
    });

    const mailOptions = {
      from: 'SynchroAI <chatgpt.akira@gmail.com>',
      to: to,
      subject: subject,
      html: html
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

// Cloud Function to handle inquiry submissions
exports.sendInquiryEmail = functions.https.onCall(async (data, context) => {
  try {
    const { businessName, email, meetingDateTime, aiRequirements } = data;
    
    if (!businessName || !email || !meetingDateTime || !aiRequirements) {
      throw new Error('Missing required fields');
    }

    // Parse meeting date time
    const meetingDate = new Date(meetingDateTime);
    const endMeetingTime = new Date(meetingDate.getTime() + 60 * 60 * 1000); // 1 hour meeting

    // Create Google Meet event
    const eventSummary = `SynchroAI Custom AI Agent Consultation - ${businessName}`;
    const eventDescription = `
      Business Name: ${businessName}
      Email: ${email}
      
      AI Requirements:
      ${aiRequirements}
    `;
    
    const attendeeEmails = ['chatgpt.akira@gmail.com', email];
    
    const event = await createGoogleMeetEvent(
      eventSummary,
      eventDescription,
      meetingDate.toISOString(),
      endMeetingTime.toISOString(),
      attendeeEmails
    );

    // Get the Google Meet link
    const meetLink = event.hangoutLink || 'Link will be provided in the calendar invitation';

    // Format date for email
    const formattedDate = meetingDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create email HTML content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4361ee; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">SynchroAI Custom AI Agent Consultation</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Dear ${businessName},</p>
          
          <p>Thank you for your interest in our Custom AI Agent service. We have scheduled a consultation to discuss your requirements in detail.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4361ee;">Meeting Details</h3>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Google Meet Link:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>
            <p>This meeting has been added to your calendar. You should receive a calendar invitation shortly.</p>
          </div>
          
          <h3>Your Requirements Summary:</h3>
          <p style="white-space: pre-line;">${aiRequirements}</p>
          
          <p>If you need to reschedule or have any questions before our meeting, please reply to this email.</p>
          
          <p>Best regards,<br>The SynchroAI Team</p>
        </div>
        
        <div style="background-color: #f1f3f5; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
          <p>&copy; 2025 SynchroAI. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email to the client
    await sendEmail(
      email,
      `SynchroAI Consultation Scheduled - ${formattedDate}`,
      emailHtml
    );

    // Send notification email to the website owner
    const ownerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4361ee; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">New Custom AI Agent Inquiry</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>You have received a new inquiry for the Custom AI Agent service.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4361ee;">Client Information</h3>
            <p><strong>Business Name:</strong> ${businessName}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4361ee;">Meeting Details</h3>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Google Meet Link:</strong> <a href="${meetLink}" target="_blank">${meetLink}</a></p>
          </div>
          
          <h3>Client Requirements:</h3>
          <p style="white-space: pre-line;">${aiRequirements}</p>
        </div>
      </div>
    `;

    await sendEmail(
      'chatgpt.akira@gmail.com',
      `New Custom AI Agent Inquiry - ${businessName}`,
      ownerEmailHtml
    );

    // Store the inquiry in Firestore
    await admin.firestore().collection('inquiries').add({
      businessName,
      email,
      meetingDateTime: admin.firestore.Timestamp.fromDate(meetingDate),
      aiRequirements,
      meetLink,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'scheduled'
    });

    return { success: true, meetLink };
  } catch (error) {
    console.error('Error processing inquiry:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== VERIFIED RECEIPTS AND ORDERS FUNCTIONS =====

/**
 * Cloud Function that creates a verified-receipts folder when a new service is created
 */
exports.createVerifiedReceiptsFolder = functions.firestore
  .document('services/{serviceId}')
  .onCreate(async (snap, context) => {
    try {
      const serviceId = context.params.serviceId;
      console.log(`New service created with ID: ${serviceId}. Creating verified-receipts folder...`);
      
      // Create the verified-receipts folder in Storage by creating a placeholder file
      // Firebase Storage doesn't have "folders" - they're created implicitly when files are added
      const folderPath = `services/${serviceId}/verified-receipts/.placeholder`;
      const bucket = admin.storage().bucket();
      
      // Create an empty file to establish the folder structure
      const file = bucket.file(folderPath);
      await file.save('', { contentType: 'text/plain' });
      
      console.log(`Successfully created verified-receipts folder for service: ${serviceId}`);
      return null;
    } catch (error) {
      console.error(`Error creating verified-receipts folder: ${error}`);
      return null;
    }
  });

/**
 * Cloud Function that processes a verified order
 * This can be triggered by an HTTP request from your n8n workflow
 */
exports.processVerifiedOrder = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  
  // Check if request method is POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { serviceId, customerPhone, receiptData, receiptType } = req.body;
    
    // Validate required fields
    if (!serviceId || !customerPhone || !receiptData) {
      res.status(400).send('Missing required fields: serviceId, customerPhone, receiptData');
      return;
    }

    // Determine file extension based on receiptType or default to jpg
    const fileExtension = receiptType === 'pdf' ? 'pdf' : 'jpg';
    const fileName = `receipt-${Date.now()}.${fileExtension}`;
    const filePath = `services/${serviceId}/verified-receipts/${fileName}`;
    
    // Decode base64 data
    const fileBuffer = Buffer.from(receiptData, 'base64');
    
    // Get a reference to the storage bucket
    const bucket = admin.storage().bucket();
    
    // Upload the file to Firebase Storage
    const file = bucket.file(filePath);
    await file.save(fileBuffer, {
      contentType: receiptType === 'pdf' ? 'application/pdf' : 'image/jpeg',
      metadata: {
        customMetadata: {
          uploadedBy: 'system',
          customerPhone: customerPhone
        }
      }
    });
    
    // Get the download URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Far future expiration
    });
    
    // Create a document in the serviceOrders collection
    const orderRef = await admin.firestore().collection('serviceOrders').add({
      serviceId: serviceId,
      customerPhone: customerPhone,
      receiptURL: url,
      status: 'verified',
      verificationDate: admin.firestore.FieldValue.serverTimestamp(),
      receiptPath: filePath,
      receiptType: fileExtension
    });
    
    // Get the service document to include service name in response
    const serviceDoc = await admin.firestore().collection('services').doc(serviceId).get();
    const serviceName = serviceDoc.exists ? serviceDoc.data().name || 'Unknown Service' : 'Unknown Service';
    
    // Send success response
    res.status(200).json({
      success: true,
      message: 'Order processed successfully',
      orderId: orderRef.id,
      serviceId: serviceId,
      serviceName: serviceName,
      receiptURL: url
    });
    
  } catch (error) {
    console.error('Error processing verified order:', error);
    res.status(500).send(`Error processing order: ${error.message}`);
  }
});

/**
 * Cloud Function that retrieves all verified orders for a specific service
 * This can be called from your frontend view-orders page
 */
exports.getServiceOrders = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  
  // Check if request method is GET
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Get serviceId from query parameters
    const serviceId = req.query.serviceId;
    
    if (!serviceId) {
      res.status(400).send('Missing required query parameter: serviceId');
      return;
    }
    
    // Query the serviceOrders collection for verified orders of this service
    const ordersSnapshot = await admin.firestore()
      .collection('serviceOrders')
      .where('serviceId', '==', serviceId)
      .where('status', '==', 'verified')
      .orderBy('verificationDate', 'desc')
      .get();
    
    // Transform the data
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamp to ISO string for JSON serialization
      verificationDate: doc.data().verificationDate ? 
        doc.data().verificationDate.toDate().toISOString() : null
    }));
    
    // Get service details
    const serviceDoc = await admin.firestore().collection('services').doc(serviceId).get();
    const serviceData = serviceDoc.exists ? serviceDoc.data() : null;
    
    // Send response
    res.status(200).json({
      success: true,
      serviceId: serviceId,
      serviceName: serviceData ? serviceData.name : 'Unknown Service',
      orders: orders
    });
    
  } catch (error) {
    console.error('Error retrieving service orders:', error);
    res.status(500).send(`Error retrieving orders: ${error.message}`);
  }
});
