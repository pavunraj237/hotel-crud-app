// src/pages/AdminDashboardPage.jsx - Protected admin hotel management page
// Lists all hotels with Add / Edit / Delete controls. Only admins reach this page.
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  fetchHotels,
  createHotel,
  deleteHotel,
  setFilters,
  resetFilters,
  setCurrentPage,
  clearSuccessMessage,
  clearError,
} from '../redux/hotelSlice';
import { logout } from '../redux/authSlice';
import HotelFormModal from '../components/HotelFormModal';
import DeleteModal from '../components/DeleteModal';
import Pagination from '../components/Pagination';
import SuccessAlert from '../components/SuccessAlert';
import { formatINR } from '../utils/currency';
import {
  Building2,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  LogOut,
  Eye,
  RotateCcw,
  LayoutDashboard,
} from 'lucide-react';

const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { hotels, pagination, filters, loading, submitting, error, successMessage } = useSelector(
    (state) => state.hotels
  );
  const { user } = useSelector((state) => state.auth);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Fetch hotels on mount and whenever filters / page change
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

  // Debounce search so we don't fire for every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchInput }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/admin/login');
  };

  // ── Add Hotel ────────────────────────────────────────────────
  const handleCreateSubmit = async ({ formData }) => {
    const result = await dispatch(createHotel(formData));
    if (createHotel.fulfilled.match(result)) {
      setIsAddModalOpen(false);
      dispatch(setCurrentPage(1));
      dispatch(fetchHotels({ ...filters, page: 1, limit: pagination.limit }));
    }
  };

  // ── Delete Hotel ─────────────────────────────────────────────
  const handleOpenDeleteModal = (hotel) => {
    setHotelToDelete(hotel);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;
    const result = await dispatch(deleteHotel(hotelToDelete.id));
    if (deleteHotel.fulfilled.match(result)) {
      setIsDeleteModalOpen(false);
      setHotelToDelete(null);
      dispatch(fetchHotels({ ...filters, page: pagination.currentPage, limit: pagination.limit }));
    }
  };

  // ── Availability badge helper ─────────────────────────────────
  const AvailabilityBadge = ({ status }) => {
    const available = status === 'Available';
    return (
      <span className={available ? 'badge-available' : 'badge-unavailable'}>
        {available ? '✓ Available' : '✗ Unavailable'}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Hotel Explorer</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Success / Error alerts */}
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

      {/* Admin Navbar */}
      <header className="navbar">
        <div className="container navbar-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={26} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Admin Dashboard</span>
          </div>

          <div className="navbar-actions">
            <Link to="/" className="btn btn-secondary btn-sm" aria-label="View public site">
              <Eye size={16} />
              <span>Public Site</span>
            </Link>

            <div className="user-profile-menu">
              <span className="user-greeting" title={user?.email}>
                <LayoutDashboard size={15} color="#2563eb" />
                <span>{user?.name || 'Admin'}</span>
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                aria-label="Log out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Page title + Add button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Hotel Management</h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
              {pagination.totalCount} hotel{pagination.totalCount !== 1 ? 's' : ''} in the system
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            aria-label="Add new hotel"
          >
            <PlusCircle size={18} />
            <span>Add New Hotel</span>
          </button>
        </div>

        {/* Search + Availability filter row */}
        <div className="admin-filter-row">
          <div className="search-group" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search hotels by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
              aria-label="Search hotels"
            />
          </div>

          <select
            value={filters.availability}
            onChange={(e) => dispatch(setFilters({ availability: e.target.value }))}
            className="availability-select"
            aria-label="Filter by availability"
          >
            <option value="all">All Availability</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          {(filters.search || filters.availability !== 'all') && (
            <button
              onClick={() => {
                dispatch(resetFilters());
                setSearchInput('');
              }}
              className="btn btn-secondary btn-sm"
              aria-label="Reset filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Hotels Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" style={{ width: '36px', height: '36px' }} />
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading hotels...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="empty-state">
            <Building2 size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No hotels found</h3>
            <p style={{ color: '#64748b', margin: '0.5rem auto 1.5rem', maxWidth: '380px' }}>
              {filters.search || filters.availability !== 'all'
                ? 'No hotels match your current filters. Try resetting them.'
                : 'Get started by adding your first hotel.'}
            </p>
            <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
              <PlusCircle size={16} />
              Add First Hotel
            </button>
          </div>
        ) : (
          <div className="admin-hotel-table">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="admin-hotel-row">
                {/* Thumbnail */}
                <img
                  src={hotel.image_url}
                  alt={`Thumbnail for ${hotel.title}`}
                  className="admin-hotel-thumb"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=60';
                  }}
                />

                {/* Info */}
                <div className="admin-hotel-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span className="admin-hotel-title">{hotel.title}</span>
                    <AvailabilityBadge status={hotel.availability_status} />
                  </div>
                  <p className="admin-hotel-desc">{hotel.description}</p>
                  <span className="admin-hotel-price">{formatINR(hotel.price)}</span>
                </div>

                {/* Actions */}
                <div className="admin-hotel-actions">
                  <Link
                    to={`/hotels/${hotel.id}`}
                    className="btn btn-secondary btn-sm"
                    aria-label={`View ${hotel.title}`}
                  >
                    <Eye size={15} />
                    <span>View</span>
                  </Link>
                  <Link
                    to={`/admin/hotels/${hotel.id}/edit`}
                    className="btn btn-secondary btn-sm"
                    aria-label={`Edit ${hotel.title}`}
                  >
                    <Edit2 size={15} />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleOpenDeleteModal(hotel)}
                    className="btn btn-danger btn-sm"
                    aria-label={`Delete ${hotel.title}`}
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            onPageChange={(page) => dispatch(setCurrentPage(page))}
          />
        )}
      </main>

      {/* Add Hotel Modal */}
      <HotelFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateSubmit}
        hotel={null}
        isSubmitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setHotelToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        hotelTitle={hotelToDelete?.title || ''}
        isDeleting={submitting}
      />
    </>
  );
};

export default AdminDashboardPage;
