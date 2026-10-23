import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import { handleError } from './middleware/auth.js';

const app = express();
const port = process.env.PORT || 5000;
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
if (process.env.NODE_ENV === 'production') app.use(express.static(clientDist));
app.get('/api/v1/health', (req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } });
  if (process.env.NODE_ENV === 'production') return res.sendFile(path.join(clientDist, 'index.html'));
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } });
});
app.use(handleError);

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('MONGODB_URI and JWT_SECRET must be configured.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`Task Manager API listening on ${port}`)))
  .catch((err) => { console.error('Unable to connect to MongoDB:', err.message); process.exit(1); });
