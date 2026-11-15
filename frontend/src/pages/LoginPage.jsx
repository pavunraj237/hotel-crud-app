// src/pages/LoginPage.jsx - Responsive Login Page
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { login, clearAuthError } from '../redux/authSlice';
import Navbar from '../components/Navbar';
import { Lock, Mail, AlertCircle, Loader2, Info } from 'lucide-react';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, authLoading, authError } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationError, setValidationError] = useState('');

  // Destination after login: either the page they came from or home
  const destination = location.state?.from?.pathname || '/';

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, destination]);

  // Clear previous auth errors when unmounting or typing
  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (validationError) setValidationError('');
    if (authError) dispatch(clearAuthError());
  };

  const handleFillDemo = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'Password123!',
    });
    setValidationError('');
    dispatch(clearAuthError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      setValidationError('Please enter your email address.');
      return;
    }
    if (!formData.password) {
      setValidationError('Please enter your password.');
      return;
    }

    const result = await dispatch(
      login({
        email: formData.email,
        password: formData.password,
      })
    );

    if (login.fulfilled.match(result)) {
      navigate(destination, { replace: true });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Hotel Explorer</title>
        <meta
          name="description"
          content="Sign in to your Hotel Explorer account to manage your hotels and view exclusive listings."
        />
      </Helmet>

      <Navbar />

      <main className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to manage and edit your hotel listings</p>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="demo-credentials-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.25rem' }}>
              <Info size={16} />
              <span>Test Account Credentials</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
              Email: <code>demo@example.com</code> | Password: <code>Password123!</code>
            </p>
            <button
              type="button"
              onClick={handleFillDemo}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
            >
              Auto-fill Demo Credentials
            </button>
          </div>

          {/* Error Message */}
          {(authError || validationError) && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{authError || validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input form-input-icon"
                  disabled={authLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input form-input-icon"
                  disabled={authLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
              disabled={authLoading}
            >
              {authLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginPage;
