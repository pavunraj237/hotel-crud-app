import React, { useEffect, useRef, useState } from 'react';
import { formatINR } from '../utils/currency';

const PriceRangeSlider = ({
  minBound = 1500,
  maxBound = 15000,
  currentMin = '',
  currentMax = '',
  onChange,
}) => {
  const minLimit = typeof minBound === 'number' && Number.isFinite(minBound) ? minBound : 1500;
  const maxLimit = typeof maxBound === 'number' && Number.isFinite(maxBound) && maxBound > minLimit
    ? maxBound
    : Math.max(15000, minLimit + 1);

  const [localMin, setLocalMin] = useState(() => {
    const value = Number(currentMin);
    return currentMin !== '' && Number.isFinite(value) ? value : minLimit;
  });
  const [localMax, setLocalMax] = useState(() => {
    const value = Number(currentMax);
    return currentMax !== '' && Number.isFinite(value) ? value : maxLimit;
  });

  const isUserInteracting = useRef(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (isUserInteracting.current) return;

    const minValue = Number(currentMin);
    const maxValue = Number(currentMax);
    setLocalMin(
      currentMin !== '' && Number.isFinite(minValue)
        ? Math.min(maxLimit - 1, Math.max(minLimit, minValue))
        : minLimit
    );
    setLocalMax(
      currentMax !== '' && Number.isFinite(maxValue)
        ? Math.min(maxLimit, Math.max(minLimit + 1, maxValue))
        : maxLimit
    );
  }, [currentMin, currentMax, minLimit, maxLimit]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const notifyChange = (minPrice, maxPrice) => {
    clearTimeout(debounceTimer.current);
    isUserInteracting.current = true;
    debounceTimer.current = setTimeout(() => {
      isUserInteracting.current = false;
      onChange?.({ minPrice, maxPrice });
    }, 350);
  };

  const updateMin = (event) => {
    const value = Math.min(Number(event.target.value), localMax - 1);
    setLocalMin(value);
    notifyChange(value, localMax);
  };

  const updateMax = (event) => {
    const value = Math.max(Number(event.target.value), localMin + 1);
    setLocalMax(value);
    notifyChange(localMin, value);
  };

  const span = maxLimit - minLimit || 1;
  const minPercent = Math.min(100, Math.max(0, ((localMin - minLimit) / span) * 100));
  const maxPercent = Math.min(100, Math.max(0, ((localMax - minLimit) / span) * 100));

  return (
    <div
      className="price-filter-widget"
      role="group"
      aria-label={`Price range filter, ₹${localMin} to ₹${localMax}`}
    >
      <h4 className="price-widget-title">Price range</h4>
      <div className="price-current-values" aria-live="polite">
        <span>{formatINR(localMin)}</span>
        <span>{formatINR(localMax)}</span>
      </div>
      <div className="dual-slider-track-wrap">
        <div className="slider-base-bar" />
        <div
          className="slider-active-highlight"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={localMin}
          onChange={updateMin}
          className="range-thumb range-thumb-left"
          aria-label="Minimum price in rupees"
        />
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={localMax}
          onChange={updateMax}
          className="range-thumb range-thumb-right"
          aria-label="Maximum price in rupees"
        />
      </div>
    </div>
  );
};

export default PriceRangeSlider;
