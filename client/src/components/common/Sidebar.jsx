import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, FileText, AlertTriangle, Bell, User, LogOut,
  Briefcase, Users, BarChart3, MessageSquare, ClipboardList,
  Building2, ChevronRight, Menu, X
} from 'lucide-react';

const NAV = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/admin' },
    { icon: FileText,        label: 'Complaints',      path: '/admin/complaints' },
    { icon: AlertTriangle,   label: 'Emergencies',     path: '/admin/emergencies' },
    { icon: Users,           label: 'Users',           path: '/admin/users' },
    { icon: Briefcase,       label: 'Job Applications',path: '/admin/jobs' },
    { icon: MessageSquare,   label: 'Support',         path: '/admin/support' },
    { icon: BarChart3,       label: 'Analytics',       path: '/admin/analytics' },
  ],
  moderator: [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/moderator' },
    { icon: FileText,        label: 'Complaints',      path: '/moderator/complaints' },
    { icon: Users,           label: 'Users',           path: '/moderator/users' },
    { icon: Briefcase,       label: 'Job Applications',path: '/moderator/jobs' },
    { icon: MessageSquare,   label: 'Support',         path: '/moderator/support' },
  ],
  technician: [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/technician' },
    { icon: ClipboardList,   label: 'My Tasks',        path: '/technician/tasks' },
    { icon: Bell,            label: 'Notifications',   path: '/technician/notifications', badge: true },
    { icon: User,            label: 'Profile',         path: '/technician/profile' },
    { icon: MessageSquare,   label: 'Support',         path: '/technician/support' },
  ],
  police: [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/emergency' },
    { icon: AlertTriangle,   label: 'Live Alerts',     path: '/emergency/alerts', badge: true },
    { icon: ClipboardList,   label: 'My Cases',        path: '/emergency/cases' },
    { icon: Bell,            label: 'Notifications',   path: '/emergency/notifications', badge: true },
    { icon: User,            label: 'Profile',         path: '/emergency/profile' },
    { icon: MessageSquare,   label: 'Support',         path: '/emergency/support' },
  ],
  ambulance: [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/emergency' },
    { icon: AlertTriangle,   label: 'Live Alerts',     path: '/emergency/alerts', badge: true },
    { icon: ClipboardList,   label: 'My Cases',        path: '/emergency/cases' },
    { icon: Bell,            label: 'Notifications',   path: '/emergency/notifications', badge: true },
    { icon: User,            label: 'Profile',         path: '/emergency/profile' },
    { icon: MessageSquare,   label: 'Support',         path: '/emergency/support' },
  ],
  fire: [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/emergency' },
    { icon: AlertTriangle,   label: 'Live Alerts',     path: '/emergency/alerts', badge: true },
    { icon: ClipboardList,   label: 'My Cases',        path: '/emergency/cases' },
    { icon: Bell,            label: 'Notifications',   path: '/emergency/notifications', badge: true },
    { icon: User,            label: 'Profile',         path: '/emergency/profile' },
    { icon: MessageSquare,   label: 'Support',         path: '/emergency/support' },
  ],
  user: [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/user' },
    { icon: FileText,        label: 'Raise Complaint', path: '/user/complaint' },
    { icon: AlertTriangle,   label: 'Emergency',       path: '/user/emergency' },
    { icon: ClipboardList,   label: 'My Complaints',   path: '/user/complaints' },
    { icon: Briefcase,       label: 'Job Application', path: '/user/jobs' },
    { icon: MessageSquare,   label: 'Support',         path: '/user/support' },
    { icon: Bell,            label: 'Notifications',   path: '/user/notifications', badge: true },
    { icon: User,            label: 'Profile',         path: '/user/profile' },
  ],
};

