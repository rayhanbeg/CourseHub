import multer from 'multer';

const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Use a JPEG, PNG or WebP image (maximum 5 MB)'));
      return;
    }
    cb(null, true);
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'].includes(file.mimetype)) {
      cb(new Error('Use an MP4, MOV, WebM, AVI or MKV video (maximum 200 MB)'));
      return;
    }
    cb(null, true);
  },
});

const resourceUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF resource files are allowed'));
      return;
    }
    cb(null, true);
  },
});

export { imageUpload, videoUpload, resourceUpload };
