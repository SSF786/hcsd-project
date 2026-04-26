require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { Emergency, JobApplication, Support, Notification } = require('../models/index');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ghmc_civic';

const users = [
  { userId: 'Admin', name: 'System Administrator', email: 'Admin007@gmail.com', password: 'Admin007', phone: '9000000000', address: 'GHMC Headquarters, Tank Bund Road', area: 'Somajiguda', pincode: '500082', role: 'admin', isOnDuty: true, jobsAccepted: 0, jobsCompleted: 0, hoursWorked: 0 },
  { userId: 'mod_rajesh', name: 'Rajesh Kumar', email: 'rajesh.mod@ghmc.gov.in', password: 'Mod@123', phone: '9100000001', address: 'GHMC Zone Office, Ameerpet', area: 'Ameerpet', pincode: '500016', role: 'moderator', isOnDuty: true, jobsAccepted: 0, jobsCompleted: 0, hoursWorked: 0 },
  { userId: 'tech_suresh', name: 'Suresh Babu', email: 'suresh@ghmc.gov.in', password: 'Tech@123', phone: '9200000001', address: 'Works Division, Banjara Hills', area: 'Banjara Hills', pincode: '500034', role: 'technician', specialization: 'electricity', isOnDuty: true, isAvailable: true, jobsAccepted: 24, jobsCompleted: 22, hoursWorked: 186 },
  { userId: 'tech_priya', name: 'Priya Sharma', email: 'priya@ghmc.gov.in', password: 'Tech@123', phone: '9200000002', address: 'Works Division, Gachibowli', area: 'Gachibowli', pincode: '500032', role: 'technician', specialization: 'water', isOnDuty: true, isAvailable: true, jobsAccepted: 18, jobsCompleted: 17, hoursWorked: 142 },
  { userId: 'tech_venkat', name: 'Venkat Reddy', email: 'venkat@ghmc.gov.in', password: 'Tech@123', phone: '9200000003', address: 'Works Division, Kukatpally', area: 'Kukatpally', pincode: '500072', role: 'technician', specialization: 'roads', isOnDuty: false, isAvailable: false, jobsAccepted: 31, jobsCompleted: 28, hoursWorked: 220 },
  { userId: 'tech_anitha', name: 'Anitha Devi', email: 'anitha@ghmc.gov.in', password: 'Tech@123', phone: '9200000004', address: 'Works Division, Dilsukhnagar', area: 'Dilsukhnagar', pincode: '500060', role: 'technician', specialization: 'drainage', isOnDuty: true, isAvailable: true, jobsAccepted: 15, jobsCompleted: 14, hoursWorked: 110 },
  { userId: 'police_arjun', name: 'SI Arjun Singh', email: 'arjun@hyderabadpolice.gov.in', password: 'Police@123', phone: '9300000001', address: 'Banjara Hills Police Station', area: 'Banjara Hills', pincode: '500034', role: 'police', isOnDuty: true, isAvailable: true, jobsAccepted: 45, jobsCompleted: 45, hoursWorked: 310 },
  { userId: 'amb_meena', name: 'Meena Devi', email: 'meena@ghmc108.gov.in', password: 'Amb@123', phone: '9400000001', address: '108 Emergency Station, Hitech City', area: 'Hitech City', pincode: '500081', role: 'ambulance', isOnDuty: true, isAvailable: true, jobsAccepted: 38, jobsCompleted: 38, hoursWorked: 280 },
  { userId: 'fire_ramu', name: 'Ramu Naidu', email: 'ramu@hydfire.gov.in', password: 'Fire@123', phone: '9500000001', address: 'Fire Station No. 4, Jubilee Hills', area: 'Jubilee Hills', pincode: '500033', role: 'fire', isOnDuty: true, isAvailable: true, jobsAccepted: 12, jobsCompleted: 12, hoursWorked: 95 },
  { userId: 'citizen_kavya', name: 'Kavya Reddy', email: 'kavya@gmail.com', password: 'User@123', phone: '9600000001', address: 'Plot 42, Jubilee Hills Road No. 36', area: 'Jubilee Hills', pincode: '500033', role: 'user' },
  { userId: 'citizen_ravi', name: 'Ravi Teja', email: 'ravi@gmail.com', password: 'User@123', phone: '9600000002', address: 'Flat 12B, Kondapur', area: 'Gachibowli', pincode: '500032', role: 'user' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all
    await Promise.all([
      User.deleteMany({}),
      Complaint.deleteMany({}),
      Emergency.deleteMany({}),
      JobApplication.deleteMany({}),
      Support.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Hash passwords and insert users
    const createdUsers = [];
    for (const u of users) {
      const hashedPw = await bcrypt.hash(u.password, 12);
      const user = await User.create({ ...u, password: hashedPw });
      createdUsers.push(user);
      console.log(`👤 Created: ${u.userId} (${u.role})`);
    }

    const getUserByUserId = (uid) => createdUsers.find(u => u.userId === uid);
    const kavya = getUserByUserId('citizen_kavya');
    const ravi = getUserByUserId('citizen_ravi');
    const suresh = getUserByUserId('tech_suresh');
    const priya = getUserByUserId('tech_priya');
    const venkat = getUserByUserId('tech_venkat');
    const arjun = getUserByUserId('police_arjun');
    const meena = getUserByUserId('amb_meena');
    const ramu = getUserByUserId('fire_ramu');

    const now = new Date();
    const ago = (h) => new Date(now - h * 3600 * 1000);

    // Seed complaints
    const complaints = [
      { userId: kavya._id, userName: kavya.name, userPhone: kavya.phone, userAddress: kavya.address, userArea: kavya.area, userPincode: kavya.pincode, type: 'electricity', description: 'Street light on Road No. 36 has been non-functional for 3 days causing safety issues at night. Multiple residents have complained.', photos: [], location: { lat: 17.4326, lng: 78.4071, address: 'Jubilee Hills Road No.36, Hyderabad', accuracy: 10 }, status: 'completed', assignedTo: suresh._id, assignedToName: suresh.name, assignedAt: ago(96), completedAt: ago(72), priority: 'high', statusHistory: [{ status: 'pending', updatedByName: 'System' }, { status: 'assigned', updatedByName: suresh.name }, { status: 'in-progress', updatedByName: suresh.name }, { status: 'completed', updatedByName: suresh.name }] },
      { userId: kavya._id, userName: kavya.name, userPhone: kavya.phone, userAddress: kavya.address, userArea: kavya.area, userPincode: kavya.pincode, type: 'roads', description: 'Large pothole near the Road No.36 junction causing vehicle damage and traffic jams. Several two-wheelers have been damaged.', photos: [], location: { lat: 17.4330, lng: 78.4075, address: 'Jubilee Hills Junction, Road No.36', accuracy: 15 }, status: 'in-progress', assignedTo: venkat._id, assignedToName: venkat.name, assignedAt: ago(24), priority: 'urgent', statusHistory: [{ status: 'pending', updatedByName: 'System' }, { status: 'assigned', updatedByName: venkat.name }, { status: 'in-progress', updatedByName: venkat.name }] },
      { userId: kavya._id, userName: kavya.name, userPhone: kavya.phone, userAddress: kavya.address, userArea: kavya.area, userPincode: kavya.pincode, type: 'water', description: 'No water supply since yesterday morning. Multiple households in our building are affected. We urgently need resolution.', photos: [], location: { lat: 17.4320, lng: 78.4060, address: 'Jubilee Hills Road No.36, Hyderabad' }, status: 'assigned', assignedTo: priya._id, assignedToName: priya.name, assignedAt: ago(3), priority: 'high', statusHistory: [{ status: 'pending', updatedByName: 'System' }, { status: 'assigned', updatedByName: priya.name }] },
      { userId: ravi._id, userName: ravi.name, userPhone: ravi.phone, userAddress: ravi.address, userArea: ravi.area, userPincode: ravi.pincode, type: 'garbage', description: 'Garbage has not been collected for 5 days in our area. The dump is overflowing and causing serious hygiene issues.', photos: [], location: { lat: 17.4400, lng: 78.3489, address: 'Kondapur, Gachibowli' }, status: 'pending', priority: 'medium', statusHistory: [{ status: 'pending', updatedByName: 'System' }] },
      { userId: ravi._id, userName: ravi.name, userPhone: ravi.phone, userAddress: ravi.address, userArea: ravi.area, userPincode: ravi.pincode, type: 'electricity', description: 'Transformer sparking in our colony since morning. Risk of fire. Need emergency attention.', photos: [], location: { lat: 17.4405, lng: 78.3492, address: 'Kondapur Colony, Gachibowli' }, status: 'assigned', assignedTo: suresh._id, assignedToName: suresh.name, assignedAt: ago(1), priority: 'urgent', statusHistory: [{ status: 'pending', updatedByName: 'System' }, { status: 'assigned', updatedByName: suresh.name }] },
    ];

    for (const c of complaints) {
      const count = await Complaint.countDocuments();
      await Complaint.create({ ...c, complaintId: `CMP-${String(count + 1).padStart(4, '0')}` });
    }
    console.log(`📋 Created ${complaints.length} complaints`);

    // Seed emergencies
    const emergencies = [
      { userId: kavya._id, userName: kavya.name, userPhone: kavya.phone, userArea: kavya.area, type: 'ambulance', status: 'completed', assignedTo: meena._id, assignedToName: meena.name, location: { lat: 17.4326, lng: 78.4071, address: 'Jubilee Hills Road No.36' }, resolvedAt: ago(7 * 24) },
      { userId: ravi._id, userName: ravi.name, userPhone: ravi.phone, userArea: ravi.area, type: 'police', status: 'completed', assignedTo: arjun._id, assignedToName: arjun.name, location: { lat: 17.4400, lng: 78.3489, address: 'Kondapur, Gachibowli' }, resolvedAt: ago(3 * 24) },
      { userId: ravi._id, userName: ravi.name, userPhone: ravi.phone, userArea: ravi.area, type: 'fire', status: 'completed', assignedTo: ramu._id, assignedToName: ramu.name, location: { lat: 17.4410, lng: 78.3500, address: 'Kondapur, Gachibowli' }, resolvedAt: ago(24) },
    ];
    for (const e of emergencies) {
      const count = await Emergency.countDocuments();
      await Emergency.create({ ...e, emergencyId: `EMG-${String(count + 1).padStart(4, '0')}` });
    }
    console.log(`🚨 Created ${emergencies.length} emergencies`);

    console.log('\n✅ SEED COMPLETE!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('LOGIN CREDENTIALS:');
    users.forEach(u => console.log(`  ${u.role.padEnd(12)} | ${u.userId.padEnd(18)} | ${u.password}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
