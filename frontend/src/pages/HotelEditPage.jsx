// src/pages/HotelEditPage.jsx - Dedicated Full-Page Hotel Edit Screen
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchHotelById, updateHotel, clearError } from '../redux/hotelSlice';
import Navbar from '../components/Navbar';
import SuccessAlert from '../components/SuccessAlert';
import {
  ArrowLeft,
  UploadCloud,
  AlertCircle,
  Loader2,
  Building2,
  Compass,
  FileText,
  ShieldAlert,
} from 'lucide-react';

const HotelEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { selectedHotel, detailLoading, submitting, error, successMessage } = useSelector(
    (state) => state.hotels
  );
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    latitude: '',
    longitude: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch hotel details on initial load
  useEffect(() => {
    if (id) {
      dispatch(fetchHotelById(id));
    }
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
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setValidationErrors((prev) => ({
          ...prev,
          image: 'Please select a valid image file (JPG, PNG, WEBP, etc.)',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          image: 'Image size must be less than 5MB',
        }));
        return;
      }

      setImageFile(file);
      setValidationErrors((prev) => ({ ...prev, image: '' }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRevertImage = () => {
    setImageFile(null);
    setImagePreview(selectedHotel?.image_url || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Hotel name is required';
    } else if (formData.title.trim().length > 255) {
      errors.title = 'Hotel name cannot exceed 255 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Hotel description is required';
    }

    const priceNum = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Please enter a valid price greater than ₹0';
    }

    const latNum = parseFloat(formData.latitude);
    if (formData.latitude === '' || isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.latitude = 'Latitude must be a valid number between -90 and 90';
    }

    const lngNum = parseFloat(formData.longitude);
    if (formData.longitude === '' || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.longitude = 'Longitude must be a valid number between -180 and 180';
    }

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

    // Only append if user picked a new replacement image file
    if (imageFile) {
      payload.append('image', imageFile);
    }

    const resultAction = await dispatch(updateHotel({ id, formData: payload }));
    if (updateHotel.fulfilled.match(resultAction)) {
      // Return to the detail page after successful update
      navigate(`/hotels/${id}`);
    }
  };

  if (detailLoading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading hotel for editing...</p>
        </div>
      </>
    );
  }

  // Ownership verification check
  const isOwner = Boolean(
    isAuthenticated &&
      user &&
      selectedHotel &&
      (selectedHotel.user_id === user.id || selectedHotel.user_id === null)
  );

  if (selectedHotel && !isOwner) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
            <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Permission Denied
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              You do not have permission to edit <strong>"{selectedHotel.title}"</strong> because it belongs to another host.
            </p>
            <Link to={`/hotels/${id}`} className="btn btn-primary">
              Return to Hotel Details
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{selectedHotel ? `Edit ${selectedHotel.title} | Hotel Explorer` : 'Edit Hotel | Hotel Explorer'}</title>
        <meta name="description" content="Update hotel pricing, photos, description, and location." />
      </Helmet>

      <Navbar />

      <main className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: '840px' }}>
        {/* Navigation Breadcrumb */}
        <Link to={`/hotels/${id}`} className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Hotel Details</span>
        </Link>

        <div className="edit-page-card">
          <div className="edit-page-header">
            <div>
              <h1 className="edit-page-title">Edit Hotel Details</h1>
              <p className="edit-page-subtitle">
                Update information for <strong>{selectedHotel?.title || 'Hotel'}</strong>
              </p>
            </div>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Hotel Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-hotel-title">
                Hotel Name *
              </label>
              <div className="input-with-icon">
                <Building2 className="input-icon" size={18} />
                <input
                  id="edit-hotel-title"
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
              <label className="form-label" htmlFor="edit-hotel-desc">
                Full Description *
              </label>
              <textarea
                id="edit-hotel-desc"
                name="description"
                rows={5}
                placeholder="Detailed description of features, views, amenities, and room options..."
                value={formData.description}
                onChange={handleChange}
                className={`form-textarea ${validationErrors.description ? 'input-error' : ''}`}
                disabled={submitting}
              />
              {validationErrors.description && (
                <span className="field-error">{validationErrors.description}</span>
              )}
            </div>

            {/* Price and Coordinates Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-hotel-price">
                  Price (₹) *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon" aria-hidden="true">₹</span>
                  <input
                    id="edit-hotel-price"
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
                <label className="form-label" htmlFor="edit-hotel-lat">
                  Latitude (-90 to 90) *
                </label>
                <div className="input-with-icon">
                  <Compass className="input-icon" size={18} />
                  <input
                    id="edit-hotel-lat"
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

            <div className="form-group">
              <label className="form-label" htmlFor="edit-hotel-lng">
                Longitude (-180 to 180) *
              </label>
              <div className="input-with-icon">
                <Compass className="input-icon" size={18} />
                <input
                  id="edit-hotel-lng"
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

            {/* Image Upload / Preview */}
            <div className="form-group">
              <label className="form-label">Hotel Image</label>
              <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                Keep existing photo or upload a new replacement image.
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
                  <img
                    src={imagePreview}
                    alt="Current hotel preview"
                    className="edit-image-preview"
                  />
                  <div className="edit-image-actions">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="btn btn-secondary btn-sm"
                      disabled={submitting}
                    >
                      <UploadCloud size={16} />
                      <span>{imageFile ? 'Choose Different Image' : 'Replace Image'}</span>
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
                >
                  <UploadCloud size={36} color="#64748b" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 600, color: '#334155' }}>Click to upload hotel image</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              )}

              {validationErrors.image && (
                <span className="field-error">{validationErrors.image}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="edit-actions-bar">
              <Link to={`/hotels/${id}`} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
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

export default HotelEditPage;
