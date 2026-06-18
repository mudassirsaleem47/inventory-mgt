import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar,
  Stack,
  Grid,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Print as PrintIcon, Visibility as VisibilityIcon, Upload as UploadIcon } from '@mui/icons-material';
import DataTable from '../Components/DataTable';

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost') ? import.meta.env.VITE_API_URL : window.location.origin);

// Offline Code 39 Barcode Generator
const BarcodeRenderer = ({ value, svgId = "barcode-svg" }) => {
  if (!value) return null;
  const uppercaseValue = `*${String(value).toUpperCase()}*`;

  // Code 39 patterns (9 elements: 5 bars, 4 spaces)
  const code39Map = {
    '0': 'N N W W N N N W N', '1': 'W N N W N N N N W', '2': 'N N W W N N N N W', '3': 'W N W W N N N N N',
    '4': 'N N N W W N N N W', '5': 'W N N W W N N N N', '6': 'N N W W W N N N N', '7': 'N N N W N N W N W',
    '8': 'W N N W N N W N N', '9': 'N N W W N N W N N', 'A': 'W N N N N W N N W', 'B': 'N N W N N W N N W',
    'C': 'W N W N N W N N N', 'D': 'N N N N W W N N W', 'E': 'W N N N W W N N N', 'F': 'N N W N W W N N N',
    'G': 'N N N N N W W N W', 'H': 'W N N N N W W N N', 'I': 'N N W N N W W N N', 'J': 'N N N N W W W N N',
    'K': 'W N N N N N N W W', 'L': 'N N W N N N N W W', 'M': 'W N W N N N N W N', 'N': 'N N N N W N N W W',
    'O': 'W N N N W N N W N', 'P': 'N N W N W N N W N', 'Q': 'N N N N N N W W W', 'R': 'W N N N N N W W N',
    'S': 'N N W N N N W W N', 'T': 'N N N N W N W W N', 'U': 'W W N N N N N N W', 'V': 'N W W N N N N N W',
    'W': 'W W W N N N N N N', 'X': 'N W N N W N N N W', 'Y': 'W W N N W N N N N', 'Z': 'N W W N W N N N N',
    '-': 'N W N N N N W N W', '.': 'W W N N N N W N N', ' ': 'N W W N N N W N N', '*': 'N W N N W N W N N',
    '$': 'N W N W N W N N N', '/': 'N W N W N N N W N', '+': 'N W N N N W N W N', '%': 'N N N W N W N W N'
  };

  let binaryPattern = '';
  for (let i = 0; i < uppercaseValue.length; i++) {
    const char = uppercaseValue[i];
    const pattern = code39Map[char];
    if (!pattern) continue; // Skip invalid characters
    const elements = pattern.split(' ');
    for (let j = 0; j < elements.length; j++) {
      const isBlack = (j % 2 === 0);
      const isWide = (elements[j] === 'W');
      const width = isWide ? 3 : 1;
      binaryPattern += isBlack ? '1'.repeat(width) : '0'.repeat(width);
    }
    binaryPattern += '0'; // Inter-character gap
  }

  const barHeight = 50;
  const barWidth = 1.5;
  const margin = 20; // 20px quiet zone on left and right
  const svgWidth = binaryPattern.length * barWidth + (margin * 2);

  let x = margin;
  const rects = [];
  for (let i = 0; i < binaryPattern.length; i++) {
    const bit = binaryPattern[i];
    if (bit === '1') {
      rects.push(
        <rect key={i} x={x} y={0} width={barWidth} height={barHeight} fill="#000" />
      );
    }
    x += barWidth;
  }

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', p: 2, bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 1 }}>
      <svg id={svgId} width={svgWidth} height={barHeight}>
        {rects}
      </svg>
      <Typography variant="caption" sx={{ fontFamily: 'monospace', mt: 1, color: '#0f172a', fontWeight: 600, fontSize: '12px' }}>
        {value}
      </Typography>
    </Box>
  );
};

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);

  // Printable Barcode Dialog
  const [openBarcodeDialog, setOpenBarcodeDialog] = useState(false);
  const [barcodeToPrint, setBarcodeToPrint] = useState('');
  const [productNameToPrint, setProductNameToPrint] = useState('');

  // View Product Dialog States
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleViewClick = async (product) => {
    setViewProduct(product);
    setOpenViewDialog(true);
    setViewLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/api/products/${product.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setViewProduct(data);
      }
    } catch (err) {
      console.error('Failed to fetch full product details:', err);
    } finally {
      setViewLoading(false);
    }
  };

  const handlePrintStickerFromView = (prod) => {
    if (!prod) return;
    const printWindow = window.open('', '_blank', 'width=500,height=400');
    if (!printWindow) {
      alert("Please allow popups to print barcode stickers.");
      return;
    }
    const barcodeHtml = document.getElementById('view-dialog-barcode-svg').outerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode Sticker</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: 'Inter', sans-serif;
              text-align: center;
            }
            svg {
              max-width: 95%;
              height: auto;
            }
            .label-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 8px;
              color: #0f172a;
            }
            .label-val {
              font-family: monospace;
              font-size: 14px;
              margin-top: 4px;
              letter-spacing: 2px;
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          <div class="label-name">${prod.name}</div>
          ${barcodeHtml}
          <div class="label-val">${prod.barcode}</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // CSV Import States
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    price: '',
    barcode: '',
    stock: '',
    unit: '',
    lowStockAlert: '',
    supplierPrice: '',
    model: '',
    detail: '',
    mfgDate: '',
    expiryDate: '',
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const databaseFields = [
    { key: 'name', label: 'Product Name', required: true, matches: /name|product|item|title/i },
    { key: 'price', label: 'Sell Price', required: true, matches: /price|sell|retail|rate/i },
    { key: 'barcode', label: 'SKU / Barcode', required: false, matches: /barcode|sku|code|serial/i },
    { key: 'stock', label: 'Quantity / Stock', required: false, matches: /stock|quantity|qty|count|amt/i },
    { key: 'unit', label: 'Unit', required: false, matches: /unit|pack/i },
    { key: 'lowStockAlert', label: 'Low Stock Alert', required: false, matches: /alert|low|minimum/i },
    { key: 'supplierPrice', label: 'Supplier Price', required: false, matches: /cost|supplier|purchase|buy/i },
    { key: 'model', label: 'Model', required: false, matches: /model|type/i },
    { key: 'detail', label: 'Detail / Description', required: false, matches: /detail|description|desc/i },
    { key: 'mfgDate', label: 'Mfg. Date', required: false, matches: /mfg|manufacture/i },
    { key: 'expiryDate', label: 'Exp. Date', required: false, matches: /exp|expiry/i },
  ];

  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') { i++; }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0) return;

      const headers = parsed[0].map(h => h.trim());
      setCsvHeaders(headers);
      setCsvData(parsed.slice(1));

      const initialMapping = {};
      databaseFields.forEach(field => {
        const matchingIndex = headers.findIndex(h => field.matches.test(h));
        initialMapping[field.key] = matchingIndex !== -1 ? String(matchingIndex) : '';
      });
      setColumnMapping(initialMapping);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Name", "Sell Price", "Barcode (Optional)", "Quantity (Optional)", "Unit (Optional)", "Low Stock Alert (Optional)", "Supplier Price (Optional)", "Model (Optional)", "Detail (Optional)", "Mfg Date (Optional)", "Exp Date (Optional)"];
    const example = ["Classic Cola 330ml", "75.00", "890103074090", "120", "pcs", "15", "55.00", "330ml Can", "Premium carbonated cola drink", "2026-01-01", "2026-12-31"];
    const csvContent = [headers.join(','), example.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async () => {
    if (columnMapping.name === '') {
      alert('Please map the Product Name field');
      return;
    }
    if (columnMapping.price === '') {
      alert('Please map the Sell Price field');
      return;
    }

    const payloadProducts = csvData.map(row => {
      const prod = {};
      databaseFields.forEach(field => {
        const mappedIndex = columnMapping[field.key];
        if (mappedIndex !== '') {
          prod[field.key] = row[Number(mappedIndex)] || '';
        } else {
          prod[field.key] = '';
        }
      });
      return prod;
    }).filter(p => p.name && p.name.trim() !== '');

    if (payloadProducts.length === 0) {
      alert('No valid products found to import.');
      return;
    }

    setImportLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/products/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ products: payloadProducts })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to import products');

      setImportSummary(data);
    } catch (err) {
      alert(err.message || 'Something went wrong during import');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCloseImportDialog = () => {
    setOpenImportDialog(false);
    setCsvHeaders([]);
    setCsvData([]);
    setCsvFileName('');
    setImportSummary(null);
    fetchProducts();
  };

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch products');

      setProducts(Array.isArray(data) ? data : []);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleBulkDelete = async (selectedIds) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete products');

      setSuccessMsg('Product(s) deleted successfully!');
      fetchProducts();
      setOpenDeleteDialog(false);
      setDeleteIds([]);
    } catch (err) {
      setError(err.message || 'Something went wrong deleting');
      setOpenDeleteDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSticker = () => {
    const printWindow = window.open('', '_blank', 'width=500,height=400');
    if (!printWindow) {
      alert("Please allow popups to print barcode stickers.");
      return;
    }
    const barcodeHtml = document.getElementById('sticker-barcode-svg').outerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode Sticker</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: 'Inter', sans-serif;
              text-align: center;
            }
            svg {
              max-width: 95%;
              height: auto;
            }
            .label-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 8px;
              color: #0f172a;
            }
            .label-val {
              font-family: monospace;
              font-size: 14px;
              margin-top: 4px;
              letter-spacing: 2px;
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          <div class="label-name">${productNameToPrint}</div>
          ${barcodeHtml}
          <div class="label-val">${barcodeToPrint}</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns = [
    { id: 'name', label: 'Product Name', sortable: true, cellSx: { fontWeight: 600, color: '#0f172a' } },
    {
      id: 'barcode',
      label: 'Barcode / Sticker',
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>
            {row.barcode}
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={(e) => {
              e.stopPropagation();
              setBarcodeToPrint(row.barcode);
              setProductNameToPrint(row.name);
              setOpenBarcodeDialog(true);
            }}
            sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.7rem', textTransform: 'none', borderRadius: 1 }}
          >
            Sticker
          </Button>
        </Stack>
      )
    },
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      render: (row) => `Rs. ${parseFloat(row.price).toFixed(2)}`
    },
    { id: 'stock', label: 'Stock', sortable: true },
    { id: 'unit', label: 'Unit', sortable: true },
    {
      id: 'category',
      label: 'Category',
      sortable: false,
      render: (row) => row.category?.name || '-'
    },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      render: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '-'
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            onClick={(e) => { e.stopPropagation(); handleViewClick(row); }}
            size="small"
            sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
            title="View Details"
          >
            <VisibilityIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); navigate(`/products/edit/${row.id}`); }}
            size="small"
            sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}
            title="Edit Product"
          >
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      )
    }
  ];

  const bulkActions = [
    {
      label: 'Delete Selected',
      icon: <DeleteIcon sx={{ fontSize: 18 }} />,
      action: (selectedIds) => { setDeleteIds(selectedIds); setOpenDeleteDialog(true); },
      color: 'error'
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: 3, fontFamily: '"Inter", sans-serif' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Products
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenImportDialog(true)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products/add')}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Add Product
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Content */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          selected={selected}
          onSelectedChange={setSelected}
          bulkActions={bulkActions}
          searchPlaceholder="Search products..."
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: '#b91c1c' }}>
          Confirm Deletion
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete {deleteIds.length} selected product(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleBulkDelete(deleteIds)}
            color="error"
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 1.5, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barcode Sticker Dialog */}
      <Dialog
        open={openBarcodeDialog}
        onClose={() => setOpenBarcodeDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Barcode Sticker Preview
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {productNameToPrint}
          </Typography>
          <BarcodeRenderer value={barcodeToPrint} svgId="sticker-barcode-svg" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenBarcodeDialog(false)} color="inherit" variant="outlined" sx={{ borderRadius: 1.5 }}>
            Close
          </Button>
          <Button
            onClick={handlePrintSticker}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{ borderRadius: 1.5 }}
          >
            Print Sticker
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Product Details Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Product Details</span>
          {viewProduct && (
            <Button
              variant="contained"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                setOpenViewDialog(false);
                navigate(`/products/edit/${viewProduct.id}`);
              }}
              sx={{ textTransform: 'none', borderRadius: 1.5, py: 0.5, px: 2 }}
            >
              Edit Product
            </Button>
          )}
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 3 }}>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Typography variant="body1">Loading product details...</Typography>
            </Box>
          ) : viewProduct ? (
            <Grid container spacing={3}>
              {/* Left Side - Image and Barcode */}
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, borderRight: { md: '1px solid #e2e8f0' }, pr: { md: 3 } }}>
                <Box sx={{ width: 180, height: 180, border: '1px solid #cbd5e1', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: '#f8fafc' }}>
                  {viewProduct.imagePath ? (
                    <img
                      src={`${API_URL}/${viewProduct.imagePath}`}
                      alt={viewProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No Image
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Barcode Sticker
                  </Typography>
                  <BarcodeRenderer value={viewProduct.barcode} svgId="view-dialog-barcode-svg" />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PrintIcon />}
                    onClick={() => handlePrintStickerFromView(viewProduct)}
                    sx={{ textTransform: 'none', borderRadius: 1.5, mt: 1 }}
                  >
                    Print Sticker
                  </Button>
                </Box>
              </Grid>

              {/* Right Side - Fields */}
              <Grid item xs={12} md={8}>
                <Stack spacing={3.5}>
                  {/* General Info */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                      General Info
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Product Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.name}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Model</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.model || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Category</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.category?.name || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Unit</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.unit || 'pcs'}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Detail / Description</Typography>
                        <Typography variant="body2" sx={{ color: '#475569', mt: 0.25, whiteSpace: 'pre-wrap' }}>{viewProduct.detail || '-'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Stock & Location */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                      Inventory & Location
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Warehouse</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.warehouse?.name || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Rack Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.rackNo || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Current Stock</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.stock} {viewProduct.unit}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Low Stock Alert</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#b91c1c', mt: 0.25 }}>{viewProduct.lowStockAlert !== null ? viewProduct.lowStockAlert : '-'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Pricing & Supplier */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                      Pricing & Supplier
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Supplier Price</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a', mt: 0.25 }}>Rs. {viewProduct.supplierPrice !== null ? parseFloat(viewProduct.supplierPrice).toFixed(2) : '0.00'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Sell Price (Retail)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb', mt: 0.25 }}>Rs. {viewProduct.price !== null ? parseFloat(viewProduct.price).toFixed(2) : '0.00'}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Supplier</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.supplier?.name || '-'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Dates */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                      Dates & Timestamps
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Mfg. Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>{viewProduct.mfgDate ? new Date(viewProduct.mfgDate).toLocaleDateString() : '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Expiry Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#b91c1c', mt: 0.25 }}>{viewProduct.expiryDate ? new Date(viewProduct.expiryDate).toLocaleDateString() : '-'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenViewDialog(false)}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 1.5 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog
        open={openImportDialog}
        onClose={handleCloseImportDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Import Products from CSV</span>
          {!importSummary && (
            <Button
              size="small"
              variant="text"
              startIcon={<PrintIcon />}
              onClick={handleDownloadTemplate}
              sx={{ textTransform: 'none', borderRadius: 1.5 }}
            >
              Download Template
            </Button>
          )}
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 3 }}>
          {importSummary ? (
            <Stack spacing={3}>
              <Alert severity={importSummary.skippedCount > 0 ? "warning" : "success"} sx={{ borderRadius: 1.5 }}>
                <strong>Import completed!</strong> Successfully imported {importSummary.successCount} product(s). Skipped {importSummary.skippedCount} product(s).
              </Alert>

              {importSummary.errors && importSummary.errors.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#e11d48', mb: 1 }}>
                    Skipped Rows & Warnings:
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: 1.5, p: 2, bgcolor: '#fff1f2' }}>
                    {importSummary.errors.map((err, index) => (
                      <Typography key={index} variant="caption" sx={{ display: 'block', color: '#9f1239', mb: 0.5, fontFamily: 'monospace' }}>
                        • {err}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          ) : csvHeaders.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 2 }}>
                Upload a CSV file containing your product records. You can download the example template above to see the required column formatting.
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ borderRadius: 2, px: 4, py: 1.25, boxShadow: 'none' }}
              >
                Choose CSV File
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleCSVUpload}
                />
              </Button>
            </Box>
          ) : (
            <Stack spacing={3}>
              <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                File: <strong>{csvFileName}</strong> ({csvData.length} records detected). Map your CSV headers to the database fields below.
              </Alert>

              <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                <Grid container spacing={2}>
                  {databaseFields.map(field => (
                    <React.Fragment key={field.key}>
                      <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: field.required ? 700 : 500, color: field.required ? '#0f172a' : '#475569' }}>
                          {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={columnMapping[field.key]}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>[Do Not Map / Auto]</em>
                            </MenuItem>
                            {csvHeaders.map((header, idx) => (
                              <MenuItem key={idx} value={String(idx)}>
                                {header}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </React.Fragment>
                  ))}
                </Grid>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {importSummary ? (
            <Button
              onClick={handleCloseImportDialog}
              variant="contained"
              sx={{ borderRadius: 1.5 }}
            >
              Done
            </Button>
          ) : csvHeaders.length === 0 ? (
            <Button
              onClick={handleCloseImportDialog}
              color="inherit"
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            >
              Cancel
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setCsvHeaders([]);
                  setCsvData([]);
                  setCsvFileName('');
                }}
                disabled={importLoading}
                color="inherit"
                variant="outlined"
                sx={{ borderRadius: 1.5 }}
              >
                Back / Reset
              </Button>
              <Button
                onClick={handleImportSubmit}
                disabled={importLoading}
                variant="contained"
                sx={{ borderRadius: 1.5 }}
              >
                {importLoading ? 'Importing...' : 'Import Products'}
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Global Page Notifications */}
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

export default Products;
