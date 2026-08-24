// App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/themeContext';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';
import { CartProvider } from './providers/CartProvider';
import { useLocation } from 'react-router-dom';
import './App.css';
import './styles/dashboard.css';

// Import Layout
import AppLayout from './components/layout/AppLayout';

// Import screens
import Homepage from './screens/homepage';
import LoginPage from './screens/Login';
import RegisterPage from './screens/Register';
import GalleryPage from './screens/GalleryPage';
import CategoriesPage from './screens/CategoriesPage';
import ProductsPage from './screens/ProductsPage';
import CategoryDetailsPage from './screens/CategoryDetails';
import ProductDetailsPage from './screens/ProductDetails';
import StyleOrderPage from './screens/StyleOrderPage';
import MyAppointmentsPage from './screens/Appointments';
import AppointmentDetailsPage from './screens/AppointmentDetails';
import CartPage from './screens/cart';
import CheckoutPage from './screens/CheckoutPage';
import PaymentCallbackPage from './screens/PaymentCallback';
import OrderListPage from './screens/OrderLis';
import OrderDetailsPage from './screens/OrderDetails';
import ProfilePage from './screens/Profile';
import SavedStylesPage from './screens/SavedStyles';
import BookAppointmentPage from './screens/BookAppointment';
import MeasurementsPage from './screens/Measurements';
import AdminDashboardPage from './screens/admin/AdminDashboard';
import AdminCatalogPage from './screens/admin/AdminCatalogPage';
import AdminCatalogEditor from './screens/admin/AdminCatalogEditor';
import Consultations from './screens/admin/Consultations';
import ProductionQueue from './screens/admin/ProductionQueue';
import ProposalEditor from './screens/admin/ProposalEditor';

// Protected Route component with role checking
const ProtectedRoute = ({ children, requiredRole, redirectTo = '/login' }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--mainBg)',
        color: 'var(--text)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            border: '4px solid var(--border)',
            borderTop: '4px solid var(--btnBg)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '20px' }}>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where the user was heading so login can send them back.
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Admin areas are open to apprentices (order handling) — only customers are kept out.
  if (requiredRole && requiredRole !== 'customer' && user?.role === 'customer') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout wrapper component that conditionally renders Layout
const LayoutWrapper = ({ children }) => {
  const location = useLocation();

  // Define paths where Layout (sidebar/header/tabs) should NOT be shown
  const noLayoutPaths = ['/login', '/register'];
  const shouldShowLayout = !noLayoutPaths.includes(location.pathname);

  return (
    <>
      {shouldShowLayout ? (
        <AppLayout>
          {children}
        </AppLayout>
      ) : (
        children
      )}
    </>
  );
};

// Spinner animation styles
const spinnerStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = spinnerStyles;
  document.head.appendChild(styleElement);
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <LayoutWrapper>
              <Routes>
                {/* Public Routes - No authentication needed */}
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/categories/:categoryId" element={<CategoryDetailsPage />} />
                <Route path="/categories/:categoryId/:subcategoryId" element={<CategoryDetailsPage />} />
                <Route path="/product/:productId" element={<ProductDetailsPage />} />
                <Route path="/styles/order/:styleId" element={<StyleOrderPage />} />
                <Route path="/appointments/book" element={<BookAppointmentPage />} />

                {/* Protected Routes - Authentication required */}
                <Route path="/appointments" element={<ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>} />
                <Route path="/appointments/:appointmentId" element={<ProtectedRoute><AppointmentDetailsPage /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallbackPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrderListPage /></ProtectedRoute>} />
                <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/savedstyles" element={<ProtectedRoute><SavedStylesPage /></ProtectedRoute>} />
                <Route path="/favorites" element={<ProtectedRoute><Navigate to="/savedstyles" replace /></ProtectedRoute>} />
                <Route path="/measure" element={<ProtectedRoute><MeasurementsPage /></ProtectedRoute>} />

                {/* Admin (customers are redirected away by ProtectedRoute) */}
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute requiredRole="admin"><AdminCatalogPage kind="products" /></ProtectedRoute>} />
                <Route path="/admin/styles" element={<ProtectedRoute requiredRole="admin"><AdminCatalogPage kind="styles" /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute requiredRole="admin"><AdminCatalogPage kind="categories" /></ProtectedRoute>} />
                <Route path="/admin/:kind/new" element={<ProtectedRoute requiredRole="admin"><AdminCatalogEditor /></ProtectedRoute>} />
                <Route path="/admin/:kind/:slug/edit" element={<ProtectedRoute requiredRole="admin"><AdminCatalogEditor /></ProtectedRoute>} />
                <Route path="/admin/consultations" element={<ProtectedRoute requiredRole="admin"><Consultations /></ProtectedRoute>} />
                <Route path="/admin/consultations/:appointmentId" element={<ProtectedRoute requiredRole="admin"><ProposalEditor /></ProtectedRoute>} />
                <Route path="/admin/production-queue" element={<ProtectedRoute requiredRole="admin"><ProductionQueue /></ProtectedRoute>} />

                {/* Catch all */}
                <Route
                  path="*"
                  element={<Navigate to="/" replace />}
                />
              </Routes>
              </LayoutWrapper>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
