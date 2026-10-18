import 'dotenv/config';
import mongoose from 'mongoose';
import Lesson from '../models/Lesson.js';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const dryRun = !process.argv.includes('--apply');
const mongoUrl = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUrl || !process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Set MONGO_URI, CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before migration.');
}

const parseCloudinaryUrl = (source) => {
  try {
    const url = new URL(source);
    if (!url.hostname.endsWith('cloudinary.com')) return null;
    const match = url.pathname.match(/\/video\/(?:upload|authenticated|private)\/(.+)$/);
    if (!match) return null;
    const path = match[1].split('/').filter(Boolean);
    if (/^v\d+$/.test(path[0] || '')) path.shift();
    const filename = path.pop() || '';
    const format = filename.includes('.') ? filename.slice(filename.lastIndexOf('.') + 1) : 'mp4';
    return { publicId: [...path, filename.replace(/\.[^.]+$/, '')].join('/'), format };
  } catch { return null; }
};

await mongoose.connect(mongoUrl);
try {
  const lessons = await Lesson.find({ videoUrl: { $type: 'string', $ne: '' }, $or: [{ videoPublicId: { $exists: false } }, { videoPublicId: '' }] });
  console.log(`${dryRun ? 'Dry run:' : 'Migrating'} ${lessons.length} lesson videos.`);
  for (const lesson of lessons) {
    const parsed = parseCloudinaryUrl(lesson.videoUrl);
    if (!parsed) {
      console.warn(`Skipping ${lesson._id}: URL is not a recognized Cloudinary video URL.`);
      continue;
    }
    if (dryRun) {
      console.log(`Would protect lesson ${lesson._id} (${parsed.publicId}).`);
      continue;
    }
    const renamedId = `${parsed.publicId}-protected-${String(lesson._id).slice(-8)}`;
    const result = await cloudinary.uploader.rename(parsed.publicId, renamedId, {
      resource_type: 'video',
      to_type: 'authenticated',
      invalidate: true,
    });
    lesson.videoPublicId = result.public_id;
    lesson.videoFormat = result.format || parsed.format;
    lesson.videoDeliveryType = 'authenticated';
    lesson.videoUrl = '';
    await lesson.save();
    console.log(`Protected lesson ${lesson._id}.`);
  }
} finally {
  await mongoose.disconnect();
}
