// src/components/ProtectedRoute.jsx - Protects admin-only routes
// Redirects to /admin/login if the user is not authenticated or not an admin.
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const location = useLocation();

  // Show a spinner while we're still verifying the session on the first load
  if (isCheckingAuth) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Verifying admin session...</p>
      </div>
    );
  }

  // Must be authenticated AND have role='admin'
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
