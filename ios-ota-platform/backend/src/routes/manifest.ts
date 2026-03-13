import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateManifest } from '../services/plist';

const router = Router({ mergeParams: true });

// GET /api/apps/:id/manifest.plist
router.get('/:id/manifest.plist', async (req: Request, res: Response) => {
  try {
    const app = await prisma.app.findUnique({ where: { id: req.params.id } });
    if (!app) {
      res.status(404).json({ error: 'App not found' });
      return;
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const plistXml = generateManifest(app, baseUrl);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${app.name}.plist"`);
    res.send(plistXml);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate manifest' });
  }
});

export default router;
