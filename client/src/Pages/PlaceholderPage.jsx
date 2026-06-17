import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardHeader } from '@mui/material';
import { AutoAwesome, Terminal } from '@mui/icons-material';

const PlaceholderPage = () => {
  const location = useLocation();
  const path = location.pathname.substring(1) || 'dashboard';

  // Capitalize name
  const pageName = path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Box sx={{ maxWidth: 800, fontFamily: '"Inter", sans-serif' }}>
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: '#0f172a', 
            fontFamily: '"Inter", sans-serif' 
          }}
        >
          {pageName}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#64748b', 
            mt: 0.5,
            fontFamily: '"Inter", sans-serif' 
          }}
        >
          Manage your {pageName.toLowerCase()} settings and records.
        </Typography>
      </Box>

      <Card 
        sx={{ 
          border: '1px solid #e2e8f0', 
          bgcolor: '#ffffff', 
          borderRadius: 2,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <CardHeader 
          title={
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: '"Inter", sans-serif' }}>
              Work in Progress
            </Typography>
          }
          subheader={
            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Inter", sans-serif', fontSize: '0.825rem' }}>
              This module is currently being developed and will be connected to the SQLite backend API.
            </Typography>
          }
          avatar={
            <Box 
              sx={{ 
                width: 36, 
                height: 36, 
                borderRadius: 1.5, 
                bgcolor: '#f1f5f9', 
                color: '#475569', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <AutoAwesome sx={{ fontSize: 18 }} />
            </Box>
          }
          sx={{ px: 3, pt: 3, pb: 1 }}
        />
        
        <CardContent sx={{ px: 3, pb: 3, pt: 1 }}>
          <Box 
            sx={{ 
              bgcolor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: 2, 
              p: 2, 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 1.5,
              mb: 2
            }}
          >
            <Terminal sx={{ fontSize: 16, color: '#64748b', mt: 0.25 }} />
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#334155', 
                  fontFamily: 'monospace',
                  fontSize: '0.75rem' 
                }}
              >
                Routing Active:
              </Typography>
              <Typography 
                variant="caption" 
                component="div" 
                sx={{ 
                  color: '#64748b', 
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  mt: 0.5 
                }}
              >
                path: <Box component="span" sx={{ color: '#2563eb', fontWeight: 600 }}>"{location.pathname}"</Box>
              </Typography>
              <Typography 
                variant="caption" 
                component="div" 
                sx={{ 
                  color: '#64748b', 
                  fontFamily: 'monospace',
                  fontSize: '0.7rem' 
                }}
              >
                component: <Box component="span" sx={{ color: '#475569', fontWeight: 600 }}>PlaceholderPage.jsx</Box>
              </Typography>
            </Box>
          </Box>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#94a3b8', 
              lineHeight: 1.5, 
              display: 'block',
              fontFamily: '"Inter", sans-serif'
            }}
          >
            Data models for this page are predefined in Prisma and ready to be integrated into controllers to connect with the local database. You can customize this layout using MUI theme parameters or sx properties.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PlaceholderPage;
