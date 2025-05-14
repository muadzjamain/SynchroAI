const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

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
