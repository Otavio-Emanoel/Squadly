import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir);
  },
  filename: (_req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: any, file: any, cb: (error: Error | null, acceptFile?: boolean) => void) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WEBP.'));
  }
});

export function publicUrlFor(filename: string) {
  return `/uploads/${filename}`;
}
