import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

import authRoutes from './routes/auth';
import appsRoutes from './routes/apps';
import manifestRoutes from './routes/manifest';
import filesRoutes from './routes/files';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure upload directories exist
const uploadDirs = [
  path.join(process.cwd(), 'uploads', 'ipa'),
  path.join(process.cwd(), 'uploads', 'icons'),
];
for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apps', manifestRoutes); // manifest route before generic apps routes
app.use('/api/apps', appsRoutes);
app.use('/files', filesRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
