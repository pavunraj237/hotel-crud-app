import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchHotels,
  setFilters,
  resetFilters,
  setCurrentPage,
  clearSuccessMessage,
  clearError,
} from '../redux/hotelSlice';
import Navbar from '../components/Navbar';
import HotelCard from '../components/HotelCard';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import SuccessAlert from '../components/SuccessAlert';
import { Hotel as HotelIcon } from 'lucide-react';

const HotelListPage = () => {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.hotels);
  const hotels = data.hotels;
  const pagination = data.pagination;
  const filters = data.filters;
  const priceStats = data.priceStats;
  const loading = data.loading;
  const error = data.error;
  const successMessage = data.successMessage;

  // Load hotels when a filter or page changes.
  useEffect(() => {
    dispatch(
      fetchHotels({
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        availability: filters.availability,
        page: pagination.currentPage,
        limit: pagination.limit,
      })
    );
  }, [
    dispatch,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.availability,
    pagination.currentPage,
    pagination.limit,
  ]);

  return (
    <>
      <Helmet>
        <title>Explore Hotels &amp; Resorts | Hotel Explorer</title>
        <meta
          name="description"
          content="Discover top luxury hotels, resorts, and vacation stays. Search by name, filter by price range and availability."
        />
        <meta property="og:title" content="Explore Hotels &amp; Resorts | Hotel Explorer" />
        <meta
          property="og:description"
          content="Browse luxury hotels, compare rates, and view locations on interactive maps."
        />
      </Helmet>

      <SuccessAlert message={successMessage} onClose={() => dispatch(clearSuccessMessage())} />

      {/* Show an error from the request. */}
      {error && (
        <div className="toast-container" role="alert">
          <div className="toast toast-error">
            <span>{error}</span>
            <button
              onClick={() => dispatch(clearError())}
              className="toast-close"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <Navbar />

      <main className="container" style={{ minHeight: '80vh', paddingBottom: '3rem' }}>
        <Filters
          filters={filters}
          priceStats={priceStats}
          onFilterChange={(newFilters) => dispatch(setFilters(newFilters))}
          onReset={() => dispatch(resetFilters())}
        />

        {/* Wait for the hotel list. */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }} />
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading hotels...</p>
          </div>
        )}

        {/* Show this when no hotels match. */}
        {!loading && hotels.length === 0 && (
          <div className="empty-state">
            <HotelIcon size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No hotels match your filters
            </h3>
            <p style={{ color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Try expanding the price range, changing the availability filter, or clearing your
              search term.
            </p>
            <button onClick={() => dispatch(resetFilters())} className="btn btn-secondary">
              Reset Filters
            </button>
          </div>
        )}

        {/* Show each hotel card. */}
        {!loading && hotels.length > 0 && (
          <div className="hotels-grid">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}

        {!loading && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            onPageChange={(page) => dispatch(setCurrentPage(page))}
          />
        )}
      </main>
    </>
  );
};

export default HotelListPage;
