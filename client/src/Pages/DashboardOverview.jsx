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
  LinearProgress
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
  LocalActivity as PromoIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data States
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loans, setLoans] = useState([]);
  const [currency, setCurrency] = useState('Rs.');

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) return;

      // Fetch core SQLite database tables in parallel
      const [prodRes, salesRes, catRes, supRes, settingsRes, invoiceRes, expenseRes, loanRes] = await Promise.all([
        fetch(`${API_URL}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/sales`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/categories`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/supplier-invoices`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/expenses`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/loans`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (
        prodRes.status === 401 ||
        salesRes.status === 401 ||
        catRes.status === 401 ||
        expenseRes.status === 401 ||
        loanRes.status === 401
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const prodData = await prodRes.json();
      const salesData = await salesRes.json();
      const catData = await catRes.json();
      const supData = await supRes.json();
      const invoiceData = invoiceRes.ok ? await invoiceRes.json() : [];
      const expenseData = expenseRes.ok ? await expenseRes.json() : [];
      const loanData = loanRes.ok ? await loanRes.json() : [];

      setProducts(Array.isArray(prodData) ? prodData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);
      setSupplierInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setLoans(Array.isArray(loanData) ? loanData : []);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData && settingsData.currency) {
          setCurrency(settingsData.currency);
        }
      }

    } catch (err) {
      setError('Failed to fetch dashboard overview metrics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ── Metrics Calculations ───────────────────────────────────────
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
  const totalInvoices = sales.length;
  
  // Tied-up Stock assets
  const stockAssetsValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);

  // Expired Products count (stock > 0 and expiryDate is in the past)
  const expiredItemsCount = products.filter(p => {
    if (!p.expiryDate || p.stock <= 0) return false;
    return dayjs(p.expiryDate).isBefore(dayjs().startOf('day'));
  }).length;

  // Dead Stock Products count (stock > 0 and no sales in last 30 days)
  const deadStockItemsCount = products.filter(p => {
    if (p.stock <= 0) return false;
    const limitDate = dayjs().subtract(30, 'day');
    const hasRecentSale = sales.some(sale => {
      const saleDate = dayjs(sale.createdAt);
      if (saleDate.isBefore(limitDate)) return false;
      return sale.items.some(item => item.productId === p.id);
    });
    return !hasRecentSale;
  }).length;

  // Low Stock Products (stock <= 5)
  const lowStockProducts = products.filter(p => p.stock <= 5);

  // Operating Expenses Summary
  const storeOperatingExpenses = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  const netIncome = totalRevenue - storeOperatingExpenses;

  // Outstanding Debt (Payable Loans) vs Receivable Loans
  const loansPayable = loans.filter(l => l.type === 'Payable' && l.status !== 'Paid').reduce((sum, l) => sum + l.amount, 0);
  const loansReceivable = loans.filter(l => l.type === 'Receivable' && l.status !== 'Paid').reduce((sum, l) => sum + l.amount, 0);

  // Quick Action Config
  const quickActions = [
    { label: 'POS Cashier', path: '/pos', color: '#3b82f6', desc: 'Perform new sales checkout' },
    { label: 'Products list', path: '/products', color: '#10b981', desc: 'Add or update stock items' },
    { label: 'Category list', path: '/categories', color: '#8b5cf6', desc: 'Manage item classifications' },
    { label: 'Invoices record', path: '/suppliers-invoice', color: '#f59e0b', desc: 'Log supplier stock invoices' }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: 4, fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header Info */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Dashboard Overview
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Real-time summary of store sales, stock valuation, operating costs, and inventory status.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* 1. Quick Navigation Actions */}
      <Grid container spacing={2}>
        {quickActions.map((action, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card
              component={Link}
              to={action.path}
              sx={{
                display: 'block',
                textDecoration: 'none',
                borderRadius: 1,
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: action.color,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {action.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {action.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 2. Core Financial metrics (Large cards) */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: 1.5, position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 90, justifyContent: 'center' }}>
              <MoneyIcon sx={{ position: 'absolute', right: -15, bottom: -15, fontSize: 100, color: 'rgba(255, 255, 255, 0.08)' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, zIndex: 1 }}>
                {currency} {totalRevenue.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.5px', mt: 1, opacity: 0.9, zIndex: 1 }}>
                TOTAL SALES REVENUE
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#0d9488', color: '#fff', borderRadius: 1.5, position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 90, justifyContent: 'center' }}>
              <InventoryIcon sx={{ position: 'absolute', right: -15, bottom: -15, fontSize: 100, color: 'rgba(255, 255, 255, 0.08)' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, zIndex: 1 }}>
                {currency} {stockAssetsValue.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.5px', mt: 1, opacity: 0.9, zIndex: 1 }}>
                STOCK ASSETS VALUE
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#dc2626', color: '#fff', borderRadius: 1.5, position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 90, justifyContent: 'center' }}>
              <ExpenseIcon sx={{ position: 'absolute', right: -15, bottom: -15, fontSize: 100, color: 'rgba(255, 255, 255, 0.08)' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, zIndex: 1 }}>
                {currency} {storeOperatingExpenses.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.5px', mt: 1, opacity: 0.9, zIndex: 1 }}>
                STORE OPERATING EXPENSES
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: netIncome >= 0 ? '#10b981' : '#f97316', color: '#fff', borderRadius: 1.5, position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 90, justifyContent: 'center' }}>
              <TrendingIcon sx={{ position: 'absolute', right: -15, bottom: -15, fontSize: 100, color: 'rgba(255, 255, 255, 0.08)' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, zIndex: 1 }}>
                {currency} {netIncome.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.5px', mt: 1, opacity: 0.9, zIndex: 1 }}>
                NET OPERATING INCOME
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Small Indicator & Alert Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
              <Avatar sx={{ bgcolor: '#eff6ff', width: 36, height: 36, color: '#3b82f6' }}>
                <CartIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  PRODUCTS
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {products.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
              <Avatar sx={{ bgcolor: '#f0fdf4', width: 36, height: 36, color: '#10b981' }}>
                <InventoryIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  UNITS IN STOCK
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {totalStockUnits}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
              <Avatar sx={{ bgcolor: '#faf5ff', width: 36, height: 36, color: '#8b5cf6' }}>
                <CategoryIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  CATEGORIES
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {categories.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
              <Avatar sx={{ bgcolor: '#fffbeb', width: 36, height: 36, color: '#d97706' }}>
                <PeopleIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  SUPPLIERS
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {suppliers.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expired Products alert */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            component={Link}
            to="/expired-products"
            sx={{
              border: expiredItemsCount > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              bgcolor: expiredItemsCount > 0 ? '#fff5f5' : '#fff',
              borderRadius: 1,
              textDecoration: 'none',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: expiredItemsCount > 0 ? '#fee2e2' : '#f8fafc' }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
              <Avatar sx={{ bgcolor: expiredItemsCount > 0 ? '#fee2e2' : '#f8fafc', width: 36, height: 36, color: '#ef4444' }}>
                <WarningIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  EXPIRED ITEMS
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: expiredItemsCount > 0 ? '#dc2626' : '#0f172a', lineHeight: 1.2 }}>
                  {expiredItemsCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Dead Stock alert */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card
            component={Link}
            to="/dead-stock"
            sx={{
              border: deadStockItemsCount > 0 ? '1px solid #fde047' : '1px solid #e2e8f0',
              bgcolor: deadStockItemsCount > 0 ? '#fefce8' : '#fff',
              borderRadius: 1,
              textDecoration: 'none',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: deadStockItemsCount > 0 ? '#fef9c3' : '#f8fafc' }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
              <Avatar sx={{ bgcolor: deadStockItemsCount > 0 ? '#fef9c3' : '#f8fafc', width: 36, height: 36, color: '#ca8a04' }}>
                <WarningIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  DEAD STOCK
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: deadStockItemsCount > 0 ? '#a16207' : '#0f172a', lineHeight: 1.2 }}>
                  {deadStockItemsCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 4. Double Column Details Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Recent Logs */}
        <Grid item xs={12} md={7.5}>
          <Stack spacing={3}>
            {/* Sales Log */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Recent Sale Transactions
                </Typography>
                <Button
                  component={Link}
                  to="/transaction"
                  variant="text"
                  size="small"
                  endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
                  sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  View Transactions Log
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: 'none', bgcolor: 'transparent' }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow sx={{ '& th': { py: 1.25, fontSize: '0.78rem', fontWeight: 600 } }}>
                      <TableCell>Receipt No</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Items Count</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell align="right">Paid Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No sales transactions recorded yet. Go to POS Cashier to start.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.slice(0, 5).map((sale) => (
                        <TableRow key={sale.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5 } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>
                            {sale.receiptNo}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {dayjs(sale.createdAt).format('DD/MM/YYYY hh:mm A')}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                          </TableCell>
                          <TableCell sx={{ color: '#dc2626', fontWeight: 500 }}>
                            {currency}{sale.discount.toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {currency}{sale.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label="Paid"
                              size="small"
                              sx={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: '#ecfdf5',
                                color: '#047857',
                                borderRadius: 1,
                                height: 20
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

            {/* Supplier Invoices Log */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Recent Supplier Invoices
                </Typography>
                <Button
                  component={Link}
                  to="/suppliers-invoice"
                  variant="text"
                  size="small"
                  endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
                  sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  View Invoices
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: 'none', bgcolor: 'transparent' }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow sx={{ '& th': { py: 1.25, fontSize: '0.78rem', fontWeight: 600 } }}>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Grand Total</TableCell>
                      <TableCell>Due Amount</TableCell>
                      <TableCell align="right">Payment Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {supplierInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No supplier invoices recorded yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplierInvoices.slice(0, 5).map((inv) => (
                        <TableRow key={inv.id} hover sx={{ '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5 } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#0891b2' }}>
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {inv.supplier?.name || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {dayjs(inv.date).format('DD/MM/YYYY')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {currency}{inv.grandTotal.toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ color: inv.due > 0 ? '#dc2626' : '#10b981', fontWeight: 600 }}>
                            {currency}{inv.due.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={inv.due > 0 ? 'Due' : 'Paid'}
                              size="small"
                              sx={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: inv.due > 0 ? '#fef2f2' : '#ecfdf5',
                                color: inv.due > 0 ? '#b91c1c' : '#047857',
                                borderRadius: 1,
                                height: 20
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
          </Stack>
        </Grid>

        {/* Right Column: Alerts & Operational Configs */}
        <Grid item xs={12} md={4.5}>
          <Stack spacing={3}>
            {/* Low Stock Alerts */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
              <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Low Stock Inventory Warnings
                </Typography>
                {lowStockProducts.length > 0 && (
                  <Chip
                    label={`${lowStockProducts.length} items`}
                    size="small"
                    color="error"
                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
              <CardContent sx={{ p: 3 }}>
                {lowStockProducts.length === 0 ? (
                  <Stack alignItems="center" spacing={1.5} sx={{ py: 2 }}>
                    <SuccessIcon sx={{ color: '#10b981', fontSize: 32 }} />
                    <Typography variant="body2" color="text.secondary">
                      All products have healthy stock levels.
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={2.5}>
                    {lowStockProducts.slice(0, 5).map((p) => {
                      const percentage = (p.stock / 5) * 100;
                      return (
                        <Box key={p.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {p.name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626' }}>
                              {p.stock} {p.unit || 'pcs'} left
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage > 100 ? 100 : percentage}
                            sx={{
                              height: 5,
                              borderRadius: 2.5,
                              bgcolor: '#f1f5f9',
                              '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' }
                            }}
                          />
                        </Box>
                      );
                    })}
                    {lowStockProducts.length > 5 && (
                      <Button
                        component={Link}
                        to="/products"
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ textTransform: 'none', mt: 1 }}
                      >
                        View All Low Stock Items
                      </Button>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Outstanding Debts / Receivables Card */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
              <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Loans & Debt Obligations
                </Typography>
              </Box>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fef2f2', p: 2, borderRadius: 1.5, border: '1px solid #fee2e2' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>We Owe (Payable)</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#dc2626', mt: 0.25 }}>
                      {currency} {loansPayable.toFixed(2)}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ color: '#ef4444' }} />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ecfdf5', p: 2, borderRadius: 1.5, border: '1px solid #d1fae5' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Owed to Us (Receivable)</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#059669', mt: 0.25 }}>
                      {currency} {loansReceivable.toFixed(2)}
                    </Typography>
                  </Box>
                  <PromoIcon sx={{ color: '#10b981' }} />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
