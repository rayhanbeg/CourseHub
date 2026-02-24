import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setOrdersSuccess: (state, action) => {
      state.orders = action.payload;
      state.error = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
      state.error = null;
    },
    addOrder: (state, action) => {
      state.orders.push(action.payload);
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const order = state.orders.find(o => o._id === action.payload._id);
      if (order) {
        order.status = action.payload.status;
      }
      if (state.currentOrder?._id === action.payload._id) {
        state.currentOrder.status = action.payload.status;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setOrdersSuccess,
  setCurrentOrder,
  addOrder,
  updateOrderStatus,
  setError,
  clearError,
} = orderSlice.actions;

export default orderSlice.reducer;
