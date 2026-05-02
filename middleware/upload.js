const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-z0-9-_]/gi, '-')
      .toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const fileFilter = (_req, file, cb) => {
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPG, PNG, WEBP, AVIF or GIF images are allowed'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});
