import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye } from 'lucide-react';
import { formatINR } from '../utils/currency';

const HotelCard = (props) => {
  const hotel = props.hotel;
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/hotels/${hotel.id}`);
  };

  const isAvailable = hotel.availability_status !== 'Unavailable';
  let badgeClass = 'badge-unavailable card-availability-badge';
  let badgeText = '✗ Unavailable';

  if (isAvailable) {
    badgeClass = 'badge-available card-availability-badge';
    badgeText = '✓ Available';
  }

  return (
    <article className="hotel-card" aria-labelledby={`hotel-title-${hotel.id}`}>
      {/* Show the hotel photo. */}
      <div
        className="card-media-wrapper"
        onClick={handleCardClick}
        title={`View details for ${hotel.title}`}
        style={{ cursor: 'pointer' }}
      >
        <img
          src={hotel.image_url}
          alt={`Photo of ${hotel.title}`}
          className="card-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
          }}
        />
        {/* Show the price. */}
        <div className="price-tag" aria-label={`Price: ${formatINR(hotel.price)}`}>
          {formatINR(hotel.price)}
        </div>

        <span
          className={badgeClass}
          aria-label={`Status: ${hotel.availability_status || 'Available'}`}
        >
          {badgeText}
        </span>
      </div>

      {/* Hotel details. */}
      <div className="card-content">
        <h3
          id={`hotel-title-${hotel.id}`}
          className="card-title"
          onClick={handleCardClick}
          style={{ cursor: 'pointer' }}
        >
          {hotel.title}
        </h3>

        <p className="card-description">{hotel.description}</p>

        <div className="card-meta-row">
          <div className="card-coordinates">
            <MapPin size={15} color="#2563eb" />
            <span>
              {parseFloat(hotel.latitude).toFixed(4)}, {parseFloat(hotel.longitude).toFixed(4)}
            </span>
          </div>
        </div>

        {/* Open the details page. */}
        <div className="card-actions">
          <button
            onClick={handleCardClick}
            className="btn btn-secondary btn-sm"
            aria-label={`View full details of ${hotel.title}`}
          >
            <Eye size={15} />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default HotelCard;
