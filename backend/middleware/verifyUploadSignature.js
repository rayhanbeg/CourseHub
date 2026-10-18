const isValidSignature = (buffer, kind) => {
  if (!buffer || buffer.length < 8) return false;
  if (kind === 'image') {
    return (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
      || buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      || (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP');
  }
  if (kind === 'video') {
    return buffer.toString('ascii', 4, 8) === 'ftyp'
      || buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
      || (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'AVI ');
  }
  return buffer.toString('ascii', 0, 5) === '%PDF-';
};

const verifyUploadSignature = (kind) => (req, res, next) => {
  if (!req.file || !isValidSignature(req.file.buffer, kind)) {
    return res.status(400).json({ message: `Uploaded ${kind} file is invalid or does not match its declared type.` });
  }
  return next();
};

export default verifyUploadSignature;
