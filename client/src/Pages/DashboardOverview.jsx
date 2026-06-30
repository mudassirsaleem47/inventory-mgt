import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Stack
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Description as InvoiceIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://localhost:5000' 
  : (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost') 
      ? import.meta.env.VITE_API_URL 
      : window.location.origin);

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currency, setCurrency] = useState('Rs.');

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setIsRefreshing(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch dashboard metrics');

      setProducts(Array.isArray(data.products) ? data.products : []);
      setSales(Array.isArray(data.sales) ? data.sales : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
      setSupplierInvoices(Array.isArray(data.supplierInvoices) ? data.supplierInvoices : []);
      setLoans(Array.isArray(data.loans) ? data.loans : []);
      setCustomers(Array.isArray(data.customers) ? data.customers : []);

      if (data.settings && data.settings.currency) {
        setCurrency(data.settings.currency);
      }
    } catch (err) {
      setError('Failed to fetch dashboard overview metrics.');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefreshClick = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress thickness={4} size={50} />
      </Box>
    );
  }

  // ── Metrics Calculations ───────────────────────────────────────
  // Loans summary
  const loansPayable = loans.filter(l => l.type === 'Payable' && l.status !== 'Paid').reduce((sum, l) => sum + l.amount, 0);
  const loansReceivable = loans.filter(l => l.type === 'Receivable' && l.status !== 'Paid').reduce((sum, l) => sum + l.amount, 0);

  // Big Cards Calculations
  const totalReceivable = loansReceivable - loansPayable;
  const totalReceivedAmount = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalDiscountGiven = sales.reduce((sum, s) => sum + s.discount, 0);
  const totalRevenue = totalReceivedAmount + totalReceivable;

  // Small Cards Calculations
  const totalInvoiceCount = sales.length;
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  
  // Count of sold product types
  const soldProductTypesSet = new Set();
  sales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        if (item.productId) soldProductTypesSet.add(item.productId);
        else if (item.name) soldProductTypesSet.add(item.name);
      });
    }
  });
  const soldProductTypesCount = soldProductTypesSet.size;

  const totalSoldQtyCount = sales.reduce((sum, s) => {
    const qty = s.items ? s.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) : 0;
    return sum + qty;
  }, 0);

  const totalCustomerCount = customers.length;
  const totalSupplierCount = suppliers.length;
  const totalItemsInStockCount = products.filter(p => p.stock > 0).length;
  const totalCategoriesCount = categories.length;

  // Chart percentage
  const totalReceivablePercent = totalRevenue !== 0 
    ? (Math.abs(totalReceivable) / Math.abs(totalRevenue)) * 100 
    : 0;

  // Donut chart segments calculations
  const totalSum = totalReceivedAmount + totalDiscountGiven + Math.abs(totalReceivable);
  const receivedPct = totalSum > 0 ? (totalReceivedAmount / totalSum) * 100 : 60;
  const discountPct = totalSum > 0 ? (totalDiscountGiven / totalSum) * 100 : 25;
  const receivablePct = totalSum > 0 ? (Math.abs(totalReceivable) / totalSum) * 100 : 15;

  // SVG parameters for donut chart
  const radius = 60;
  const strokeWidth = 14;
  const circ = 2 * Math.PI * radius;

  // Segment stroke offsets
  const receivedDashoffset = circ - (receivedPct / 100) * circ;
  const discountDashoffset = circ - (discountPct / 100) * circ;
  const receivableDashoffset = circ - (receivablePct / 100) * circ;

  const quickActions = [
    { label: 'Cash Receivable', path: '/loan', icon: <MoneyIcon sx={{ fontSize: 24 }} /> },
    { label: 'Add Products', path: '/products/add', icon: <CartIcon sx={{ fontSize: 24 }} /> },
    { label: 'Add Invoice', path: '/pos', icon: <InvoiceIcon sx={{ fontSize: 24 }} /> },
    { label: 'Company Info', path: '/setting', icon: <SettingsIcon sx={{ fontSize: 24 }} /> }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', pb: 4 }}>
      {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>{error}</Alert>}

      {/* 1. Top Quick Action Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {quickActions.map((action, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Card
              component={Link}
              to={action.path}
              sx={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 2.5,
                bgcolor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
                  borderColor: '#3b82f6',
                  '& .action-icon-box': {
                    color: '#2563eb'
                  }
                }
              }}
            >
              <Box 
                className="action-icon-box"
                sx={{ 
                  color: '#2563eb', 
                  mb: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                {action.icon}
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                {action.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 2. Last 365 Days Reports Banner */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem', tracking: '0.5px' }}>
          Last 365 Days Reports
        </Typography>
        <IconButton 
          onClick={handleRefreshClick}
          size="small"
          sx={{ 
            color: '#475569', 
            bgcolor: '#ffffff', 
            border: '1px solid #e5e7eb',
            '&:hover': { bgcolor: '#f8fafc' }
          }}
        >
          <RefreshIcon 
            sx={{ 
              fontSize: 16,
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} 
          />
        </IconButton>
      </Box>

      {/* 3. Four Big Colored Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* TOTAL RECEIVABLE (Red) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: '#f44336', 
              color: '#ffffff', 
              borderRadius: '6px',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: 115,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: 3
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.65rem' }}>
              {currency}{totalReceivable.toFixed(1)}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', mt: 0.5, letterSpacing: '0.5px', fontSize: '0.72rem' }}>
              TOTAL RECEIVABLE
            </Typography>
            <CartIcon 
              sx={{ 
                position: 'absolute', 
                bottom: -15, 
                right: -10, 
                fontSize: '6.5rem', 
                color: 'rgba(255, 255, 255, 0.08)' 
              }} 
            />
          </Card>
        </Grid>

        {/* TOTAL RECEIVED AMOUNT (Blue) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: '#2196f3', 
              color: '#ffffff', 
              borderRadius: '6px',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: 115,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: 3
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.65rem' }}>
              {currency}{totalReceivedAmount.toFixed(1)}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', mt: 0.5, letterSpacing: '0.5px', fontSize: '0.72rem' }}>
              TOTAL RECEIVED AMOUNT
            </Typography>
            <BarChartIcon 
              sx={{ 
                position: 'absolute', 
                bottom: -15, 
                right: -10, 
                fontSize: '6.5rem', 
                color: 'rgba(255, 255, 255, 0.08)' 
              }} 
            />
          </Card>
        </Grid>

        {/* TOTAL DISCOUNT GIVEN (Orange) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: '#ff9800', 
              color: '#ffffff', 
              borderRadius: '6px',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: 115,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: 3
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.65rem' }}>
              {currency}{totalDiscountGiven.toFixed(0)}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', mt: 0.5, letterSpacing: '0.5px', fontSize: '0.72rem' }}>
              TOTAL DISCOUNT GIVEN
            </Typography>
            <BarChartIcon 
              sx={{ 
                position: 'absolute', 
                bottom: -15, 
                right: -10, 
                fontSize: '6.5rem', 
                color: 'rgba(255, 255, 255, 0.08)' 
              }} 
            />
          </Card>
        </Grid>

        {/* TOTAL REVENUE (Green) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: '#4caf50', 
              color: '#ffffff', 
              borderRadius: '6px',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: 115,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: 3
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.65rem' }}>
              {currency}{totalRevenue.toFixed(0)}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', mt: 0.5, letterSpacing: '0.5px', fontSize: '0.72rem' }}>
              TOTAL REVENUE
            </Typography>
            <TrendingIcon 
              sx={{ 
                position: 'absolute', 
                bottom: -15, 
                right: -10, 
                fontSize: '6.5rem', 
                color: 'rgba(255, 255, 255, 0.08)' 
              }} 
            />
          </Card>
        </Grid>
      </Grid>

      {/* 4. Eight Smaller Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'TOTAL INVOICE', value: totalInvoiceCount, icon: <InvoiceIcon sx={{ fontSize: 20 }} />, color: '#ef5350', bg: '#fef2f2' },
          { label: 'SALES', value: `${currency}${totalSalesRevenue.toFixed(0)}`, icon: <BarChartIcon sx={{ fontSize: 20 }} />, color: '#66bb6a', bg: '#ecfdf5' },
          { label: 'SOLD PRODUCTS TYPES', value: soldProductTypesCount, icon: <CartIcon sx={{ fontSize: 20 }} />, color: '#42a5f5', bg: '#eff6ff' },
          { label: 'TOTAL SOLD PRO. QTY', value: totalSoldQtyCount, icon: <CartIcon sx={{ fontSize: 20 }} />, color: '#ffa726', bg: '#fff7ed' },
          { label: 'TOTAL CUSTOMER', value: totalCustomerCount, icon: <PeopleIcon sx={{ fontSize: 20 }} />, color: '#66bb6a', bg: '#ecfdf5' },
          { label: 'TOTAL SUPPLIER', value: totalSupplierCount, icon: <PeopleIcon sx={{ fontSize: 20 }} />, color: '#66bb6a', bg: '#ecfdf5' },
          { label: 'TOTAL ITEMS IN STOCK', value: totalItemsInStockCount, icon: <CartIcon sx={{ fontSize: 20 }} />, color: '#42a5f5', bg: '#eff6ff' },
          { label: 'TOTAL ITEM CATEGORIES', value: totalCategoriesCount, icon: <CartIcon sx={{ fontSize: 20 }} />, color: '#ffa726', bg: '#fff7ed' },
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card 
              sx={{ 
                bgcolor: '#ffffff', 
                borderRadius: '6px', 
                border: '1px solid #e5e7eb',
                p: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 70
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: card.bg, 
                  color: card.color, 
                  width: 42, 
                  height: 42, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                {card.icon}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 650, fontSize: '0.66rem', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  {card.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.25, fontSize: '1.25rem' }}>
                  {card.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 5. Bottom Section: 365 Days Sales Chart & Recent Invoices */}
      <Grid container spacing={3}>
        {/* Left Column: Donut Chart */}
        <Grid item xs={12} lg={4}>
          <Card 
            sx={{ 
              bgcolor: '#ffffff', 
              borderRadius: '6px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 380
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 4, alignSelf: 'flex-start', fontSize: '0.85rem' }}>
              365 Days Sales chart
            </Typography>

            <Box sx={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                {/* Gray Background circle */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                />

                {/* Received (Green) segment */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="transparent"
                  stroke="#4caf50"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circ}
                  strokeDashoffset={receivedDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />

                {/* Discount Given (Orange) segment */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="transparent"
                  stroke="#ffa726"
                  strokeWidth={strokeWidth - 1}
                  strokeDasharray={circ}
                  strokeDashoffset={discountDashoffset}
                  strokeLinecap="round"
                  style={{ 
                    transition: 'stroke-dashoffset 0.8s ease-in-out',
                    transform: `rotate(${receivedPct * 3.6}deg)`,
                    transformOrigin: '110px 110px'
                  }}
                />

                {/* Receivable (Red) segment */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="transparent"
                  stroke="#ef5350"
                  strokeWidth={strokeWidth + 2}
                  strokeDasharray={circ}
                  strokeDashoffset={receivableDashoffset}
                  strokeLinecap="round"
                  style={{ 
                    transition: 'stroke-dashoffset 0.8s ease-in-out',
                    transform: `rotate(${(receivedPct + discountPct) * 3.6}deg)`,
                    transformOrigin: '110px 110px'
                  }}
                />
              </svg>

              {/* Text inside donut */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textAlign: 'center',
                  width: 130
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', mb: 0.25 }}>
                  Total Receivable %
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.8rem' }}>
                  {totalReceivablePercent.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Recent Invoices Table */}
        <Grid item xs={12} lg={8}>
          <Card 
            sx={{ 
              bgcolor: '#ffffff', 
              borderRadius: '6px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              p: 2.5,
              height: 380,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>
                Recent Invoices
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                  <RefreshIcon sx={{ fontSize: 14 }} onClick={() => fetchData(true)} />
                </IconButton>
                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                  <SettingsIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Stack>
            </Box>

            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Table size="small" sx={{ '& td, & th': { borderBottom: '1px solid #f1f5f9', py: 1.2 } }}>
                <TableBody>
                  {supplierInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                        No supplier invoices recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    supplierInvoices.slice(0, 9).map((inv, idx) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ color: '#64748b', fontWeight: 600, width: 40 }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell sx={{ color: '#334155', fontWeight: 500 }}>
                          {inv.supplier?.name || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ width: 120 }}>
                          <Link 
                            to="/suppliers-invoice" 
                            style={{ 
                              color: '#2563eb', 
                              textDecoration: 'underline', 
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            {inv.invoiceNo}
                          </Link>
                        </TableCell>
                        <TableCell sx={{ color: '#334155', fontWeight: 600, fontSize: '0.85rem' }}>
                          {currency}{inv.grandTotal.toFixed(0)}
                        </TableCell>
                        <TableCell align="right" sx={{ width: 100 }}>
                          <Chip
                            label={inv.due > 0 ? 'Unpaid' : 'Paid'}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              bgcolor: inv.due > 0 ? '#ef4444' : '#4caf50',
                              color: '#ffffff',
                              borderRadius: '3px',
                              height: 18,
                              px: 0.5,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
