import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './redux/authSlice';

import HotelListPage from './pages/HotelListPage';
import HotelDetailPage from './pages/HotelDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminHotelEditPage from './pages/AdminHotelEditPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const dispatch = useDispatch();

  // Check if an admin session is already open.
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public pages. */}
      <Route path="/" element={<HotelListPage />} />
      <Route path="/hotels/:id" element={<HotelDetailPage />} />

      {/* Admin login. */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin-only pages. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/hotels/:id/edit"
        element={
          <ProtectedRoute>
            <AdminHotelEditPage />
          </ProtectedRoute>
        }
      />

      {/* Send unknown paths to the home page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
