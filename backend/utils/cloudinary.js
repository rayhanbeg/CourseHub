import { v2 as cloudinary } from 'cloudinary';

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

const uploadVideoBuffer = async (buffer, folder = 'course-videos') => {
  const result = await uploadFromBuffer(buffer, {
    resource_type: 'video',
    folder,
    quality: 'auto',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
  };
};

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

const deleteVideo = async (publicId) => {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
};

export { uploadVideoBuffer, uploadImageBuffer, deleteVideo };
