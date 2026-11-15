// src/pages/SignupPage.jsx - Responsive Registration Page
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { signup, clearAuthError } from '../redux/authSlice';
import Navbar from '../components/Navbar';
import { Lock, Mail, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, authLoading, authError } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) {
      dispatch(clearAuthError());
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(
      signup({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })
    );

    if (signup.fulfilled.match(result)) {
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up | Hotel Explorer</title>
        <meta
          name="description"
          content="Create your free Hotel Explorer account to host, list, and manage luxury hotel properties."
        />
      </Helmet>

      <Navbar />

      <main className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join Hotel Explorer to list and host accommodations</p>
          </div>

          {/* Server Error Message */}
          {authError && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">
                Full Name *
              </label>
              <div className="input-with-icon">
                <User className="input-icon" size={18} />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input form-input-icon ${validationErrors.name ? 'input-error' : ''}`}
                  disabled={authLoading}
                />
              </div>
              {validationErrors.name && (
                <span className="field-error">{validationErrors.name}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">
                Email Address *
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input form-input-icon ${validationErrors.email ? 'input-error' : ''}`}
                  disabled={authLoading}
                />
              </div>
              {validationErrors.email && (
                <span className="field-error">{validationErrors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">
                Password (min 6 characters) *
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input form-input-icon ${validationErrors.password ? 'input-error' : ''}`}
                  disabled={authLoading}
                />
              </div>
              {validationErrors.password && (
                <span className="field-error">{validationErrors.password}</span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm-password">
                Confirm Password *
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input form-input-icon ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                  disabled={authLoading}
                />
              </div>
              {validationErrors.confirmPassword && (
                <span className="field-error">{validationErrors.confirmPassword}</span>
              )}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignupPage;
