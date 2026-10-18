import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import CoursesList from './pages/CoursesList';
import CourseDetails from './pages/CourseDetails';
import CoursePlayer from './pages/CoursePlayer';
import Checkout, { CheckoutSkeleton } from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import OrderHistory from './pages/OrderHistory';
import StudentDashboard from './pages/StudentDashboard';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Components
import { ProtectedRoute } from './components';

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Error Page Component
const ErrorPage = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Oops! The page you're looking for doesn't exist.</p>
        <a href="/" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary transition-colors">
          Go Back Home
        </a>
      </div>
    </div>
  );
};

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    </div>
  );
};

// Scroll to top on route change
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      window.setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return null;
};

// Layout wrapper that includes ScrollToTop
const LayoutWithScrollToTop = ({ children }) => {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
};

// Router configuration with all routes
const router = createBrowserRouter([
  // Main application routes with header and footer
  {
    path: '/',
    element: (
      <LayoutWithScrollToTop>
        <MainLayout />
      </LayoutWithScrollToTop>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'courses', element: <CoursesList /> },
      { path: 'courses/:courseId', element: <CourseDetails /> },

      // Protected Student Routes
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-learning',
        element: <ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>,
      },
      {
        path: 'dashboard/orders',
        element: <ProtectedRoute requiredRole="student"><OrderHistory /></ProtectedRoute>,
      },
      {
        path: 'course/:courseId',
        element: (
          <ProtectedRoute requiredRole="student">
            <CoursePlayer />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout/:courseId',
        element: (
          <ProtectedRoute requiredRole="student" loadingFallback={<CheckoutSkeleton />}>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout-success',
        element: <CheckoutSuccess />,
      },
      {
        path: 'checkout-cancel',
        element: <CheckoutCancel />,
      },

    ],
  },

  // Admin routes intentionally use their own shell, outside the public layout.
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>,
    errorElement: <ErrorPage />,
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      ...['courses', 'orders', 'students'].map((section) => ({
        path: `dashboard/${section}`,
        element: <AdminDashboard />,
      })),
      { path: 'create-course', element: <CreateCourse /> },
      { path: 'edit-course/:courseId', element: <EditCourse /> },
    ],
  },

  // Authentication routes (no layout)
  {
    path: '/login',
    element: (
      <LayoutWithScrollToTop>
        <Login />
      </LayoutWithScrollToTop>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/register',
    element: (
      <LayoutWithScrollToTop>
        <Register />
      </LayoutWithScrollToTop>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/forgot-password',
    element: <LayoutWithScrollToTop><ForgotPassword /></LayoutWithScrollToTop>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/reset-password',
    element: <LayoutWithScrollToTop><ResetPassword /></LayoutWithScrollToTop>,
    errorElement: <ErrorPage />,
  },

  // Catch all - 404
  {
    path: '*',
    element: <ErrorPage />,
  },
]);

// Main App Component
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
