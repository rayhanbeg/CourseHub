import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, orderAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader, Users, BookOpen, DollarSign, TrendingUp, PlusCircle } from 'lucide-react';
import AppNavbar from '../components/AppNavbar';

const formatMonth = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short' });

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
        const [coursesRes, ordersRes] = await Promise.all([
          courseAPI.getInstructorCourses(),
          orderAPI.getAllOrders({ limit: 100 }),
        ]);

        const fetchedCourses = coursesRes.data.courses || [];
        const fetchedOrders = ordersRes.data.orders || [];

        setCourses(fetchedCourses);
        setOrders(fetchedOrders);

        const completedOrders = fetchedOrders.filter((o) => o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const uniqueStudents = new Set(fetchedOrders.map((o) => o.student?._id).filter(Boolean)).size;

        setStats({
          totalCourses: fetchedCourses.length,
          totalRevenue,
          totalOrders: ordersRes.data.total || fetchedOrders.length,
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

  const revenueData = useMemo(() => {
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const monthlyRevenue = completedOrders.reduce((acc, order) => {
      const month = formatMonth(order.createdAt);
      acc[month] = (acc[month] || 0) + (order.amount || 0);
      return acc;
    }, {});

    return Object.entries(monthlyRevenue).map(([name, revenue]) => ({ name, revenue }));
  }, [orders]);

  const orderStatusData = useMemo(
    () => [
      { name: 'Completed', value: orders.filter((o) => o.status === 'completed').length },
      { name: 'Pending', value: orders.filter((o) => o.status === 'pending').length },
      { name: 'Failed', value: orders.filter((o) => o.status === 'failed').length },
    ],
    [orders]
  );


  const handleDeleteCourse = async (courseId) => {
    try {
      await courseAPI.deleteCourse(courseId);
      setCourses((prev) => prev.filter((course) => course._id !== courseId));
      setStats((prev) => ({ ...prev, totalCourses: Math.max(0, prev.totalCourses - 1) }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const togglePublishStatus = async (courseId, nextStatus) => {
    try {
      const { data } = await courseAPI.updateCourse(courseId, { isPublished: nextStatus });
      setCourses((prev) => prev.map((course) => (
        course._id === courseId ? { ...course, isPublished: data.course.isPublished } : course
      )));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update publish status');
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-blue-100">Manage courses, orders, and track analytics</p>
          </div>
          <Link to="/admin/create-course" className="inline-flex items-center gap-2 px-5 py-3 bg-white/95 text-primary font-semibold rounded-xl hover:bg-white transition">
            <PlusCircle className="w-5 h-5" /> Create Course
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[{
            label: 'Total Courses', value: stats.totalCourses, icon: BookOpen,
          }, {
            label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign,
          }, {
            label: 'Total Orders', value: stats.totalOrders, icon: TrendingUp,
          }, {
            label: 'Active Students', value: stats.activeStudents, icon: Users,
          }].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{item.label}</p>
                  <p className="text-3xl font-bold text-dark mt-1">{item.value}</p>
                </div>
                <item.icon className="w-10 h-10 text-primary opacity-30" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-dark mb-4">Revenue Trend (from real orders)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-dark mb-4">Order Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-100">
          <h3 className="text-lg font-bold text-dark mb-6">Your Courses</h3>
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
                      <td className="py-4 px-4 text-gray-600">{course.enrollmentCount || 0}</td>
                      <td className="py-4 px-4 text-gray-600">{course.modules?.length || 0}</td>
                      <td className="py-4 px-4 text-dark font-semibold">${course.price}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.isPublished ? 'bg-green-100 text-accent' : 'bg-yellow-100 text-orange-600'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => togglePublishStatus(course._id, !course.isPublished)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${course.isPublished ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                          >
                            {course.isPublished ? 'Move to Draft' : 'Publish'}
                          </button>
                          <Link
                            to={`/admin/edit-course/${course._id}`}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course._id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
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
