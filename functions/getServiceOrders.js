const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized elsewhere
if (!admin.apps.length) {
  admin.initializeApp();
}

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
