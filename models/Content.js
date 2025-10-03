const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['news', 'guide', 'analysis', 'tutorial', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  author: {
    type: String,
    trim: true
  },
  featuredImage: {
    type: String,
    trim: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 添加索引
contentSchema.index({ title: 'text', content: 'text' });
contentSchema.index({ category: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ status: 1 });
contentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Content', contentSchema);