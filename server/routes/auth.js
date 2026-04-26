const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { HYDERABAD_AREAS } = require('../config/constants');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// In-memory OTP store: { email -> { otp, expiresAt } }
const otpStore = new Map();
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { userId, name, email, password, phone, address, area, pincode } = req.body;

    // Validate area
    const validArea = HYDERABAD_AREAS.find(a => a.name === area);
    if (!validArea) return res.status(400).json({ success: false, message: 'Invalid Hyderabad area selected' });

    // Check unique
    if (await User.findOne({ userId })) return res.status(400).json({ success: false, message: 'Username already taken' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ userId, name, email, password, phone, address, area, pincode: validArea.pincode, role: 'user' });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

    const user = await User.findOne({ $or: [{ userId }, { email: userId.toLowerCase() }] });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/auth/duty — toggle duty status
router.patch('/duty', protect, async (req, res) => {
  try {
    const isDemoUser = !req.user._id || String(req.user._id).startsWith('mock_');

    // Demo users: toggle duty in-memory without DB
    if (isDemoUser) {
      const toggled = !req.user.isOnDuty;
      const demoUser = { ...req.user, isOnDuty: toggled, isAvailable: toggled, dutyStartTime: toggled ? new Date() : null };
      return res.json({ success: true, user: demoUser });
    }

    const user = await User.findById(req.user._id);
    if (!['technician', 'police', 'ambulance', 'fire'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Not a field role' });
    }

    if (user.isOnDuty && user.dutyStartTime) {
      const mins = (Date.now() - user.dutyStartTime.getTime()) / 60000;
      if (mins < 60) return res.status(400).json({ success: false, message: `Minimum 1 hour duty required. ${Math.round(60 - mins)} minutes remaining.` });
    }

    user.isOnDuty = !user.isOnDuty;
    user.isAvailable = user.isOnDuty;
    user.dutyStartTime = user.isOnDuty ? new Date() : null;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/auth/location — update current location
router.patch('/location', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: { lat, lng, updatedAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// POST /api/auth/forgot-password — generate & return OTP (email sending optional)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email address' });

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email.toLowerCase(), { otp, expiresAt, userId: user._id });

    // In production: send via email (nodemailer / SendGrid etc.)
    // For demo, we return the OTP directly in the response
    console.log(`[FORGOT PASSWORD] OTP for ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent to your email', otp /* remove in production */ });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-otp — verify the OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email?.toLowerCase());
    if (!record) return res.status(400).json({ success: false, message: 'No OTP requested for this email. Please request again.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/reset-password — reset password after OTP verified
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const record = otpStore.get(email.toLowerCase());
    if (!record) return res.status(400).json({ success: false, message: 'OTP session expired. Please start again.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    otpStore.delete(email.toLowerCase());

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
