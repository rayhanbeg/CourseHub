import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Home from './pages/Home';
import CoursesList from './pages/CoursesList';
import CourseDetails from './pages/CourseDetails';
import CoursePlayer from './pages/CoursePlayer';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import { ProtectedRoute } from './components';

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
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
          <ProtectedRoute requiredRole="student">
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout-success',
        element: <CheckoutSuccess />,
      },

      // Protected Admin Routes
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/create-course',
        element: (
          <ProtectedRoute requiredRole="admin">
            <CreateCourse />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/edit-course/:courseId',
        element: (
          <ProtectedRoute requiredRole="admin">
            <EditCourse />
          </ProtectedRoute>
        ),
      },
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
