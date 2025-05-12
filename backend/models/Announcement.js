const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  target: { type: String, enum: ['all', 'admin', 'student'], default: 'all' },
});

module.exports = mongoose.model('Announcement', announcementSchema);
