import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Badge,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const DashboardHeader = ({ onMenuClick, onCollapseToggle, isCollapsed }) => {


  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#1e293b'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, py: 1, minHeight: '5.5' }}>

        {/* Left Container: Mobile menu and Search Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => {
              if (window.innerWidth < 1200) {
                onMenuClick();
              } else {
                onCollapseToggle();
              }
            }}
            sx={{
              color: '#475569',
              p: 1,
              '&:hover': { backgroundColor: '#f1f5f9' }
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Simple Search bar with active width transition */}
          <TextField
            size="small"
            placeholder="Search..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 200,
              transition: 'width 0.15s ease-in-out',
              '&:focus-within': {
                width: 300,
              },
              '& .MuiOutlinedInput-root': {
                height: 36,
                borderRadius: 2,
                fontSize: '0.825rem',
                fontFamily: '"Inter", sans-serif',
                backgroundColor: '#f1f5f9',
              }
            }}
          />
        </Box>

        {/* Right Actions: Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Notification Button */}
          <IconButton
            sx={{
              color: '#475569',
              p: 1,
              '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' }
            }}
          >
            <Badge variant="dot" color="primary" overlap="circular">
              <NotificationsIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          {/* Info Button */}
          <IconButton
            onClick={() => alert('StockSphere System v1.0.0')}
            sx={{
              color: '#475569',
              p: 1,
              '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' }
            }}
          >
            <InfoIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardHeader;
