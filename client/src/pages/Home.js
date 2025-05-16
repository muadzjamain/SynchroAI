import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Stack
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CodeIcon from '@mui/icons-material/Code';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Hero Section - More compact */}
      <Paper
        sx={{
          position: 'relative',
          background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
          color: '#fff',
          mb: 2,
          py: 4,
          borderRadius: 0,
          //make this box become curve
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography component="h1" variant="h3" color="inherit" gutterBottom fontWeight="bold">
                SynchroAI
              </Typography>
              <Typography variant="h6" color="inherit" paragraph>
                AI-powered WhatsApp automation for your business
              </Typography>
              <Stack direction="row" spacing={2}>
                {currentUser ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    component={RouterLink}
                    to="/profile"
                    startIcon={<SmartToyIcon />}
                  >
                    My Services
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    component={RouterLink}
                    to="/signup"
                    startIcon={<SmartToyIcon />}
                  >
                    Get Started
                  </Button>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', width: '100%', height: '200px' }}>
                <SmartToyIcon sx={{ fontSize: 120, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Tabbed Content Section */}
      <Container sx={{ py: 3 }}>
        <Paper elevation={0} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            aria-label="service tabs"
          >
            <Tab icon={<WhatsAppIcon />} label="AI Services" />
            <Tab icon={<AutoGraphIcon />} label="How It Works" />
          </Tabs>
        </Paper>

        {/* Services Tab */}
        {tabValue === 0 && (
          <Box>
            <Grid container spacing={3}>
              {/* WhatsApp FAQ AI */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '4px solid #25D366' }}>
                  <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <WhatsAppIcon sx={{ color: '#25D366', fontSize: 28 }} />
                      <Typography variant="h6" component="h3">
                        WhatsApp FAQ AI
                      </Typography>
                    </Stack>
                    <Chip label="$90" color="primary" size="small" sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Automate customer support with an AI that answers frequently asked questions through WhatsApp.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      component={RouterLink}
                      to={currentUser ? "/form-whatsapp-faq" : "/login"}
                      size="small"
                    >
                      {currentUser ? "Get Started" : "Sign In to Order"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* WhatsApp Order AI */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '4px solid #1976d2' }}>
                  <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <ShoppingCartIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                      <Typography variant="h6" component="h3">
                        WhatsApp Order AI
                      </Typography>
                    </Stack>
                    <Chip label="$150" color="primary" size="small" sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Process orders automatically through WhatsApp with AI that handles customer inquiries and payments.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      component={RouterLink}
                      to={currentUser ? "/form-whatsapp-order" : "/login"}
                      size="small"
                    >
                      {currentUser ? "Get Started" : "Sign In to Order"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Custom AI */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '4px solid #9c27b0' }}>
                  <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CodeIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
                      <Typography variant="h6" component="h3">
                        Custom AI Agent
                      </Typography>
                    </Stack>
                    <Chip label="$199-$599" color="secondary" size="small" sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Need something specific? We'll build a custom AI solution tailored to your business needs.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      component={RouterLink}
                      to={currentUser ? "/form-custom-ai" : "/login"}
                      size="small"
                    >
                      {currentUser ? "Get Started" : "Sign In to Order"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* How It Works Tab */}
        {tabValue === 1 && (
          <Box sx={{ py: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', height: '100%', borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>1</Typography>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">Choose Your AI Service</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select from our range of AI services or request a custom solution that fits your business needs.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', height: '100%', borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>2</Typography>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">Configure Your AI</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provide the necessary information to customize your AI agent for your specific business requirements.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', height: '100%', borderLeft: '4px solid #1976d2' }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>3</Typography>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">Launch & Manage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your AI agent will be set up within 24 hours. Easily manage it from your dashboard anytime.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to={currentUser ? "/profile" : "/signup"}
                startIcon={<SmartToyIcon />}
              >
                {currentUser ? "View My Services" : "Get Started Now"}
              </Button>
            </Box>
          </Box>
        )}
      </Container>

      {/* Quick Info Banner */}
      <Paper sx={{ py: 2, mt: 3, bgcolor: 'background.paper', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
        <Container>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                <strong>24/7</strong> AI-powered automation
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                <strong>Setup within 24 hours</strong> of purchase
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                <strong>WhatsApp Business API</strong> integration
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Paper>
    </Box>
  );
};

export default Home;
