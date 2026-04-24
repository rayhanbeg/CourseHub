import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { courseAPI } from '../services/api';
import { setCoursesSuccess, setLoading, setError, setFilters, clearFilters } from '../store/courseSlice';
import { Loader, Search, Filter, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const CoursesList = () => {
  const dispatch = useDispatch();
  const { courses, isLoading, totalCourses, filters } = useSelector((state) => state.courses);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      dispatch(setLoading(true));
      try {
        const params = {
          category: selectedCategory || undefined,
          level: selectedLevel || undefined,
          query: searchTerm || undefined,
        };
        const { data } = await courseAPI.searchCourses(params);
        dispatch(setCoursesSuccess(data));
      } catch (error) {
        dispatch(setError(error.response?.data?.message || 'Failed to load courses'));
      }
    };

    fetchCourses();
  }, [selectedCategory, selectedLevel, searchTerm, dispatch]);

  const categories = ['Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-3">Explore Courses</h1>
          <p className="text-blue-100">Learn new skills from industry experts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:border-primary"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg border border-slate-200 p-5 lg:sticky lg:top-20">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" /> Filters
              </h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600 capitalize">{cat}</span>
                    </label>
                  ))}
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="text-xs text-primary hover:underline mt-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Level Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Level</h4>
                <div className="space-y-2">
                  {levels.map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="level"
                        value={level}
                        checked={selectedLevel === level}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600 capitalize">{level}</span>
                    </label>
                  ))}
                  {selectedLevel && (
                    <button
                      onClick={() => setSelectedLevel('')}
                      className="text-xs text-primary hover:underline mt-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {(selectedCategory || selectedLevel || searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedLevel('');
                    setSearchTerm('');
                    dispatch(clearFilters());
                  }}
                  className="w-full px-4 py-2 bg-light border border-primary text-primary rounded hover:bg-primary hover:text-white transition text-sm font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <p className="text-gray-500 text-lg">No courses found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition overflow-hidden group">
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition duration-500"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2 text-dark line-clamp-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-primary text-xs font-semibold rounded-full capitalize">
                          {course.level}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{course.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">${course.price}</span>
                        <Link
                          to={`/courses/${course._id}`}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-semibold text-sm"
                        >
                          View Course
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesList;