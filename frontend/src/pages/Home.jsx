import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BookOpen, Users, Zap, Award } from 'lucide-react';

const Home = () => {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-light">
      {/* Navigation */}
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4 text-balance">
            Learn from Industry Experts
          </h2>
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

      {/* Features Section */}
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

      {/* Popular Courses Preview */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-dark mb-12">Popular Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {[
              {
                title: 'Advanced React Development',
                category: 'Programming',
                price: '$49',
                students: '15K',
              },
              {
                title: 'UI/UX Design Masterclass',
                category: 'Design',
                price: '$39',
                students: '8K',
              },
              {
                title: 'Digital Marketing 101',
                category: 'Marketing',
                price: '$29',
                students: '12K',
              },
            ].map((course, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                <div className="bg-gradient-to-r from-primary to-secondary h-32 rounded-lg mb-4"></div>
                <h4 className="font-bold text-lg text-dark mb-2">{course.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{course.category}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">{course.price}</span>
                  <span className="text-sm text-gray-600">{course.students} students</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/courses" className="text-primary hover:text-secondary font-bold">
              View All Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!auth.isAuthenticated && (
        <section className="bg-gradient-to-r from-primary to-secondary text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Learning?</h3>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students and invest in your future today.
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-bold"
            >
              Get Started for Free
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CourseHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
