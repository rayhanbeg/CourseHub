import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseAPI, orderAPI, progressAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader, Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalRevenue: 0,
    totalOrders: 0,
    activeStudents: 0,
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch courses
        const coursesRes = await courseAPI.getInstructorCourses();
        setCourses(coursesRes.data.courses);

        // Fetch orders
        const ordersRes = await orderAPI.getAllOrders({ limit: 100 });
        setOrders(ordersRes.data.orders);

        // Calculate stats
        const totalRevenue = ordersRes.data.orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + o.amount, 0);

        const uniqueStudents = new Set(ordersRes.data.orders.map(o => o.student._id)).size;

        setStats({
          totalCourses: coursesRes.data.courses.length,
          totalRevenue,
          totalOrders: ordersRes.data.total,
          activeStudents: uniqueStudents,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    if (auth.user?.role === 'admin') {
      fetchAdminData();
    }
  }, [auth.user?.role]);

  if (auth.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare chart data
  const revenueData = [
    { name: 'Week 1', revenue: 1200 },
    { name: 'Week 2', revenue: 1900 },
    { name: 'Week 3', revenue: 1600 },
    { name: 'Week 4', revenue: 2400 },
    { name: 'Week 5', revenue: 2100 },
  ];

  const orderStatusData = [
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length },
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Failed', value: orders.filter(o => o.status === 'failed').length },
  ];

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">Manage courses, orders, and track analytics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Courses</p>
                <p className="text-3xl font-bold text-dark">{stats.totalCourses}</p>
              </div>
              <BookOpen className="w-10 h-10 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-dark">${stats.totalRevenue}</p>
              </div>
              <DollarSign className="w-10 h-10 text-accent opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-dark">{stats.totalOrders}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-secondary opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Students</p>
                <p className="text-3xl font-bold text-dark">{stats.activeStudents}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-dark mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-dark mb-4">Order Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-dark">Your Courses</h3>
            <a href="/admin/create-course" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-semibold">
              Create New Course
            </a>
          </div>

          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No courses yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-dark">Course Title</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Students</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Modules</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Price</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id} className="border-b border-gray-100 hover:bg-light transition">
                      <td className="py-4 px-4 text-dark font-semibold">{course.title}</td>
                      <td className="py-4 px-4 text-gray-600">{course.enrollmentCount}</td>
                      <td className="py-4 px-4 text-gray-600">{course.modules.length}</td>
                      <td className="py-4 px-4 text-dark font-semibold">${course.price}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          course.isPublished
                            ? 'bg-green-100 text-accent'
                            : 'bg-yellow-100 text-orange-600'
                        }`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <a href={`/admin/edit-course/${course._id}`} className="text-primary hover:underline text-sm font-semibold">
                            Edit
                          </a>
                          <a href={`/admin/course-analytics/${course._id}`} className="text-secondary hover:underline text-sm font-semibold">
                            Analytics
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-dark mb-6">Recent Orders</h3>

          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-dark">Order ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Student</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Course</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Amount</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-dark">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-light transition">
                      <td className="py-4 px-4 text-dark font-mono text-sm">{order._id.slice(-8)}</td>
                      <td className="py-4 px-4 text-gray-600">{order.student.name}</td>
                      <td className="py-4 px-4 text-gray-600">{order.course.title}</td>
                      <td className="py-4 px-4 text-dark font-semibold">${order.amount}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed' ? 'bg-green-100 text-accent' :
                          order.status === 'pending' ? 'bg-yellow-100 text-orange-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
