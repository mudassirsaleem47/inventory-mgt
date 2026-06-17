import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DashboardLayout from './Dashboard-layout';
import DashboardOverview from './Pages/DashboardOverview';
import PlaceholderPage from './Pages/PlaceholderPage';
import Suppliers from './Pages/Suppliers';
import Categories from './Pages/Categories';
import Warehouse from './Pages/Warehouse';
import SuppliersInvoice from './Pages/SuppliersInvoice';
import Login from './Pages/Login';
import Register from './Pages/Register';

// Define a decent, flat theme with Inter font
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  palette: {
    primary: {
      main: '#2563eb', // Clean Blue
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    background: {
      default: '#f8fafc', // Clean slate bg
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& fieldset': {
            borderColor: '#e2e8f0',
          },
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        transitionDuration: { enter: 50, exit: 50 },
      },
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard Layout & Child Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="products" element={<PlaceholderPage />} />
            <Route path="expired-products" element={<PlaceholderPage />} />
            <Route path="dead-stock" element={<PlaceholderPage />} />
            <Route path="categories" element={<Categories />} />
            <Route path="warehouse" element={<Warehouse />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers-invoice" element={<SuppliersInvoice />} />
            <Route path="customers" element={<PlaceholderPage />} />
            <Route path="invoice" element={<PlaceholderPage />} />
            <Route path="transaction" element={<PlaceholderPage />} />
            <Route path="expenses" element={<PlaceholderPage />} />
            <Route path="loan" element={<PlaceholderPage />} />
            <Route path="staff" element={<PlaceholderPage />} />
            <Route path="reports" element={<PlaceholderPage />} />
            <Route path="setting" element={<Navigate to="/dashboard" replace />} />
            <Route path="documentation" element={<PlaceholderPage />} />
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;