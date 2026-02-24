import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { ArrowLeft, Loader, Upload, CheckCircle2 } from 'lucide-react';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
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
  });

  const categories = [
    'Programming',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Design',
    'Business',
    'Marketing',
    'Other',
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Chinese'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);
    setError(null);

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

  const handleIntroVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setError(null);

    try {
      const { data } = await courseAPI.uploadIntroVideo(file);
      setFormData((prev) => ({
        ...prev,
        introVideoUrl: data.video.url,
        introVideoPublicId: data.video.publicId,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) throw new Error('Course title is required');
      if (!formData.description.trim()) throw new Error('Course description is required');
      if (!formData.price || formData.price <= 0) throw new Error('Valid course price is required');

      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        level: formData.level,
        price: parseFloat(formData.price),
        thumbnail: formData.thumbnail?.trim(),
        language: formData.language,
        duration: formData.duration ? parseInt(formData.duration, 10) : 0,
        introVideoUrl: formData.introVideoUrl,
        introVideoPublicId: formData.introVideoPublicId,
        isPublished: formData.isPublished,
      };

      await courseAPI.createCourse(courseData);

      setSuccess(true);
      setFormData({
        title: '',
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
      });

      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message
          || err.response?.data?.errors?.[0]?.message
          || err.message
          || 'Failed to create course. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <p className="text-blue-100 mt-2">Upload intro video and thumbnail directly to Cloudinary</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 font-semibold">Course Created Successfully!</p>
              <p className="text-green-700 text-sm">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error Creating Course</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Course Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Web Development Masterclass"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Course Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Describe what students will learn in this course..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" disabled={loading}>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Level *</label>
              <select name="level" value={formData.level} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" disabled={loading}>
                {levels.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price ($) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" className="w-full px-4 py-3 border border-gray-300 rounded-lg" disabled={loading} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Duration (hours)</label>
              <input type="number" name="duration" value={formData.duration} onChange={handleChange} min="0" className="w-full px-4 py-3 border border-gray-300 rounded-lg" disabled={loading} />
            </div>
          </div>

          <div className="mb-6">
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))}
                className="w-4 h-4"
              />
              Publish this course immediately
            </label>
            <p className="text-xs text-gray-500 mt-1">If unchecked, course will stay in Draft and won't appear on Home/Courses pages.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
            <select name="language" value={formData.language} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" disabled={loading}>
              {languages.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-bold text-gray-700 mb-3">Thumbnail (Cloudinary Upload)</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-secondary transition">
                {uploadingThumbnail ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumbnail || loading} />
              </label>
              {formData.thumbnail && <p className="text-xs text-green-700 mt-3 break-all">Uploaded: {formData.thumbnail}</p>}
              {formData.thumbnail && (
                <img src={formData.thumbnail} alt="Thumbnail" className="mt-3 w-full h-36 object-cover rounded-lg" />
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-bold text-gray-700 mb-3">Intro Video (Direct Upload)</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-secondary transition">
                {uploadingVideo ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Video
                <input type="file" accept="video/*" className="hidden" onChange={handleIntroVideoUpload} disabled={uploadingVideo || loading} />
              </label>
              {formData.introVideoUrl && <p className="text-xs text-green-700 mt-3 break-all">Uploaded video ready.</p>}
              {formData.introVideoUrl && (
                <video src={formData.introVideoUrl} controls className="mt-3 w-full h-36 rounded-lg bg-black" />
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => navigate('/admin/dashboard')} disabled={loading} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || uploadingThumbnail || uploadingVideo} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-900 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? 'Creating Course...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
