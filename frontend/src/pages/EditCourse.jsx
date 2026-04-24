import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, Plus, Save, Trash2, Upload } from 'lucide-react';
import { courseAPI, lessonAPI, moduleAPI } from '../services/api';

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          courseAPI.getCourseById(courseId),
          moduleAPI.getCourseModules(courseId),
        ]);
        setCourse(courseRes.data.course);
        // Ensure modules have lessons array initialized
        const modulesWithLessons = (modulesRes.data.modules || []).map((module) => ({
          ...module,
          lessons: module.lessons || [],
        }));
        setModules(modulesWithLessons);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  const updateModuleField = (moduleId, field, value) => {
    setModules((prev) => prev.map((m) => (m._id === moduleId ? { ...m, [field]: value } : m)));
  };

  const updateLessonField = (moduleId, lessonId, field, value) => {
    setModules((prev) => prev.map((m) => (
      m._id !== moduleId ? m : {
        ...m,
        lessons: (m.lessons || []).map((l) => (l._id === lessonId ? { ...l, [field]: value } : l)),
      }
    )));
  };

  const handleSaveCourse = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const { data } = await courseAPI.updateCourse(courseId, {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: Number(course.price),
        language: course.language,
        duration: Number(course.duration || 0),
        thumbnail: course.thumbnail,
        introVideoUrl: course.introVideoUrl || '',
        introVideoPublicId: course.introVideoPublicId || '',
        isPublished: course.isPublished,
      });
      setCourse(data.course);
      setSuccess('Course info updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    try {
      const { data } = await moduleAPI.createModule({
        title: `New Section ${modules.length + 1}`,
        description: '',
        courseId,
        sequenceNumber: modules.length + 1,
      });
      setModules((prev) => [...prev, { ...data.module, lessons: [] }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add section');
    }
  };

  const handleSaveSection = async (module) => {
    try {
      await moduleAPI.updateModule(module._id, {
        title: module.title,
        description: module.description,
        sequenceNumber: module.sequenceNumber,
      });
      setSuccess('Section updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update section');
    }
  };

  const handleDeleteSection = async (moduleId) => {
    try {
      await moduleAPI.deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m._id !== moduleId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleAddLesson = async (module) => {
    try {
      const nextSeq = (module.lessons?.length || 0) + 1;
      const { data } = await lessonAPI.createLesson({
        title: `Lesson ${nextSeq}`,
        description: '',
        videoUrl: course.introVideoUrl || '',
        videoDuration: 0,
        isPreview: false,
        resources: [],
        moduleId: module._id,
        sequenceNumber: nextSeq,
      });
      setModules((prev) => prev.map((m) => (
        m._id === module._id ? { ...m, lessons: [...(m.lessons || []), data.lesson] } : m
      )));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lesson');
    }
  };

  const handleSaveLesson = async (moduleId, lesson) => {
    try {
      const payload = {
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        videoDuration: Number(lesson.videoDuration || 0),
        isPreview: !!lesson.isPreview,
        sequenceNumber: Number(lesson.sequenceNumber || 1),
        resources: lesson.resources || [],
      };
      const { data } = await lessonAPI.updateLesson(lesson._id, payload);
      updateLessonField(moduleId, lesson._id, 'title', data.lesson.title);
      setSuccess('Lesson updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    try {
      await lessonAPI.deleteLesson(lessonId);
      setModules((prev) => prev.map((m) => (
        m._id !== moduleId ? m : { ...m, lessons: (m.lessons || []).filter((l) => l._id !== lessonId) }
      )));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  const handleLessonVideoUpload = async (moduleId, lessonId, file) => {
    try {
      const { data } = await lessonAPI.uploadLessonVideo(file);
      updateLessonField(moduleId, lessonId, 'videoUrl', data.video.url);
      updateLessonField(moduleId, lessonId, 'videoDuration', Math.round(data.video.duration || 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Video upload failed');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-primary font-semibold"><ArrowLeft className="w-5 h-5" /> Back to Dashboard</Link>
          <button onClick={() => navigate(`/courses/${courseId}`)} className="px-4 py-2 border rounded-lg hover:bg-white">Preview Public Page</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 h-fit">
            <h2 className="text-xl font-bold mb-4">Course Info</h2>
            {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
            {success && <div className="mb-3 text-green-700 text-sm">{success}</div>}
            <div className="space-y-3">
              <input className="w-full border rounded-lg px-3 py-2" value={course.title} onChange={(e) => setCourse((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
              <textarea className="w-full border rounded-lg px-3 py-2" rows="4" value={course.description} onChange={(e) => setCourse((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />
              <input className="w-full border rounded-lg px-3 py-2" value={course.thumbnail || ''} onChange={(e) => setCourse((p) => ({ ...p, thumbnail: e.target.value }))} placeholder="Thumbnail URL" />
              <input className="w-full border rounded-lg px-3 py-2" value={course.introVideoUrl || ''} onChange={(e) => setCourse((p) => ({ ...p, introVideoUrl: e.target.value }))} placeholder="Intro video URL" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="w-full border rounded-lg px-3 py-2" value={course.price} onChange={(e) => setCourse((p) => ({ ...p, price: e.target.value }))} placeholder="Price" />
                <input type="number" className="w-full border rounded-lg px-3 py-2" value={course.duration || 0} onChange={(e) => setCourse((p) => ({ ...p, duration: e.target.value }))} placeholder="Duration" />
              </div>
              <div className="flex items-center gap-2">
                <input id="publish" type="checkbox" checked={!!course.isPublished} onChange={(e) => setCourse((p) => ({ ...p, isPublished: e.target.checked }))} />
                <label htmlFor="publish">Published</label>
              </div>
              <button onClick={handleSaveCourse} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Course Info
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Full Course Outline</h2>
              <button onClick={handleAddSection} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-slate-50"><Plus className="w-4 h-4" /> Add Section</button>
            </div>

            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module._id} className="border rounded-xl p-4 bg-slate-50">
                  <div className="grid md:grid-cols-12 gap-2 items-center mb-3">
                    <input className="md:col-span-4 border rounded px-3 py-2" value={module.title} onChange={(e) => updateModuleField(module._id, 'title', e.target.value)} placeholder="Section title" />
                    <input className="md:col-span-4 border rounded px-3 py-2" value={module.description || ''} onChange={(e) => updateModuleField(module._id, 'description', e.target.value)} placeholder="Section description" />
                    <input type="number" className="md:col-span-2 border rounded px-3 py-2" value={module.sequenceNumber || 1} onChange={(e) => updateModuleField(module._id, 'sequenceNumber', e.target.value)} />
                    <div className="md:col-span-2 flex gap-2 justify-end">
                      <button onClick={() => handleSaveSection(module)} className="p-2 rounded bg-white border hover:bg-green-50"><Save className="w-4 h-4 text-green-700" /></button>
                      <button onClick={() => handleDeleteSection(module._id)} className="p-2 rounded bg-white border hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-700" /></button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(module.lessons || []).map((lesson) => (
                      <div key={lesson._id} className="border rounded-lg p-3 bg-white">
                        <div className="grid lg:grid-cols-12 gap-2 items-start">
                          <input className="lg:col-span-3 border rounded px-2 py-2" value={lesson.title} onChange={(e) => updateLessonField(module._id, lesson._id, 'title', e.target.value)} placeholder="Lesson title" />
                          <input className="lg:col-span-3 border rounded px-2 py-2" value={lesson.description || ''} onChange={(e) => updateLessonField(module._id, lesson._id, 'description', e.target.value)} placeholder="Description" />
                          <div className="lg:col-span-3 border rounded px-2 py-2 bg-slate-50">
                            {lesson.videoUrl ? (
                              <video src={lesson.videoUrl} controls className="w-full h-24 rounded bg-black" />
                            ) : (
                              <p className="text-xs text-slate-500">No video uploaded yet</p>
                            )}
                          </div>
                          <div className="lg:col-span-1 flex items-center gap-1 text-xs">
                            <input type="checkbox" checked={!!lesson.isPreview} onChange={(e) => updateLessonField(module._id, lesson._id, 'isPreview', e.target.checked)} /> Preview
                          </div>
                          <input type="number" className="lg:col-span-1 border rounded px-2 py-2" value={lesson.videoDuration || 0} onChange={(e) => updateLessonField(module._id, lesson._id, 'videoDuration', e.target.value)} placeholder="sec" />
                          <div className="lg:col-span-1 flex gap-1 justify-end">
                            <label className="p-2 rounded border bg-white hover:bg-slate-50 cursor-pointer">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLessonVideoUpload(module._id, lesson._id, e.target.files[0])} />
                            </label>
                            <button onClick={() => handleSaveLesson(module._id, lesson)} className="p-2 rounded border bg-white hover:bg-green-50"><Save className="w-4 h-4 text-green-700" /></button>
                            <button onClick={() => handleDeleteLesson(module._id, lesson._id)} className="p-2 rounded border bg-white hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-700" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => handleAddLesson(module)} className="mt-3 inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white hover:bg-slate-100"><Plus className="w-4 h-4" /> Add Lesson</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;