# 🏛️ GHMC Hyderabad Civic Support Desk — v3
## Full-Stack | MongoDB | Real-time Location | Photo Upload | Luxury UI

---

## ⚡ QUICK START (5 steps)

### Prerequisites
- **Node.js** v18+ → https://nodejs.org (download LTS)
- **MongoDB** → https://mongodb.com/try/download/community (download Community Server)

### Step 1 — Install MongoDB
Download from https://www.mongodb.com/try/download/community and install.
Start it:
- Windows: `net start MongoDB` or use MongoDB Compass
- Mac: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

### Step 2 — Install Dependencies

Open terminal, navigate to project folder, then:
```bash
# Install server deps
cd server
npm install

# Install client deps  
cd ../client
npm install
```

### Step 3 — Seed the Database
```bash
cd server
npm run seed
```
You'll see all demo users created with credentials printed.

### Step 4 — Start Backend Server
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

### Step 5 — Start Frontend (new terminal window)
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser. 🎉

---

## 🔐 Login Credentials

| Role        | Username        | Password     |
|-------------|-----------------|--------------|
| Admin       | Admin           | Admin007     |
| Moderator   | mod_rajesh      | Mod@123      |
| Technician  | tech_suresh     | Tech@123     |
| Technician  | tech_priya      | Tech@123     |
| Police      | police_arjun    | Police@123   |
| Ambulance   | amb_meena       | Amb@123      |
| Fire        | fire_ramu       | Fire@123     |
| Citizen     | citizen_kavya   | User@123     |
| Citizen     | citizen_ravi    | User@123     |

---

## 📁 Project Structure

```
civic-v3/
├── README.md
├── package.json
│
├── server/                          ← Express + MongoDB Backend
│   ├── index.js                     ← Main server + Socket.IO
│   ├── .env                         ← Environment variables
│   ├── package.json
│   ├── config/
│   │   ├── constants.js             ← 46 Hyderabad areas + pincodes
│   │   └── seed.js                  ← Database seeder
│   ├── middleware/
│   │   ├── auth.js                  ← JWT protect + authorize middleware
│   │   └── upload.js                ← Multer photo upload (15MB, 5 files)
│   ├── models/
│   │   ├── User.js                  ← User model (all 7 roles, bcrypt hashed)
│   │   ├── Complaint.js             ← Complaints (location, photos, history)
│   │   └── index.js                 ← Emergency, JobApp, Support, Notification
│   ├── routes/
│   │   ├── auth.js                  ← Login, register, duty toggle, location
│   │   ├── complaints.js            ← Full CRUD + photo upload + auto-assign
│   │   └── api.js                   ← Emergency, users, jobs, support, analytics
│   └── uploads/                     ← Uploaded photos stored here
│
└── client/                          ← React + Vite Frontend
    ├── index.html
    ├── vite.config.js               ← Proxies /api and /uploads to backend
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                  ← Router with all 30+ routes + role guards
        ├── styles/global.css        ← Luxury Navy+Gold design system
        ├── services/api.js          ← All API calls (axios + JWT auto-attach)
        ├── context/AppContext.jsx   ← Auth state + notification polling
        ├── pages/
        │   ├── LandingPage.jsx      ← Luxury public homepage
        │   └── AuthPages.jsx        ← Login + Register (area autocomplete)
        └── components/
            ├── common/
            │   ├── Sidebar.jsx      ← Role-based nav + live badge counts
            │   ├── Header.jsx       ← Top bar + notification dropdown
            │   └── NotificationsPage.jsx
            ├── user/
            │   ├── UserDashboard.jsx
            │   ├── RaiseComplaint.jsx  ← GPS location + multi-photo upload
            │   ├── MyComplaints.jsx    ← Photo lightbox + location map link
            │   ├── EmergencyPage.jsx   ← GPS emergency + history
            │   ├── ProfilePage.jsx     ← Duty toggle + performance stats
            │   ├── JobApplication.jsx
            │   └── SupportPage.jsx
            ├── admin/
            │   ├── AdminDashboard.jsx
            │   ├── AdminComplaints.jsx  ← Photo viewer + location + assign modal
            │   ├── AdminUsers.jsx       ← Promote/demote users
            │   ├── AdminJobs.jsx        ← Approve/reject job applications
            │   ├── AdminSupport.jsx     ← Reply to support tickets
            │   ├── AdminEmergencies.jsx ← Live emergency management
            │   └── AdminAnalytics.jsx   ← Charts + period filters
            ├── moderator/
            │   └── ModeratorDashboard.jsx
            ├── technician/
            │   ├── TechnicianDashboard.jsx  ← Duty toggle + task cards
            │   └── TechnicianTasks.jsx      ← Accept/complete + photo view
            └── emergency/
                ├── EmergencyDashboard.jsx   ← Live alerts + countdown
                └── EmergencyAlerts.jsx      ← Accept/resolve cases
```

---

## ✅ Features

### 🗄️ MongoDB Database
- All user credentials stored with bcrypt-hashed passwords
- Complaint history with full status audit trail
- Photos stored as files, referenced in MongoDB
- GPS coordinates stored with accuracy radius
- Real-time notifications persisted in DB
- JWT authentication (7-day expiry)

### 📍 Real-time Location
- Browser Geolocation API captures exact GPS coords
- Accuracy radius stored (e.g., ±10m)
- "Open in Google Maps" link in all admin/tech panels
- Emergency alerts include live location
- Technician location updates via Socket.IO

### 📸 Photo Upload
- Up to 5 photos per complaint
- 15MB max per file
- Served via `/uploads/` static route
- Clickable photo thumbnails → fullscreen lightbox
- Visible to Technician, Moderator, Admin

### 🔐 Security
- Bcrypt password hashing (12 rounds)
- JWT tokens with 7-day expiry
- Role-based route protection (server-side)
- Auto-redirect on expired token

---

## 🎨 Design
- **Fonts**: Playfair Display (headings) + Instrument Sans (body)
- **Theme**: Deep Navy (#040812) + Gold (#C9A84C)
- **Components**: Glass-morphism cards, gold accent lines, luxury gradients
- **Animations**: Smooth fade-ins, scale transitions, emergency pulse

