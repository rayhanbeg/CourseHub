import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI } from '../services/api';
import { ArrowRight, BookOpen, Users, Zap, Award, Loader, Briefcase, Clock3, ShieldCheck } from 'lucide-react';

const valuePoints = [
  {
    icon: BookOpen,
    title: 'Expert Content',
    description: 'Structured lessons built by experienced professionals with practical examples.',
  },
  {
    icon: Zap,
    title: 'Flexible Learning',
    description: 'Study at your own pace with lessons optimized for short, consistent sessions.',
  },
  {
    icon: Award,
    title: 'Career Ready',
    description: 'Build proven skills and complete courses with confidence and measurable progress.',
  },
  {
    icon: Users,
    title: 'Trusted Community',
    description: 'Join a growing network of learners focused on meaningful skill development.',
  },
];

const Home = () => {
  const auth = useAuth();
  const [popularCourses, setPopularCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        const { data } = await courseAPI.getAllCourses({ limit: 8 });
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
    () => [...popularCourses].sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0)).slice(0, 6),
    [popularCourses]
  );

  const stats = useMemo(() => {
    const learnerCount = popularCourses.reduce((acc, course) => acc + (course.enrollmentCount || 0), 0);
    const categoryCount = new Set(popularCourses.map((course) => course.category).filter(Boolean)).size;
    return {
      courses: popularCourses.length,
      learners: learnerCount,
      categories: categoryCount,
    };
  }, [popularCourses]);

  const featuredTracks = useMemo(() => {
    const grouped = popularCourses.reduce((acc, course) => {
      const key = course.category || 'General';
      acc[key] = acc[key] || [];
      acc[key].push(course);
      return acc;
    }, {});

    return Object.entries(grouped)
      .slice(0, 3)
      .map(([name, courses]) => ({
        name,
        count: courses.length,
        avgLevel: courses[0]?.level || 'Beginner',
      }));
  }, [popularCourses]);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-medium text-primary mb-3">Professional Online Learning</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4 text-balance">
              Build practical skills with modern, focused courses.
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mb-8 text-balance">
              CourseHub provides high-quality, career-focused learning experiences with a clean interface and a structured learning path.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/courses" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-secondary font-semibold">
                Explore Courses <ArrowRight className="w-4 h-4" />
              </Link>
              {!auth.isAuthenticated && (
                <Link to="/register" className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold">
                  Create Free Account
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Published Courses', value: stats.courses || 0, icon: BookOpen },
              { label: 'Total Learners', value: stats.learners || 0, icon: Users },
              { label: 'Top Categories', value: stats.categories || 0, icon: Briefcase },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-100 border border-slate-200 p-5">
                <item.icon className="w-5 h-5 text-primary mb-3" />
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 text-center mb-10">Why learners choose CourseHub</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {valuePoints.map((point) => (
            <div key={point.title} className="bg-white rounded-xl border border-slate-200 p-5">
              <point.icon className="w-5 h-5 text-primary mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">{point.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">Popular Courses</h2>
            <Link to="/courses" className="text-sm font-semibold text-primary hover:text-secondary">View all courses →</Link>
          </div>

          {loadingCourses ? (
            <div className="py-10 flex justify-center"><Loader className="w-8 h-8 animate-spin text-primary" /></div>
          ) : topCourses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Courses will appear here after publication.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCourses.map((course) => (
                <article key={course._id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">{course.category}</p>
                    <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2">{course.title}</h3>
                    <div className="flex justify-between items-center text-sm text-slate-600 mb-4">
                      <span>{course.enrollmentCount || 0} students</span>
                      <span>{course.level}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">${course.price}</span>
                      <Link to={`/courses/${course._id}`} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-secondary">
                        View Course
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Learning paths by category</h3>
            <div className="space-y-3">
              {featuredTracks.length === 0 ? (
                <p className="text-sm text-slate-500">New categories will appear as soon as courses are available.</p>
              ) : (
                featuredTracks.map((track) => (
                  <div key={track.name} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{track.name}</p>
                      <p className="text-xs text-slate-600">{track.count} courses · {track.avgLevel}</p>
                    </div>
                    <Link to="/courses" className="text-sm font-semibold text-primary">Explore</Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">How CourseHub supports consistency</h3>
            <div className="space-y-4">
              {[
                { icon: Clock3, title: 'Focused lesson duration', text: 'Most lessons are structured for quick, meaningful progress in less time.' },
                { icon: ShieldCheck, title: 'Reliable course structure', text: 'A clear module-based format helps learners stay organized and reduce overwhelm.' },
                { icon: Award, title: 'Progress visibility', text: 'Track completion and maintain momentum with a clear dashboard and milestones.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!auth.isAuthenticated && (
        <section className="bg-slate-900 text-white py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-3">Ready to start learning professionally?</h3>
            <p className="text-slate-300 mb-7">Create your account and begin with courses aligned to your goals.</p>
            <Link to="/register" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100">
              Get Started
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
