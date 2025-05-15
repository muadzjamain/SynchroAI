import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Service endpoints
const services = {
  // Firebase config
  getFirebaseConfig: () => api.get('/api/firebase-config'),
  
  // Stripe config
  getStripeConfig: () => api.get('/api/stripe-config'),
  
  // Wallet services
  createCheckoutSession: (data) => api.post('/api/create-checkout-session', data),
  verifyPayment: (sessionId) => api.get(`/api/payment-success?sessionId=${sessionId}`),
  
  // Service management
  createService: (data) => api.post('/api/services', data),
  updateService: (serviceId, data) => api.patch(`/api/services/${serviceId}`, data),
  deleteService: (serviceId, userId) => api.delete(`/api/services/${serviceId}`, { data: { userId } }),
  
  // Custom AI inquiry
  sendCustomAiInquiry: (data) => api.post('/api/send-inquiry', data)
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default services;
