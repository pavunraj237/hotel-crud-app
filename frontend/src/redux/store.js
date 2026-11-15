// src/redux/store.js - Redux store configuration
import { configureStore } from '@reduxjs/toolkit';
import hotelReducer from './hotelSlice';
import authReducer from './authSlice';

const reducers = {
  hotels: hotelReducer,
  auth: authReducer,
};

export const store = configureStore({
  reducer: reducers,
});
