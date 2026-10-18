import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, GripVertical, ImagePlus, Loader, Plus, Trash2, Upload, Video } from 'lucide-react';
import { courseAPI, lessonAPI, moduleAPI } from '../services/api';

const categories = ['Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'];
const levels = ['Beginner', 'Intermediate', 'Advanced'];
const steps = ['Basics', 'Media', 'Curriculum', 'Review & Publish'];
const emptyCourse = { title: '', shortDescription: '', fullDescription: '', category: 'Programming', level: 'Beginner', price: '', duration: '', language: 'English', thumbnail: '', introVideoUrl: '', introVideoPublicId: '', isPublished: false };
const messageFrom = (error, fallback) => error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallback;

function SortableSection({ module, onChange, onDelete, children, error }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `section:${module._id}` });
  return <section ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-xl border border-slate-200 bg-white ${isDragging ? 'z-10 opacity-70 shadow-lg' : ''}`}>
    <div className="flex items-start gap-3 border-b border-slate-100 p-4">
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder section ${module.title}`} className="mt-2 cursor-grab touch-none text-slate-400 hover:text-slate-700"><GripVertical size={19} /></button>
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Section title<input value={module.title} onChange={(event) => onChange('title', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" aria-invalid={!!error} /></label><label className="text-sm font-medium">Section description <span className="font-normal text-slate-500">(optional)</span><input value={module.description || ''} onChange={(event) => onChange('description', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div>
      <button type="button" onClick={onDelete} aria-label="Delete section" className="mt-2 rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={17} /></button>
    </div>
    {error && <p className="px-4 pt-3 text-sm text-red-700">{error}</p>}
    <div className="space-y-3 p-4">{children}</div>
  </section>;
}

function SortableLesson({ lesson, moduleId, onChange, onDelete, onUploadVideo, onUploadResource, uploadProgress }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `lesson:${moduleId}:${lesson._id}` });
  const [open, setOpen] = useState(false);
  const [streamPreview, setStreamPreview] = useState('');
  useEffect(() => {
    if (!open || !lesson.hasVideo || lesson.videoUrl) return undefined;
    let active = true;
    lessonAPI.getStream(lesson._id).then(({ data }) => { if (active) setStreamPreview(data.url); }).catch(() => { if (active) setStreamPreview(''); });
    return () => { active = false; };
  }, [open, lesson._id, lesson.hasVideo, lesson.videoUrl]);
  const hasVideo = Boolean(lesson.videoPublicId || lesson.hasVideo || lesson.videoUrl);
  const previewUrl = lesson.videoUrl || streamPreview;
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-lg border border-slate-200 bg-slate-50 ${isDragging ? 'opacity-60' : ''}`}>
    <div className="flex items-center gap-2 p-3">
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder lesson ${lesson.title}`} className="cursor-grab touch-none text-slate-400"><GripVertical size={18} /></button>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"><span className="truncate font-medium">{lesson.title || 'Untitled lesson'}</span><ChevronDown size={17} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      <label className="inline-flex shrink-0 items-center gap-2 text-xs font-medium"><input type="checkbox" checked={!!lesson.isPreview} onChange={(event) => onChange('isPreview', event.target.checked)} /> Free preview</label>
      <button type="button" onClick={onDelete} aria-label="Delete lesson" className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>
    </div>
    {open && <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-2">
      <label className="text-sm font-medium">Lesson title<input value={lesson.title} onChange={(event) => onChange('title', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" aria-invalid={!lesson.title.trim()} /></label>
      <label className="text-sm font-medium">Duration (seconds)<input type="number" min="0" value={lesson.videoDuration || 0} readOnly className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2" /><span className="mt-1 block text-xs font-normal text-slate-500">Detected from the uploaded video.</span></label>
      <label className="text-sm font-medium lg:col-span-2">Description<textarea rows="3" value={lesson.description || ''} onChange={(event) => onChange('description', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
      <div className="lg:col-span-2"><p className="mb-2 text-sm font-medium">Lesson video</p><div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"><Upload size={16} />{uploadProgress !== undefined ? 'Uploading…' : hasVideo ? 'Replace video' : 'Upload video'}<input type="file" accept="video/*" className="sr-only" onChange={(event) => { onUploadVideo(event.target.files?.[0]); event.target.value = ''; }} /></label>{hasVideo && <span className="text-sm text-green-800">Video ready</span>}{uploadProgress !== undefined && <div className="min-w-48 flex-1"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} /></div><p className="mt-1 text-xs text-slate-500">{uploadProgress}% uploaded</p></div>}</div>{previewUrl && <div className="mt-3" onContextMenu={(event) => event.preventDefault()}><video src={previewUrl} controls preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline draggable={false} onContextMenu={(event) => event.preventDefault()} className="aspect-video max-h-52 w-full rounded-lg bg-black object-contain" /></div>}</div>
      <div className="space-y-3 lg:col-span-2"><div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Resources</h4><button type="button" onClick={() => onChange('resources', [...(lesson.resources || []), { title: '', url: '' }])} className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><Plus size={15} />Add resource</button></div>{(lesson.resources || []).length === 0 && <p className="text-sm text-slate-500">Attach PDF files or add resource links.</p>}{(lesson.resources || []).map((resource, index) => <div key={`${lesson._id}-resource-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto_auto]"><input aria-label="Resource title" placeholder="Resource title" value={resource.title || ''} onChange={(event) => { const resources = [...lesson.resources]; resources[index] = { ...resources[index], title: event.target.value }; onChange('resources', resources); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm" /><input aria-label="Resource URL" placeholder="https://…" value={resource.url || ''} onChange={(event) => { const resources = [...lesson.resources]; resources[index] = { ...resources[index], url: event.target.value }; onChange('resources', resources); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm" /><label className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm"><Upload size={15} />PDF<input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { onUploadResource(index, event.target.files?.[0]); event.target.value = ''; }} /></label><button type="button" onClick={() => onChange('resources', lesson.resources.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove resource" className="rounded-md px-2 text-slate-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button></div>)}</div>
    </div>}
  </article>;
}

export default function CourseBuilder({ mode = 'edit' }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreate = mode === 'create' && !courseId;
  const [course, setCourse] = useState(emptyCourse);
  const [modules, setModules] = useState([]);
  const [step, setStep] = useState(location.state?.step || 1);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState('All changes saved');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const courseDirtyRef = useRef(false);
  const curriculumDirtyRef = useRef(false);
  const courseVersion = useRef(0);
  const curriculumVersion = useRef(0);
  const uploadProgress = useRef({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const localDraftKey = 'coursehub-course-builder-draft';
  const blocker = useBlocker(hasUnsavedChanges);

  useEffect(() => {
    let active = true;
    if (isCreate) {
      try {
        const saved = JSON.parse(localStorage.getItem(localDraftKey) || 'null');
        if (active && saved?.course) { setCourse({ ...emptyCourse, ...saved.course }); setStep(saved.step || 1); }
      } catch { localStorage.removeItem(localDraftKey); }
      setLoading(false);
      return () => { active = false; };
    }
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [courseRes, modulesRes] = await Promise.all([courseAPI.getCourseById(courseId), moduleAPI.getCourseModules(courseId)]);
        if (!active) return;
        const saved = courseRes.data.course;
        setCourse({ ...emptyCourse, ...saved, fullDescription: saved.fullDescription || saved.description || '' });
        setModules((modulesRes.data.modules || []).map((module) => ({ ...module, lessons: (module.lessons || []).map((lesson) => ({ ...lesson, resources: lesson.resources || [] })) })));
        setStep(location.state?.step || 1);
      } catch (err) { if (active) setError(messageFrom(err, 'Course could not be loaded.')); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [courseId, isCreate]);

  useEffect(() => {
    if (!isCreate) return;
    localStorage.setItem(localDraftKey, JSON.stringify({ course, step }));
  }, [course, step, isCreate]);

  useEffect(() => {
    if (!courseId || !courseDirtyRef.current) return undefined;
    const version = courseVersion.current;
    const timer = window.setTimeout(async () => {
      if (courseVersion.current !== version) return;
      setSaveLabel('Saving draft…');
      try {
        const draftPayload = toCoursePayload(course);
        delete draftPayload.isPublished;
        await courseAPI.updateCourse(courseId, draftPayload);
        if (courseVersion.current === version) { courseDirtyRef.current = false; setSaveLabel('All changes saved'); if (!curriculumDirtyRef.current) setHasUnsavedChanges(false); }
      } catch (err) { setSaveLabel('Draft not saved'); setError(messageFrom(err, 'Course changes could not be saved.')); }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [course, courseId]);

  useEffect(() => {
    if (!courseId || !curriculumDirtyRef.current) return undefined;
    const version = curriculumVersion.current;
    const timer = window.setTimeout(async () => {
      if (curriculumVersion.current !== version) return;
      setSaveLabel('Saving curriculum…');
      try {
        await Promise.all(modules.map(async (module, moduleIndex) => {
          if (module.title.trim()) await moduleAPI.updateModule(module._id, { title: module.title.trim(), description: module.description || '', sequenceNumber: moduleIndex + 1 });
          await Promise.all((module.lessons || []).filter((lesson) => lesson.title?.trim()).map((lesson, lessonIndex) => lessonAPI.updateLesson(lesson._id, {
            title: lesson.title.trim(), description: lesson.description || '', videoPublicId: lesson.videoPublicId, videoFormat: lesson.videoFormat, videoDuration: Number(lesson.videoDuration || 0), isPreview: !!lesson.isPreview, resources: lesson.resources || [], sequenceNumber: lessonIndex + 1,
          })));
        }));
        if (curriculumVersion.current === version) { curriculumDirtyRef.current = false; setSaveLabel('All changes saved'); if (!courseDirtyRef.current) setHasUnsavedChanges(false); }
      } catch (err) { setSaveLabel('Curriculum not saved'); setError(messageFrom(err, 'Curriculum changes could not be saved.')); }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [modules, courseId]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (hasUnsavedChanges || courseDirtyRef.current || curriculumDirtyRef.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const checkBasics = () => {
    const errors = {};
    if (!course.title.trim()) errors.title = 'Enter a course title.';
    if (!course.shortDescription.trim()) errors.shortDescription = 'Add a short description.';
    if (!course.fullDescription.trim()) errors.fullDescription = 'Add the full course description.';
    if (course.price === '' || !Number.isFinite(Number(course.price)) || Number(course.price) < 0) errors.price = 'Enter a price of 0 or more.';
    if (!course.category) errors.category = 'Choose a category.';
    if (!course.level) errors.level = 'Choose a level.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkCurriculum = () => {
    const issues = [];
    if (!modules.length) issues.push('Add at least one section.');
    if (!modules.some((module) => module.lessons?.length)) issues.push('Add at least one lesson.');
    if (modules.some((module) => !module.lessons?.length)) issues.push('Every section needs at least one lesson before you continue.');
    if (modules.some((module) => !module.title.trim())) issues.push('Give every section a title.');
    if (modules.some((module) => module.lessons?.some((lesson) => !lesson.title.trim()))) issues.push('Give every lesson a title.');
    setError(issues.join(' '));
    return issues.length === 0;
  };

  const updateCourseField = (field, value) => {
    setCourse((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    setHasUnsavedChanges(true);
    if (isCreate) return;
    courseDirtyRef.current = true; courseVersion.current += 1; setSaveLabel('Unsaved changes');
  };

  const toCoursePayload = (source = course, isPublished = source.isPublished) => ({
    title: source.title.trim(), shortDescription: source.shortDescription.trim(), fullDescription: source.fullDescription.trim(), description: source.fullDescription.trim(),
    category: source.category, level: source.level, price: source.price === '' ? undefined : Number(source.price), duration: Number(source.duration || 0), language: source.language || 'English',
    thumbnail: source.thumbnail || '', introVideoUrl: source.introVideoUrl || '', introVideoPublicId: source.introVideoPublicId || '', isPublished,
  });

  const saveCourseNow = async (source = course, publishState = source.isPublished) => {
    const version = ++courseVersion.current;
    courseDirtyRef.current = false;
    setSaving(true); setError(''); setSaveLabel('Saving…');
    try {
      const { data } = await courseAPI.updateCourse(courseId, toCoursePayload(source, publishState));
      if (courseVersion.current === version) {
        setCourse((current) => ({ ...current, isPublished: data.course.isPublished, thumbnail: data.course.thumbnail || '' }));
        courseDirtyRef.current = false; setSaveLabel('All changes saved'); if (!curriculumDirtyRef.current) setHasUnsavedChanges(false);
      }
      return data.course;
    } catch (err) {
      const issues = err.response?.data?.issues;
      setError(issues ? issues.join(' ') : messageFrom(err, 'Course changes could not be saved.'));
      setSaveLabel('Changes not saved');
      return null;
    } finally { setSaving(false); }
  };

  const continueFromBasics = async () => {
    if (!checkBasics()) return;
    if (isCreate) {
      setSaving(true); setError('');
      try {
        const { data } = await courseAPI.createCourse({ ...toCoursePayload(course, false), isPublished: false });
        localStorage.removeItem(localDraftKey);
        setHasUnsavedChanges(false);
        navigate(`/admin/edit-course/${data.course._id}`, { replace: true, state: { step: 2 } });
      } catch (err) { setError(messageFrom(err, 'Draft could not be created.')); }
      finally { setSaving(false); }
      return;
    }
    const saved = await saveCourseNow();
    if (saved) setStep(2);
  };

  const uniqueSectionTitle = () => {
    const titles = new Set(modules.map((module) => module.title.trim().toLowerCase()));
    let number = 1;
    while (titles.has(`section ${number}`)) number += 1;
    return `Section ${number}`;
  };

  const addSection = async () => {
    const title = uniqueSectionTitle();
    setSaving(true); setError('');
    try {
      const { data } = await moduleAPI.createModule({ title, description: '', courseId, sequenceNumber: modules.length + 1 });
      setModules((current) => [...current, { ...data.module, lessons: [] }]);
    } catch (err) { setError(messageFrom(err, 'Section could not be added.')); }
    finally { setSaving(false); }
  };

  const addLesson = async (module) => {
    const used = new Set(module.lessons.map((lesson) => lesson.title.trim().toLowerCase()));
    let number = 1; while (used.has(`lesson ${number}`)) number += 1;
    setSaving(true); setError('');
    try {
      const { data } = await lessonAPI.createLesson({ title: `Lesson ${number}`, description: '', videoPublicId: '', videoDuration: 0, isPreview: false, resources: [], moduleId: module._id, sequenceNumber: module.lessons.length + 1 });
      setModules((current) => current.map((item) => item._id === module._id ? { ...item, lessons: [...item.lessons, data.lesson] } : item));
    } catch (err) { setError(messageFrom(err, 'Lesson could not be added.')); }
    finally { setSaving(false); }
  };

  const changeModule = (moduleId, field, value) => {
    setModules((current) => current.map((module) => module._id === moduleId ? { ...module, [field]: value } : module));
    setHasUnsavedChanges(true);
    curriculumDirtyRef.current = true; curriculumVersion.current += 1; setSaveLabel('Unsaved changes');
  };
  const changeLesson = (moduleId, lessonId, field, value) => {
    setModules((current) => current.map((module) => module._id !== moduleId ? module : { ...module, lessons: module.lessons.map((lesson) => lesson._id === lessonId ? { ...lesson, [field]: value } : lesson) }));
    setHasUnsavedChanges(true);
    curriculumDirtyRef.current = true; curriculumVersion.current += 1; setSaveLabel('Unsaved changes');
  };

  const saveCurriculumNow = async () => {
    const version = ++curriculumVersion.current;
    curriculumDirtyRef.current = false;
    setSaving(true); setSaveLabel('Saving curriculum…'); setError('');
    try {
      await Promise.all(modules.map(async (module, moduleIndex) => {
        await moduleAPI.updateModule(module._id, { title: module.title.trim(), description: module.description || '', sequenceNumber: moduleIndex + 1 });
        await Promise.all(module.lessons.map((lesson, lessonIndex) => lessonAPI.updateLesson(lesson._id, {
          title: lesson.title.trim(), description: lesson.description || '', ...(lesson.videoPublicId !== undefined ? { videoPublicId: lesson.videoPublicId, videoFormat: lesson.videoFormat || 'mp4' } : {}), videoDuration: Number(lesson.videoDuration || 0), isPreview: !!lesson.isPreview, resources: lesson.resources || [], sequenceNumber: lessonIndex + 1,
        })));
      }));
      if (curriculumVersion.current === version) {
        curriculumDirtyRef.current = false; setSaveLabel('All changes saved'); if (!courseDirtyRef.current) setHasUnsavedChanges(false);
      }
      return true;
    } catch (err) { setError(messageFrom(err, 'Curriculum changes could not be saved.')); setSaveLabel('Curriculum not saved'); return false; }
    finally { setSaving(false); }
  };

  const deleteSection = async (module) => {
    const warning = course.enrollmentCount > 0 ? `This section contains ${module.lessons.length} lesson(s). Removing it may change progress for existing learners. Continue?` : 'Delete this section and its lessons?';
    if (!window.confirm(warning)) return;
    setSaving(true);
    try { await moduleAPI.deleteModule(module._id); setModules((current) => current.filter((item) => item._id !== module._id)); }
    catch (err) { setError(messageFrom(err, 'Section could not be deleted.')); }
    finally { setSaving(false); }
  };
  const deleteLesson = async (moduleId, lesson) => {
    if (!window.confirm(course.enrollmentCount > 0 ? 'Delete this lesson? Existing learner progress for it will no longer count.' : 'Delete this lesson?')) return;
    setSaving(true);
    try { await lessonAPI.deleteLesson(lesson._id); setModules((current) => current.map((module) => module._id === moduleId ? { ...module, lessons: module.lessons.filter((item) => item._id !== lesson._id) } : module)); }
    catch (err) { setError(messageFrom(err, 'Lesson could not be deleted.')); }
    finally { setSaving(false); }
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const activeId = String(active.id); const overId = String(over.id);
    if (activeId.startsWith('section:') && overId.startsWith('section:')) {
      const from = modules.findIndex((module) => `section:${module._id}` === activeId);
      const to = modules.findIndex((module) => `section:${module._id}` === overId);
      if (from < 0 || to < 0) return;
      const reordered = arrayMove(modules, from, to); setModules(reordered); setSaving(true); setSaveLabel('Saving section order…');
      try { await moduleAPI.reorderModules({ courseId, moduleIds: reordered.map((module) => module._id) }); setSaveLabel('All changes saved'); }
      catch (err) { setModules(modules); setError(messageFrom(err, 'Section order could not be saved.')); setSaveLabel('Order not saved'); }
      finally { setSaving(false); }
    } else if (activeId.startsWith('lesson:') && overId.startsWith('lesson:')) {
      const [, activeModule, activeLesson] = activeId.split(':'); const [, overModule, overLesson] = overId.split(':');
      if (activeModule !== overModule) return;
      const module = modules.find((item) => item._id === activeModule); if (!module) return;
      const reorderedLessons = arrayMove(module.lessons, module.lessons.findIndex((lesson) => lesson._id === activeLesson), module.lessons.findIndex((lesson) => lesson._id === overLesson));
      setModules((current) => current.map((item) => item._id === activeModule ? { ...item, lessons: reorderedLessons } : item)); setSaving(true); setSaveLabel('Saving lesson order…');
      try { await lessonAPI.reorderLessons({ moduleId: activeModule, lessonIds: reorderedLessons.map((lesson) => lesson._id) }); setSaveLabel('All changes saved'); }
      catch (err) { setModules((current) => current.map((item) => item._id === activeModule ? { ...item, lessons: module.lessons } : item)); setError(messageFrom(err, 'Lesson order could not be saved.')); setSaveLabel('Order not saved'); }
      finally { setSaving(false); }
    }
  };

  const setProgress = (key, percent) => { uploadProgress.current[key] = percent; setUploading((current) => ({ ...current, [key]: percent })); };
  const uploadFile = async (key, file, uploadFn, onSuccess) => {
    if (!file) return;
    setError(''); setProgress(key, 0);
    try { const result = await uploadFn(file, (event) => setProgress(key, Math.round((event.loaded * 100) / (event.total || file.size)))); onSuccess(result); setProgress(key, 100); }
    catch (err) { setError(messageFrom(err, 'Upload failed. Please try again.')); setUploading((current) => { const next = { ...current }; delete next[key]; return next; }); }
    finally { window.setTimeout(() => setUploading((current) => { const next = { ...current }; delete next[key]; return next; }), 800); }
  };

  const uploadThumbnail = (file) => uploadFile('thumbnail', file, courseAPI.uploadThumbnail, ({ data }) => updateCourseField('thumbnail', data.thumbnail.url));
  const uploadIntro = (file) => uploadFile('intro', file, courseAPI.uploadIntroVideo, ({ data }) => { updateCourseField('introVideoUrl', data.video.url); updateCourseField('introVideoPublicId', data.video.publicId); });
  const uploadLesson = (moduleId, lessonId, file) => {
    if (file) { const localUrl = URL.createObjectURL(file); const probe = document.createElement('video'); probe.controlsList = 'nodownload noremoteplayback'; probe.disablePictureInPicture = true; probe.playsInline = true; probe.preload = 'metadata'; probe.draggable = false; probe.src = localUrl; probe.onloadedmetadata = () => { changeLesson(moduleId, lessonId, 'videoDuration', Math.round(probe.duration || 0)); URL.revokeObjectURL(localUrl); }; }
    uploadFile(`video:${lessonId}`, file, lessonAPI.uploadLessonVideo, ({ data }) => { changeLesson(moduleId, lessonId, 'videoUrl', data.video.url); changeLesson(moduleId, lessonId, 'videoPublicId', data.video.publicId); changeLesson(moduleId, lessonId, 'videoFormat', data.video.format || 'mp4'); changeLesson(moduleId, lessonId, 'videoDuration', Math.round(data.video.duration || 0)); });
  };
  const uploadResource = (moduleId, lesson, index, file) => uploadFile(`resource:${lesson._id}:${index}`, file, lessonAPI.uploadLessonResource, ({ data }) => {
    const resources = [...(lesson.resources || [])]; resources[index] = { ...resources[index], title: resources[index]?.title || file.name.replace(/\.pdf$/i, ''), url: data.resource.url }; changeLesson(moduleId, lesson._id, 'resources', resources);
  });

  const checklist = useMemo(() => [
    { label: 'Course thumbnail uploaded', complete: !!course.thumbnail },
    { label: 'At least one section added', complete: modules.length > 0 },
    { label: 'At least one lesson added', complete: modules.some((module) => module.lessons?.length > 0) },
    { label: 'Course price set', complete: course.price !== '' && Number.isFinite(Number(course.price)) && Number(course.price) >= 0 },
  ], [course.thumbnail, course.price, modules]);

  const publishCourse = async () => {
    setError('');
    if (course.isPublished) { await saveCourseNow(course, false); return; }
    if (!checkBasics()) { setStep(1); return; }
    if (!checkCurriculum()) { setStep(3); return; }
    if (!course.thumbnail) { setError('Upload a course thumbnail before publishing.'); setStep(2); return; }
    if (hasUnsavedChanges && !await saveCurriculumNow()) return;
    if (checklist.some((item) => !item.complete)) { setError('Finish each item in the publish checklist before publishing.'); return; }
    await saveCourseNow(course, !course.isPublished);
  };

  const nextStep = async () => {
    setError('');
    if (step === 1) return continueFromBasics();
    if (step === 2) { setStep(3); return; }
    if (step === 3 && checkCurriculum()) { if (hasUnsavedChanges && !await saveCurriculumNow()) return; setStep(4); return; }
    if (step < 4) setStep((value) => value + 1);
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error && !course && !isCreate) return <div className="mx-auto max-w-3xl p-10 text-center"><p role="alert" className="text-red-700">{error}</p><Link className="mt-4 inline-block text-primary" to="/admin/dashboard">Return to dashboard</Link></div>;

  return <main className="min-h-screen bg-light">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-dark"><ArrowLeft size={16} /> Admin dashboard</Link><div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">Course builder</p><h1 className="mt-1 text-3xl font-semibold text-dark">{course.title || (isCreate ? 'Create a course' : 'Edit course')}</h1></div><span aria-live="polite" className={`text-sm ${saveLabel.includes('not saved') ? 'text-red-700' : 'text-slate-500'}`}>{saveLabel}</span></div>
      <ol className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((label, index) => { const number = index + 1; const current = step === number; const done = step > number; return <li key={label}><button type="button" onClick={() => { if (number < step || (!isCreate && number <= step)) setStep(number); }} aria-current={current ? 'step' : undefined} className={`flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm ${current ? 'bg-primary text-white' : done ? 'bg-indigo-50 text-primary' : 'bg-slate-100 text-slate-500'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${current ? 'bg-white/20' : done ? 'bg-primary text-white' : 'bg-white'}`}>{done ? <Check size={14} /> : number}</span><span className="font-medium">{label}</span></button></li>; })}</ol>
    </div></header>
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
        {step === 1 && <div className="space-y-5"><div><h2 className="text-xl font-semibold">Course basics</h2><p className="mt-1 text-sm text-slate-600">Start with the details learners will see first.</p></div><div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Course title *<input autoFocus value={course.title} maxLength={100} onChange={(event) => updateCourseField('title', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" aria-invalid={!!fieldErrors.title} />{fieldErrors.title && <span className="mt-1 block text-xs text-red-700">{fieldErrors.title}</span>}</label>
          <label className="text-sm font-medium sm:col-span-2">Short description *<textarea rows="2" maxLength={240} value={course.shortDescription} onChange={(event) => updateCourseField('shortDescription', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" aria-invalid={!!fieldErrors.shortDescription} />{fieldErrors.shortDescription && <span className="mt-1 block text-xs text-red-700">{fieldErrors.shortDescription}</span>}</label>
          <label className="text-sm font-medium sm:col-span-2">Full description *<textarea rows="5" value={course.fullDescription} onChange={(event) => updateCourseField('fullDescription', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" aria-invalid={!!fieldErrors.fullDescription} />{fieldErrors.fullDescription && <span className="mt-1 block text-xs text-red-700">{fieldErrors.fullDescription}</span>}</label>
          <label className="text-sm font-medium">Category *<select value={course.category} onChange={(event) => updateCourseField('category', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="text-sm font-medium">Level *<select value={course.level} onChange={(event) => updateCourseField('level', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">{levels.map((level) => <option key={level}>{level}</option>)}</select></label>
          <label className="text-sm font-medium">Price *<div className="mt-1 flex rounded-lg border border-slate-300"><span className="border-r border-slate-200 px-3 py-2.5 text-slate-500">$</span><input type="number" min="0" step="0.01" value={course.price} onChange={(event) => updateCourseField('price', event.target.value)} className="min-w-0 flex-1 rounded-r-lg px-3 py-2.5" aria-invalid={!!fieldErrors.price} /></div><span className="mt-1 block text-xs font-normal text-slate-500">Set 0 for a free course.</span>{fieldErrors.price && <span className="mt-1 block text-xs text-red-700">{fieldErrors.price}</span>}</label>
          <label className="text-sm font-medium">Course duration (hours)<input type="number" min="0" step="0.5" value={course.duration} onChange={(event) => updateCourseField('duration', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
          <label className="text-sm font-medium sm:col-span-2">Language<input value={course.language} onChange={(event) => updateCourseField('language', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
        </div></div>}

        {step === 2 && <div className="space-y-6"><div><h2 className="text-xl font-semibold">Course media</h2><p className="mt-1 text-sm text-slate-600">Add a cover image and an optional introduction video.</p></div><div className="grid gap-6 lg:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Thumbnail <span className="text-red-700">*</span></p>{course.thumbnail ? <img src={course.thumbnail} alt="Course thumbnail preview" className="aspect-video w-full rounded-xl border border-slate-200 object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400"><ImagePlus size={36} /></div>}<label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><Upload size={16} />{uploading.thumbnail !== undefined ? 'Uploading thumbnail…' : course.thumbnail ? 'Replace thumbnail' : 'Upload thumbnail'}<input type="file" accept="image/*" className="sr-only" onChange={(event) => { uploadThumbnail(event.target.files?.[0]); event.target.value = ''; }} /></label>{uploading.thumbnail !== undefined && <UploadBar value={uploading.thumbnail} />}</div><div><p className="mb-2 text-sm font-medium">Introduction video <span className="font-normal text-slate-500">(optional)</span></p>{course.introVideoUrl ? <div onContextMenu={(event) => event.preventDefault()}><video src={course.introVideoUrl} controls className="aspect-video w-full rounded-xl bg-black object-contain" controlsList="nodownload noremoteplayback" disablePictureInPicture playsInline preload="metadata" draggable={false} onContextMenu={(event) => event.preventDefault()} /></div> : <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400"><Video size={36} /></div>}<label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><Upload size={16} />{uploading.intro !== undefined ? 'Uploading intro…' : course.introVideoUrl ? 'Replace intro video' : 'Upload intro video'}<input type="file" accept="video/*" className="sr-only" onChange={(event) => { uploadIntro(event.target.files?.[0]); event.target.value = ''; }} /></label>{uploading.intro !== undefined && <UploadBar value={uploading.intro} />}</div></div></div>}

        {step === 3 && <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Curriculum</h2><p className="mt-1 text-sm text-slate-600">Drag sections and lessons to reorder. Changes save automatically.</p></div><button type="button" disabled={saving} onClick={addSection} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Plus size={17} />Add section</button></div>{modules.some((module) => !module.lessons?.length) && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Empty sections are saved as drafts. Add at least one lesson to every section before publishing.</p>}{modules.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center"><p className="font-medium">Your curriculum is empty</p><p className="mt-1 text-sm text-slate-500">Add a section, then add lessons inside it.</p></div>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={modules.map((module) => `section:${module._id}`)} strategy={verticalListSortingStrategy}><div className="space-y-4">{modules.map((module) => <SortableSection key={module._id} module={module} onChange={(field, value) => changeModule(module._id, field, value)} onDelete={() => deleteSection(module)} error={!module.title.trim() ? 'A section title is required.' : ''}><SortableContext items={module.lessons.map((lesson) => `lesson:${module._id}:${lesson._id}`)} strategy={verticalListSortingStrategy}><div className="space-y-2">{module.lessons.map((lesson) => <SortableLesson key={lesson._id} lesson={lesson} moduleId={module._id} onChange={(field, value) => changeLesson(module._id, lesson._id, field, value)} onDelete={() => deleteLesson(module._id, lesson)} onUploadVideo={(file) => uploadLesson(module._id, lesson._id, file)} onUploadResource={(index, file) => uploadResource(module._id, lesson, index, file)} uploadProgress={uploading[`video:${lesson._id}`]} />)}</div></SortableContext><button type="button" disabled={saving} onClick={() => addLesson(module)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"><Plus size={15} />Add lesson</button></SortableSection>)}</div></SortableContext></DndContext>
        </div>}

        {step === 4 && <div className="space-y-6"><div><h2 className="text-xl font-semibold">Review & publish</h2><p className="mt-1 text-sm text-slate-600">Review the learner-facing details, then publish when the checklist is complete.</p></div><div className="grid gap-6 lg:grid-cols-[1fr_330px]"><div className="rounded-xl border border-slate-200 p-5"><div className="flex flex-col gap-4 sm:flex-row">{course.thumbnail && <img src={course.thumbnail} alt="" className="aspect-video w-full rounded-lg object-cover sm:w-48" />}<div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{course.category} · {course.level}</p><h3 className="mt-2 text-xl font-semibold">{course.title}</h3><p className="mt-2 text-sm text-slate-600">{course.shortDescription}</p><p className="mt-3 font-semibold">{Number(course.price) === 0 ? 'Free' : `$${Number(course.price || 0).toFixed(2)}`}</p></div></div><div className="mt-5 border-t border-slate-200 pt-4"><p className="font-semibold">{modules.length} section(s), {modules.reduce((sum, module) => sum + module.lessons.length, 0)} lesson(s)</p>{modules.some((module) => !module.lessons.length) && <p className="mt-2 text-sm text-amber-800">One or more sections have no lessons.</p>}</div><Link to={`/courses/${courseId}`} target="_blank" className="mt-4 inline-block text-sm font-semibold text-primary">Preview public course page ↗</Link></div><aside className="rounded-xl border border-slate-200 p-5"><h3 className="font-semibold">Publish checklist</h3><ul className="mt-4 space-y-3">{checklist.map((item) => <li key={item.label} className="flex items-start gap-2 text-sm"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.complete ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{item.complete ? <Check size={13} /> : '·'}</span>{item.label}</li>)}</ul><button type="button" onClick={publishCourse} disabled={saving} className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-60 ${course.isPublished ? 'bg-slate-800' : 'bg-primary'}`}>{saving ? 'Saving…' : course.isPublished ? 'Unpublish course' : 'Publish course'}</button><p className="mt-3 text-xs text-slate-500">Unpublishing keeps enrollments and learner progress intact.</p></aside></div></div>}
      </section>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium disabled:opacity-40"><ArrowLeft size={16} />Back</button>{step < 4 ? <button type="button" onClick={nextStep} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? <Loader size={16} className="animate-spin" /> : null}{step === 1 && isCreate ? 'Save draft & continue' : 'Continue'}<ArrowRight size={16} /></button> : <button type="button" onClick={() => saveCourseNow()} disabled={saving} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold">Save draft</button>}</div>
    </div>
    {blocker.state === 'blocked' && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="unsaved-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="unsaved-title" className="text-xl font-semibold">Unsaved changes</h2><p className="mt-2 text-sm text-slate-600">Some edits are still saving. Leave this builder anyway?</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => blocker.reset()} className="rounded-lg border border-slate-300 px-4 py-2 font-medium">Keep editing</button><button type="button" onClick={() => blocker.proceed()} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white">Leave page</button></div></section></div>}
  </main>;
}

function UploadBar({ value }) { return <div className="mt-3"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-primary transition-all" style={{ width: `${value}%` }} /></div><p className="mt-1 text-xs text-slate-500">{value}% uploaded</p></div>; }
