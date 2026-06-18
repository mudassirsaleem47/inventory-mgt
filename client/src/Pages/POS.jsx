import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
} from '@mui/material';
import { Delete as DeleteIcon, Print as PrintIcon, Clear as ClearIcon, Add as AddIcon, QrCodeScanner as QrCodeScannerIcon } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const POS = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);

  // POS State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [cash, setCash] = useState('');
  const [settings, setSettings] = useState({
    storeName: 'My Store',
    currency: 'Rs.',
    receiptFooter: 'Thank you! Come again',
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastSale, setLastSale] = useState(null);

  // Manual Add Dialog
  const [openManualDialog, setOpenManualDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Camera Scanning States
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  // Fetch Settings & Products
  const fetchSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data) setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchProducts();
    focusBarcodeField();
  }, []);

  const focusBarcodeField = () => {
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 200);
  };

  // Auto-print receipt when checkout completes
  useEffect(() => {
    if (lastSale) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastSale]);

  // Fetch product by barcode string
  const fetchProductByBarcode = async (code) => {
    try {
      const token = getToken();
      if (!token) return null;

      const response = await fetch(`${API_URL}/api/products/barcode/${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error fetching barcode product:', err);
      return null;
    }
  };

  // Barcode Submit Handler
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const code = barcode.trim();
    if (!code) return;

    const product = await fetchProductByBarcode(code);
    if (!product) {
      setError(`Product with barcode "${code}" not found.`);
      setBarcode('');
      return;
    }

    addToCart(product);
    setBarcode('');
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        const newQty = newCart[existingIndex].qty + 1;
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          qty: newQty,
          total: newQty * product.price,
        };
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            qty: 1,
            total: product.price,
          },
        ];
      }
    });
    focusBarcodeField();
  };

  // Camera Control Functions
  const startCamera = async () => {
    setError('');
    setScannerError('');
    setScanning(true);

    if (!window.BarcodeDetector) {
      setScannerError(
        'Your browser does not support native camera barcode scanning. Please open this app on Google Chrome (Android) or Safari (iOS 17+). Alternatively, you can use a remote scanner app like "Barcode to PC".'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setScannerError('Could not access camera. Please allow camera permissions in your browser.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
    focusBarcodeField();
  };

  // Camera Barcode Scanning loop
  useEffect(() => {
    let intervalId;
    if (scanning && window.BarcodeDetector && !scannerError) {
      const detector = new window.BarcodeDetector({
        formats: ['code_39', 'code_128', 'ean_13', 'ean_8']
      });

      intervalId = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const detected = await detector.detect(videoRef.current);
            if (detected.length > 0) {
              const code = detected[0].rawValue;
              const product = await fetchProductByBarcode(code);

              if (product) {
                addToCart(product);
                setSuccessMsg(`Successfully scanned and added: ${product.name}`);
                setTimeout(() => setSuccessMsg(''), 3000);
                // Vibrate if supported on mobile
                if (navigator.vibrate) navigator.vibrate(200);
                stopCamera();
              } else {
                setError(`Scanned barcode "${code}" but product was not found in database.`);
                stopCamera();
              }
            }
          } catch (err) {
            console.error('Detection error:', err);
          }
        }
      }, 400); // scan every 400ms
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [scanning, scannerError]);

  const handleManualAdd = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (product) {
      addToCart(product);
    }
    setOpenManualDialog(false);
    setSelectedProductId('');
  };

  const handleQtyChange = (id, newQty) => {
    const qty = parseFloat(newQty);
    if (isNaN(qty) || qty <= 0) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? { ...item, qty, total: qty * item.price }
          : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    focusBarcodeField();
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    setCash('');
    setLastSale(null);
    setError('');
    focusBarcodeField();
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const finalDiscount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - finalDiscount);
  const paid = parseFloat(cash) || 0;
  const change = Math.max(0, paid - total);

  // Checkout Handler
  const handleCheckout = async () => {
    setError('');
    setSuccessMsg('');
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }
    if (paid < total) {
      setError('Paid amount is less than the total.');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            name: item.name,
            barcode: item.barcode,
            quantity: item.qty,
            price: item.price,
            total: item.total,
          })),
          totalAmount: total,
          paidAmount: paid,
          discount: finalDiscount,
          tax: 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Checkout failed');
      }

      const sale = await response.json();
      setLastSale(sale);
      setSuccessMsg(`Checkout successful! Receipt: ${sale.receiptNo}`);
      setCart([]);
      setCash('');
      setDiscount(0);
      focusBarcodeField();
    } catch (err) {
      setError(err.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: 3, fontFamily: '"Inter", sans-serif' }}>
      {/* Print-Only Style Overlay */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .thermal-receipt, .thermal-receipt * {
            visibility: visible;
          }
          .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
          }
          .thermal-receipt-divider {
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .thermal-receipt-center {
            text-align: center;
          }
          .thermal-receipt-flex {
            display: flex;
            justify-content: space-between;
          }
        }
      `}} />

      {/* Actual printed receipt layout hidden on screen */}
      <Box className="thermal-receipt" sx={{ display: 'none' }}>
        <div className="thermal-receipt-center">
          <h3>=== {settings.storeName.toUpperCase()} ===</h3>
          <p>Inventory POS System</p>
        </div>
        <div className="thermal-receipt-divider" />
        <div className="thermal-receipt-flex">
          <span>Date: {lastSale ? new Date(lastSale.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          <span>No: {lastSale?.receiptNo || 'R-XXXX'}</span>
        </div>
        <div className="thermal-receipt-divider" />

        {/* If print is triggered after sale, show real items; otherwise fallback to current cart */}
        {(lastSale ? lastSale.items : cart).map((item) => (
          <div key={item.id} style={{ margin: '4px 0' }}>
            <div>{item.name}</div>
            <div className="thermal-receipt-flex" style={{ paddingLeft: '8px' }}>
              <span>{item.qty || item.quantity} x {settings.currency}{parseFloat(item.price).toFixed(2)}</span>
              <span>{settings.currency}{parseFloat(item.total).toFixed(2)}</span>
            </div>
          </div>
        ))}

        <div className="thermal-receipt-divider" />
        <div className="thermal-receipt-flex" style={{ fontWeight: 'bold' }}>
          <span>Total:</span>
          <span>{settings.currency}{(lastSale ? lastSale.totalAmount : total).toFixed(2)}</span>
        </div>
        <div className="thermal-receipt-flex">
          <span>Discount:</span>
          <span>{settings.currency}{(lastSale ? lastSale.discount : finalDiscount).toFixed(2)}</span>
        </div>
        <div className="thermal-receipt-flex">
          <span>Paid:</span>
          <span>{settings.currency}{(lastSale ? lastSale.paidAmount : paid).toFixed(2)}</span>
        </div>
        <div className="thermal-receipt-flex">
          <span>Change:</span>
          <span>{settings.currency}{(lastSale ? lastSale.change : change).toFixed(2)}</span>
        </div>
        <div className="thermal-receipt-divider" />
        <div className="thermal-receipt-center" style={{ marginTop: '10px' }}>
          <p>{settings.receiptFooter}</p>
          <p>=============================</p>
        </div>
      </Box>

      {/* Screen layout */}
      <Box className="no-print" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            POS — Cashier
          </Typography>
          <Button variant="outlined" color="inherit" onClick={handleClearCart} startIcon={<ClearIcon />}>
            Clear / New Sale
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}

        <Grid container spacing={3}>
          {/* Left Side: Scan & Cart */}
          <Grid item xs={12} md={9}>
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', p: 3 }}>
              {/* Scan input */}
              <Box component="form" onSubmit={handleBarcodeSubmit} sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5} md={6}>
                    <TextField
                      inputRef={barcodeInputRef}
                      label="Scan Barcode"
                      placeholder="Scan product barcode & press Enter..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      autoComplete="off"
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={7} md={6}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button type="submit" variant="contained" sx={{ flexGrow: 1, minWidth: '80px' }}>
                        Scan
                      </Button>
                      <Button variant="outlined" onClick={startCamera} startIcon={<QrCodeScannerIcon />} sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}>
                        Camera Scan
                      </Button>
                      <Button variant="outlined" onClick={() => setOpenManualDialog(true)} startIcon={<AddIcon />} sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}>
                        Add Manually
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {/* Items Table */}
              <TableContainer component={Paper} sx={{ border: '1px solid #f1f5f9', borderRadius: 1, boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell style={{ width: 110 }}>Qty</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell align="right" style={{ width: 60 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            Cart is empty. Scan a barcode or add an item manually.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cart.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                          <TableCell>{settings.currency}{parseFloat(item.price).toFixed(2)}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.qty}
                              onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              inputProps={{ min: 1, step: 1, style: { padding: '4px 8px' } }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{settings.currency}{parseFloat(item.total).toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Right Side: Total & Checkout */}
          <Grid item xs={12} md={3}>
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Checkout Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Items Count:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{cart.reduce((sum, item) => sum + item.qty, 0)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{settings.currency}{subtotal.toFixed(2)}</Typography>
                </Box>

                <TextField
                  label="Discount Amount"
                  type="number"
                  size="small"
                  fullWidth
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  inputProps={{ min: 0 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {settings.currency}{total.toFixed(2)}
                  </Typography>
                </Box>

                <TextField
                  label="Cash Received"
                  type="number"
                  size="small"
                  fullWidth
                  required
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  inputProps={{ min: 0 }}
                  sx={{ mt: 1 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, bgcolor: '#f8fafc', px: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Change:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                    {settings.currency}{change.toFixed(2)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading || cart.length === 0 || paid < total}
                  onClick={handleCheckout}
                  sx={{ py: 1.25, borderRadius: 2 }}
                >
                  {loading ? 'Processing...' : 'Pay / Checkout'}
                </Button>

                {lastSale && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ py: 1, borderRadius: 2 }}
                  >
                    Print Last Receipt
                  </Button>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Manual Add Dialog */}
      <Dialog
        open={openManualDialog}
        onClose={() => setOpenManualDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Add Product Manually
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="manual-product-select-label">Select Product</InputLabel>
            <Select
              labelId="manual-product-select-label"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select a product</em>
              </MenuItem>
              {products.map((prod) => (
                <MenuItem key={prod.id} value={prod.id}>
                  {prod.name} ({settings.currency}{prod.price.toFixed(2)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenManualDialog(false)} color="inherit" variant="outlined" sx={{ borderRadius: 1.5 }}>
            Cancel
          </Button>
          <Button onClick={handleManualAdd} variant="contained" disabled={!selectedProductId} sx={{ borderRadius: 1.5 }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Camera Scanner Dialog */}
      <Dialog
        open={scanning}
        onClose={stopCamera}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Camera Barcode Scanner
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {scannerError ? (
            <Alert severity="warning">{scannerError}</Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                Align the product's barcode inside the green line to scan.
              </Typography>
              <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: '#000', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  playsInline
                  muted
                />
                {/* Visual scan indicator */}
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  bgcolor: '#22c55e',
                  boxShadow: '0 0 10px #22c55e',
                  animation: 'scan-anim 2s infinite ease-in-out'
                }} />
                <style dangerouslySetInnerHTML={{
                  __html: `
                  @keyframes scan-anim {
                    0% { top: 15%; }
                    50% { top: 85%; }
                    100% { top: 15%; }
                  }
                `}} />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={stopCamera} color="inherit" variant="outlined" sx={{ borderRadius: 1.5 }}>
            Close Camera
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Cashier Notifications */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMsg('')} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default POS;
