import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="container navbar-container">
        {/* Go back to the hotel list. */}
        <Link to="/" className="navbar-logo" aria-label="Hotel Explorer Home">
          <Building2 size={28} />
          <span>Hotel Explorer</span>
        </Link>

        {/* Open the admin login page. */}
        <div className="navbar-actions">
          <Link
            to="/admin/login"
            className="btn btn-secondary btn-sm"
            aria-label="Admin portal"
            title="Administrator login"
          >
            <Shield size={15} />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
