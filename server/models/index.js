const mongoose = require('mongoose');

// ─── Emergency ───────────────────────────────────────────────
const emergencySchema = new mongoose.Schema({
  emergencyId: { type: String, unique: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName:    String,
  userPhone:   String,
  userArea:    String,
  type:        { type: String, enum: ['police', 'ambulance', 'fire'], required: true },
  description: { type: String, default: '' },
  priority:    { type: String, enum: ['low','medium','high','urgent'], default: 'urgent' },
  status:      { type: String, enum: ['pending', 'assigned', 'in-progress', 'completed'], default: 'pending' },
  assignedTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedToName:  { type: String, default: '' },
  location: { lat: Number, lng: Number, address: { type: String, default: '' }, accuracy: Number },
  resolvedAt: { type: Date, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true });

emergencySchema.pre('save', async function (next) {
  if (!this.emergencyId) {
    const count = await mongoose.model('Emergency').countDocuments();
    this.emergencyId = `EMG-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// ─── Job Application ─────────────────────────────────────────
const jobApplicationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: String,
  userPhone: String,
  userArea:  String,
  role: { type: String, enum: ['technician', 'police', 'ambulance', 'fire'], required: true },
  message:  { type: String, default: '' },
  status:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedByName: { type: String, default: '' },
  reviewedAt:     { type: Date, default: null },
  reviewNote:     { type: String, default: '' }
}, { timestamps: true });

// ─── Support Ticket ──────────────────────────────────────────
const replySchema = new mongoose.Schema({
  text:     String,
  byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  byName:   String,
  byRole:   String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const supportSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: String,
  userRole: String,
  subject:  { type: String, required: true },
  message:  { type: String, required: true },
  status:   { type: String, enum: ['open', 'replied', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  replies:  [replySchema]
}, { timestamps: true });

supportSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Support').countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// ─── Notification ────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: String,
  type:    { type: String, enum: ['info', 'task', 'emergency', 'success', 'warning'], default: 'info' },
  read:    { type: Boolean, default: false },
  link:    { type: String, default: '' }
}, { timestamps: true });

module.exports = {
  Emergency:      mongoose.model('Emergency',      emergencySchema),
  JobApplication: mongoose.model('JobApplication', jobApplicationSchema),
  Support:        mongoose.model('Support',        supportSchema),
  Notification:   mongoose.model('Notification',   notificationSchema),
};
