import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, lessonAPI, progressAPI } from '../services/api';
import { VideoPlayer } from '../components';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Download, Loader, Lock, Play } from 'lucide-react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { motionTokens, Pressable } from '../lib/motion';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const reduced = useReducedMotion();
  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamLessonId, setStreamLessonId] = useState('');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);
  const [toastMessage, setToastMessage] = useState(location.state?.toast || '');
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(null);
  const lastSavedRef = useRef({ lessonId: '', seconds: 0 });
  const currentPositionRef = useRef(0);
  const refreshedStreamUrlRef = useRef('');

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const lessons = useMemo(() => (course?.modules || []).flatMap((module) => (module.lessons || []).map((lesson) => ({ ...lesson, moduleId: module._id }))), [course]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const courseRes = await courseAPI.getCourseById(courseId);
        const progressRes = await progressAPI.getCourseProgress(courseId);
        if (!active) return;
        const courseData = courseRes.data.course;
        const progressData = progressRes.data.progress;
        setCourse(courseData);
        setProgress(progressData);
        const allLessons = (courseData.modules || []).flatMap((module) => (module.lessons || []).map((lesson) => ({ ...lesson, moduleId: module._id })));
        const requestedId = searchParams.get('lessonId');
        const lastId = progressData.lastLesson?._id || progressData.lastLesson;
        const firstIncomplete = progressData.lessons.find((item) => !item.isCompleted)?.lesson?._id;
        const initial = allLessons.find((lesson) => lesson._id === requestedId)
          || allLessons.find((lesson) => lesson._id === lastId)
          || allLessons.find((lesson) => lesson._id === firstIncomplete)
          || allLessons[0];
        if (initial) {
          setSelectedLesson(initial);
          setExpandedModules({ [initial.moduleId]: true });
          const saved = progressData.lessons.find((item) => (item.lesson?._id || item.lesson) === initial._id)?.watchTime || 0;
          currentPositionRef.current = saved;
          lastSavedRef.current = { lessonId: initial._id, seconds: saved };
        }
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 403 || err.response?.status === 404) {
          setAccessDenied(true);
          setError('You need to be enrolled in this course to access its lessons.');
        } else setError(err.response?.data?.message || 'Failed to load course');
      } finally { if (active) setLoading(false); }
    };
    if (auth.isAuthenticated) fetchData();
    return () => { active = false; };
  }, [courseId, auth.isAuthenticated, searchParams]);

  useEffect(() => {
    if (!selectedLesson?._id || !selectedLesson.hasVideo) { refreshedStreamUrlRef.current = ''; setStreamUrl(''); setStreamLessonId(''); return undefined; }
    let active = true;
    let refreshTimer;
    let firstRequest = true;
    refreshedStreamUrlRef.current = '';
    const requestStream = async () => {
      const { data } = await lessonAPI.getStream(selectedLesson._id);
      if (!active) return;
      refreshedStreamUrlRef.current = data.url;
      if (firstRequest) {
        firstRequest = false;
        setStreamUrl(data.url);
        setStreamLessonId(selectedLesson._id);
      }
      const remaining = Math.max(60, (Number(data.expiresAt) * 1000) - Date.now() - 2 * 60 * 1000);
      refreshTimer = window.setTimeout(() => requestStream().catch(() => {}), remaining);
    };
    requestStream().catch((err) => { if (active) setError(err.response?.data?.message || 'Video could not be loaded.'); });
    return () => { active = false; window.clearTimeout(refreshTimer); };
  }, [selectedLesson?._id, selectedLesson?.hasVideo]);

  const saveProgress = useCallback(async (lesson, seconds, completed = false) => {
    if (!lesson) return;
    if (savingRef.current) {
      if (completed) pendingSaveRef.current = { lesson, seconds, completed };
      return;
    }
    savingRef.current = true;
    try {
      const { data } = await progressAPI.updateLessonProgress(courseId, lesson._id, { watchTime: seconds, ...(completed ? { isCompleted: true } : {}) });
      setProgress(data.progress);
      lastSavedRef.current = { lessonId: lesson._id, seconds };
    } catch (err) { setError(err.response?.data?.message || 'Progress could not be saved.'); }
    finally {
      savingRef.current = false;
      const pending = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (pending) saveProgress(pending.lesson, pending.seconds, pending.completed);
    }
  }, [courseId]);

  const handlePlaybackProgress = (seconds, duration) => {
    currentPositionRef.current = seconds;
    const last = lastSavedRef.current;
    if (last.lessonId !== selectedLesson?._id || Math.abs(seconds - last.seconds) >= 5) saveProgress(selectedLesson, seconds, duration > 0 && seconds / duration >= 0.9);
  };

  const handleLessonComplete = () => saveProgress(selectedLesson, currentPositionRef.current, true);

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);
    const saved = progress?.lessons.find((item) => (item.lesson?._id || item.lesson) === lesson._id)?.watchTime || 0;
    currentPositionRef.current = saved;
    lastSavedRef.current = { lessonId: lesson._id, seconds: saved };
  };

  const currentIndex = lessons.findIndex((lesson) => lesson._id === selectedLesson?._id);
  const moveLesson = (offset) => {
    const next = lessons[currentIndex + offset];
    if (next) {
      selectLesson(next);
      setExpandedModules((value) => ({ ...value, [next.moduleId]: true }));
    }
  };

  const downloadCertificate = async () => {
    try {
      const { data } = await progressAPI.downloadCertificate(courseId);
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `certificate-${courseId}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err.response?.data?.message || 'Certificate could not be downloaded.'); }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader className="h-8 w-8 animate-spin text-primary" /></div>;
  if (accessDenied) return <div className="public-container"><div className="mx-auto my-16 max-w-xl rounded-xl border border-slate-200 bg-white p-10 text-center"><Lock className="mx-auto mb-4 h-9 w-9 text-primary" /><h1 className="text-2xl font-semibold">Enrollment required</h1><p className="my-4 text-gray-600">{error}</p><button onClick={() => navigate(`/courses/${courseId}`)} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white">View course</button></div></div>;
  if (!course) return <div className="p-12 text-center">{error || 'Course not found'}</div>;

  if (progress?.isCompleted) return <main className="public-container flex min-h-[70vh] items-center py-16"><m.section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }}><m.div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50" initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.base }}><svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><m.path d="m8 12 2.5 2.5L16.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.slow }} /></svg></m.div><p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Course completed</p><h1 className="mt-2 text-3xl font-semibold text-dark">Congratulations, {auth.user?.name}</h1><p className="mx-auto mt-3 max-w-xl text-gray-600">You completed {course.title}. Your certificate is ready to download.</p><div className="my-8 rounded-xl border border-slate-200 bg-light p-5"><p className="text-sm text-gray-600">Certificate ID</p><p className="mt-1 font-mono font-semibold">{progress.certificateId || 'Available in your certificate PDF'}</p></div><div className="flex flex-col justify-center gap-3 sm:flex-row"><Pressable onClick={downloadCertificate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white"><Download size={17} />Download certificate</Pressable><Link to="/my-learning" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 font-semibold">My Learning</Link></div>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}</m.section></main>;

  const selectedProgress = progress?.lessons.find((item) => (item.lesson?._id || item.lesson) === selectedLesson?._id);
  return <main className="min-h-screen bg-light">
    <AnimatePresence>{toastMessage && <m.div className="course-player-toast" role="status" initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0.01 : motionTokens.durations.fast }}>{toastMessage}</m.div>}</AnimatePresence>
    <header className="border-b border-slate-200 bg-white"><div className="public-container py-4"><Link to="/my-learning" className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-gray-600 hover:text-dark"><ArrowLeft size={16} /> My Learning</Link><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-xl font-semibold text-dark sm:text-2xl">{course.title}</h1><p className="mt-1 text-sm text-gray-600">{progress?.completedLessons || 0} of {progress?.totalLessons || lessons.length} lessons complete</p></div><div className="flex items-center gap-3"><div className="h-2 w-36 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-primary transition-all" style={{ width: `${progress?.overallProgress || 0}%` }} /></div><span className="text-sm font-semibold">{progress?.overallProgress || 0}%</span></div></div></div></header>
    <div className="public-container grid grid-cols-1 gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_350px]">
      <section className="min-w-0">
        {selectedLesson ? <>{streamUrl && streamLessonId === selectedLesson._id ? <VideoPlayer key={selectedLesson._id} videoUrl={streamUrl} title={selectedLesson.title} resources={selectedLesson.resources || []} initialPosition={selectedProgress?.watchTime || 0} onProgress={handlePlaybackProgress} onComplete={handleLessonComplete} onPlaybackError={() => { if (refreshedStreamUrlRef.current && refreshedStreamUrlRef.current !== streamUrl) { setStreamUrl(refreshedStreamUrlRef.current); } }} watermark={auth.user?.email || auth.user?.name} /> : <div className="lesson-stream-loading" role="status">Preparing lesson video…</div>}
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-gray-500">Lesson {currentIndex + 1} of {lessons.length}</p><h2 className="mt-1 text-xl font-semibold text-dark">{selectedLesson.title}</h2></div>{selectedProgress?.isCompleted && <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><CheckCircle2 size={17} />Completed</span>}</div><p className="mt-3 whitespace-pre-line text-gray-600">{selectedLesson.description}</p><p className="mt-4 text-xs text-gray-500">Keyboard: Space to play or pause · ← / → to seek 10 seconds</p><div className="mt-6 flex flex-wrap justify-between gap-3"><button onClick={() => moveLesson(-1)} disabled={currentIndex <= 0} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-medium disabled:opacity-40"><ArrowLeft size={16} />Previous lesson</button><div className="flex gap-3">{!selectedProgress?.isCompleted && <button onClick={handleLessonComplete} className="rounded-lg border border-primary px-4 py-2.5 font-semibold text-primary">Mark as complete</button>}<button onClick={() => moveLesson(1)} disabled={currentIndex >= lessons.length - 1} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-40">Next lesson<ArrowRight size={16} /></button></div></div>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}</div>
        </> : <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">No lessons are available yet.</div>}
      </section>

      <aside className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white lg:sticky lg:top-5"><div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-dark">Course curriculum</h2><p className="mt-1 text-sm text-gray-600">{progress?.completedLessons || 0} / {progress?.totalLessons || lessons.length} completed</p></div><div className="max-h-[72vh] divide-y divide-slate-100 overflow-y-auto">{(course.modules || []).filter((module) => module.lessons?.length).map((module, index) => <section key={module._id}><button type="button" aria-expanded={!!expandedModules[module._id]} onClick={() => setExpandedModules((value) => ({ ...value, [module._id]: !value[module._id] }))} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-light"><span><span className="mr-2 text-xs text-gray-500">{String(index + 1).padStart(2, '0')}</span><strong className="text-sm">{module.title}</strong><span className="mt-1 block pl-7 text-xs text-gray-500">{module.lessons.length} lessons</span></span><ChevronDown size={17} className={`transition-transform ${expandedModules[module._id] ? 'rotate-180' : ''}`} /></button>{expandedModules[module._id] && <ul className="space-y-1 px-2 pb-3">{module.lessons.map((lesson) => { const item = progress?.lessons.find((entry) => (entry.lesson?._id || entry.lesson) === lesson._id); const active = selectedLesson?._id === lesson._id; return <li key={lesson._id}><button type="button" aria-current={active ? 'true' : undefined} onClick={() => selectLesson(lesson)} className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${active ? 'text-primary' : 'text-dark hover:bg-light'}`}>{active && <m.span layoutId="course-current-lesson" className="absolute inset-0 rounded-lg bg-indigo-50" transition={reduced ? { duration: 0.01 } : motionTokens.springs.snappy} />}{item?.isCompleted ? <CheckCircle2 size={17} className="relative z-10 shrink-0" /> : <Play size={16} className="relative z-10 shrink-0" />}<span className="relative z-10 min-w-0 flex-1 truncate">{lesson.title}</span>{active && <span className="relative z-10 h-2 w-2 shrink-0 rounded-full bg-primary" />}</button></li>; })}</ul>}</section>)}</div></aside>
    </div>
  </main>;
};

export default CoursePlayer;
