const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { Emergency, JobApplication, Support, Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

async function notify(userId, message, type = 'info') {
  try {
    if (!userId || String(userId).startsWith('mock_')) return; // skip for demo users
    await Notification.create({ userId, message, type });
  } catch (e) {}
}

const isDemoId = (id) => !id || String(id).startsWith('mock_');

// ═══════════════════════════════════════════════
// EMERGENCY ROUTES
// ═══════════════════════════════════════════════

// POST /api/emergency
router.post('/emergency', protect, authorize('user'), async (req, res) => {
  try {
    const { type, description, location, priority } = req.body;
    if (!['police', 'ambulance', 'fire'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid emergency type' });

    const count = await Emergency.countDocuments();
    const emergency = await Emergency.create({
      emergencyId: `EMG-${String(count + 1).padStart(4, '0')}`,
      userId: isDemoId(req.user._id) ? null : req.user._id,
      userName: req.user.name, userPhone: req.user.phone, userArea: req.user.area,
      type, description: description || '', priority: priority || 'urgent',
      location: location || null
    });

    // Notify on-duty responders
    const responders = await User.find({ role: type, isOnDuty: true });
    for (const r of responders) {
      await notify(r._id, `🚨 EMERGENCY: ${type.toUpperCase()} needed in ${req.user.area}! ID: ${emergency.emergencyId}`, 'emergency');
    }

    // Auto-assign if available responder
    setTimeout(async () => {
      try {
        const e = await Emergency.findById(emergency._id);
        if (e && e.status === 'pending' && !e.assignedTo) {
          const avail = await User.findOne({ role: type, isOnDuty: true, isAvailable: true });
          if (avail) {
            e.status = 'in-progress'; e.assignedTo = avail._id; e.assignedToName = avail.name;
            await e.save();
            await notify(avail._id, `Auto-assigned emergency ${emergency.emergencyId}`, 'task');
          }
        }
      } catch (e) {}
    }, 5 * 60 * 1000);

    res.status(201).json({ success: true, emergency });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/emergency
router.get('/emergency', protect, async (req, res) => {
  try {
    let filter = {};
    if (['police', 'ambulance', 'fire'].includes(req.user.role)) filter.type = req.user.role;
    else if (req.user.role === 'user') {
      if (isDemoId(req.user._id)) filter.userName = req.user.name;
      else filter.userId = req.user._id;
    }
    const emergencies = await Emergency.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, emergencies });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/emergency/:id/respond
router.patch('/emergency/:id/respond', protect, async (req, res) => {
  try {
    const { action } = req.body;
    const e = await Emergency.findById(req.params.id);
    if (!e) return res.status(404).json({ success: false, message: 'Not found' });

    const isEmgRole = ['police', 'ambulance', 'fire'].includes(req.user.role);

    if (action === 'accept' && isEmgRole) {
      // Enforce max 1 active case at a time for emergency roles
      if (!isDemoId(req.user._id)) {
        const activeCount = await Emergency.countDocuments({
          assignedTo: req.user._id, status: { $in: ['in-progress', 'assigned'] }
        });
        if (activeCount >= 1) return res.status(400).json({ success: false, message: 'You already have an active case. Resolve it before accepting another.' });
        await User.findByIdAndUpdate(req.user._id, { $inc: { jobsAccepted: 1 } });
      }
      e.status = 'in-progress';
      e.assignedTo = isDemoId(req.user._id) ? null : req.user._id;
      e.assignedToName = req.user.name;
    } else if (action === 'resolve') {
      e.status = 'completed'; e.resolvedAt = new Date();
      if (!isDemoId(req.user._id)) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { jobsCompleted: 1 } });
      }
      await notify(e.userId, `✅ Your ${e.type} emergency ${e.emergencyId} has been resolved`, 'success');
    }
    await e.save();
    res.json({ success: true, emergency: e });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ═══════════════════════════════════════════════
// USER MANAGEMENT ROUTES
// ═══════════════════════════════════════════════

// GET /api/users
router.get('/users', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { role, area, search } = req.query;
    let filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { userId: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/users/me/credentials — user self-edit (once per month) — MUST be before /:id routes
router.patch('/users/me/credentials', protect, async (req, res) => {
  try {
    const { name, phone, address, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Enforce once-per-month limit
    if (user.lastCredentialChange) {
      const daysSince = (Date.now() - new Date(user.lastCredentialChange).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        const daysLeft = Math.ceil(30 - daysSince);
        return res.status(429).json({ success: false, message: `You can update your credentials once per month. Try again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.` });
      }
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (password && password.length >= 6) user.password = password;
    user.lastCredentialChange = new Date();
    await user.save();
    const updated = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/users/:id/role
router.patch('/users/:id/role', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot change admin role' });
    user.role = role;
    if (['technician', 'police', 'ambulance', 'fire'].includes(role)) {
      user.isOnDuty = false; user.isAvailable = false;
      user.jobsAccepted = user.jobsAccepted || 0;
      user.jobsCompleted = user.jobsCompleted || 0;
      user.hoursWorked = user.hoursWorked || 0;
    }
    await user.save({ validateBeforeSave: false });
    await notify(user._id, `Your role has been updated to ${role}`, 'info');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/users/:id/credentials — admin edit any user's credentials
router.patch('/users/:id/credentials', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, address, area, pincode, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (area) user.area = area;
    if (pincode) user.pincode = pincode;
    if (password && password.length >= 6) user.password = password; // triggers pre-save hash
    await user.save();
    await notify(user._id, `Your account credentials were updated by an administrator`, 'info');
    const updated = await User.findById(req.params.id).select('-password');
    res.json({ success: true, user: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ═══════════════════════════════════════════════
// JOB APPLICATION ROUTES
// ═══════════════════════════════════════════════

// POST /api/jobs
router.post('/jobs', protect, authorize('user'), async (req, res) => {
  try {
    const { role, message } = req.body;
    const userIdField = isDemoId(req.user._id) ? null : req.user._id;
    const existing = await JobApplication.findOne({
      $or: [
        ...(userIdField ? [{ userId: userIdField }] : []),
        { userName: req.user.name }
      ],
      status: 'pending'
    });
    if (existing) return res.status(400).json({ success: false, message: 'You already have a pending application' });
    const app = await JobApplication.create({
      userId: userIdField,
      userName: req.user.name, userPhone: req.user.phone, userArea: req.user.area, role, message: message || ''
    });
    res.status(201).json({ success: true, application: app });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/jobs
router.get('/jobs', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'user') {
      if (isDemoId(req.user._id)) filter.userName = req.user.name;
      else filter.userId = req.user._id;
    }
    const apps = await JobApplication.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, applications: apps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/jobs/:id/review — approve/reject (promotes user role)
router.patch('/jobs/:id/review', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { action, note } = req.body;
    const app = await JobApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    app.status = action === 'approve' ? 'approved' : 'rejected';
    app.reviewedBy = isDemoId(req.user._id) ? null : req.user._id;
    app.reviewedByName = req.user.name;
    app.reviewedAt = new Date();
    app.reviewNote = note || '';
    await app.save();

    if (action === 'approve' && app.userId) {
      // Promote user role in DB
      await User.findByIdAndUpdate(app.userId, {
        role: app.role, isOnDuty: false, isAvailable: false,
        jobsAccepted: 0, jobsCompleted: 0, hoursWorked: 0
      });
      await notify(app.userId, `🎉 Your application for ${app.role} has been approved! You are now a ${app.role}.`, 'success');
    } else {
      await notify(app.userId, `Your application for ${app.role} was not approved at this time.`, 'info');
    }
    res.json({ success: true, application: app });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ═══════════════════════════════════════════════
// SUPPORT ROUTES
// ═══════════════════════════════════════════════

router.post('/support', protect, async (req, res) => {
  try {
    if (['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Admin/Moderator cannot submit tickets' });
    const { subject, message, priority } = req.body;
    const count = await Support.countDocuments();
    const ticket = await Support.create({
      ticketId: `TKT-${String(count + 1).padStart(4, '0')}`,
      userId: isDemoId(req.user._id) ? null : req.user._id,
      userName: req.user.name, userRole: req.user.role, subject, message, priority: priority || 'normal'
    });
    res.status(201).json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/support', protect, async (req, res) => {
  try {
    let filter = {};
    if (!['admin', 'moderator'].includes(req.user.role)) {
      if (isDemoId(req.user._id)) filter.userName = req.user.name;
      else filter.userId = req.user._id;
    }
    const tickets = await Support.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/support/:id/reply', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await Support.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    ticket.replies = ticket.replies || [];
    ticket.replies.push({ text, byName: req.user.name, byRole: req.user.role });
    ticket.status = 'replied';
    await ticket.save();
    await notify(ticket.userId, `Your support ticket ${ticket.ticketId} has a new reply from ${req.user.name}`, 'info');
    res.json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ═══════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════

router.get('/notifications', protect, async (req, res) => {
  try {
    if (isDemoId(req.user._id)) return res.json({ success: true, notifications: [], unreadCount: 0 });
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/notifications/read-all', protect, async (req, res) => {
  try {
    if (!isDemoId(req.user._id)) await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ═══════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════

router.get('/analytics', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const [totalUsers, totalComplaints, totalEmg, pendingApps, openTickets] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Complaint.countDocuments(),
      Emergency.countDocuments(),
      JobApplication.countDocuments({ status: 'pending' }),
      Support.countDocuments({ status: 'open' })
    ]);
    const statusCounts = await Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const typeCounts = await Complaint.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
    const areaCounts = await Complaint.aggregate([{ $group: { _id: '$userArea', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);
    const techs = await User.find({ role: 'technician' }).select('name userId area specialization isOnDuty jobsAccepted jobsCompleted hoursWorked');
    res.json({ success: true, stats: { totalUsers, totalComplaints, totalEmg, pendingApps, openTickets }, statusCounts, typeCounts, areaCounts, techs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
