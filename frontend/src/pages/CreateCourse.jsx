import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI, lessonAPI, moduleAPI } from '../services/api';
import { ArrowLeft, CheckCircle2, Loader, Plus, Trash2, Upload } from 'lucide-react';

const emptyLesson = () => ({
  title: '',
  description: '',
  videoUrl: '',
  videoDuration: 0,
  isPreview: false,
  resourceTitle: '',
  resourceUrl: '',
  uploading: false,
});

const emptySection = () => ({
  title: '',
  description: '',
  lessons: [emptyLesson()],
});

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingIntro, setUploadingIntro] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: 'Programming',
    level: 'Beginner',
    price: '',
    thumbnail: '',
    language: 'English',
    duration: '',
    introVideoUrl: '',
    introVideoPublicId: '',
    isPublished: false,
    sections: [emptySection()],
  });

  const categories = ['Programming', 'Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateSection = (index, field, value) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      sections[index] = { ...sections[index], [field]: value };
      return { ...prev, sections };
    });
  };

  const updateLesson = (sectionIdx, lessonIdx, field, value) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      const lessons = [...sections[sectionIdx].lessons];
      lessons[lessonIdx] = { ...lessons[lessonIdx], [field]: value };
      sections[sectionIdx] = { ...sections[sectionIdx], lessons };
      return { ...prev, sections };
    });
  };

  const addSection = () => setFormData((prev) => ({ ...prev, sections: [...prev.sections, emptySection()] }));
  const removeSection = (sectionIdx) => setFormData((prev) => ({ ...prev, sections: prev.sections.filter((_, idx) => idx !== sectionIdx) }));
  const addLesson = (sectionIdx) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      sections[sectionIdx] = { ...sections[sectionIdx], lessons: [...sections[sectionIdx].lessons, emptyLesson()] };
      return { ...prev, sections };
    });
  };
  const removeLesson = (sectionIdx, lessonIdx) => {
    setFormData((prev) => {
      const sections = [...prev.sections];
      sections[sectionIdx] = { ...sections[sectionIdx], lessons: sections[sectionIdx].lessons.filter((_, idx) => idx !== lessonIdx) };
      return { ...prev, sections };
    });
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const { data } = await courseAPI.uploadThumbnail(file);
      setFormData((prev) => ({ ...prev, thumbnail: data.thumbnail.url }));
    } catch (err) {
      setError(err.response?.data?.message || 'Thumbnail upload failed');
    } finally {
      setUploadingThumbnail(false);
      e.target.value = '';
    }
  };

  const handleIntroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIntro(true);
    try {
      const { data } = await courseAPI.uploadIntroVideo(file);
      setFormData((prev) => ({ ...prev, introVideoUrl: data.video.url, introVideoPublicId: data.video.publicId }));
    } catch (err) {
      setError(err.response?.data?.message || 'Intro upload failed');
    } finally {
      setUploadingIntro(false);
      e.target.value = '';
    }
  };

  const handleLessonVideoUpload = async (sectionIdx, lessonIdx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateLesson(sectionIdx, lessonIdx, 'uploading', true);
    try {
      const { data } = await lessonAPI.uploadLessonVideo(file);
      updateLesson(sectionIdx, lessonIdx, 'videoUrl', data.video.url);
      updateLesson(sectionIdx, lessonIdx, 'videoDuration', Math.round(data.video.duration || 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Lesson video upload failed');
    } finally {
      updateLesson(sectionIdx, lessonIdx, 'uploading', false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) throw new Error('Course title is required');
      if (!formData.shortDescription.trim()) throw new Error('Short description is required');
      if (!formData.description.trim()) throw new Error('Full description is required');
      if (!formData.price || Number(formData.price) <= 0) throw new Error('Valid course price is required');

      const coursePayload = {
        title: formData.title.trim(),
        description: `${formData.shortDescription.trim()}\n\n${formData.description.trim()}`,
        category: formData.category,
        level: formData.level,
        price: parseFloat(formData.price),
        thumbnail: formData.thumbnail,
        language: formData.language,
        duration: formData.duration ? parseInt(formData.duration, 10) : 0,
        introVideoUrl: formData.introVideoUrl,
        introVideoPublicId: formData.introVideoPublicId,
        isPublished: formData.isPublished,
      };

      const { data: created } = await courseAPI.createCourse(coursePayload);
      const courseId = created.course._id;

      for (let s = 0; s < formData.sections.length; s++) {
        const section = formData.sections[s];
        if (!section.title.trim()) continue;

        const { data: sectionRes } = await moduleAPI.createModule({
          title: section.title,
          description: section.description,
          courseId,
          sequenceNumber: s + 1,
        });

        for (let l = 0; l < section.lessons.length; l++) {
          const lesson = section.lessons[l];
          if (!lesson.title.trim() || !lesson.videoUrl) continue;

          const resources = lesson.resourceUrl ? [{ title: lesson.resourceTitle || 'Resource', url: lesson.resourceUrl }] : [];

          await lessonAPI.createLesson({
            title: lesson.title,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            videoDuration: Number(lesson.videoDuration || 0),
            isPreview: lesson.isPreview,
            resources,
            moduleId: sectionRes.module._id,
            sequenceNumber: l + 1,
          });
        }
      }

      setSuccess(true);
      setTimeout(() => navigate('/admin/dashboard'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <button onClick={() => navigate('/admin/dashboard')} className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-3"><ArrowLeft className="w-5 h-5" /> Back</button>
          <h1 className="text-2xl sm:text-3xl font-semibold">Create Course</h1>
          <p className="text-blue-100 text-sm sm:text-base">Build a clean course structure with sections and lessons.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {success && <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Course created successfully.</div>}
        {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Title *</label>
              <input name="title" value={formData.title} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Short Description *</label>
              <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2" rows="2" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Full Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2" rows="4" />
            </div>
            <div><label className="text-sm font-semibold">Category</label><select name="category" value={formData.category} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2">{categories.map((c)=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-semibold">Level</label><select name="level" value={formData.level} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2">{levels.map((c)=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-semibold">Price</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="text-sm font-semibold">Duration (hrs)</label><input type="number" name="duration" value={formData.duration} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2" /></div>
            <div className="md:col-span-2"><label className="inline-flex gap-2 items-center"><input type="checkbox" checked={formData.isPublished} onChange={(e)=>setFormData((p)=>({...p,isPublished:e.target.checked}))} /> Publish now</label></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="font-semibold mb-2">Thumbnail Upload</p>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg cursor-pointer">
                {uploadingThumbnail ? <Loader className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Upload Thumbnail
                <input className="hidden" type="file" accept="image/*" onChange={handleThumbnailUpload} />
              </label>
              {formData.thumbnail && <img src={formData.thumbnail} alt="thumb" className="mt-3 h-36 w-full object-cover rounded" />}
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="font-semibold mb-2">Intro / Preview Video</p>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg cursor-pointer">
                {uploadingIntro ? <Loader className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Upload Intro Video
                <input className="hidden" type="file" accept="video/*" onChange={handleIntroUpload} />
              </label>
              {formData.introVideoUrl && <video src={formData.introVideoUrl} controls className="mt-3 h-36 w-full rounded bg-black" />}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Sections & Lessons</h2>
              <button type="button" onClick={addSection} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"><Plus className="w-4 h-4"/> Add Section</button>
            </div>

            {formData.sections.map((section, sIdx) => (
              <div key={sIdx} className="border rounded-xl p-4 bg-slate-50 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 grid md:grid-cols-2 gap-3">
                    <input placeholder={`Section ${sIdx + 1} title`} value={section.title} onChange={(e)=>updateSection(sIdx,'title',e.target.value)} className="border rounded-lg px-3 py-2" />
                    <input placeholder="Section description" value={section.description} onChange={(e)=>updateSection(sIdx,'description',e.target.value)} className="border rounded-lg px-3 py-2" />
                  </div>
                  {formData.sections.length > 1 && <button type="button" onClick={()=>removeSection(sIdx)} className="p-2 text-red-600"><Trash2 className="w-4 h-4"/></button>}
                </div>

                {section.lessons.map((lesson, lIdx) => (
                  <div key={lIdx} className="border rounded-lg p-3 bg-white">
                    <div className="grid md:grid-cols-2 gap-3">
                      <input placeholder="Lesson title" value={lesson.title} onChange={(e)=>updateLesson(sIdx,lIdx,'title',e.target.value)} className="border rounded px-3 py-2" />
                      <input placeholder="Lesson description" value={lesson.description} onChange={(e)=>updateLesson(sIdx,lIdx,'description',e.target.value)} className="border rounded px-3 py-2" />
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded cursor-pointer">
                          {lesson.uploading ? <Loader className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Upload Lesson Video
                          <input type="file" accept="video/*" className="hidden" onChange={(e)=>handleLessonVideoUpload(sIdx,lIdx,e)} />
                        </label>
                        {lesson.videoUrl && <span className="text-xs text-green-700">Uploaded</span>}
                      </div>
                      <input type="number" placeholder="Duration (sec)" value={lesson.videoDuration} onChange={(e)=>updateLesson(sIdx,lIdx,'videoDuration',e.target.value)} className="border rounded px-3 py-2" />
                      <input placeholder="Resource title (optional)" value={lesson.resourceTitle} onChange={(e)=>updateLesson(sIdx,lIdx,'resourceTitle',e.target.value)} className="border rounded px-3 py-2" />
                      <input placeholder="Resource URL (PDF link optional)" value={lesson.resourceUrl} onChange={(e)=>updateLesson(sIdx,lIdx,'resourceUrl',e.target.value)} className="border rounded px-3 py-2 md:col-span-2" />
                      <label className="inline-flex gap-2 items-center text-sm"><input type="checkbox" checked={lesson.isPreview} onChange={(e)=>updateLesson(sIdx,lIdx,'isPreview',e.target.checked)} /> Is Preview (Free)</label>
                    </div>
                    {section.lessons.length > 1 && <button type="button" onClick={()=>removeLesson(sIdx,lIdx)} className="mt-2 text-xs text-red-600">Remove Lesson</button>}
                  </div>
                ))}

                <button type="button" onClick={()=>addLesson(sIdx)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"><Plus className="w-4 h-4"/> Add Lesson</button>
              </div>
            ))}
          </div>

          <button disabled={loading || uploadingIntro || uploadingThumbnail} className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold disabled:opacity-60">
            {loading ? 'Creating Course & Structure...' : 'Create Course with Sections'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
