import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import './styles/global.css';

// Pages
import LandingPage from './pages/LandingPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';

// Common
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import ToastContainer from './components/common/Toast';

// User
import RaiseComplaint from './components/user/RaiseComplaint';
import MyComplaints from './components/user/MyComplaints';

// Admin
import AdminComplaints from './components/admin/AdminComplaints';

// Lazy placeholder panels (full pages needed)
import UserDashboard from './components/user/UserDashboard';
import EmergencyPage from './components/user/EmergencyPage';
import JobApplication from './components/user/JobApplication';
import SupportPage from './components/user/SupportPage';
import ProfilePage from './components/user/ProfilePage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminJobs from './components/admin/AdminJobs';
import AdminSupport from './components/admin/AdminSupport';
import AdminEmergencies from './components/admin/AdminEmergencies';
import AdminAnalytics from './components/admin/AdminAnalytics';
import ModeratorDashboard from './components/moderator/ModeratorDashboard';
import TechnicianDashboard from './components/technician/TechnicianDashboard';
import TechnicianTasks from './components/technician/TechnicianTasks';
import EmergencyDashboard from './components/emergency/EmergencyDashboard';
import EmergencyAlerts from './components/emergency/EmergencyAlerts';
import EmergencyCases from './components/emergency/EmergencyCases';
import NotificationsPage from './components/common/NotificationsPage';

const ROLE_ROUTES = { admin:'/admin', moderator:'/moderator', technician:'/technician', police:'/emergency', ambulance:'/emergency', fire:'/emergency', user:'/user' };

function Guard({ children, roles }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to={ROLE_ROUTES[currentUser.role]||'/user'} replace />;
  return children;
}

function Shell({ children }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const { pathname } = useLocation();
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content" style={{ marginLeft: isMobile ? 0 : 272 }}>
        <div key={pathname} style={{ animation: 'fadeIn 0.28s ease both', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

function Redir() {
  const { currentUser } = useApp();
  return <Navigate to={currentUser ? (ROLE_ROUTES[currentUser.role]||'/user') : '/'} replace />;
}

const A = ['admin'], M = ['moderator'], T = ['technician'], E = ['police','ambulance','fire'], U = ['user'];

function AppRoutes() {
  const { currentUser } = useApp();
  return (
    <Routes>
      <Route path="/" element={currentUser ? <Redir /> : <LandingPage />} />
      <Route path="/login" element={currentUser ? <Redir /> : <LoginPage />} />
      <Route path="/register" element={currentUser ? <Redir /> : <RegisterPage />} />

      <Route path="/user" element={<Guard roles={U}><Shell><UserDashboard /></Shell></Guard>} />
      <Route path="/user/complaint" element={<Guard roles={U}><Shell><RaiseComplaint /></Shell></Guard>} />
      <Route path="/user/complaints" element={<Guard roles={U}><Shell><MyComplaints /></Shell></Guard>} />
      <Route path="/user/emergency" element={<Guard roles={U}><Shell><EmergencyPage /></Shell></Guard>} />
      <Route path="/user/jobs" element={<Guard roles={U}><Shell><JobApplication /></Shell></Guard>} />
      <Route path="/user/support" element={<Guard roles={U}><Shell><SupportPage /></Shell></Guard>} />
      <Route path="/user/profile" element={<Guard roles={U}><Shell><ProfilePage /></Shell></Guard>} />
      <Route path="/user/notifications" element={<Guard roles={U}><Shell><NotificationsPage /></Shell></Guard>} />

      <Route path="/admin" element={<Guard roles={A}><Shell><AdminDashboard /></Shell></Guard>} />
      <Route path="/admin/complaints" element={<Guard roles={A}><Shell><AdminComplaints /></Shell></Guard>} />
      <Route path="/admin/emergencies" element={<Guard roles={A}><Shell><AdminEmergencies /></Shell></Guard>} />
      <Route path="/admin/users" element={<Guard roles={A}><Shell><AdminUsers /></Shell></Guard>} />
      <Route path="/admin/jobs" element={<Guard roles={A}><Shell><AdminJobs /></Shell></Guard>} />
      <Route path="/admin/support" element={<Guard roles={A}><Shell><AdminSupport /></Shell></Guard>} />
      <Route path="/admin/analytics" element={<Guard roles={A}><Shell><AdminAnalytics /></Shell></Guard>} />

      <Route path="/moderator" element={<Guard roles={M}><Shell><ModeratorDashboard /></Shell></Guard>} />
      <Route path="/moderator/complaints" element={<Guard roles={M}><Shell><AdminComplaints /></Shell></Guard>} />
      <Route path="/moderator/users" element={<Guard roles={M}><Shell><AdminUsers /></Shell></Guard>} />
      <Route path="/moderator/jobs" element={<Guard roles={M}><Shell><AdminJobs /></Shell></Guard>} />
      <Route path="/moderator/support" element={<Guard roles={M}><Shell><AdminSupport /></Shell></Guard>} />

      <Route path="/technician" element={<Guard roles={T}><Shell><TechnicianDashboard /></Shell></Guard>} />
      <Route path="/technician/tasks" element={<Guard roles={T}><Shell><TechnicianTasks /></Shell></Guard>} />
      <Route path="/technician/notifications" element={<Guard roles={T}><Shell><NotificationsPage /></Shell></Guard>} />
      <Route path="/technician/profile" element={<Guard roles={T}><Shell><ProfilePage /></Shell></Guard>} />
      <Route path="/technician/support" element={<Guard roles={T}><Shell><SupportPage /></Shell></Guard>} />

      <Route path="/emergency" element={<Guard roles={E}><Shell><EmergencyDashboard /></Shell></Guard>} />
      <Route path="/emergency/alerts" element={<Guard roles={E}><Shell><EmergencyAlerts /></Shell></Guard>} />
      <Route path="/emergency/cases" element={<Guard roles={E}><Shell><EmergencyCases /></Shell></Guard>} />
      <Route path="/emergency/notifications" element={<Guard roles={E}><Shell><NotificationsPage /></Shell></Guard>} />
      <Route path="/emergency/profile" element={<Guard roles={E}><Shell><ProfilePage /></Shell></Guard>} />
      <Route path="/emergency/support" element={<Guard roles={E}><Shell><SupportPage /></Shell></Guard>} />

      <Route path="*" element={<Redir />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastContainer />
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
