import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Alert,
  Snackbar,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Star as StarIcon,
  LocalActivity as PromoIcon
} from '@mui/icons-material';
import DataTable from '../Components/DataTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currency, setCurrency] = useState('Rs.');

  // Form Dialog States
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    loyaltyPoints: '0'
  });

  // Delete Dialog States
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const fetchSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.currency) setCurrency(data.currency);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch customers');

      setCustomers(Array.isArray(data) ? data : []);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Something went wrong fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchSettings();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: '', phone: '', email: '', address: '', loyaltyPoints: '0' });
    setIsEdit(false);
    setEditId(null);
    setError('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      loyaltyPoints: String(customer.loyaltyPoints || 0)
    });
    setIsEdit(true);
    setEditId(customer.id);
    setError('');
    setOpenDialog(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const url = isEdit ? `${API_URL}/api/customers/${editId}` : `${API_URL}/api/customers`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          loyaltyPoints: parseInt(formData.loyaltyPoints) || 0
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save customer');

      setSuccessMsg(isEdit ? 'Customer details updated successfully!' : 'Customer added successfully!');
      fetchCustomers();
      setOpenDialog(false);
    } catch (err) {
      setError(err.message || 'Failed to submit customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (ids) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/customers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete customer(s)');

      setSuccessMsg('Customer(s) deleted successfully!');
      fetchCustomers();
      setOpenDeleteDialog(false);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Failed to delete customer(s)');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalCustomers = customers.length;
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const totalCustomerSales = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const columns = [
    { id: 'name', label: 'Customer Name', sortable: true, cellSx: { fontWeight: 600, color: '#0f172a' } },
    { id: 'phone', label: 'Phone Number', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { id: 'address', label: 'Address', sortable: false },
    {
      id: 'loyaltyPoints',
      label: 'Loyalty Points',
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <StarIcon sx={{ color: '#eab308', fontSize: 16 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.loyaltyPoints}</Typography>
        </Stack>
      )
    },
    {
      id: 'totalSpent',
      label: 'Total Purchased',
      sortable: true,
      render: (row) => `${currency} ${(row.totalSpent || 0).toFixed(2)}`
    },
    { id: 'visits', label: 'Visits', sortable: true },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <IconButton
          onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
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
          Customer Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 2 }}
        >
          Add Customer
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff', borderRadius: 1.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 1.5, display: 'flex', color: '#2563eb' }}>
                <PeopleIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Total Customers
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
                  {totalCustomers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff', borderRadius: 1.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: '#fef9c3', borderRadius: 1.5, display: 'flex', color: '#ca8a04' }}>
                <StarIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Loyalty Points Awarded
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
                  {totalLoyaltyPoints}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff', borderRadius: 1.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: '#ecfdf5', borderRadius: 1.5, display: 'flex', color: '#10b981' }}>
                <PromoIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Customer Valuation
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#10b981' }}>
                  {currency} {totalCustomerSales.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customers Table */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          selected={selected}
          onSelectedChange={setSelected}
          bulkActions={bulkActions}
          searchPlaceholder="Search customers..."
        />
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {isEdit ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={3}>
              <TextField
                label="Customer Name"
                variant="standard"
                required
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                label="Phone Number"
                variant="standard"
                fullWidth
                size="small"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <TextField
                label="Email Address"
                variant="standard"
                fullWidth
                type="email"
                size="small"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <TextField
                label="Home/Billing Address"
                variant="standard"
                fullWidth
                size="small"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <TextField
                label="Loyalty Program Points"
                variant="standard"
                fullWidth
                type="number"
                size="small"
                value={formData.loyaltyPoints}
                onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setOpenDialog(false)}
              color="inherit"
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ borderRadius: 1.5 }}
            >
              {isEdit ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
            Are you sure you want to delete {deleteIds.length} selected customer(s)? This action cannot be undone.
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
            sx={{ borderRadius: 1.5, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            Delete Customer(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Success Notifications */}
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

export default Customers;
