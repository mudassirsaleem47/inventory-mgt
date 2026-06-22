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
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Pagination,
  Tabs,
  Tab,
  CardHeader
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  ReceiptLong as ReceiptIcon,
  TrendingUp as TrendingIcon,
  ArrowForward as ArrowIcon,
  Inventory as InventoryIcon,
  TrendingDown as ExpenseIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as SuccessIcon,
  LocalActivity as PromoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CalendarToday as DateIcon,
  ArrowUpward as UpwardIcon,
  ArrowDownward as DownwardIcon,
  NotificationsActive as AlertCenterIcon,
  Payments as LoansIcon,
  Leaderboard as ChartsIcon
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
  const [liveTime, setLiveTime] = useState(new Date());

  // Data States
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loans, setLoans] = useState([]);
  const [currency, setCurrency] = useState('Rs.');

  // UI Interactive States
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', '7days', '30days'
  const [tabValue, setTabValue] = useState(0); // 0 = Sales, 1 = Supplier Invoices
  const [salesSearch, setSalesSearch] = useState('');
  const [invoicesSearch, setInvoicesSearch] = useState('');
  const [salesPage, setSalesPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);

  const itemsPerPage = 5;

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
      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      setLoans(Array.isArray(data.loans) ? data.loans : []);

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

  // Live timer tick
  useEffect(() => {
    fetchData();
    const clockTimer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
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

  // ── Date Filters Applied to Sales and Expenses ──────────────────
  const now = dayjs();
  const filteredSales = sales.filter(sale => {
    if (dateFilter === 'today') return dayjs(sale.createdAt).isSame(now, 'day');
    if (dateFilter === '7days') return dayjs(sale.createdAt).isAfter(now.subtract(7, 'day').startOf('day'));
    if (dateFilter === '30days') return dayjs(sale.createdAt).isAfter(now.subtract(30, 'day').startOf('day'));
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    if (dateFilter === 'today') return dayjs(exp.date).isSame(now, 'day');
    if (dateFilter === '7days') return dayjs(exp.date).isAfter(now.subtract(7, 'day').startOf('day'));
    if (dateFilter === '30days') return dayjs(exp.date).isAfter(now.subtract(30, 'day').startOf('day'));
    return true;
  });

  // ── Metrics Calculations ───────────────────────────────────────
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalDiscount = filteredSales.reduce((sum, sale) => sum + sale.discount, 0);
  const storeOperatingExpenses = filteredExpenses.reduce((sum, ex) => sum + ex.amount, 0);
  const netIncome = totalRevenue - storeOperatingExpenses;
  const avgSaleValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  
  // Total Inventory Valuation (Snapshots unaffected by time periods)
  const stockAssetsValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);

  // Expired Products count (stock > 0 and expiryDate is in the past)
  const expiredProducts = products.filter(p => {
    if (!p.expiryDate || p.stock <= 0) return false;
    return dayjs(p.expiryDate).isBefore(dayjs().startOf('day'));
  });

  // Dead Stock Products count (stock > 0 and no sales in last 30 days)
  const deadStockProducts = products.filter(p => {
    if (p.stock <= 0) return false;
    const limitDate = dayjs().subtract(30, 'day');
    const hasRecentSale = sales.some(sale => {
      const saleDate = dayjs(sale.createdAt);
      if (saleDate.isBefore(limitDate)) return false;
      return sale.items.some(item => item.productId === p.id);
    });
    return !hasRecentSale;
  });

  // Low Stock Products (stock <= 5)
  const lowStockProducts = products.filter(p => p.stock <= 5);

  // Outstanding Debt vs Receivable Loans
  const loansPayable = loans.filter(l => l.type === 'Payable' && l.status !== 'Paid').reduce((sum, l) => sum + l.amount, 0);
  const loansReceivable = loans.filter(l => l.type === 'Receivable' && l.status !== 'Paid').reduce((sum, l) => sum + l.amount, 0);

  // ── Calculated Top Products & Categories ──────────────────────────
  const getTopProducts = () => {
    const counts = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const name = item.name;
        if (!counts[name]) counts[name] = { name, quantity: 0, total: 0 };
        counts[name].quantity += item.quantity || 0;
        counts[name].total += item.total || 0;
      });
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  };

  const getTopCategories = () => {
    const counts = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.barcode === item.barcode);
        const cat = prod?.category?.name || 'General / Uncategorized';
        if (!counts[cat]) counts[cat] = { name: cat, quantity: 0, revenue: 0 };
        counts[cat].quantity += item.quantity || 0;
        counts[cat].revenue += item.total || 0;
      });
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  };

  const topSellingList = getTopProducts();
  const topCategoriesList = getTopCategories();

  // Financial comparative calculations
  const totalFinancialSum = totalRevenue + storeOperatingExpenses;
  const revPercent = totalFinancialSum > 0 ? (totalRevenue / totalFinancialSum) * 100 : 100;
  const expPercent = totalFinancialSum > 0 ? (storeOperatingExpenses / totalFinancialSum) * 100 : 0;

  // ── Table Filtering & Search ────────────────────────────────────
  const searchedSales = filteredSales.filter(sale => {
    if (!salesSearch) return true;
    const term = salesSearch.toLowerCase();
    const receiptMatch = sale.receiptNo.toLowerCase().includes(term);
    const itemMatch = sale.items?.some(it => it.name.toLowerCase().includes(term));
    return receiptMatch || itemMatch;
  });

  const searchedInvoices = supplierInvoices.filter(inv => {
    if (!invoicesSearch) return true;
    const term = invoicesSearch.toLowerCase();
    const invoiceMatch = inv.invoiceNo.toLowerCase().includes(term);
    const supplierMatch = inv.supplier?.name?.toLowerCase().includes(term);
    const itemMatch = inv.items?.some(it => it.name?.toLowerCase().includes(term));
    return invoiceMatch || supplierMatch || itemMatch;
  });

  // Paginated Slices
  const paginatedSales = searchedSales.slice(
    (salesPage - 1) * itemsPerPage,
    salesPage * itemsPerPage
  );
  const paginatedInvoices = searchedInvoices.slice(
    (invoicesPage - 1) * itemsPerPage,
    invoicesPage * itemsPerPage
  );

  const quickActions = [
    { label: 'POS Cashier', path: '/pos', color: '#2563eb', bg: '#eff6ff', desc: 'Launch sales register', icon: <CartIcon /> },
    { label: 'Products', path: '/products', color: '#10b981', bg: '#f0fdf4', desc: 'Manage inventory items', icon: <InventoryIcon /> },
    { label: 'Add Product', path: '/products/add', color: '#a855f7', bg: '#faf5ff', desc: 'Register catalog stock', icon: <CategoryIcon /> },
    { label: 'Supplier Invoices', path: '/suppliers-invoice', color: '#f59e0b', bg: '#fffbeb', desc: 'Record stock purchases', icon: <ReceiptIcon /> }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
      
      {/* 1. Header Banner Card with live clock and filter selectors */}
      <Card 
        sx={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
          color: '#fff', 
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.15)',
          borderRadius: 2, 
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '-50px', 
            right: '-50px', 
            width: 200, 
            height: 200, 
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%'
          }} 
        />
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, tracking: '-0.5px' }}>
                  System Dashboard
                </Typography>
                <IconButton 
                  onClick={handleRefreshClick}
                  sx={{ 
                    color: '#fff', 
                    bgcolor: 'rgba(255, 255, 255, 0.1)', 
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                    transition: 'all 0.3s'
                  }}
                >
                  <RefreshIcon 
                    sx={{ 
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} 
                  />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" color="rgba(255, 255, 255, 0.85)">
                <DateIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                  {dayjs(liveTime).format('dddd, MMMM D, YYYY • h:mm:ss A')}
                </Typography>
              </Stack>
            </Grid>

            {/* Filter buttons */}
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Stack direction="row" spacing={1} sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 0.5, borderRadius: 2 }}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'today', label: 'Today' },
                  { value: '7days', label: '7 Days' },
                  { value: '30days', label: '30 Days' }
                ].map((item) => (
                  <Button
                    key={item.value}
                    size="small"
                    onClick={() => { setDateFilter(item.value); setSalesPage(1); }}
                    sx={{
                      color: dateFilter === item.value ? '#1e3a8a' : '#fff',
                      bgcolor: dateFilter === item.value ? '#fff' : 'transparent',
                      fontWeight: 700,
                      px: 2,
                      py: 0.5,
                      borderRadius: 1.5,
                      '&:hover': {
                        bgcolor: dateFilter === item.value ? '#fff' : 'rgba(255,255,255,0.15)'
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      {/* 2. Top-level Performance Indicators (Large cards with elevation) */}
      <Grid container spacing={3}>
        {/* Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              transition: 'transform 0.2s, box-shadow 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                    REVENUE ({dateFilter.toUpperCase()})
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#1e293b' }}>
                    {currency} {totalRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', borderRadius: 2, width: 48, height: 48 }}>
                  <MoneyIcon />
                </Avatar>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 2 }}>
                <UpwardIcon sx={{ color: '#10b981', fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                  Active Sales Flow
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Operating Expenses */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              transition: 'transform 0.2s, box-shadow 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                    EXPENSES ({dateFilter.toUpperCase()})
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#1e293b' }}>
                    {currency} {storeOperatingExpenses.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#fef2f2', color: '#ef4444', borderRadius: 2, width: 48, height: 48 }}>
                  <ExpenseIcon />
                </Avatar>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 2 }}>
                <DownwardIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700 }}>
                  Store Operations cost
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Net income */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              transition: 'transform 0.2s, box-shadow 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                    NET OPERATING INCOME
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 800, 
                      mt: 1, 
                      color: netIncome >= 0 ? '#10b981' : '#ef4444' 
                    }}
                  >
                    {currency} {netIncome.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: netIncome >= 0 ? '#ecfdf5' : '#fff7ed', 
                    color: netIncome >= 0 ? '#10b981' : '#f97316', 
                    borderRadius: 2, 
                    width: 48, 
                    height: 48 
                  }}
                >
                  <TrendingIcon />
                </Avatar>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 2 }}>
                {netIncome >= 0 ? (
                  <>
                    <UpwardIcon sx={{ color: '#10b981', fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                      Positive Operating Surplus
                    </Typography>
                  </>
                ) : (
                  <>
                    <DownwardIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700 }}>
                      Operating deficit
                    </Typography>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Valuation */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              transition: 'transform 0.2s, box-shadow 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                    STOCK ASSETS VALUE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#1e293b' }}>
                    {currency} {stockAssetsValue.toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f0fdf4', color: '#10b981', borderRadius: 2, width: 48, height: 48 }}>
                  <InventoryIcon />
                </Avatar>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total Asset Valuation snapshot
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. KPI Mini Summary Cards Row */}
      <Grid container spacing={2}>
        {[
          { label: 'Avg Sale Value', value: `${currency} ${avgSaleValue.toFixed(2)}`, color: '#3b82f6' },
          { label: 'Discount Granted', value: `${currency} ${totalDiscount.toFixed(2)}`, color: '#ef4444' },
          { label: 'Transactions Count', value: filteredSales.length, color: '#8b5cf6' },
          { label: 'Total Catalog Products', value: products.length, color: '#0ea5e9' }
        ].map((kpi, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Card sx={{ border: '1px solid #f1f5f9', borderRadius: 1.5, bgcolor: '#fafafa' }}>
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {kpi.label}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5, color: '#0f172a' }}>
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 4. Quick Actions Panel */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArrowIcon sx={{ fontSize: 16 }} /> QUICK DASHBOARD SHORTCUTS
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                component={Link}
                to={action.path}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: action.color,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                    '& .action-avatar': {
                      bgcolor: action.color,
                      color: '#fff'
                    }
                  }
                }}
              >
                <Avatar 
                  className="action-avatar"
                  sx={{ 
                    bgcolor: action.bg, 
                    color: action.color, 
                    borderRadius: 1.5,
                    width: 44,
                    height: 44,
                    mr: 2,
                    transition: 'all 0.3s'
                  }}
                >
                  {action.icon}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1f2937' }}>
                    {action.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {action.desc}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 5. Main Content Layout (Table & Analytics vs Warnings & Liabilities) */}
      <Grid container spacing={4}>
        {/* Left Side: Recent Sales vs Supplier Invoices & Analytics */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            
            {/* Sales vs Expenses Segment Progress Bar */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChartsIcon sx={{ color: '#6366f1' }} /> Operating Breakdown Ratio
                  </Typography>
                  <Chip 
                    label={dateFilter.toUpperCase()} 
                    size="small" 
                    sx={{ fontWeight: 700, fontSize: '0.65rem' }} 
                  />
                </Stack>

                <Box sx={{ width: '100%', mt: 1 }}>
                  <Box sx={{ display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden', bgcolor: '#e2e8f0', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                    {totalRevenue > 0 && (
                      <Tooltip title={`Revenue: ${currency}${totalRevenue.toFixed(2)} (${revPercent.toFixed(1)}%)`}>
                        <Box sx={{ width: `${revPercent}%`, bgcolor: '#10b981', transition: 'width 0.4s ease' }} />
                      </Tooltip>
                    )}
                    {storeOperatingExpenses > 0 && (
                      <Tooltip title={`Expenses: ${currency}${storeOperatingExpenses.toFixed(2)} (${expPercent.toFixed(1)}%)`}>
                        <Box sx={{ width: `${expPercent}%`, bgcolor: '#ef4444', transition: 'width 0.4s ease' }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: '50%' }} />
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                        Revenue: {currency} {totalRevenue.toFixed(2)} ({revPercent.toFixed(0)}%)
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, bgcolor: '#ef4444', borderRadius: '50%' }} />
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                        Expenses: {currency} {storeOperatingExpenses.toFixed(2)} ({expPercent.toFixed(0)}%)
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Recent Transaction Log Tabs Card */}
            <Card sx={{ borderRadius: 2 }}>
              <Box sx={{ borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={(e, val) => setTabValue(val)}
                  sx={{ 
                    '& .MuiTab-root': { fontWeight: 700, fontSize: '0.85rem', py: 2 },
                  }}
                >
                  <Tab label="Recent Transactions" icon={<CartIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                  <Tab label="Supplier Invoices" icon={<ReceiptIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                </Tabs>
                
                {/* Search Bar depending on active tab */}
                <Box sx={{ py: 1, width: { xs: '100%', sm: 'auto' } }}>
                  {tabValue === 0 ? (
                    <TextField
                      placeholder="Search receipts..."
                      size="small"
                      value={salesSearch}
                      onChange={(e) => { setSalesSearch(e.target.value); setSalesPage(1); }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, width: { xs: '100%', sm: 220 } } }}
                    />
                  ) : (
                    <TextField
                      placeholder="Search invoices..."
                      size="small"
                      value={invoicesSearch}
                      onChange={(e) => { setInvoicesSearch(e.target.value); setInvoicesPage(1); }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, width: { xs: '100%', sm: 220 } } }}
                    />
                  )}
                </Box>
              </Box>

              {/* Tab Content 1: Sales Transactions */}
              {tabValue === 0 && (
                <Box>
                  <TableContainer component={Paper} elevation={0} sx={{ border: 'none', bgcolor: 'transparent' }}>
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow sx={{ '& th': { py: 1.5, fontSize: '0.78rem', fontWeight: 700, color: '#475569' } }}>
                          <TableCell>Receipt No</TableCell>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Items Count</TableCell>
                          <TableCell>Discount</TableCell>
                          <TableCell>Total Amount</TableCell>
                          <TableCell align="right">Paid Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedSales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                {salesSearch ? 'No transactions match your search filter.' : 'No transactions recorded yet.'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSales.map((sale) => (
                            <TableRow key={sale.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5 } }}>
                              <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>
                                {sale.receiptNo}
                              </TableCell>
                              <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                {dayjs(sale.createdAt).format('DD/MM/YYYY hh:mm A')}
                              </TableCell>
                              <TableCell sx={{ color: '#475569' }}>
                                {sale.items?.length || 0} {sale.items?.length === 1 ? 'item' : 'items'}
                              </TableCell>
                              <TableCell sx={{ color: '#dc2626', fontWeight: 600 }}>
                                {currency}{sale.discount?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                                {currency}{sale.totalAmount.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label="Paid"
                                  size="small"
                                  sx={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    bgcolor: '#ecfdf5',
                                    color: '#047857',
                                    borderRadius: 1.5,
                                    height: 22
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {searchedSales.length > itemsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5, borderTop: '1px solid #e2e8f0' }}>
                      <Pagination 
                        count={Math.ceil(searchedSales.length / itemsPerPage)} 
                        page={salesPage} 
                        onChange={(e, page) => setSalesPage(page)}
                        size="small"
                        color="primary"
                        sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab Content 2: Supplier Invoices */}
              {tabValue === 1 && (
                <Box>
                  <TableContainer component={Paper} elevation={0} sx={{ border: 'none', bgcolor: 'transparent' }}>
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow sx={{ '& th': { py: 1.5, fontSize: '0.78rem', fontWeight: 700, color: '#475569' } }}>
                          <TableCell>Invoice #</TableCell>
                          <TableCell>Supplier</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Grand Total</TableCell>
                          <TableCell>Due Amount</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedInvoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                {invoicesSearch ? 'No invoices match your search filter.' : 'No supplier invoices recorded.'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedInvoices.map((inv) => (
                            <TableRow key={inv.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5 } }}>
                              <TableCell sx={{ fontWeight: 700, color: '#0891b2' }}>
                                {inv.invoiceNo}
                              </TableCell>
                              <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                                {inv.supplier?.name || 'N/A'}
                              </TableCell>
                              <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                {dayjs(inv.date).format('DD/MM/YYYY')}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                                {currency}{inv.grandTotal.toFixed(2)}
                              </TableCell>
                              <TableCell sx={{ color: inv.due > 0 ? '#dc2626' : '#10b981', fontWeight: 700 }}>
                                {currency}{inv.due.toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={inv.due > 0 ? 'Due' : 'Paid'}
                                  size="small"
                                  sx={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    bgcolor: inv.due > 0 ? '#fef2f2' : '#ecfdf5',
                                    color: inv.due > 0 ? '#b91c1c' : '#047857',
                                    borderRadius: 1.5,
                                    height: 22
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {searchedInvoices.length > itemsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5, borderTop: '1px solid #e2e8f0' }}>
                      <Pagination 
                        count={Math.ceil(searchedInvoices.length / itemsPerPage)} 
                        page={invoicesPage} 
                        onChange={(e, page) => setInvoicesPage(page)}
                        size="small"
                        color="primary"
                        sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Card>

            {/* Calculations & Top Insights Grid */}
            <Grid container spacing={3}>
              {/* Top Selling Products */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, height: '100%' }}>
                  <CardHeader 
                    title={
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Top Selling Items ({dateFilter.toUpperCase()})
                      </Typography>
                    }
                    sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}
                  />
                  <CardContent sx={{ p: 2.5 }}>
                    {topSellingList.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No sales data found for this range.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {topSellingList.map((item, idx) => {
                          const maxQty = topSellingList[0].quantity || 1;
                          const ratioPercent = (item.quantity / maxQty) * 100;
                          return (
                            <Box key={idx}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                  #{idx + 1} {item.name}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#2563eb' }}>
                                  {item.quantity} sold
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={ratioPercent} 
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3, 
                                  bgcolor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, textAlign: 'right' }}>
                                Revenue: {currency}{item.total.toFixed(2)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Revenue Categories */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, height: '100%' }}>
                  <CardHeader 
                    title={
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Category Distribution ({dateFilter.toUpperCase()})
                      </Typography>
                    }
                    sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}
                  />
                  <CardContent sx={{ p: 2.5 }}>
                    {topCategoriesList.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No category data found for this range.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {topCategoriesList.map((cat, idx) => {
                          const maxRev = topCategoriesList[0].revenue || 1;
                          const ratioPercent = (cat.revenue / maxRev) * 100;
                          return (
                            <Box key={idx}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                  {cat.name}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                                  {currency}{cat.revenue.toFixed(2)}
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={ratioPercent} 
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3, 
                                  bgcolor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

          </Stack>
        </Grid>

        {/* Right Side: Alerts Center & Liability Metrics */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            
            {/* Critical Warnings Center Panel */}
            <Card sx={{ borderRadius: 2, border: '1px solid #fca5a5' }}>
              <Box 
                sx={{ 
                  bgcolor: '#fff5f5', 
                  px: 3, 
                  py: 2.5, 
                  borderBottom: '1px solid #fca5a5', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#c53030', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AlertCenterIcon /> Warning Alert Center
                </Typography>
                
                <Stack direction="row" spacing={0.5}>
                  {lowStockProducts.length > 0 && (
                    <Chip label={`Low Stock: ${lowStockProducts.length}`} size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                  )}
                  {expiredProducts.length > 0 && (
                    <Chip label={`Expired: ${expiredProducts.length}`} size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                  )}
                </Stack>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3.5}>
                  
                  {/* Low Stock Alerts */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155', mb: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                      <span>⚠️ Low Stock Items</span>
                      <Typography component="span" variant="caption" color="text.secondary">Limit ≤ 5 left</Typography>
                    </Typography>
                    {lowStockProducts.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 1 }}>
                        ✓ All inventory items stock counts are healthy.
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {lowStockProducts.slice(0, 4).map((p) => (
                          <Box key={p.id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                                {p.name}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#dc2626' }}>
                                {p.stock} remaining
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={(p.stock / 5) * 100}
                              sx={{
                                height: 5,
                                borderRadius: 2,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' }
                              }}
                            />
                          </Box>
                        ))}
                        {lowStockProducts.length > 4 && (
                          <Button 
                            component={Link} 
                            to="/products" 
                            size="small" 
                            variant="text" 
                            sx={{ mt: 0.5, fontSize: '0.72rem', textTransform: 'none', justifyContent: 'flex-start' }}
                          >
                            View all {lowStockProducts.length} low stock warnings →
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Box>

                  <Divider />

                  {/* Expired Products alert */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155', mb: 1 }}>
                      ⌛ Expired Products
                    </Typography>
                    {expiredProducts.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 1 }}>
                        ✓ No expired products detected in inventory.
                      </Typography>
                    ) : (
                      <Stack spacing={1.25}>
                        {expiredProducts.slice(0, 3).map((p) => (
                          <Stack 
                            key={p.id} 
                            direction="row" 
                            justifyContent="space-between" 
                            alignItems="center"
                            sx={{ bgcolor: '#fff1f2', p: 1, borderRadius: 1.5, border: '1px solid #ffe4e6' }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#9f1239' }}>
                              {p.name} ({p.stock} units)
                            </Typography>
                            <Chip 
                              label={`Expired ${dayjs(p.expiryDate).format('DD/MM/YY')}`} 
                              size="small" 
                              color="error" 
                              sx={{ fontSize: '0.65rem', fontWeight: 800, height: 18 }} 
                            />
                          </Stack>
                        ))}
                        <Button 
                          component={Link} 
                          to="/expired-products" 
                          size="small" 
                          variant="text" 
                          sx={{ fontSize: '0.72rem', textTransform: 'none', justifyContent: 'flex-start' }}
                        >
                          Open Expired Items panel →
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  <Divider />

                  {/* Dead Stock alert */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155', mb: 1 }}>
                      📦 Dead Stock (Unsold &gt; 30 Days)
                    </Typography>
                    {deadStockProducts.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 1 }}>
                        ✓ No dead stock detected in inventory.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 1, display: 'block' }}>
                          There are currently <strong>{deadStockProducts.length}</strong> items in inventory that have not registered any sales transactions in the past 30 days.
                        </Typography>
                        <Button 
                          component={Link} 
                          to="/dead-stock" 
                          size="small" 
                          variant="text" 
                          sx={{ fontSize: '0.72rem', textTransform: 'none', justifyContent: 'flex-start' }}
                        >
                          Analyze Dead Stock inventory →
                        </Button>
                      </Stack>
                    )}
                  </Box>

                </Stack>
              </CardContent>
            </Card>

            {/* Outstanding Debts & Receivables Card */}
            <Card sx={{ borderRadius: 2 }}>
              <CardHeader 
                avatar={
                  <Avatar sx={{ bgcolor: '#faf5ff', color: '#a855f7' }}>
                    <LoansIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Debts & Liabilities Summary
                  </Typography>
                }
                sx={{ borderBottom: '1px solid #f1f5f9', py: 2 }}
              />
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    bgcolor: '#fff5f5', 
                    p: 2, 
                    borderRadius: 2, 
                    border: '1px solid #fee2e2' 
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Payable (Store owes partners)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#dc2626', mt: 0.5 }}>
                      {currency} {loansPayable.toFixed(2)}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ color: '#ef4444' }} />
                </Box>

                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    bgcolor: '#ecfdf5', 
                    p: 2, 
                    borderRadius: 2, 
                    border: '1px solid #d1fae5' 
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Receivable (Owed to store)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                      {currency} {loansReceivable.toFixed(2)}
                    </Typography>
                  </Box>
                  <SuccessIcon sx={{ color: '#10b981' }} />
                </Box>
                
                <Button
                  component={Link}
                  to="/loan"
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ borderRadius: 1.5, mt: 0.5 }}
                >
                  Go to Loans Ledger
                </Button>
              </CardContent>
            </Card>

          </Stack>
        </Grid>
      </Grid>
      
    </Box>
  );
};

export default DashboardOverview;
