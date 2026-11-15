// src/components/HotelFormModal.jsx - Reusable modal form for Adding hotels (admin use)
// Now includes the availability_status dropdown alongside the existing fields.
import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

const HotelFormModal = ({ isOpen, onClose, onSubmit, hotel = null, isSubmitting = false }) => {
  const isEditing = Boolean(hotel && hotel.id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    price: '',
    availability_status: 'Available',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});

  // Populate or reset form whenever the modal opens or hotel prop changes
  useEffect(() => {
    if (isOpen) {
      if (hotel) {
        setFormData({
          title: hotel.title || '',
          description: hotel.description || '',
          latitude: hotel.latitude !== undefined ? hotel.latitude.toString() : '',
          longitude: hotel.longitude !== undefined ? hotel.longitude.toString() : '',
          price: hotel.price !== undefined ? hotel.price.toString() : '',
          availability_status: hotel.availability_status || 'Available',
        });
        setImagePreview(hotel.image_url || '');
      } else {
        setFormData({
          title: '',
          description: '',
          latitude: '',
          longitude: '',
          price: '',
          availability_status: 'Available',
        });
        setImagePreview('');
      }
      setImageFile(null);
      setErrors({});
    }
  }, [isOpen, hotel]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select a valid image file (.jpg, .png, etc.)' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size must be less than 5 MB' }));
        return;
      }
      setImageFile(file);
      setErrors((prev) => ({ ...prev, image: '' }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const priceNum = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Please enter a valid price greater than ₹0';
    }

    const latNum = parseFloat(formData.latitude);
    if (formData.latitude === '' || isNaN(latNum) || latNum < -90 || latNum > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    const lngNum = parseFloat(formData.longitude);
    if (formData.longitude === '' || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Image is required when creating a new hotel
    if (!isEditing && !imageFile) {
      newErrors.image = 'An image is required for a new hotel';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('description', formData.description.trim());
    payload.append('price', parseFloat(formData.price));
    payload.append('latitude', parseFloat(formData.latitude));
    payload.append('longitude', parseFloat(formData.longitude));
    payload.append('availability_status', formData.availability_status);
    if (imageFile) payload.append('image', imageFile);

    onSubmit({
      id: isEditing ? hotel.id : null,
      formData: payload,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Hotel Details' : 'Add New Hotel'}</h2>
          <button onClick={onClose} className="toast-close" disabled={isSubmitting} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="hotel-title">Hotel Title *</label>
              <input
                id="hotel-title"
                name="title"
                type="text"
                placeholder="e.g. Grand Vista Resort"
                value={formData.title}
                onChange={handleChange}
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="hotel-description">Description *</label>
              <textarea
                id="hotel-description"
                name="description"
                rows={3}
                placeholder="Detailed description of features, amenities, and surroundings..."
                value={formData.description}
                onChange={handleChange}
                className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>

            {/* Price + Latitude */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="hotel-price">Price (₹) *</label>
                <input
                  id="hotel-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 2499"
                  value={formData.price}
                  onChange={handleChange}
                  className={`form-input ${errors.price ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="hotel-latitude">Latitude (-90 to 90) *</label>
                <input
                  id="hotel-latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 40.7128"
                  value={formData.latitude}
                  onChange={handleChange}
                  className={`form-input ${errors.latitude ? 'input-error' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.latitude && <span className="field-error">{errors.latitude}</span>}
              </div>
            </div>

            {/* Longitude */}
            <div className="form-group">
              <label className="form-label" htmlFor="hotel-longitude">Longitude (-180 to 180) *</label>
              <input
                id="hotel-longitude"
                name="longitude"
                type="number"
                step="0.000001"
                placeholder="e.g. -74.0060"
                value={formData.longitude}
                onChange={handleChange}
                className={`form-input ${errors.longitude ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.longitude && <span className="field-error">{errors.longitude}</span>}
            </div>

            {/* Availability Status */}
            <div className="form-group">
              <label className="form-label" htmlFor="hotel-availability">Availability Status</label>
              <select
                id="hotel-availability"
                name="availability_status"
                value={formData.availability_status}
                onChange={handleChange}
                className="availability-select"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                <option value="Available">✓ Available</option>
                <option value="Unavailable">✗ Unavailable</option>
              </select>
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">
                Hotel Image {isEditing ? '(Leave empty to keep existing image)' : '*'}
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="image-file-input"
                disabled={isSubmitting}
              />

              {imagePreview ? (
                <div className="image-preview-wrapper">
                  <img src={imagePreview} alt="Hotel Preview" className="image-preview" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn-remove-image"
                    disabled={isSubmitting}
                    title="Change or remove selected image"
                  >
                    Change Image
                  </button>
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
                  <p style={{ fontWeight: 600, color: '#334155' }}>Click to browse and upload hotel image</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Supported: JPG, PNG, WEBP (Max 5 MB)
                  </p>
                </div>
              )}

              {errors.image && (
                <span className="field-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} />
                  {errors.image}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Hotel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelFormModal;
