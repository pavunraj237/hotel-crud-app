import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchHotelById,
  clearSuccessMessage,
  clearError,
  clearSelectedHotel,
} from '../redux/hotelSlice';
import Navbar from '../components/Navbar';
import MapViewer from '../components/MapViewer';
import SuccessAlert from '../components/SuccessAlert';
import { ArrowLeft, MapPin, Compass } from 'lucide-react';
import { formatINR } from '../utils/currency';

const formatCoordinate = (val, isLat) => {
  const num = parseFloat(val);
  if (isNaN(num)) return `${val}°`;
  if (isLat) {
    if (num > 0) return `${num.toFixed(4)}° N`;
    if (num < 0) return `${Math.abs(num).toFixed(4)}° S`;
    return '0.0000° (Equator)';
  } else {
    if (num > 0) return `${num.toFixed(4)}° E`;
    if (num < 0) return `${Math.abs(num).toFixed(4)}° W`;
    return '0.0000° (Prime Meridian)';
  }
};

const HotelDetailPage = () => {
  const params = useParams();
  const id = params.id;
  const dispatch = useDispatch();

  const data = useSelector((state) => state.hotels);
  const selectedHotel = data.selectedHotel;
  const detailLoading = data.detailLoading;
  const error = data.error;
  const successMessage = data.successMessage;

  useEffect(() => {
    dispatch(fetchHotelById(id));
    return () => {
      dispatch(clearSelectedHotel());
    };
  }, [dispatch, id]);

  if (detailLoading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading hotel details...</p>
        </div>
      </>
    );
  }

  if (!selectedHotel && !detailLoading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            Hotel not found
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            The requested hotel could not be found or may have been removed.
          </p>
          <Link to="/" className="btn btn-primary">
            Back to All Hotels
          </Link>
        </div>
      </>
    );
  }

  const title = selectedHotel.title;
  const description = selectedHotel.description;
  const price = selectedHotel.price;
  const latitude = selectedHotel.latitude;
  const longitude = selectedHotel.longitude;
  const image_url = selectedHotel.image_url;
  const availability_status = selectedHotel.availability_status;

  const formattedLat = formatCoordinate(latitude, true);
  const formattedLng = formatCoordinate(longitude, false);
  const isAvailable = availability_status !== 'Unavailable';
  let availabilityText = '✗ Unavailable';
  let availabilityClass = 'badge-unavailable';

  if (isAvailable) {
    availabilityText = '✓ Available';
    availabilityClass = 'badge-available';
  }

  return (
    <>
      <Helmet>
        <title>{`${title} | Hotel Explorer`}</title>
        <meta name="description" content={description.slice(0, 160)} />
        <meta property="og:title" content={`${title} - ${formatINR(price)}`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image_url} />
      </Helmet>

      <SuccessAlert message={successMessage} onClose={() => dispatch(clearSuccessMessage())} />

      {error && (
        <div className="toast-container" role="alert">
          <div className="toast toast-error">
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} className="toast-close" aria-label="Dismiss">
              &times;
            </button>
          </div>
        </div>
      )}

      <Navbar />

      <main className="container detail-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Hotel Listings</span>
        </Link>

        <article className="detail-card">
          <div className="detail-hero-image-wrapper">
            <img
              src={image_url}
              alt={`Full photograph of ${title}`}
              className="detail-hero-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
              }}
            />
          </div>

          <div className="detail-body">
            <div className="detail-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h1 className="detail-title">{title}</h1>
                  <span className={availabilityClass}>{availabilityText}</span>
                </div>

                <div className="detail-meta-row">
                  <span className="meta-badge" title="Geographic Coordinates">
                    <Compass size={16} color="#2563eb" />
                    <span>
                      {formattedLat}, {formattedLng}
                    </span>
                  </span>

                </div>
              </div>

              <div className="detail-header-right">
                <div className="detail-price">
                  {formatINR(price)}
                </div>
              </div>
            </div>

            <hr className="detail-divider" />

            <div className="detail-section">
              <h2 className="detail-section-title">About this Hotel</h2>
              <p className="detail-description">{description}</p>
            </div>

            <section className="map-section" aria-labelledby="map-heading">
              <h2 id="map-heading" className="map-title">
                <MapPin size={22} color="#2563eb" />
                <span>Location &amp; Surrounding Area</span>
              </h2>
              <p className="map-coordinates-text">
                Decimal coordinates: {latitude}, {longitude} ({formattedLat}, {formattedLng})
              </p>
              <MapViewer latitude={latitude} longitude={longitude} title={title} />
            </section>
          </div>
        </article>
      </main>
    </>
  );
};

export default HotelDetailPage;
