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
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import DataTable from '../Components/DataTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Categories = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteIds, setDeleteIds] = useState([]);

  const [formData, setFormData] = useState({ name: '', description: '' });

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return null; }
    return token;
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch categories');

      setCategories(data);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') fetchCategories();
  }, [view]);

  const handleBulkDelete = async (selectedIds) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/categories`, {
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
      if (!response.ok) throw new Error(data.message || 'Failed to delete categories');

      setSuccessMsg('Category(s) deleted successfully!');
      fetchCategories();
      setOpenDeleteDialog(false);
      setDeleteIds([]);
    } catch (err) {
      setError(err.message || 'Something went wrong deleting');
      setOpenDeleteDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (category) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditId(category.id);
    setView('edit');
    setError('');
    setSuccessMsg('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Please enter a category name');
      return;
    }

    const isEdit = view === 'edit';
    const url = isEdit ? `${API_URL}/api/categories/${editId}` : `${API_URL}/api/categories`;
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
        body: JSON.stringify({ name: formData.name.trim(), description: formData.description.trim() })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'add'} category`);

      setSuccessMsg(isEdit ? 'Category updated successfully!' : 'Category added successfully!');
      setFormData({ name: '', description: '' });
      setEditId(null);
      setTimeout(() => { setView('list'); setSuccessMsg(''); }, 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { id: 'name', label: 'Category Name', sortable: true, cellSx: { fontWeight: 600, color: '#0f172a' } },
    { id: 'description', label: 'Description', sortable: false },
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
          {view === 'list' ? 'Categories' : (view === 'edit' ? 'Edit Category' : 'Add Category')}
        </Typography>
        {view === 'list' ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setView('add'); setError(''); setEditId(null); setFormData({ name: '', description: '' }); }}
            sx={{ borderRadius: 2 }}
          >
            Add Category
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
            data={categories}
            loading={loading}
            selected={selected}
            onSelectedChange={setSelected}
            bulkActions={bulkActions}
            searchPlaceholder="Search categories..."
          />
        </Card>
      ) : (
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {view === 'edit' ? 'Edit Category' : 'Add Category'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {view === 'edit' ? 'Use this form to edit the category.' : 'Use this form to add a new category.'}
            </Typography>
          </Box>

          <form onSubmit={handleFormSubmit}>
            <Stack spacing={3} sx={{ maxWidth: 600 }}>
              <TextField
                label="Category Name"
                name="name"
                variant="standard"
                autoComplete="off"
                required
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <TextField
                label="Description"
                name="description"
                variant="standard"
                autoComplete="off"
                fullWidth
                multiline
                rows={3}
                size="small"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Box sx={{ pt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {loading ? (view === 'edit' ? 'Saving...' : 'Adding...') : (view === 'edit' ? 'Save Changes' : 'Add Category')}
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
            Are you sure you want to delete {deleteIds.length} selected category(s)? This action cannot be undone.
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

      {/* Global Category Notifications */}
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

export default Categories;
