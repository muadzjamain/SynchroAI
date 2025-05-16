import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import AppsIcon from '@mui/icons-material/Apps';
import SettingsIcon from '@mui/icons-material/Settings';

import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { walletBalance } = useWallet();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <AppBar position="static" sx={{ bgcolor: '#3861fb', boxShadow: 'none' }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <SmartToyIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            SynchroAI
          </Typography>
        </RouterLink>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/"
              startIcon={<HomeIcon />}
              sx={{ mr: 1 }}
            >
              Home
            </Button>
            
            {currentUser && (
              <>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/profile"
                  sx={{ mr: 1 }}
                >
                  My Services
                </Button>
                <Button 
                  component={RouterLink} 
                  to="/wallet"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    color: 'white', 
                    mr: 2,
                    borderRadius: 2,
                    px: 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      ${walletBalance.toFixed(2)}
                    </Typography>
                  </Box>
                </Button>
              </>
            )}
          </Box>
        )}
        
        {currentUser ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              onClick={handleMenu}
              sx={{ textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                src={currentUser?.photoURL} 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'primary.dark',
                    border: '2px solid white',
                    mr: 1
                  }}
                >
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {currentUser.displayName || currentUser.email}
                </Typography>
              </Box>
            </Button>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem component={RouterLink} to="/wallet" onClick={handleClose}>
                <ListItemIcon>
                  <AccountBalanceWalletIcon fontSize="small" />
                </ListItemIcon>
                My Wallet
              </MenuItem>
              <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>
                <ListItemIcon>
                  <AppsIcon fontSize="small" />
                </ListItemIcon>
                My Services
              </MenuItem>
              <MenuItem component={RouterLink} to="/account-settings" onClick={handleClose}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Account Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={RouterLink} to="/login" sx={{ mr: 1 }}>
              Sign In
            </Button>
            <Button variant="contained" color="secondary" component={RouterLink} to="/signup">
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
      
      {/* Mobile menu drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={handleMobileMenuToggle}
        >
          <List>
            <ListItem button component={RouterLink} to="/">
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            
            {currentUser && (
              <>
                <ListItem button component={RouterLink} to="/profile">
                  <ListItemIcon>
                    <AppsIcon />
                  </ListItemIcon>
                  <ListItemText primary="My Services" />
                </ListItem>
                <ListItem button component={RouterLink} to="/wallet">
                  <ListItemIcon>
                    <AccountBalanceWalletIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>My Wallet</span>
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                          ${walletBalance.toFixed(2)}
                        </Typography>
                      </Box>
                    } 
                  />
                </ListItem>
                <ListItem button component={RouterLink} to="/account-settings">
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Account Settings" />
                </ListItem>
                <Divider />
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign Out" />
                </ListItem>
              </>
            )}
            
            {!currentUser && (
              <>
                <ListItem button component={RouterLink} to="/login">
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign In" />
                </ListItem>
                <ListItem button component={RouterLink} to="/signup">
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign Up" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;
