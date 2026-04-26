import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { openSidebar } from './Sidebar';

const TYPE_DOT = { emergency:'#E74C3C', task:'#F39C12', success:'#2ECC71', info:'#3498DB', warning:'#E67E22' };

export default function Header({ title, subtitle }) {
  const { currentUser, notifications, unreadCount, markAllNotificationsRead } = useApp();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Close notif panel when clicking outside
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (!e.target.closest('.notif-root')) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  return (
    <header className="header-inner" style={{
      height: 'var(--header-h)', background: 'rgba(7,13,31,0.97)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center',
      padding: '0 32px', gap: 12, position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.15),transparent)' }} />

      {/* Hamburger — mobile only */}
      {isMobile && (
        <button className="mobile-menu-btn" onClick={openSidebar} style={{ flexShrink: 0 }}>
          <Menu size={18} />
        </button>
      )}

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, background: 'linear-gradient(to bottom,#C9A84C,#8B6914)', borderRadius: 2, flexShrink: 0 }} />
            <h2 className="header-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: '#F0EDE4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
          </div>
        )}
        {subtitle && !isMobile && (
          <p className="header-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1, paddingLeft: 11 }}>{subtitle}</p>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Notifications */}
        <div className="notif-root" style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)} style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${open ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)'}`, color: unreadCount > 0 ? '#C9A84C' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
            <Bell size={16} />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#E74C3C', color: '#fff', borderRadius: 20, fontSize: '0.56rem', fontWeight: 800, padding: '1px 5px', minWidth: 16, textAlign: 'center', border: '2px solid #070d1f' }}>{unreadCount}</span>}
          </button>
          {open && (
            <div className="notif-dropdown" style={{ position: 'absolute', top: 46, right: 0, width: isMobile ? 'calc(100vw - 28px)' : 340, maxWidth: '92vw', background: 'linear-gradient(145deg,#0c1630,#070d1f)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 200, animation: 'scaleIn 0.2s ease', transformOrigin: 'top right', overflow: 'hidden' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {unreadCount > 0 && <button onClick={markAllNotificationsRead} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#C9A84C', cursor: 'pointer' }}><CheckCheck size={12} /> Mark all read</button>}
                  <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0
                  ? <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No notifications yet</div>
                  : notifications.map(n => (
                    <div key={n._id || n.id} style={{ padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: n.read ? 'transparent' : 'rgba(201,168,76,0.03)', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.read ? 'transparent' : (TYPE_DOT[n.type] || '#3498DB'), flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: n.read ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{n.message}</p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : 'Just now'}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C30,#C9A84C15)', border: '2px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: '#C9A84C', flexShrink: 0 }}>
          {currentUser?.name?.[0] || 'U'}
        </div>
      </div>
    </header>
  );
}
