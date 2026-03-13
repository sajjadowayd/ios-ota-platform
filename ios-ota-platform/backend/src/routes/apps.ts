import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadFields } from '../middleware/upload';

const router = Router();

// GET /api/apps?search=
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const apps = await prisma.app.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch apps' });
  }
});

// GET /api/apps/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const app = await prisma.app.findUnique({ where: { id: req.params.id } });
    if (!app) {
      res.status(404).json({ error: 'App not found' });
      return;
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch app' });
  }
});

// POST /api/apps (admin only)
router.post(
  '/',
  requireAdmin,
  uploadFields,
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (!files?.ipa?.[0] || !files?.icon?.[0]) {
        res.status(400).json({ error: 'Both IPA file and icon image are required' });
        return;
      }

      const { name, bundleId, version, description, category } = req.body as {
        name: string;
        bundleId: string;
        version: string;
        description: string;
        category?: string;
      };

      if (!name || !bundleId || !version || !description) {
        res.status(400).json({ error: 'name, bundleId, version, and description are required' });
        return;
      }

      const app = await prisma.app.create({
        data: {
          name,
          bundleId,
          version,
          description,
          category: category || null,
          ipaFilename: files.ipa[0].filename,
          iconFilename: files.icon[0].filename,
        },
      });

      res.status(201).json(app);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create app' });
    }
  }
);

// DELETE /api/apps/:id (admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const app = await prisma.app.findUnique({ where: { id: req.params.id } });
    if (!app) {
      res.status(404).json({ error: 'App not found' });
      return;
    }

    await prisma.app.delete({ where: { id: req.params.id } });

    const ipaPath = path.join(process.cwd(), 'uploads', 'ipa', app.ipaFilename);
    const iconPath = path.join(process.cwd(), 'uploads', 'icons', app.iconFilename);

    for (const filePath of [ipaPath, iconPath]) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // File may already be missing — ignore
      }
    }

    res.json({ message: 'App deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete app' });
  }
});

export default router;
