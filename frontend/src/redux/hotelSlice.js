// src/redux/hotelSlice.js - Redux Toolkit slice for managing hotel state
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = '/api/hotels';

// Async thunk to fetch paginated and filtered list of hotels
export const fetchHotels = createAsyncThunk(
  'hotels/fetchHotels',
  async (
    { search = '', minPrice = '', maxPrice = '', availability = 'all', page = 1, limit = 6 },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (minPrice !== '' && minPrice !== undefined && minPrice !== null) {
        params.append('minPrice', minPrice);
      }
      if (maxPrice !== '' && maxPrice !== undefined && maxPrice !== null) {
        params.append('maxPrice', maxPrice);
      }
      if (availability && availability !== 'all') {
        params.append('availability', availability);
      }
      params.append('page', page);
      params.append('limit', limit);

      const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch hotels');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message || 'Network error while fetching hotels');
    }
  }
);

// Async thunk to fetch global price distribution and min/max bounds
export const fetchPriceStats = createAsyncThunk(
  'hotels/fetchPriceStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/price-stats`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch price stats');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message || 'Network error while fetching price stats');
    }
  }
);

// Async thunk to fetch a single hotel by ID for detail page
export const fetchHotelById = createAsyncThunk(
  'hotels/fetchHotelById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Hotel not found');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message || 'Network error while fetching hotel details');
    }
  }
);

// Async thunk to create a new hotel with multipart/form-data (Admin required)
export const createHotel = createAsyncThunk(
  'hotels/createHotel',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.errors ? data.errors.join(', ') : data.error || 'Failed to create hotel';
        return rejectWithValue(errorMsg);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error while creating hotel');
    }
  }
);

// Async thunk to update an existing hotel with multipart/form-data (Admin required)
export const updateHotel = createAsyncThunk(
  'hotels/updateHotel',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.errors ? data.errors.join(', ') : data.error || 'Failed to update hotel';
        return rejectWithValue(errorMsg);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error while updating hotel');
    }
  }
);

// Async thunk to delete a hotel (Admin required)
export const deleteHotel = createAsyncThunk(
  'hotels/deleteHotel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete hotel');
      }
      return { id: parseInt(id, 10), message: data.message };
    } catch (err) {
      return rejectWithValue(err.message || 'Network error while deleting hotel');
    }
  }
);

const initialState = {
  hotels: [],
  selectedHotel: null,
  pagination: {
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 6,
  },
  filters: {
    search: '',
    minPrice: 1500,
    maxPrice: 15000,
    availability: 'all',
  },
  priceStats: {
    minPrice: 1500,
    maxPrice: 15000,
    totalHotels: 0,
    buckets: [],
  },
  loading: false,
  detailLoading: false,
  submitting: false,
  error: null,
  successMessage: null,
};

const hotelSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Always reset to page 1 on filter change
    },
    resetFilters: (state) => {
      state.filters = { search: '', minPrice: 1500, maxPrice: 15000, availability: 'all' };
      state.pagination.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedHotel: (state) => {
      state.selectedHotel = null;
    },
  },
  extraReducers: (builder) => {
    // fetchHotels
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = action.payload.hotels;
        state.pagination = action.payload.pagination;
        if (action.payload.priceStats) {
          state.priceStats = action.payload.priceStats;
        }
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchPriceStats
    builder
      .addCase(fetchPriceStats.fulfilled, (state, action) => {
        state.priceStats = action.payload;
      });

    // fetchHotelById
    builder
      .addCase(fetchHotelById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedHotel = action.payload;
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      });

    // createHotel
    builder
      .addCase(createHotel.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createHotel.fulfilled, (state) => {
        state.submitting = false;
        state.successMessage = 'Hotel added successfully!';
      })
      .addCase(createHotel.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });

    // updateHotel
    builder
      .addCase(updateHotel.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.submitting = false;
        state.selectedHotel = action.payload;
        state.successMessage = 'Hotel updated successfully!';
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });

    // deleteHotel
    builder
      .addCase(deleteHotel.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.submitting = false;
        state.hotels = state.hotels.filter((hotel) => hotel.id !== action.payload.id);
        state.successMessage = 'Hotel deleted successfully!';
        if (state.selectedHotel && state.selectedHotel.id === action.payload.id) {
          state.selectedHotel = null;
        }
      })
      .addCase(deleteHotel.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setCurrentPage,
  clearSuccessMessage,
  clearError,
  clearSelectedHotel,
} = hotelSlice.actions;

export default hotelSlice.reducer;
