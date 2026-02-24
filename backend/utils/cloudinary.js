import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload video to Cloudinary
const uploadVideo = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'course-videos',
      quality: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
    };
  } catch (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }
};

// Delete video from Cloudinary
const deleteVideo = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  } catch (error) {
    throw new Error(`Video deletion failed: ${error.message}`);
  }
};

// Upload image thumbnail
const uploadThumbnail = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'course-thumbnails',
      transformation: [
        { width: 400, height: 300, crop: 'fill' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new Error(`Thumbnail upload failed: ${error.message}`);
  }
};

export { uploadVideo, deleteVideo, uploadThumbnail };
