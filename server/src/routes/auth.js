import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tokenFor = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
const safeUser = (user) => ({ id: user.id, email: user.email });

router.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!emailPattern.test(email) || email.length > 254 || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Enter a valid email and a password between 8 and 128 characters.' } });
    }
    if (await User.exists({ email })) return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' } });
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
    return res.status(201).json({ data: { user: safeUser(user), token: tokenFor(user) } });
  } catch (err) { return next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    }
    return res.json({ data: { user: safeUser(user), token: tokenFor(user) } });
  } catch (err) { return next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('_id email');
    if (!user) return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Please sign in again.' } });
    return res.json({ data: { user: safeUser(user) } });
  } catch (err) { return next(err); }
});

export default router;
