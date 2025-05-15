import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import WalletSuccess from './pages/WalletSuccess';
import FormWhatsappFaq from './pages/FormWhatsappFaq';
import FormWhatsappOrder from './pages/FormWhatsappOrder';
import FormCustomAi from './pages/FormCustomAi';
import ViewOrders from './pages/ViewOrders';
import AccountSettings from './pages/AccountSettings';
import NotFound from './pages/NotFound';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <WalletProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="wallet-success" element={
            <ProtectedRoute>
              <WalletSuccess />
            </ProtectedRoute>
          } />
          <Route path="form-whatsapp-faq" element={
            <ProtectedRoute>
              <FormWhatsappFaq />
            </ProtectedRoute>
          } />
          <Route path="form-whatsapp-order" element={
            <ProtectedRoute>
              <FormWhatsappOrder />
            </ProtectedRoute>
          } />
          <Route path="form-custom-ai" element={
            <ProtectedRoute>
              <FormCustomAi />
            </ProtectedRoute>
          } />
          <Route path="view-orders/:serviceId" element={
            <ProtectedRoute>
              <ViewOrders />
            </ProtectedRoute>
          } />
          <Route path="account-settings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </WalletProvider>
  );
}

export default App;
