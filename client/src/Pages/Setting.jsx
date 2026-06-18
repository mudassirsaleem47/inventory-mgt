import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Grid,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Avatar
} from '@mui/material';
import {
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Store as StoreIcon,
  Payments as PaymentsIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Setting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxRate: '0',
    currency: 'Rs.',
    receiptFooter: 'Thank you! Come again'
  });

  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch settings');

      setFormData({
        storeName: data.storeName || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        taxRate: String(data.taxRate || 0),
        currency: data.currency || 'Rs.',
        receiptFooter: data.receiptFooter || 'Thank you! Come again'
      });

      if (data.logoPath) {
        setLogoPreview(`${API_URL}/${data.logoPath}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to load store settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const token = getToken();
      if (!token) return;

      const fd = new FormData();
      fd.append('storeName', formData.storeName);
      fd.append('address', formData.address);
      fd.append('phone', formData.phone);
      fd.append('email', formData.email);
      fd.append('website', formData.website);
      fd.append('taxRate', formData.taxRate);
      fd.append('currency', formData.currency);
      fd.append('receiptFooter', formData.receiptFooter);
      if (logoFile) {
        fd.append('logo', logoFile);
      }

      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save settings');

      setSuccessMsg('Store settings updated successfully!');
      if (data.logoPath) {
        setLogoPreview(`${API_URL}/${data.logoPath}?t=${Date.now()}`); // Cache bust
      }
      setLogoFile(null);
    } catch (err) {
      setError(err.message || 'Something went wrong saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column', gap: 3, fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Store Settings
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Customize company profile, transaction currency/tax values, and checkout receipt templates.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleFormSubmit}>
        <Grid container spacing={3}>
          {/* Company Profile Card */}
          <Grid item xs={12} md={7}>
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <StoreIcon sx={{ color: '#2563eb' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Company Profile
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Stack spacing={3}>
                  <TextField
                    label="Store Name"
                    variant="standard"
                    required
                    fullWidth
                    size="small"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  />
                  <TextField
                    label="Store Address"
                    variant="standard"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Store Phone"
                        variant="standard"
                        fullWidth
                        size="small"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Store Email"
                        variant="standard"
                        fullWidth
                        type="email"
                        size="small"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    label="Store Website"
                    variant="standard"
                    fullWidth
                    size="small"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Financial Details & Receipts */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <PaymentsIcon sx={{ color: '#059669' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Financials & Tax Configurations
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Currency Symbol"
                      variant="standard"
                      required
                      fullWidth
                      size="small"
                      placeholder="Rs. or $ or €"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Tax Rate (%)"
                      variant="standard"
                      required
                      fullWidth
                      type="number"
                      inputProps={{ min: 0, step: 'any' }}
                      size="small"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <ReceiptIcon sx={{ color: '#ea580c' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Receipt Template Settings
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <TextField
                  label="Receipt Footer / Terms Note"
                  variant="standard"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={formData.receiptFooter}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Logo Identity Card */}
          <Grid item xs={12} md={5}>
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, height: '100%' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', boxSizing: 'border-box' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', width: '100%', mb: 2.5 }}>
                  Store Logo
                </Typography>
                <Divider sx={{ width: '100%', mb: 4 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexGrow: 1, justifyContent: 'center', py: 2 }}>
                  <Avatar
                    src={logoPreview}
                    alt="Store Logo"
                    variant="rounded"
                    sx={{
                      width: 160,
                      height: 160,
                      border: '1px solid #e2e8f0',
                      bgcolor: '#f8fafc',
                      '& img': { objectFit: 'contain' }
                    }}
                  />

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                      Brand Identity Icon
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, maxWidth: 220 }}>
                      Used on PDF reports and POS checkout receipts. SVG, PNG, JPG accepted. Max size 2MB.
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                  >
                    Upload Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </Button>
                </Box>

                <Box sx={{ width: '100%', pt: 4, mt: 'auto' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}
                  >
                    {loading ? 'Saving Settings...' : 'Save Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

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

export default Setting;
