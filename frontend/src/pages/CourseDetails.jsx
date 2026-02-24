import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Globe2, Loader, PlayCircle, Star } from 'lucide-react';
import { courseAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await courseAPI.getCourseById(courseId);
        setCourse(data.course);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course details');
      }
    };

    const fetchEnrollment = async () => {
      if (!auth.isAuthenticated || auth.user?.role !== 'student') return;
      try {
        const { data } = await orderAPI.getUserOrders();
        const hasEnrollment = (data.orders || []).some(
          (order) => order.course?._id === courseId && order.status === 'completed'
        );
        setEnrolled(hasEnrollment);
      } catch (_) {
        setEnrolled(false);
      }
    };

    const run = async () => {
      setLoading(true);
      await Promise.all([fetchCourse(), fetchEnrollment()]);
      setLoading(false);
    };

    run();
  }, [courseId, auth.isAuthenticated, auth.user?.role]);

  const enrollButtonLabel = useMemo(() => {
    if (enrolled) return 'Continue Course';
    if (!auth.isAuthenticated) return 'Login to Enroll';
    if (auth.user?.role !== 'student') return 'Student account required';
    return 'Enroll Now';
  }, [auth.isAuthenticated, auth.user?.role, enrolled]);

  const handleEnroll = () => {
    if (enrolled) {
      navigate(`/course/${courseId}`);
      return;
    }

    if (!auth.isAuthenticated) {
      navigate('/login');
      return;
    }

    if (auth.user?.role !== 'student') {
      navigate('/');
      return;
    }

    navigate(`/checkout/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-light py-10">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/courses" className="inline-flex items-center gap-2 text-primary hover:text-secondary mb-6 font-semibold">
            <ArrowLeft className="w-5 h-5" /> Back to Courses
          </Link>
          <div className="bg-white rounded-xl shadow p-8 text-center text-red-600">
            {error || 'Course not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light py-10">
      <div className="max-w-5xl mx-auto px-4">
        <Link to="/courses" className="inline-flex items-center gap-2 text-primary hover:text-secondary mb-6 font-semibold">
          <ArrowLeft className="w-5 h-5" /> Back to Courses
        </Link>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <img src={course.thumbnail} alt={course.title} className="w-full h-72 object-cover" />

          <div className="p-8">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-primary font-semibold">{course.category}</span>
              <span className="px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 font-semibold">{course.level}</span>
            </div>

            <h1 className="text-3xl font-bold text-dark mb-3">{course.title}</h1>
            <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{course.description}</p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <Globe2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">Language</p>
                  <p className="font-semibold">{course.language || 'English'}</p>
                </div>
              </div>
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <Clock3 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold">{course.duration || 0} hrs</p>
                </div>
              </div>
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-gray-500">Rating</p>
                  <p className="font-semibold">{(course.rating || 0).toFixed(1)}</p>
                </div>
              </div>
            </div>

            {course.introVideoUrl && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-dark mb-3 flex items-center gap-2"><PlayCircle className="w-5 h-5 text-primary" /> Course Intro</h2>
                <video src={course.introVideoUrl} controls className="w-full rounded-lg bg-black max-h-96" />
              </div>
            )}

            {Array.isArray(course.modules) && course.modules.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-dark mb-3">Course Curriculum</h2>
                <div className="space-y-3">
                  {course.modules.map((section, idx) => (
                    <div key={section._id || idx} className="border rounded-lg p-4">
                      <p className="font-semibold mb-2">Section {idx + 1}: {section.title}</p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(section.lessons || []).map((lesson, lidx) => (
                          <li key={lesson._id || lidx} className="flex items-center justify-between">
                            <span>{lidx + 1}. {lesson.title}</span>
                            {lesson.isPreview ? <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Preview</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-3xl font-bold text-primary">${course.price}</p>
              <button
                onClick={handleEnroll}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-secondary transition"
              >
                {enrollButtonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
