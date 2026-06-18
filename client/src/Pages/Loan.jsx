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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CallMade as DebtGivenIcon,
  CallReceived as DebtTakenIcon,
  Percent as PercentIcon,
  ReceiptLong as LoanIcon
} from '@mui/icons-material';
import DataTable from '../Components/DataTable';
import dayjs from 'dayjs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Loan = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
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
    partnerName: '',
    type: 'Payable', // Payable (We owe), Receivable (Owed to us)
    amount: '',
    interestRate: '0',
    dueDate: dayjs().add(3, 'month').format('YYYY-MM-DD'),
    status: 'Active', // Active, Paid, Overdue
    description: ''
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

  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/loans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch loans');

      setLoans(Array.isArray(data) ? data : []);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Something went wrong fetching loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchSettings();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      partnerName: '',
      type: 'Payable',
      amount: '',
      interestRate: '0',
      dueDate: dayjs().add(3, 'month').format('YYYY-MM-DD'),
      status: 'Active',
      description: ''
    });
    setIsEdit(false);
    setEditId(null);
    setError('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (loan) => {
    setFormData({
      partnerName: loan.partnerName,
      type: loan.type,
      amount: String(loan.amount),
      interestRate: String(loan.interestRate),
      dueDate: dayjs(loan.dueDate).format('YYYY-MM-DD'),
      status: loan.status,
      description: loan.description || ''
    });
    setIsEdit(true);
    setEditId(loan.id);
    setError('');
    setOpenDialog(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.partnerName.trim() || !formData.type || !formData.amount) {
      setError('Borrower/Lender Name, Type, and Amount are required');
      return;
    }

    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const url = isEdit ? `${API_URL}/api/loans/${editId}` : `${API_URL}/api/loans`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerName: formData.partnerName.trim(),
          type: formData.type,
          amount: parseFloat(formData.amount) || 0,
          interestRate: parseFloat(formData.interestRate) || 0,
          dueDate: formData.dueDate,
          status: formData.status,
          description: formData.description.trim()
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save loan');

      setSuccessMsg(isEdit ? 'Loan details updated successfully!' : 'Loan recorded successfully!');
      fetchLoans();
      setOpenDialog(false);
    } catch (err) {
      setError(err.message || 'Failed to submit loan details');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (ids) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/loans`, {
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
      if (!response.ok) throw new Error(data.message || 'Failed to delete loan(s)');

      setSuccessMsg('Loan record(s) deleted!');
      fetchLoans();
      setOpenDeleteDialog(false);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Failed to delete loan(s)');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalPayable = loans
    .filter(l => l.type === 'Payable' && l.status !== 'Paid')
    .reduce((sum, l) => sum + l.amount, 0);

  const totalReceivable = loans
    .filter(l => l.type === 'Receivable' && l.status !== 'Paid')
    .reduce((sum, l) => sum + l.amount, 0);

  const netDebtLiability = totalPayable - totalReceivable;

  const columns = [
    { id: 'partnerName', label: 'Borrower / Lender', sortable: true, cellSx: { fontWeight: 600, color: '#0f172a' } },
    {
      id: 'type',
      label: 'Loan Type',
      sortable: true,
      render: (row) => (
        <Chip
          label={row.type}
          size="small"
          icon={row.type === 'Payable' ? <DebtTakenIcon sx={{ fontSize: 14 }} /> : <DebtGivenIcon sx={{ fontSize: 14 }} />}
          sx={{
            fontSize: '0.72rem',
            fontWeight: 600,
            bgcolor: row.type === 'Payable' ? '#fff5f5' : '#ecfdf5',
            color: row.type === 'Payable' ? '#b91c1c' : '#047857',
            borderRadius: 1
          }}
        />
      )
    },
    {
      id: 'amount',
      label: 'Principal Amount',
      sortable: true,
      render: (row) => `${currency} ${parseFloat(row.amount).toFixed(2)}`
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <PercentIcon sx={{ fontSize: 14, color: '#64748b' }} />
          <Typography variant="body2">{row.interestRate}%</Typography>
        </Stack>
      )
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (row) => dayjs(row.dueDate).format('DD/MM/YYYY')
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        let color = '#3b82f6';
        let bg = '#eff6ff';
        if (row.status === 'Paid') { color = '#10b981'; bg = '#ecfdf5'; }
        if (row.status === 'Overdue') { color = '#ef4444'; bg = '#fef2f2'; }
        return (
          <Chip
            label={row.status}
            size="small"
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              bgcolor: bg,
              color: color,
              borderRadius: 1
            }}
          />
        );
      }
    },
    { id: 'description', label: 'Purpose / Remarks', sortable: false },
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
          Store Loans & Debt Liabilities
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 2 }}
        >
          Record Loan / Debt
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Summary Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #fee2e2', bgcolor: '#fff', borderRadius: 1.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 1.5, display: 'flex', color: '#ef4444' }}>
                <DebtTakenIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Total Debts Payable
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#dc2626' }}>
                  {currency} {totalPayable.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #d1fae5', bgcolor: '#fff', borderRadius: 1.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: '#ecfdf5', borderRadius: 1.5, display: 'flex', color: '#10b981' }}>
                <DebtGivenIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Total Loans Receivable
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#059669' }}>
                  {currency} {totalReceivable.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff', borderRadius: 1.5 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '20px !important' }}>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, display: 'flex', color: '#64748b' }}>
                <LoanIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Net Debt Liability
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: netDebtLiability > 0 ? '#dc2626' : '#059669' }}>
                  {currency} {netDebtLiability.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loans Table */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={loans}
          loading={loading}
          selected={selected}
          onSelectedChange={setSelected}
          bulkActions={bulkActions}
          searchPlaceholder="Search borrower/lender name..."
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
          {isEdit ? 'Edit Loan Record' : 'Record New Loan / Debt'}
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={3}>
              <TextField
                label="Borrower / Lender Name"
                variant="standard"
                required
                fullWidth
                size="small"
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              />

              <FormControl variant="standard" required fullWidth size="small">
                <InputLabel>Loan Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="Payable">Payable (Store owes money)</MenuItem>
                  <MenuItem value="Receivable">Receivable (Owed to store)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label={`Principal Amount (${currency})`}
                variant="standard"
                required
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 'any' }}
                size="small"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />

              <TextField
                label="Interest Rate (%)"
                variant="standard"
                required
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 'any' }}
                size="small"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              />

              <TextField
                label="Due Date"
                variant="standard"
                required
                fullWidth
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />

              <FormControl variant="standard" required fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Purpose / Remarks"
                variant="standard"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {isEdit ? 'Save Changes' : 'Record Loan'}
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
            Are you sure you want to delete {deleteIds.length} selected loan records? This action cannot be undone.
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
            Delete Record(s)
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

export default Loan;
