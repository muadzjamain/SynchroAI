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
  Paper
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CodeIcon from '@mui/icons-material/Code';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'primary.main',
          color: '#fff',
          mb: 4,
          py: 6,
          borderRadius: 3,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="md">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography component="h1" variant="h3" color="inherit" gutterBottom fontWeight="bold">
                AI Automation Services for Business Owners
              </Typography>
              <Typography variant="h6" color="inherit" paragraph>
                Streamline your business operations with custom AI solutions that work 24/7.
                Automate customer service, order processing, and more.
              </Typography>
              <Box sx={{ mt: 4 }}>
                {currentUser ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    component={RouterLink}
                    to="/profile"
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
                  >
                    Get Started
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ textAlign: 'center' }}>
                <SmartToyIcon sx={{ fontSize: 180, opacity: 0.8 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Services Section */}
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" fontWeight="bold">
          Our AI Services
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Choose from our range of specialized AI solutions or request a custom AI agent
        </Typography>

        <Grid container spacing={4}>
          {/* WhatsApp FAQ AI */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="div"
                sx={{
                  pt: '56.25%',
                  bgcolor: 'success.light',
                  position: 'relative',
                }}
              >
                <WhatsAppIcon
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 80,
                    color: '#fff',
                  }}
                />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  WhatsApp FAQ AI
                </Typography>
                <Typography paragraph>
                  Automate customer support with an AI that answers frequently asked questions through WhatsApp.
                </Typography>
                <Typography variant="h6" color="primary.main" gutterBottom>
                  $90
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  component={RouterLink}
                  to={currentUser ? "/form-whatsapp-faq" : "/login"}
                >
                  {currentUser ? "Get Started" : "Login to Order"}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* WhatsApp Order AI */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="div"
                sx={{
                  pt: '56.25%',
                  bgcolor: 'primary.light',
                  position: 'relative',
                }}
              >
                <WhatsAppIcon
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 80,
                    color: '#fff',
                  }}
                />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  WhatsApp Order AI
                </Typography>
                <Typography paragraph>
                  Process orders, handle payments, and track deliveries automatically through WhatsApp.
                </Typography>
                <Typography variant="h6" color="primary.main" gutterBottom>
                  $125
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  component={RouterLink}
                  to={currentUser ? "/form-whatsapp-order" : "/login"}
                >
                  {currentUser ? "Get Started" : "Login to Order"}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Custom AI Agent */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="div"
                sx={{
                  pt: '56.25%',
                  bgcolor: 'secondary.light',
                  position: 'relative',
                }}
              >
                <CodeIcon
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 80,
                    color: '#fff',
                  }}
                />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  Custom AI Agent
                </Typography>
                <Typography paragraph>
                  Need something specific? We'll build a custom AI solution tailored to your business needs.
                </Typography>
                <Typography variant="h6" color="primary.main" gutterBottom>
                  $199-$599
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  component={RouterLink}
                  to={currentUser ? "/form-custom-ai" : "/login"}
                >
                  {currentUser ? "Get Started" : "Login to Order"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 6, mt: 6 }}>
        <Container>
          <Typography variant="h4" component="h2" gutterBottom align="center" fontWeight="bold">
            How It Works
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
            Getting started with SynchroAI is simple
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" color="primary.main" gutterBottom>1</Typography>
                <Typography variant="h6" gutterBottom>Choose Your AI Service</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select from our range of AI services or request a custom solution.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" color="primary.main" gutterBottom>2</Typography>
                <Typography variant="h6" gutterBottom>Configure Your AI</Typography>
                <Typography variant="body2" color="text.secondary">
                  Provide the necessary information to customize your AI agent.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" color="primary.main" gutterBottom>3</Typography>
                <Typography variant="h6" gutterBottom>Launch & Manage</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your AI agent will be set up within 24 hours. Manage it from your dashboard.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to={currentUser ? "/profile" : "/signup"}
            >
              {currentUser ? "View My Services" : "Get Started Now"}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
