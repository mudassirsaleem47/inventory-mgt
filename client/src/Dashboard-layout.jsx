import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './Components/Sidebar';
import DashboardHeader from './Components/dashboard-header';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: '#f8fafc', overflow: 'hidden' }}>
      {/* Sidebar (handles mobile and desktop views) */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleMobileSidebar} isCollapsed={isCollapsed} />

      {/* Main Content Pane */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, height: '100%' }}>
        {/* Header */}
        <DashboardHeader 
          onMenuClick={toggleMobileSidebar} 
          onCollapseToggle={toggleSidebarCollapse}
          isCollapsed={isCollapsed}
        />

        {/* Content Area */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            width: '100%',
            maxWidth: 'none',
            boxSizing: 'border-box',
            overflowY: 'auto', 
            p: { xs: 3, md: 4 }, 
            backgroundColor: '#f8fafc'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;