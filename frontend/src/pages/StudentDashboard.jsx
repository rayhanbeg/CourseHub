import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressAPI } from '../services/api';
import { Loader, BookOpen, BarChart3, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const auth = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data } = await progressAPI.getAllUserProgress();
        setProgress(data.progress);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    if (auth.isAuthenticated) {
      fetchProgress();
    }
  }, [auth.isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedCourses = progress.filter(p => p.isCompleted).length;
  const inProgressCourses = progress.filter(p => !p.isCompleted).length;
  const avgProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.overallProgress, 0) / progress.length)
    : 0;

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-2">Welcome back, {auth.user?.name}!</h1>
          <p className="text-blue-100">Continue your learning journey</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Courses</p>
                <p className="text-3xl font-bold text-dark">{progress.length}</p>
              </div>
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
          </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-dark">{inProgressCourses}</p>
              </div>
              <Play className="w-10 h-10 text-secondary" />
            </div>
          </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-dark">{completedCourses}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-accent" />
            </div>
          </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Progress</p>
                <p className="text-3xl font-bold text-dark">{avgProgress}%</p>
              </div>
              <div className="text-primary text-2xl font-bold">📊</div>
            </div>
          </div>
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-dark">Your Courses</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {progress.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No courses yet. Start learning today!</p>
              <Link to="/courses" className="text-primary hover:text-secondary mt-4 inline-block font-semibold">
                Browse Courses →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progress.map((prog) => (
                <div key={prog._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-secondary h-2"></div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 text-dark truncate">{prog.course.title}</h3>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{prog.overallProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all"
                          style={{ width: `${prog.overallProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {prog.isCompleted ? (
                        <span className="flex-1 px-4 py-2 bg-accent text-white rounded text-center text-sm font-semibold">
                          Completed
                        </span>
                      ) : (
                        <Link
                          to={`/course/${prog.course._id}`}
                          className="flex-1 px-4 py-2 bg-primary text-white rounded text-center text-sm font-semibold hover:bg-secondary transition"
                        >
                          Continue
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
