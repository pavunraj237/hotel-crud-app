// src/pages/AdminLoginPage.jsx - Admin-only login page
// Reuses the existing Redux login thunk. No public signup link here.
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { login, clearAuthError } from '../redux/authSlice';
import { Building2, LogIn, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';

const AdminLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, authLoading, authError, isCheckingAuth } = useSelector(
    (state) => state.auth
  );

  // Where to send the admin after login (default: /admin dashboard)
  const from = location.state?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  // If already logged in as admin, redirect immediately
  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.role === 'admin') {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isCheckingAuth, user, navigate, from]);

  // Clear any leftover auth errors when this page loads
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Basic client-side validation before hitting the API
  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(login({ email: email.trim().toLowerCase(), password }));
    if (login.fulfilled.match(result)) {
      // login succeeded — the useEffect above handles the redirect
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | Hotel Explorer</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="auth-page">
        {/* Page header */}
        <div className="auth-logo-row">
          <Building2 size={32} color="#2563eb" />
          <span className="auth-logo-text">Hotel Explorer</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <LogIn size={24} color="#2563eb" />
            <h1 className="auth-title">Admin Portal Login</h1>
            <p className="auth-subtitle">Only authorised administrators can access this area.</p>
          </div>

          {/* Demo credentials helper (development convenience) */}
          <div className="auth-info-banner">
            <Info size={16} />
            <div>
              <strong>Demo credentials:</strong>{' '}
              <span style={{ fontFamily: 'monospace' }}>admin@example.com</span> /{' '}
              <span style={{ fontFamily: 'monospace' }}>Admin@12345</span>
            </div>
          </div>

          {/* API-level error from Redux */}
          {authError && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (localErrors.email) setLocalErrors((p) => ({ ...p, email: '' }));
                  if (authError) dispatch(clearAuthError());
                }}
                className={`form-input ${localErrors.email ? 'input-error' : ''}`}
                disabled={authLoading}
              />
              {localErrors.email && <span className="field-error">{localErrors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">
                Password
              </label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (localErrors.password) setLocalErrors((p) => ({ ...p, password: '' }));
                    if (authError) dispatch(clearAuthError());
                  }}
                  className={`form-input ${localErrors.password ? 'input-error' : ''}`}
                  style={{ paddingRight: '2.75rem' }}
                  disabled={authLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {localErrors.password && <span className="field-error">{localErrors.password}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={authLoading}
            >
              {authLoading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In to Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Back to public site */}
          <p className="auth-footer-text">
            <a href="/" style={{ color: '#2563eb' }}>
              ← Back to public site
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
