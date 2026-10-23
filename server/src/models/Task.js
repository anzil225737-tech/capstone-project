import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['To Do', 'In Progress', 'Complete'], default: 'To Do' }
}, { timestamps: true });

taskSchema.index({ owner: 1, updatedAt: -1 });
taskSchema.index({ owner: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
