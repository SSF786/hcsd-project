const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Demo users for offline/unseeded demo mode
const DEMO_USERS = {
  'Admin':         { _id: 'mock_admin',   userId: 'Admin',         name: 'System Administrator', email: 'Admin007@gmail.com',  role: 'admin',      area: 'Somajiguda',    pincode: '500082', phone: '9000000000', isActive: true, isOnDuty: true  },
  'citizen_kavya': { _id: 'mock_kavya',   userId: 'citizen_kavya', name: 'Kavya Reddy',          email: 'kavya@gmail.com',    role: 'user',       area: 'Jubilee Hills', pincode: '500033', phone: '9600000001', isActive: true, isOnDuty: false },
  'tech_suresh':   { _id: 'mock_suresh',  userId: 'tech_suresh',   name: 'Suresh Babu',          email: 'suresh@ghmc.gov.in', role: 'technician', area: 'Banjara Hills', pincode: '500034', phone: '9200000001', isActive: true, isOnDuty: true  },
  'police_arjun':  { _id: 'mock_arjun',   userId: 'police_arjun',  name: 'Arjun Singh',          email: 'arjun@police.gov.in',role: 'police',     area: 'Secunderabad',  pincode: '500003', phone: '9300000001', isActive: true, isOnDuty: true  },
  'mod_rajesh':    { _id: 'mock_rajesh',  userId: 'mod_rajesh',    name: 'Rajesh Kumar',         email: 'rajesh@ghmc.gov.in', role: 'moderator',  area: 'Ameerpet',      pincode: '500016', phone: '9100000001', isActive: true, isOnDuty: true  },
  'amb_meena':     { _id: 'mock_meena',   userId: 'amb_meena',     name: 'Meena Sharma',         email: 'meena@ghmc.gov.in',  role: 'ambulance',  area: 'Begumpet',      pincode: '500003', phone: '9400000001', isActive: true, isOnDuty: true  },
};

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    // Demo token fallback — allows frontend demo mode without a seeded DB
    if (token.startsWith('demo_token_')) {
      const userId = token.replace('demo_token_', '');
      const demoUser = DEMO_USERS[userId];
      if (demoUser) { req.user = demoUser; return next(); }
      return res.status(401).json({ success: false, message: 'Invalid demo token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found or inactive' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  }
  next();
};

module.exports = { protect, authorize };
