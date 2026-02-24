import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components';

// Pages
import StudentDashboard from './pages/StudentDashboard';
import CoursesList from './pages/CoursesList';
import CoursePlayer from './pages/CoursePlayer';
import CourseDetails from './pages/CourseDetails';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AdminDashboard from './pages/AdminDashboard';
import CreateCourse from './pages/CreateCourse';

// Auth Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<CoursesList />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />

            {/* Protected Student Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:courseId"
              element={
                <ProtectedRoute requiredRole="student">
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/:courseId"
              element={
                <ProtectedRoute requiredRole="student">
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create-course"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateCourse />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;
