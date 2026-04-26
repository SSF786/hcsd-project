const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  area: { type: String, required: true },
  pincode: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'technician', 'police', 'ambulance', 'fire', 'user'],
    default: 'user'
  },
  specialization: { type: String, default: '' },
  isOnDuty: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  dutyStartTime: { type: Date, default: null },
  jobsAccepted: { type: Number, default: 0 },
  jobsCompleted: { type: Number, default: 0 },
  hoursWorked: { type: Number, default: 0 },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  lastCredentialChange: { type: Date, default: null },
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
