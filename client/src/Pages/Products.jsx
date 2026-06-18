import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  Alert,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Delete as DeleteIcon, Edit as EditIcon, Print as PrintIcon } from '@mui/icons-material';
import DataTable from '../Components/DataTable';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);

  // Printable Barcode Dialog
  const [openBarcodeDialog, setOpenBarcodeDialog] = useState(false);
  const [barcodeToPrint, setBarcodeToPrint] = useState('');
  const [productNameToPrint, setProductNameToPrint] = useState('');

  // Category Sub-Dialog States
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [catError, setCatError] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  const handleCategorySubmit = async () => {
    setCatError('');
    if (!catForm.name.trim()) {
      setCatError('Category name is required.');
      return;
    }
    setCatLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: catForm.name.trim(), description: catForm.description.trim() })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create category');

      await fetchCategories();
      setFormData(prev => ({ ...prev, categoryId: data.id }));
      setOpenCategoryDialog(false);
    } catch (err) {
      setCatError(err.message || 'Something went wrong');
    } finally {
      setCatLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    stock: '',
    unit: 'pcs',
    categoryId: '',
    expiryDate: '',
  });

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

  const fetchCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchProducts();
    }
    fetchCategories();
  }, [view]);

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

  const handleEditClick = (product) => {
    setFormData({
      name: product.name,
      barcode: product.barcode,
      price: product.price !== null ? String(product.price) : '',
      stock: product.stock !== null ? String(product.stock) : '',
      unit: product.unit || 'pcs',
      categoryId: product.categoryId || '',
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
    });
    setEditId(product.id);
    setView('edit');
    setError('');
    setSuccessMsg('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Please enter a product name');
      return;
    }
    if (!formData.barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    const isEdit = view === 'edit';
    const url = isEdit ? `${API_URL}/api/products/${editId}` : `${API_URL}/api/products`;
    const method = isEdit ? 'PUT' : 'POST';

    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          barcode: formData.barcode.trim(),
          price: formData.price ? parseFloat(formData.price) : 0,
          stock: formData.stock ? parseFloat(formData.stock) : 0,
          unit: formData.unit.trim(),
          expiryDate: formData.expiryDate || null,
          categoryId: formData.categoryId || null,
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'add'} product`);

      setSuccessMsg(isEdit ? 'Product updated successfully!' : 'Product added successfully!');
      setFormData({ name: '', barcode: '', price: '', stock: '', unit: 'pcs', categoryId: '', expiryDate: '' });
      setEditId(null);
      setTimeout(() => { setView('list'); setSuccessMsg(''); }, 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
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
        <IconButton
          onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
          size="small"
          sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}
        >
          <EditIcon sx={{ fontSize: 18 }} />
        </IconButton>
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
          {view === 'list' ? 'Products' : (view === 'edit' ? 'Edit Product' : 'Add Product')}
        </Typography>
        {view === 'list' ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setView('add'); setError(''); setEditId(null); setFormData({ name: '', barcode: '', price: '', stock: '', unit: 'pcs', categoryId: '', expiryDate: '' }); }}
            sx={{ borderRadius: 2 }}
          >
            Add Product
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => { setView('list'); setError(''); setEditId(null); }}
            sx={{ borderRadius: 2 }}
          >
            Back to List
          </Button>
        )}
      </Box>
      {error && <Alert severity="error">{error}</Alert>}

      {/* Content */}
      {view === 'list' ? (
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
      ) : (
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {view === 'edit' ? 'Edit Product' : 'Add Product'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {view === 'edit' ? 'Use this form to edit the product.' : 'Use this form to add a new product.'}
            </Typography>
          </Box>

          <form onSubmit={handleFormSubmit}>
            <Stack spacing={3} sx={{ maxWidth: 600 }}>
              <TextField
                label="Product Name"
                name="name"
                variant="standard"
                autoComplete="off"
                required
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Stack direction="row" spacing={2} alignItems="flex-end">
                <TextField
                  label="Barcode"
                  name="barcode"
                  variant="standard"
                  autoComplete="off"
                  required
                  fullWidth
                  size="small"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const prefix = '890';
                    let code = prefix;
                    for (let i = 0; i < 9; i++) {
                      code += Math.floor(Math.random() * 10);
                    }
                    setFormData({ ...formData, barcode: code });
                  }}
                  sx={{ whiteSpace: 'nowrap', py: 0.75 }}
                >
                  Generate
                </Button>
              </Stack>

              <TextField
                label="Price"
                name="price"
                variant="standard"
                required
                autoComplete="off"
                type="number"
                fullWidth
                size="small"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />

              <TextField
                label="Stock"
                name="stock"
                variant="standard"
                autoComplete="off"
                type="number"
                fullWidth
                size="small"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />

              <TextField
                label="Unit"
                name="unit"
                variant="standard"
                autoComplete="off"
                fullWidth
                size="small"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />

              <Stack direction="row" spacing={1} alignItems="flex-end">
                <FormControl variant="standard" fullWidth size="small">
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  color="primary"
                  onClick={() => {
                    setCatForm({ name: '', description: '' });
                    setCatError('');
                    setOpenCategoryDialog(true);
                  }}
                  sx={{ mb: 0.5 }}
                >
                  <AddIcon />
                </IconButton>
              </Stack>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Expiry Date"
                  value={formData.expiryDate ? dayjs(formData.expiryDate) : null}
                  onChange={(newVal) =>
                    setFormData(f => ({ ...f, expiryDate: newVal ? newVal.format('YYYY-MM-DD') : '' }))
                  }
                  slotProps={{
                    textField: {
                      variant: 'standard',
                      fullWidth: true,
                      size: 'small',
                    }
                  }}
                />
              </LocalizationProvider>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: -1 }}>
                {[
                  { label: '+3 Months', months: 3 },
                  { label: '+6 Months', months: 6 },
                  { label: '+1 Year', months: 12 },
                  { label: '+2 Years', months: 24 },
                  { label: '+3 Years', months: 36 },
                  { label: '+5 Years', months: 60 }
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + preset.months);
                      setFormData({ ...formData, expiryDate: d.toISOString().split('T')[0] });
                    }}
                    sx={{ fontSize: '0.72rem', py: 0.25, px: 1, borderRadius: 1, textTransform: 'none' }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Stack>

              <Box sx={{ pt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {loading ? (view === 'edit' ? 'Saving...' : 'Adding...') : (view === 'edit' ? 'Save Changes' : 'Add Product')}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={loading}
                  onClick={() => { setView('list'); setEditId(null); }}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </form>
        </Card>
      )}

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

      {/* Category Creation Sub-Dialog */}
      <Dialog
        open={openCategoryDialog}
        onClose={() => setOpenCategoryDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Add New Category
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 3 }}>
          {catError && <Alert severity="error" sx={{ mb: 2 }}>{catError}</Alert>}
          <Stack spacing={3}>
            <TextField
              label="Category Name"
              variant="standard"
              autoComplete="off"
              required
              fullWidth
              size="small"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            />
            <TextField
              label="Description"
              variant="standard"
              autoComplete="off"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCategoryDialog(false)} color="inherit" variant="outlined" sx={{ borderRadius: 1.5 }}>
            Cancel
          </Button>
          <Button onClick={handleCategorySubmit} variant="contained" disabled={catLoading || !catForm.name.trim()} sx={{ borderRadius: 1.5 }}>
            {catLoading ? 'Creating...' : 'Create'}
          </Button>
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
