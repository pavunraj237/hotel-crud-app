import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import PriceRangeSlider from './PriceRangeSlider';

const Filters = (props) => {
  const filters = props.filters;
  const priceStats = props.priceStats;
  const onFilterChange = props.onFilterChange;
  const onReset = props.onReset;

  let isFiltered = false;
  if (filters.search && filters.search.trim()) {
    isFiltered = true;
  }
  if (!isFiltered && filters.availability && filters.availability !== 'all') {
    isFiltered = true;
  }

  let minBound = 0;
  let maxBound = 15000;
  if (priceStats && priceStats.minPrice) {
    minBound = priceStats.minPrice;
  }
  if (priceStats && priceStats.maxPrice) {
    maxBound = priceStats.maxPrice;
  }

  if (
    !isFiltered &&
    filters.minPrice !== '' &&
    filters.minPrice !== undefined &&
    Number(filters.minPrice) > minBound
  ) {
    isFiltered = true;
  }
  if (
    !isFiltered &&
    filters.maxPrice !== '' &&
    filters.maxPrice !== undefined &&
    Number(filters.maxPrice) < maxBound
  ) {
    isFiltered = true;
  }

  return (
    <section className="filters-card" aria-label="Hotel search and filters">
      <div className="filters-top-row">
        {/* Search by hotel name. */}
        <div className="search-group">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search hotels by title..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="search-input"
            aria-label="Search hotels by title"
          />
        </div>

        {/* Adjust the price range. */}
        <div className="price-slider-row">
          <PriceRangeSlider
            minBound={priceStats ? priceStats.minPrice : undefined}
            maxBound={priceStats ? priceStats.maxPrice : undefined}
            currentMin={filters.minPrice}
            currentMax={filters.maxPrice}
            onChange={(range) => {
              onFilterChange({ minPrice: range.minPrice, maxPrice: range.maxPrice });
            }}
          />
        </div>

        {/* Filter by availability. */}
        <select
          value={filters.availability || 'all'}
          onChange={(e) => onFilterChange({ availability: e.target.value })}
          className="availability-select"
          aria-label="Filter by availability"
        >
          <option value="all">All Availability</option>
          <option value="Available">✓ Available</option>
          <option value="Unavailable">✗ Unavailable</option>
        </select>

        {/* Show reset when a filter is active. */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="btn btn-secondary btn-sm reset-filter-btn"
            title="Reset all filters to defaults"
            aria-label="Reset all search filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

    </section>
  );
};

export default Filters;
