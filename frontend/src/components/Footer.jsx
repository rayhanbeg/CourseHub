import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">CourseHub</h3>
            <p className="text-sm text-slate-400">
              Learn new skills and advance your career with our comprehensive online courses.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition">Courses</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Contact</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">FAQ</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: info@coursehub.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Education St, Learning City</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              &copy; 2024 CourseHub. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">Facebook</a>
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
