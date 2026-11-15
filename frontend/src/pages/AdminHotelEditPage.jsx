// src/pages/AdminHotelEditPage.jsx - Dedicated edit page at /admin/hotels/:id/edit
// Protected: only authenticated admins can access this route.
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchHotelById, updateHotel, clearError, clearSelectedHotel } from '../redux/hotelSlice';
import { logout } from '../redux/authSlice';
import SuccessAlert from '../components/SuccessAlert';
import { clearSuccessMessage } from '../redux/hotelSlice';
import {
  ArrowLeft,
  UploadCloud,
  AlertCircle,
  Loader2,
  Building2,
  Compass,
  Eye,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

const AdminHotelEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { selectedHotel, detailLoading, submitting, error, successMessage } = useSelector(
    (state) => state.hotels
  );
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    latitude: '',
    longitude: '',
    availability_status: 'Available',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Load hotel data on mount
  useEffect(() => {
    dispatch(fetchHotelById(id));
    return () => {
      dispatch(clearSelectedHotel());
    };
  }, [dispatch, id]);

  // Populate form once hotel is loaded
  useEffect(() => {
    if (selectedHotel && selectedHotel.id === parseInt(id, 10)) {
      setFormData({
        title: selectedHotel.title || '',
        description: selectedHotel.description || '',
        price: selectedHotel.price !== undefined ? selectedHotel.price.toString() : '',
        latitude: selectedHotel.latitude !== undefined ? selectedHotel.latitude.toString() : '',
        longitude: selectedHotel.longitude !== undefined ? selectedHotel.longitude.toString() : '',
        availability_status: selectedHotel.availability_status || 'Available',
      });
      setImagePreview(selectedHotel.image_url || '');
      setImageFile(null);
      setValidationErrors({});
    }
  }, [selectedHotel, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) dispatch(clearError());
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setValidationErrors((prev) => ({ ...prev, image: 'Please choose a valid image file (JPG, PNG, WEBP)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors((prev) => ({ ...prev, image: 'Image must be smaller than 5 MB' }));
      return;
    }
    setImageFile(file);
    setValidationErrors((prev) => ({ ...prev, image: '' }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRevertImage = () => {
    setImageFile(null);
    setImagePreview(selectedHotel?.image_url || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Hotel name is required';
    } else if (formData.title.trim().length > 255) {
      errors.title = 'Hotel name cannot exceed 255 characters';
    }
    if (!formData.description.trim()) errors.description = 'Description is required';

    const priceNum = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceNum) || priceNum <= 0)
      errors.price = 'Enter a valid price greater than ₹0';

    const latNum = parseFloat(formData.latitude);
    if (formData.latitude === '' || isNaN(latNum) || latNum < -90 || latNum > 90)
      errors.latitude = 'Latitude must be between -90 and 90';

    const lngNum = parseFloat(formData.longitude);
    if (formData.longitude === '' || isNaN(lngNum) || lngNum < -180 || lngNum > 180)
      errors.longitude = 'Longitude must be between -180 and 180';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('description', formData.description.trim());
    payload.append('price', parseFloat(formData.price));
    payload.append('latitude', parseFloat(formData.latitude));
    payload.append('longitude', parseFloat(formData.longitude));
    payload.append('availability_status', formData.availability_status);
    if (imageFile) payload.append('image', imageFile);

    const result = await dispatch(updateHotel({ id, formData: payload }));
    if (updateHotel.fulfilled.match(result)) {
      navigate('/admin');
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/admin/login');
  };

  // ── Loading state ──────────────────────────────────────────────
  if (detailLoading) {
    return (
      <>
        {/* Minimal admin navbar */}
        <header className="navbar">
          <div className="container navbar-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Building2 size={24} color="#2563eb" />
              <span style={{ fontWeight: 700 }}>Admin Dashboard</span>
            </div>
          </div>
        </header>
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading hotel for editing...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {selectedHotel
            ? `Edit "${selectedHotel.title}" | Admin`
            : 'Edit Hotel | Admin'}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <SuccessAlert message={successMessage} onClose={() => dispatch(clearSuccessMessage())} />

      {/* Admin Navbar */}
      <header className="navbar">
        <div className="container navbar-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={26} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Admin Dashboard</span>
          </div>
          <div className="navbar-actions">
            <Link to="/" className="btn btn-secondary btn-sm">
              <Eye size={16} />
              <span>Public Site</span>
            </Link>
            <div className="user-profile-menu">
              <span className="user-greeting">
                <LayoutDashboard size={15} color="#2563eb" />
                <span>{user?.name || 'Admin'}</span>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" aria-label="Log out">
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: '840px' }}>
        {/* Breadcrumb back link */}
        <Link to="/admin" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Admin Dashboard</span>
        </Link>

        <div className="edit-page-card">
          <div className="edit-page-header">
            <div>
              <h1 className="edit-page-title">Edit Hotel Details</h1>
              <p className="edit-page-subtitle">
                Updating: <strong>{selectedHotel?.title || '...'}</strong>
              </p>
            </div>
          </div>

          {/* API error */}
          {error && (
            <div className="auth-error-banner" role="alert" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Hotel Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-edit-title">
                Hotel Name *
              </label>
              <div className="input-with-icon">
                <Building2 className="input-icon" size={18} />
                <input
                  id="admin-edit-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Grand Pacific Luxury Suites"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input form-input-icon ${validationErrors.title ? 'input-error' : ''}`}
                  disabled={submitting}
                />
              </div>
              {validationErrors.title && <span className="field-error">{validationErrors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-edit-desc">
                Full Description *
              </label>
              <textarea
                id="admin-edit-desc"
                name="description"
                rows={5}
                placeholder="Detailed description of features, amenities, and surroundings..."
                value={formData.description}
                onChange={handleChange}
                className={`form-textarea ${validationErrors.description ? 'input-error' : ''}`}
                disabled={submitting}
              />
              {validationErrors.description && (
                <span className="field-error">{validationErrors.description}</span>
              )}
            </div>

            {/* Price + Latitude */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="admin-edit-price">
                  Price (₹) *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon" aria-hidden="true">₹</span>
                  <input
                    id="admin-edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 2499"
                    value={formData.price}
                    onChange={handleChange}
                    className={`form-input form-input-icon ${validationErrors.price ? 'input-error' : ''}`}
                    disabled={submitting}
                  />
                </div>
                {validationErrors.price && <span className="field-error">{validationErrors.price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-edit-lat">
                  Latitude (-90 to 90) *
                </label>
                <div className="input-with-icon">
                  <Compass className="input-icon" size={18} />
                  <input
                    id="admin-edit-lat"
                    name="latitude"
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    placeholder="e.g. 40.7128"
                    value={formData.latitude}
                    onChange={handleChange}
                    className={`form-input form-input-icon ${validationErrors.latitude ? 'input-error' : ''}`}
                    disabled={submitting}
                  />
                </div>
                {validationErrors.latitude && (
                  <span className="field-error">{validationErrors.latitude}</span>
                )}
              </div>
            </div>

            {/* Longitude */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-edit-lng">
                Longitude (-180 to 180) *
              </label>
              <div className="input-with-icon">
                <Compass className="input-icon" size={18} />
                <input
                  id="admin-edit-lng"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  placeholder="e.g. -74.0060"
                  value={formData.longitude}
                  onChange={handleChange}
                  className={`form-input form-input-icon ${validationErrors.longitude ? 'input-error' : ''}`}
                  disabled={submitting}
                />
              </div>
              {validationErrors.longitude && (
                <span className="field-error">{validationErrors.longitude}</span>
              )}
            </div>

            {/* Availability Status */}
            <div className="form-group">
              <label className="form-label" htmlFor="admin-edit-availability">
                Availability Status
              </label>
              <select
                id="admin-edit-availability"
                name="availability_status"
                value={formData.availability_status}
                onChange={handleChange}
                className="availability-select"
                style={{ width: '100%', maxWidth: '280px' }}
                disabled={submitting}
              >
                <option value="Available">✓ Available</option>
                <option value="Unavailable">✗ Unavailable</option>
              </select>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.3rem' }}>
                Visible to visitors on the public hotel listing.
              </p>
            </div>

            {/* Image Upload / Preview */}
            <div className="form-group">
              <label className="form-label">Hotel Image</label>
              <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                Leave blank to keep the existing photo. Upload to replace it.
              </span>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                disabled={submitting}
              />

              {imagePreview ? (
                <div className="edit-image-preview-container">
                  <img src={imagePreview} alt="Hotel preview" className="edit-image-preview" />
                  <div className="edit-image-actions">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="btn btn-secondary btn-sm"
                      disabled={submitting}
                    >
                      <UploadCloud size={16} />
                      <span>{imageFile ? 'Choose Different' : 'Replace Image'}</span>
                    </button>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={handleRevertImage}
                        className="btn btn-danger btn-sm"
                        disabled={submitting}
                      >
                        Revert to Original
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="image-upload-area"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      fileInputRef.current && fileInputRef.current.click();
                  }}
                >
                  <UploadCloud size={36} color="#64748b" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 600, color: '#334155' }}>Click to upload hotel image</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>JPG, PNG, WEBP (Max 5 MB)</p>
                </div>
              )}

              {validationErrors.image && (
                <span className="field-error">{validationErrors.image}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="edit-actions-bar">
              <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem' }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default AdminHotelEditPage;
