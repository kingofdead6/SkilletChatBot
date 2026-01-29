import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,           // faster queries by user
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true,
    maxlength: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  messages: [messageSchema],
});

// Auto-update updatedAt on save
chatSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
});

export default mongoose.model('Chat', chatSchema);