const RC = {
  admin:      { color: '#C9A84C', label: 'Administrator' },
  moderator:  { color: '#9B59B6', label: 'Moderator' },
  technician: { color: '#1AB5A0', label: 'Field Technician' },
  police:     { color: '#3498DB', label: 'Police Officer' },
  ambulance:  { color: '#E74C3C', label: 'Paramedic' },
  fire:       { color: '#E67E22', label: 'Fire Fighter' },
  user:       { color: '#2ECC71', label: 'Citizen' },
};

// Global sidebar open state — exposed so Header can toggle it
let _setSidebarOpen = null;
export function openSidebar() { _setSidebarOpen && _setSidebarOpen(true); }
export function closeSidebar() { _setSidebarOpen && _setSidebarOpen(false); }

export default function Sidebar() {
  const { currentUser, logout, unreadCount } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Expose setter for Header hamburger
  useEffect(() => { _setSidebarOpen = setMobileOpen; return () => { _setSidebarOpen = null; }; }, []);

  // Track mobile breakpoint
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => { if (isMobile) setMobileOpen(false); }, [pathname]);

  if (!currentUser) return null;

  const items = NAV[currentUser.role] || NAV.user;
  const rc = RC[currentUser.role] || RC.user;

  const isActive = (p) => {
    const exactOnly = ['/user', '/admin', '/moderator', '/technician', '/emergency', '/user/complaint'];
    return exactOnly.includes(p) ? pathname === p : pathname.startsWith(p);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const navigate_ = (path) => { navigate(path); if (isMobile) setMobileOpen(false); };

  const sidebarStyle = {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: 272,
    background: 'linear-gradient(180deg, #070d1f 0%, #040812 100%)',
    borderRight: '1px solid rgba(201,168,76,0.1)',
    display: 'flex', flexDirection: 'column',
    zIndex: 100, overflowX: 'hidden',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s',
    ...(isMobile ? {
      transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
      boxShadow: mobileOpen ? '8px 0 48px rgba(0,0,0,0.7)' : 'none',
    } : {
      transform: 'translateX(0)',
      boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
    }),
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(4,8,18,0.75)',
            zIndex: 99, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      <aside style={sidebarStyle}>
        {/* ── Logo + Mobile Close ── */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(201,168,76,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #C9A84C, #8B6914)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
            }}>
              <Building2 size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: '#F0EDE4' }}>GHMC</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Civic Support</div>
            </div>
            {isMobile && (
              <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            )}
          </div>
          <div style={{ marginTop: 14, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />
        </div>

        {/* ── User Card ── */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 11px', borderRadius: 11,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${rc.color}30, ${rc.color}15)`,
              border: `2px solid ${rc.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: rc.color,
            }}>
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#F0EDE4' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.62rem', color: rc.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                {rc.label}
                {currentUser.isOnDuty && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2ECC71', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: '0.58rem', color: 'rgba(85,96,122,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '4px 11px 7px', fontWeight: 700 }}>
            Navigation
          </div>
          {items.map((item, i) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const badgeCount = item.badge ? unreadCount : 0;
            return (
              <button
                key={item.path}
                onClick={() => navigate_(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 11px', borderRadius: 9, width: '100%',
                  background: active ? `linear-gradient(135deg, ${rc.color}18, ${rc.color}08)` : 'transparent',
                  border: active ? `1px solid ${rc.color}28` : '1px solid transparent',
                  color: active ? rc.color : 'var(--text-secondary)',
                  animation: `slideInLeft 0.35s cubic-bezier(0.34,1.1,0.64,1) ${0.05 + i * 0.04}s both`,
                  transition: 'all 0.15s', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#F0EDE4'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                <span style={{ flex: 1, fontSize: '0.83rem', fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {badgeCount > 0 && (
                  <span style={{ background: '#E74C3C', color: '#fff', borderRadius: 20, fontSize: '0.56rem', fontWeight: 800, padding: '1px 5px', minWidth: 17, textAlign: 'center', lineHeight: '1.4' }}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
              </button>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(201,168,76,0.08)', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, width: '100%', background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.83rem', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.1)'; e.currentTarget.style.color = '#E74C3C'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
