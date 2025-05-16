const functions = require('firebase-functions');
const admin = require('firebase-admin');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Initialize Firebase Admin if not already initialized elsewhere
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function that processes a verified order
 * This can be triggered by an HTTP request from your n8n workflow
 */
exports.processVerifiedOrder = functions.https.onRequest(async (req, res) => {
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
