import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (
    !username ||
    !password ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET as string, {
    expiresIn: '24h',
  });

  res.json({ token });
});

export default router;
