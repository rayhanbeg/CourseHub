import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock3, Globe2, Loader, Play, Star } from 'lucide-react';
import { courseAPI, lessonAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCourseDuration, getCourseDescriptions, getCourseLessons, pluralize } from '../utils/format';
import './publicPages.css';
import { m, useReducedMotion } from 'framer-motion';
import { motionTokens } from '../lib/motion';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const reduced = useReducedMotion();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const previewPlayerRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchCourse = courseAPI.getCourseById(courseId).then(({ data }) => { if (active) setCourse(data.course); }).catch((err) => { if (active) setError(err.response?.data?.message || 'Failed to load course details'); });
    const fetchEnrollment = !auth.isLoading && auth.isAuthenticated && auth.user?.role === 'student'
      ? orderAPI.getUserOrders().then(({ data }) => { if (active) setEnrolled((data.orders || []).some((order) => order.course?._id === courseId && order.status === 'completed')); }).catch(() => { if (active) setEnrolled(false); })
      : Promise.resolve();
    Promise.all([fetchCourse, fetchEnrollment]).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, auth.isAuthenticated, auth.isLoading, auth.user?.role]);

  const lessonList = useMemo(() => getCourseLessons(course), [course]);
  const modules = useMemo(() => (course?.modules || []).filter((module) => (module?.lessons || []).length > 0), [course]);
  const descriptions = getCourseDescriptions(course || {});
  const duration = formatCourseDuration(course || {}, lessonList);
  const hasReviews = Number(course?.reviewCount) > 0 || (Array.isArray(course?.reviews) && course.reviews.length > 0);

  const handleEnroll = () => {
    if (auth.user?.role === 'admin') {
      navigate(`/admin/edit-course/${courseId}`);
      return;
    }
    if (enrolled) {
      navigate(`/course/${courseId}`);
      return;
    }
    if (!auth.isAuthenticated) {
      navigate('/login', { state: { from: `/checkout/${courseId}`, returnTo: location.pathname } });
      return;
    }
    navigate(`/checkout/${courseId}`);
  };

  const ctaLabel = auth.user?.role === 'admin' ? 'Edit course' : enrolled ? 'Continue learning' : 'Enroll now';

  const playPreview = async (lesson) => {
    setPreviewLesson(lesson);
    setPreviewVideoUrl('');
    try {
      const { data } = await lessonAPI.getStream(lesson._id);
      setPreviewVideoUrl(data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Preview video could not be loaded.');
    }
    window.setTimeout(() => previewPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  if (loading) return <div className="public-loading"><Loader className="animate-spin" aria-label="Loading course" /></div>;
  if (error || !course) return <div className="public-container course-not-found"><Link className="text-link" to="/courses"><ArrowLeft size={16} /> Back to courses</Link><div className="public-empty"><h1>We couldn’t find that course.</h1><p>{error || 'It may have been moved or is no longer available.'}</p><Link className="public-button public-button--primary" to="/courses">Explore courses</Link></div></div>;

  const instructor = course.instructor || {};
  const instructorName = String(instructor.name || '').trim();
  const instructorIsGeneric = /^(admin|administrator|coursehub admin|instructor|unknown)$/i.test(instructorName);
  const showInstructor = Boolean((instructorName && !instructorIsGeneric) || instructor.bio || instructor.profileImage);
  const courseOutcomes = (course.learningOutcomes || []).filter(Boolean);
  const outcomes = courseOutcomes.length ? courseOutcomes : modules.flatMap((module) =>
    module.description?.trim() ? [module.description.trim()] : module.lessons.map((lesson) => lesson.title)
  ).filter(Boolean).slice(0, 6);
  const includes = ['On-demand video lessons', 'A structured course curriculum', 'Progress tracking as you learn'];

  return (
    <div className="public-course-detail">
      <header className="course-detail-hero"><div className="public-container"><Link to="/courses" className="course-back"><ArrowLeft size={16} /> All courses</Link><div className="course-detail-hero__grid"><div><div className="course-detail-tags"><span>{course.category}</span><span>{course.level}</span></div><h1>{course.title}</h1><p>{descriptions.shortDescription}</p><div className="course-detail-hero__meta"><span>{pluralize(lessonList.length, 'lesson')}</span>{duration && <span><Clock3 size={15} /> {duration}</span>}{course.language && <span><Globe2 size={15} /> {course.language}</span>}{hasReviews && <span><Star size={15} /> {Number(course.rating || 0).toFixed(1)}</span>}</div></div><img className="course-detail-thumbnail" src={course.thumbnail} alt={`${course.title} course`} /></div></div></header>

      <main className="public-container course-detail-layout">
        <div className="course-detail-main">
          {(course.introVideoUrl || previewLesson) && <section className="course-detail-block" ref={previewPlayerRef} onContextMenu={(event) => event.preventDefault()}><div className="course-block-heading"><p className="eyebrow">{previewLesson ? 'Free lesson preview' : 'Course introduction'}</p><h2>{previewLesson?.title || 'A first look'}</h2></div>{previewLesson && !previewVideoUrl ? <p role="status">Preparing preview…</p> : <video key={previewLesson?._id || course.introVideoUrl} src={previewLesson ? previewVideoUrl : course.introVideoUrl} poster={course.thumbnail} controls playsInline preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture draggable={false} onContextMenu={(event) => event.preventDefault()} className="course-detail-video" aria-label={previewLesson?.title || 'Course introduction video'} />}{previewLesson && <button className="preview-close" type="button" onClick={() => { setPreviewLesson(null); setPreviewVideoUrl(''); }}>Close preview</button>}</section>}

          {descriptions.fullDescription && <section className="course-detail-block"><div className="course-block-heading"><p className="eyebrow">About the course</p><h2>Learn the foundations<br />and build from there.</h2></div><p className="course-long-description">{descriptions.fullDescription}</p></section>}

          {outcomes.length > 0 && <section className="course-detail-block"><div className="course-block-heading"><p className="eyebrow">Learning outcomes</p><h2>What you’ll learn</h2></div><ul className="course-outcomes">{outcomes.map((outcome) => <li key={outcome}><Check size={17} />{outcome}</li>)}</ul></section>}

          {modules.length > 0 && <section className="course-detail-block"><div className="course-block-heading"><p className="eyebrow">Inside the course</p><h2>Curriculum</h2><p>{pluralize(lessonList.length, 'lesson')} across {pluralize(modules.length, 'section')}</p></div><div className="curriculum-list">{modules.map((module, moduleIndex) => <details className="curriculum-section" key={module._id} open={moduleIndex === 0}><summary><span><strong>{String(moduleIndex + 1).padStart(2, '0')}</strong>{module.title}</span><span className="curriculum-count">{pluralize(module.lessons.length, 'lesson')}</span></summary><ul>{module.lessons.map((lesson) => <li key={lesson._id}><span className="curriculum-lesson-icon"><Play size={14} /></span><span className="curriculum-lesson-title">{lesson.title}</span>{lesson.videoDuration > 0 && <span className="curriculum-duration">{Math.floor(lesson.videoDuration / 60)} min</span>}{lesson.isPreview && lesson.hasVideo && <button className="preview-badge" type="button" onClick={() => playPreview(lesson)}>Preview <Play size={11} fill="currentColor" /></button>}</li>)}</ul></details>)}</div></section>}

          {showInstructor && <section className="course-detail-block instructor-course"><div className="course-block-heading"><p className="eyebrow">Your instructor</p><h2>{instructorName && !instructorIsGeneric ? `Meet ${instructorName}` : 'Meet your instructor'}</h2></div><div className="instructor-course__identity">{instructor.profileImage ? <img src={instructor.profileImage} alt={instructorName ? `${instructorName}, course instructor` : 'Course instructor'} /> : <span aria-hidden="true">{instructorName && !instructorIsGeneric ? instructorName.split(' ').map((word) => word[0]).slice(0, 2).join('') : 'CH'}</span>}<p>{instructor.bio}</p></div></section>}
        </div>

        <m.aside className="course-enroll-column" initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }}><div className="course-enroll-card"><div className="course-enroll-price">{Number(course.price) === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`}</div><button className="public-button public-button--primary course-enroll-button" type="button" onClick={handleEnroll} disabled={auth.isLoading}>{auth.isLoading ? <span className="course-enroll-auth-skeleton" aria-hidden="true" /> : <>{ctaLabel}<ArrowRight size={17} /></>}</button><p className="course-enroll-caption">Start learning at your own pace.</p><div className="course-enroll-divider" /><h2>This course includes</h2><ul>{includes.map((item) => <li key={item}><Check size={15} />{item}</li>)}{duration && <li><Clock3 size={15} />{duration} of content</li>}</ul></div></m.aside>
      </main>
    </div>
  );
};

export default CourseDetails;
