import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  admin?: boolean;
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { admin: boolean };
    if (!payload.admin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    req.admin = true;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
