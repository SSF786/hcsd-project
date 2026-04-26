const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, default: '' },
  accuracy: { type: Number, default: null },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: { type: String },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true }, // CMP-001
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, required: true },
  userPhone: { type: String },
  userAddress: { type: String },
  userArea: { type: String },
  userPincode: { type: String },

  type: {
    type: String,
    enum: ['electricity', 'water', 'roads', 'drainage', 'garbage', 'facilities'],
    required: true
  },
  description: { type: String, required: true, trim: true },

  // Photos - stored as filenames, served from /uploads/
  photos: [{ type: String }],

  // Real-time location from browser geolocation
  location: { type: locationSchema, default: null },

  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedToName: { type: String, default: '' },
  assignedAt: { type: Date, default: null },

  completedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

  statusHistory: [statusHistorySchema],

  feedback: {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    submittedAt: { type: Date, default: null }
  },

  autoAssignScheduled: { type: Boolean, default: false }

}, { timestamps: true });

// Auto-generate complaintId
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = `CMP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
