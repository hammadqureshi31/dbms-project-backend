import fs from 'fs';
import path from 'path';
import multer from 'multer';

export const uploadDir = path.resolve('./public/uploads/');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

export const upload = multer({ storage: storage });
