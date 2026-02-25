import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  courses: [],
  selectedCourse: null,
  isLoading: false,
  error: null,
  totalCourses: 0,
  currentPage: 1,
  filters: {
    category: null,
    level: null,
    search: null,
  },
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCoursesSuccess: (state, action) => {
      state.courses = action.payload.courses;
      state.totalCourses = action.payload.total;
      state.currentPage = action.payload.page;
      state.error = null;
      state.isLoading = false;
    },
    setCourseDetails: (state, action) => {
      state.selectedCourse = action.payload;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = { category: null, level: null, search: null };
      state.currentPage = 1;
    },
    addCourse: (state, action) => {
      state.courses.push(action.payload);
    },
    updateCourse: (state, action) => {
      const index = state.courses.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
      if (state.selectedCourse?._id === action.payload._id) {
        state.selectedCourse = action.payload;
      }
    },
    deleteCourse: (state, action) => {
      state.courses = state.courses.filter(c => c._id !== action.payload);
      if (state.selectedCourse?._id === action.payload) {
        state.selectedCourse = null;
      }
    },
  },
});

export const {
  setLoading,
  setCoursesSuccess,
  setCourseDetails,
  setError,
  setFilters,
  clearFilters,
  addCourse,
  updateCourse,
  deleteCourse,
} = courseSlice.actions;

export default courseSlice.reducer;