import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFromBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    uploadStream.end(buffer);
  });

const uploadVideoBuffer = async (buffer, folder = 'course-videos', { authenticated = false } = {}) => {
  const result = await uploadFromBuffer(buffer, {
    resource_type: 'video',
    folder,
    quality: 'auto',
    ...(authenticated ? { type: 'authenticated' } : {}),
  });

  return {
    url: authenticated ? makeTemporaryVideoUrl(result.public_id, result.format) : result.secure_url,
    publicId: result.public_id,
    format: result.format,
    deliveryType: authenticated ? 'authenticated' : 'upload',
    duration: result.duration,
    expiresAt: authenticated ? Math.floor(Date.now() / 1000) + 15 * 60 : null,
  };
};

const makeTemporaryVideoUrl = (publicId, format = 'mp4', expiresAt = Math.floor(Date.now() / 1000) + 15 * 60, type = 'authenticated') =>
  cloudinary.utils.private_download_url(publicId, format || 'mp4', {
    resource_type: 'video',
    type,
    expires_at: expiresAt,
    attachment: false,
  });

const uploadImageBuffer = async (buffer, folder = 'course-thumbnails') => {
  const result = await uploadFromBuffer(buffer, {
    resource_type: 'image',
    folder,
    transformation: [{ width: 1200, height: 675, crop: 'fill' }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

const uploadResourceBuffer = async (buffer, originalName) => {
  const publicId = `${Date.now()}-${String(originalName || 'course-resource').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const result = await uploadFromBuffer(buffer, { resource_type: 'raw', folder: 'lesson-resources', public_id: publicId });
  return { url: result.secure_url, publicId: result.public_id, name: originalName };
};

const deleteVideo = async (publicId) => {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
};

export { uploadVideoBuffer, makeTemporaryVideoUrl, uploadImageBuffer, uploadResourceBuffer, deleteVideo };
