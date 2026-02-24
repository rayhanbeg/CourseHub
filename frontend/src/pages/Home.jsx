import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { ArrowRight, BookOpen, Users, Zap, Award, Loader } from 'lucide-react';

const Home = () => {
  const auth = useAuth();
  const [popularCourses, setPopularCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        const { data } = await courseAPI.getAllCourses({ limit: 6 });
        setPopularCourses(data.courses || []);
      } catch (error) {
        setPopularCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchPopularCourses();
  }, []);

  const topCourses = useMemo(
    () => [...popularCourses].sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0)).slice(0, 3),
    [popularCourses]
  );

  return (
    <div className="min-h-screen bg-light">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">CourseHub</h1>
          <div className="flex gap-4">
            {auth.isAuthenticated ? (
              <>
                <Link to="/courses" className="text-dark hover:text-primary font-semibold">
                  Browse Courses
                </Link>
                <Link
                  to={auth.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-semibold"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-dark hover:text-primary font-semibold">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4 text-balance">Learn from Industry Experts</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto text-balance">
            Explore thousands of courses taught by professionals. Gain new skills and advance your career.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/courses"
              className="px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-bold flex items-center gap-2"
            >
              Explore Courses <ArrowRight className="w-5 h-5" />
            </Link>
            {!auth.isAuthenticated && (
              <Link
                to="/register"
                className="px-8 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition font-bold"
              >
                Sign Up Free
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center text-dark mb-12">Why Choose CourseHub?</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-bold text-lg mb-2 text-dark">Expert Content</h4>
            <p className="text-gray-600">Learn from industry professionals with years of experience</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-secondary" />
            </div>
            <h4 className="font-bold text-lg mb-2 text-dark">Learn at Your Pace</h4>
            <p className="text-gray-600">Access course materials anytime, anywhere at your convenience</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-accent" />
            </div>
            <h4 className="font-bold text-lg mb-2 text-dark">Certificates</h4>
            <p className="text-gray-600">Earn certificates upon course completion to boost your resume</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-bold text-lg mb-2 text-dark">Community</h4>
            <p className="text-gray-600">Connect with thousands of learners and grow together</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-dark">Popular Courses</h3>
            <Link to="/courses" className="text-primary hover:text-secondary font-bold">
              View All Courses →
            </Link>
          </div>

          {loadingCourses ? (
            <div className="py-12 flex justify-center">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : topCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No published courses available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topCourses.map((course) => (
                <div key={course._id} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition bg-white">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="p-5">
                    <p className="text-xs font-semibold tracking-wide text-primary mb-2">{course.category}</p>
                    <h4 className="font-bold text-lg text-dark mb-2 line-clamp-2">{course.title}</h4>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <span>{course.enrollmentCount || 0} students</span>
                      <span>{course.level}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">${course.price}</span>
                      <Link to="/courses" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-secondary transition font-semibold text-sm">
                        Browse
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {!auth.isAuthenticated && (
        <section className="bg-gradient-to-r from-primary to-secondary text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Learning?</h3>
            <p className="text-xl text-blue-100 mb-8">Join thousands of students and invest in your future today.</p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-bold"
            >
              Get Started for Free
            </Link>
          </div>
        </section>
      )}

      <footer className="bg-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 CourseHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
