import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function safeFilePath(subdir: string, filename: string): string | null {
  // Prevent path traversal: only allow plain filenames (no slashes or dots that escape)
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return null;
  }
  return path.join(UPLOADS_DIR, subdir, filename);
}

// GET /files/ipa/:filename — serves IPA and increments download count
router.get('/ipa/:filename', async (req: Request, res: Response) => {
  const filePath = safeFilePath('ipa', req.params.filename);
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  // Increment download count asynchronously (fire-and-forget)
  prisma.app
    .updateMany({
      where: { ipaFilename: req.params.filename },
      data: { downloadCount: { increment: 1 } },
    })
    .catch(() => {});

  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(filePath);
});

// GET /files/icons/:filename — serves icon images
router.get('/icons/:filename', (req: Request, res: Response) => {
  const filePath = safeFilePath('icons', req.params.filename);
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.sendFile(filePath);
});

export default router;
