import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const ipaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'ipa'));
  },
  filename: (_req, _file, cb) => {
    cb(null, `${uuidv4()}.ipa`);
  },
});

const iconStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'icons'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (file.fieldname === 'ipa') {
    if (
      file.originalname.toLowerCase().endsWith('.ipa') ||
      file.mimetype === 'application/octet-stream'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .ipa files are allowed for the IPA field'));
    }
  } else if (file.fieldname === 'icon') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for the icon field'));
    }
  } else {
    cb(new Error('Unexpected field'));
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => {
      if (file.fieldname === 'ipa') {
        cb(null, path.join(process.cwd(), 'uploads', 'ipa'));
      } else {
        cb(null, path.join(process.cwd(), 'uploads', 'icons'));
      }
    },
    filename: (_req, file, cb) => {
      if (file.fieldname === 'ipa') {
        cb(null, `${uuidv4()}.ipa`);
      } else {
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        cb(null, `${uuidv4()}${ext}`);
      }
    },
  }),
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB overall limit; icon checked separately below
  },
});

export const uploadFields = upload.fields([
  { name: 'ipa', maxCount: 1 },
  { name: 'icon', maxCount: 1 },
]);
