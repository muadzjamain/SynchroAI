const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized elsewhere
if (!admin.apps.length) {
  admin.initializeApp();
}

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
