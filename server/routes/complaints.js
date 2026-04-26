const express = require('express');
const router  = express.Router();
const Complaint = require('../models/Complaint');
const User      = require('../models/User');
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const isDemoId = (id) => !id || String(id).startsWith('mock_');

async function notify(userId, message, type = 'info') {
  try {
    if (isDemoId(userId)) return;
    await Notification.create({ userId, message, type });
  } catch (e) {}
}

// ── GET /api/complaints ────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, area, page = 1, limit = 50 } = req.query;
    let filter = {};

    if (req.user.role === 'user') {
      // Demo users: match by name; real users: match by _id
      if (isDemoId(req.user._id)) filter.userName = req.user.name;
      else filter.userId = req.user._id;

    } else if (req.user.role === 'technician') {
      // Techs see all pending + their own assigned tasks
      if (isDemoId(req.user._id)) {
        filter.$or = [{ status: 'pending' }, { assignedToName: req.user.name }];
      } else {
        filter.$or = [{ assignedTo: req.user._id }, { status: 'pending' }];
      }
      // Do NOT add extra status/type filters on top of $or — let frontend tabs handle it

    } else {
      if (status) filter.status = status;
      if (type)   filter.type   = type;
      if (area && ['admin', 'moderator'].includes(req.user.role)) filter.userArea = area;
    }

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Complaint.countDocuments(filter);
    res.json({ success: true, complaints, total, page: Number(page) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/complaints/:id ────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('assignedTo', 'name phone area currentLocation');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, complaint });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/complaints ───────────────────────────────────────
router.post('/', protect, authorize('user'), upload.array('photos', 5), async (req, res) => {
  try {
    const { type, description, priority, locationLat, locationLng, locationAddress, locationAccuracy } = req.body;

    // Check duplicate active complaint of same type (name-based for demo users)
    const dupFilter = isDemoId(req.user._id)
      ? { userName: req.user.name, type, status: { $in: ['pending', 'assigned', 'in-progress'] } }
      : { userId: req.user._id, type, status: { $in: ['pending', 'assigned', 'in-progress'] } };

    const existing = await Complaint.findOne(dupFilter);
    if (existing) return res.status(400).json({ success: false, message: `You already have an active ${type} complaint (${existing.complaintId})` });

    const photos = req.files ? req.files.map(f => f.filename) : [];

    let location = null;
    if (locationLat && locationLng) {
      location = {
        lat:      parseFloat(locationLat),
        lng:      parseFloat(locationLng),
        address:  locationAddress || '',
        accuracy: locationAccuracy ? parseFloat(locationAccuracy) : null,
      };
    }

    const complaint = await Complaint.create({
      userId:      isDemoId(req.user._id) ? null : req.user._id,
      userName:    req.user.name,
      userPhone:   req.user.phone,
      userAddress: req.user.address,
      userArea:    req.user.area,
      userPincode: req.user.pincode,
      type, description, photos, location,
      priority: priority || 'medium',
      statusHistory: [{ status: 'pending', updatedByName: req.user.name }],
    });

    // Auto-assign after 5 minutes
    setTimeout(async () => {
      try {
        const c = await Complaint.findById(complaint._id);
        if (c && c.status === 'pending' && !c.assignedTo) {
          const tech = await User.findOne({ role: 'technician', isOnDuty: true, isAvailable: true });
          if (tech) {
            c.status       = 'assigned';
            c.assignedTo   = tech._id;
            c.assignedToName = tech.name;
            c.assignedAt   = new Date();
            c.statusHistory.push({ status: 'assigned', updatedByName: 'System (Auto)', note: 'Auto-assigned after 5 minutes' });
            await c.save();
            await notify(tech._id, `Auto-assigned: Complaint ${c.complaintId} — ${c.type} in ${c.userArea}`, 'task');
            if (!isDemoId(req.user._id)) await notify(req.user._id, `Your complaint ${c.complaintId} was auto-assigned to ${tech.name}`, 'info');
          }
        }
      } catch (e) {}
    }, 5 * 60 * 1000);

    res.status(201).json({ success: true, complaint });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PATCH /api/complaints/:id/status ──────────────────────────
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, note, assignSelf } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const isAdminMod = ['admin', 'moderator'].includes(req.user.role);
    const isTech     = req.user.role === 'technician';
    const isDemo     = isDemoId(req.user._id);

    // ── Technician self-accept ──
    if (isTech && assignSelf && complaint.status === 'pending') {
      // Enforce max 2 active tasks
      if (!isDemo) {
        const activeCount = await Complaint.countDocuments({
          assignedTo: req.user._id,
          status: { $in: ['assigned', 'in-progress'] }
        });
        if (activeCount >= 2) {
          return res.status(400).json({ success: false, message: 'You already have 2 active tasks. Complete one before accepting more.' });
        }
        await User.findByIdAndUpdate(req.user._id, { $inc: { jobsAccepted: 1 } });
      }
      complaint.assignedTo     = isDemo ? null : req.user._id;
      complaint.assignedToName = req.user.name;
      complaint.assignedAt     = new Date();
      complaint.status         = 'assigned';
      complaint.statusHistory.push({ status: 'assigned', updatedByName: req.user.name, note: 'Self-accepted by technician' });
      if (!isDemo) await notify(complaint.userId, `Technician ${req.user.name} has accepted your complaint ${complaint.complaintId}`, 'info');
      await complaint.save();
      return res.json({ success: true, complaint });
    }

    // ── Auth check for status updates ──
    // Demo: match by name; real: match by _id
    const isAssigned = isDemo
      ? complaint.assignedToName === req.user.name
      : complaint.assignedTo?.toString() === req.user._id.toString();

    if (!isAssigned && !isAdminMod) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this complaint' });
    }

    complaint.status = status;
    if (status === 'completed') complaint.completedAt = new Date();
    if (status === 'in-progress' && !complaint.assignedTo && !isDemo) {
      complaint.assignedTo     = req.user._id;
      complaint.assignedToName = req.user.name;
      complaint.assignedAt     = new Date();
    }
    complaint.statusHistory.push({
      status,
      updatedBy:     isDemo ? null : req.user._id,
      updatedByName: req.user.name,
      note:          note || '',
    });

    if (status === 'completed') {
      if (!isDemo && complaint.assignedTo) await User.findByIdAndUpdate(complaint.assignedTo, { $inc: { jobsCompleted: 1 } });
      await notify(complaint.userId, `✅ Your complaint ${complaint.complaintId} has been resolved!`, 'success');
    }

    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PATCH /api/complaints/:id/assign ──────────────────────────
router.patch('/:id/assign', protect, authorize('admin', 'moderator'), async (req, res) => {
  try {
    const { technicianId } = req.body;
    const tech = await User.findById(technicianId);
    if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      assignedTo:     tech._id,
      assignedToName: tech.name,
      assignedAt:     new Date(),
      status:         'assigned',
      $push: { statusHistory: { status: 'assigned', updatedByName: req.user.name, note: `Manually assigned by ${req.user.role}` } }
    }, { new: true });

    await User.findByIdAndUpdate(tech._id, { $inc: { jobsAccepted: 1 } });
    await notify(tech._id, `Complaint ${complaint.complaintId} assigned to you by ${req.user.name}`, 'task');
    res.json({ success: true, complaint });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE /api/complaints/:id ─────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
