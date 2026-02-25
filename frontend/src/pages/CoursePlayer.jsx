import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, progressAPI } from '../services/api';
import { VideoPlayer } from '../components';
import AppNavbar from '../components/AppNavbar';
import { Loader, ChevronDown, CheckCircle, Play, Lock } from 'lucide-react';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course details
        const courseRes = await courseAPI.getCourseById(courseId);
        setCourse(courseRes.data.course);

        // Fetch student progress
        const progressRes = await progressAPI.getCourseProgress(courseId);
        setProgress(progressRes.data.progress);

        // Set first lesson as default
        if (courseRes.data.course.modules.length > 0) {
          const firstLesson = courseRes.data.course.modules[0]?.lessons[0];
          if (firstLesson) {
            setSelectedLesson(firstLesson);
            setExpandedModules({ [courseRes.data.course.modules[0]._id]: true });
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setAccessDenied(true);
          setError('You are not enrolled in this course yet.');
        } else {
          setError(err.response?.data?.message || 'Failed to load course');
        }
      } finally {
        setLoading(false);
      }
    };

    if (auth.isAuthenticated) {
      fetchData();
    }
  }, [courseId, auth.isAuthenticated]);

  const handleLessonSelect = async (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleLessonComplete = async () => {
    try {
      if (selectedLesson && progress) {
        await progressAPI.updateLessonProgress(courseId, selectedLesson._id, {
          isCompleted: true,
        });
        // Refresh progress
        const progressRes = await progressAPI.getCourseProgress(courseId);
        setProgress(progressRes.data.progress);
      }
    } catch (err) {
      console.error('Failed to update progress', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-light py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">Course not found</p>
          </div>
        </div>
      </div>
    );
  }


  if (accessDenied) {
    return (
      <div className="min-h-screen bg-light py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-dark mb-2">Enrollment Required</h2>
            <p className="text-gray-600 mb-6">You need to enroll in this course before accessing lessons.</p>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-secondary transition font-semibold"
            >
              Go to Course Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lessonProgress = progress?.lessons.find(l => l.lesson._id === selectedLesson?._id);
  const isLessonCompleted = lessonProgress?.isCompleted || false;

  return (
    <div className="min-h-screen bg-light">
      <AppNavbar />
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-100 hover:text-white mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {progress && (
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-32 bg-blue-100 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${progress.overallProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">{progress.overallProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {selectedLesson ? (
              <div>
                <VideoPlayer
                  videoUrl={selectedLesson.videoUrl}
                  title={selectedLesson.title}
                  resources={selectedLesson.resources}
                  onComplete={handleLessonComplete}
                />

                {/* Lesson Info */}
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-dark">{selectedLesson.title}</h2>
                    {isLessonCompleted && (
                      <div className="flex items-center gap-2 text-accent">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold">Completed</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">{selectedLesson.description}</p>

                  {!isLessonCompleted && (
                    <button
                      onClick={handleLessonComplete}
                      className="px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition font-semibold"
                    >
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">No lessons available</p>
              </div>
            )}
          </div>

          {/* Modules Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-20">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-bold text-lg text-dark">Course Content</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {progress?.lessons.filter(l => l.isCompleted).length} of {progress?.lessons.length} completed
                </p>
              </div>

              <div className="divide-y max-h-[calc(100vh-200px)] overflow-y-auto">
                {course.modules.map((module) => (
                  <div key={module._id} className="p-4">
                    <button
                      onClick={() => setExpandedModules(prev => ({
                        ...prev,
                        [module._id]: !prev[module._id]
                      }))}
                      className="w-full flex items-center justify-between hover:bg-light p-2 rounded transition"
                    >
                      <h4 className="font-semibold text-dark text-left">{module.title}</h4>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${expandedModules[module._id] ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {expandedModules[module._id] && (
                      <div className="mt-2 space-y-1">
                        {module.lessons.map((lesson) => {
                          const lessonProg = progress?.lessons.find(l => l.lesson._id === lesson._id);
                          const isCompleted = lessonProg?.isCompleted || false;
                          return (
                            <button
                              key={lesson._id}
                              onClick={() => handleLessonSelect(lesson)}
                              className={`w-full p-3 rounded transition flex items-center gap-2 text-left ${
                                selectedLesson?._id === lesson._id
                                  ? 'bg-primary text-white'
                                  : 'hover:bg-light text-dark'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                              ) : (
                                <Play className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="text-sm truncate">{lesson.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
