import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import {
  AttachMoney,
  ShoppingCart,
  Description,
  Business,
  Anchor,
  TrendingUp,
  BarChart,
  Person,
  ReceiptLong,
  Category
} from '@mui/icons-material';

const DashboardOverview = () => {

  // Quick Actions (Top Row)
  const quickActions = [
    { label: 'Cash Receivable', icon: AttachMoney },
    { label: 'Add Products', icon: ShoppingCart },
    { label: 'Add Invoice', icon: Description },
    { label: 'Company Info', icon: Business }
  ];

  // 4 Large Colored Stats Cards
  const largeStats = [
    { value: 'Rs-4598057.5', label: 'TOTAL RECEIVABLE', color: '#f44336', icon: ShoppingCart }, // Red
    { value: 'Rs1693709.5', label: 'TOTAL RECEIVED AMOUNT', color: '#1e88e5', icon: BarChart }, // Blue
    { value: 'Rs3353701', label: 'TOTAL DISCOUNT GIVEN', color: '#ff9800', icon: BarChart }, // Orange
    { value: 'Rs-2904348', label: 'TOTAL REVENUE', color: '#4caf50', icon: BarChart } // Green
  ];

  // 8 Smaller Indicator Cards
  const smallMetrics = [
    [
      { label: 'TOTAL INVOICE', value: '61', icon: ReceiptLong, iconColor: '#ffffff', iconBg: '#f44336' },
      { label: 'TOTAL CUSTOMER', value: '20', icon: Person, iconColor: '#ffffff', iconBg: '#4caf50' }
    ],
    [
      { label: 'SALES', value: 'Rs449353', icon: BarChart, iconColor: '#ffffff', iconBg: '#4caf50' },
      { label: 'TOTAL SUPPLIER', value: '3', icon: Person, iconColor: '#ffffff', iconBg: '#4caf50' }
    ],
    [
      { label: 'SOLD PRODUCTS TYPES', value: '77', icon: ShoppingCart, iconColor: '#ffffff', iconBg: '#1e88e5' },
      { label: 'TOTAL ITEMS IN STOCK', value: '34', icon: ShoppingCart, iconColor: '#ffffff', iconBg: '#1e88e5' }
    ],
    [
      { label: 'TOTAL SOLD PRO. QTY', value: '6919', icon: ShoppingCart, iconColor: '#ffffff', iconBg: '#ff9800' },
      { label: 'TOTAL ITEM CATEGORIES', value: '35', icon: Category, iconColor: '#ffffff', iconBg: '#ff9800' }
    ]
  ];

  // Recent Invoices Table Data
  const recentInvoices = [
    { index: 1, name: 'Hari', invoiceId: '111', amount: 'Rs499', status: 'Paid' },
    { index: 2, name: 'Arabai', invoiceId: '110', amount: 'Rs25', status: 'Unpaid' },
    { index: 3, name: 'hitesh sankhe', invoiceId: '105', amount: 'Rs72', status: 'Paid' },
    { index: 4, name: 'rr', invoiceId: '103', amount: 'Rs36', status: 'Unpaid' },
    { index: 5, name: 'Arabai', invoiceId: '101', amount: 'Rs8400', status: 'Unpaid' },
    { index: 6, name: 'Mr test', invoiceId: '100', amount: 'Rs300', status: 'Unpaid' },
    { index: 7, name: 'hitesh sankhe', invoiceId: '99', amount: 'Rs622', status: 'Paid' },
    { index: 8, name: 'Mr test', invoiceId: '95', amount: 'Rs4620', status: 'Unpaid' },
    { index: 9, name: 'gerry', invoiceId: '94', amount: 'Rs0', status: 'Paid' }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: 3, fontFamily: '"Inter", sans-serif' }}>

      {/* 1. Quick Actions Row */}
      <Grid container spacing={2}>
        {quickActions.map((action, idx) => {
          const ActionIcon = action.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                sx={{
                  borderRadius: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  '&:hover': { backgroundColor: '#f8fafc' }
                }}
              >
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <ActionIcon sx={{ fontSize: 24, color: '#1976d2', mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontFamily: '"Inter", sans-serif', fontSize: '0.8rem' }}>
                    {action.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Section Header */}
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', fontFamily: '"Inter", sans-serif' }}>
        Last 365 Days Reports
      </Typography>

      {/* 2. Four Colored Stats Cards */}
      <Grid container spacing={2}>
        {largeStats.map((stat, idx) => {
          const StatIcon = stat.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                sx={{
                  backgroundColor: stat.color,
                  color: '#ffffff',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  height: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  px: 2.5
                }}
              >
                {/* Watermark Icon */}
                <StatIcon
                  sx={{
                    position: 'absolute',
                    right: -10,
                    bottom: -10,
                    fontSize: 80,
                    color: 'rgba(255, 255, 255, 0.08)'
                  }}
                />

                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Inter", sans-serif', fontSize: '1.4rem', zIndex: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.5px', fontSize: '0.65rem', mt: 0.5, opacity: 0.9, zIndex: 1 }}>
                  {stat.label}
                </Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* 3. Eight Smaller Metric Cards Grid */}
      <Grid container spacing={2}>
        {smallMetrics.map((column, colIdx) => (
          <Grid item xs={12} sm={6} md={3} key={colIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {column.map((metric, metricIdx) => {
              const MetricIcon = metric.icon;
              return (
                <Card
                  key={metricIdx}
                  sx={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2
                  }}
                >
                  <Avatar sx={{ bgcolor: metric.iconBg, width: 36, height: 36 }}>
                    <MetricIcon sx={{ fontSize: 18, color: metric.iconColor }} />
                  </Avatar>
                  <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
                      {metric.label}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: '"Inter", sans-serif', lineHeight: 1.2 }}>
                      {metric.value}
                    </Typography>
                  </Box>
                </Card>
              );
            })}
          </Grid>
        ))}
      </Grid>

      {/* 4. Bottom Row: Donut Chart & Recent Invoices */}
      <Grid container spacing={3}>

        {/* Left: 365 Days Sales chart (Donut) */}
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: '100%' }}>
            <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: '"Inter", sans-serif' }}>
                365 Days Sales chart
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, position: 'relative' }}>

              {/* Custom SVG Donut Chart */}
              <svg width="200" height="200" viewBox="0 0 220 220">
                {/* Green Arc (Active/Received) */}
                <circle
                  cx="110"
                  cy="110"
                  r="80"
                  fill="transparent"
                  stroke="#4caf50"
                  strokeWidth="20"
                  strokeDasharray="502"
                  strokeDashoffset="120"
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
                {/* Orange Arc (Receivable) */}
                <circle
                  cx="110"
                  cy="110"
                  r="80"
                  fill="transparent"
                  stroke="#ff9800"
                  strokeWidth="20"
                  strokeDasharray="502"
                  strokeDashoffset="380"
                  strokeLinecap="round"
                  style={{ transform: 'rotate(50deg)', transformOrigin: 'center' }}
                />
              </svg>

              {/* Text in Center */}
              <Box
                sx={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: '"Inter", sans-serif', fontSize: '0.8rem' }}>
                  Total Receivable %
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: '"Inter", sans-serif', mt: 0.5 }}>
                  158.32
                </Typography>
              </Box>

            </Box>
          </Card>
        </Grid>

        {/* Right: Recent Invoices Table */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: '"Inter", sans-serif' }}>
                Recent Invoices
              </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: 'none', bgcolor: 'transparent' }}>
              <Table size="small">
                <TableBody sx={{ '& tr': { '&:hover': { bgcolor: '#f8fafc' } }, '& td': { borderBottom: '1px solid #f1f5f9', px: 2, py: 1, fontFamily: '"Inter", sans-serif', fontSize: '0.825rem', color: '#475569' } }}>
                  {recentInvoices.map((row) => (
                    <TableRow key={row.index}>
                      <TableCell sx={{ width: 40, color: '#94a3b8 !important' }}>{row.index}</TableCell>
                      <TableCell sx={{ color: '#0f172a !important', fontWeight: 500 }}>{row.name}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{
                            textDecoration: 'underline',
                            color: '#1976d2',
                            cursor: 'pointer',
                            fontSize: '0.825rem',
                            fontFamily: '"Inter", sans-serif'
                          }}
                        >
                          {row.invoiceId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: '600 !important', color: '#334155 !important' }}>{row.amount}</TableCell>
                      <TableCell align="right" sx={{ width: 100 }}>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            bgcolor: row.status === 'Paid' ? '#ecfdf5' : '#fef2f2',
                            color: row.status === 'Paid' ? '#047857' : '#b91c1c',
                            borderRadius: 1,
                            height: 18
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default DashboardOverview;
