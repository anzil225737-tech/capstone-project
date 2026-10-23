import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
const priorities = ['Low', 'Medium', 'High'];
const statuses = ['To Do', 'In Progress', 'Complete'];

function validateTask(body, partial = false) {
  const out = {};
  if (!partial || Object.hasOwn(body, 'title')) {
    const title = String(body.title || '').trim();
    if (!title || title.length > 120) return { error: 'Title is required and must be 120 characters or fewer.' };
    out.title = title;
  }
  if (Object.hasOwn(body, 'description')) {
    out.description = String(body.description || '').trim();
    if (out.description.length > 2000) return { error: 'Description must be 2,000 characters or fewer.' };
  } else if (!partial) out.description = '';
  if (Object.hasOwn(body, 'dueDate')) {
    if (body.dueDate === '' || body.dueDate === null) out.dueDate = null;
    else if (!Number.isNaN(Date.parse(body.dueDate))) out.dueDate = new Date(body.dueDate);
    else return { error: 'Enter a valid due date.' };
  }
  if (Object.hasOwn(body, 'priority')) {
    if (!priorities.includes(body.priority)) return { error: 'Choose Low, Medium, or High priority.' };
    out.priority = body.priority;
  } else if (!partial) out.priority = 'Medium';
  if (Object.hasOwn(body, 'status')) {
    if (!statuses.includes(body.status)) return { error: 'Choose a valid task status.' };
    out.status = body.status;
  } else if (!partial) out.status = 'To Do';
  return { value: out };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: { code: 'INVALID_QUERY', message: 'Page must be positive and limit must be between 1 and 100.' } });
    }
    const filter = { owner: req.userId };
    if (req.query.status) {
      if (!statuses.includes(req.query.status)) return res.status(400).json({ error: { code: 'INVALID_QUERY', message: 'Choose a valid status.' } });
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      if (!priorities.includes(req.query.priority)) return res.status(400).json({ error: { code: 'INVALID_QUERY', message: 'Choose a valid priority.' } });
      filter.priority = req.query.priority;
    }
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    }
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Task.countDocuments(filter)
    ]);
    return res.json({ data: tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { return next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = validateTask(req.body);
    if (parsed.error) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error } });
    const task = await Task.create({ ...parsed.value, owner: req.userId });
    return res.status(201).json({ data: task });
  } catch (err) { return next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    const task = await Task.findOne({ _id: req.params.id, owner: req.userId }).lean();
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    return res.json({ data: task });
  } catch (err) { return next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    const parsed = validateTask(req.body, true);
    if (parsed.error || !Object.keys(parsed.value || {}).length) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error || 'Provide at least one task field to update.' } });
    const task = await Task.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, parsed.value, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    return res.json({ data: task });
  } catch (err) { return next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    const result = await Task.deleteOne({ _id: req.params.id, owner: req.userId });
    if (!result.deletedCount) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found.' } });
    return res.status(204).end();
  } catch (err) { return next(err); }
});

export default router;
