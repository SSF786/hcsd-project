import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import Header from './Header';
import { useApp } from '../../context/AppContext';
import { notificationsAPI } from '../../services/api';
import { Bell, CheckCheck, AlertTriangle, CheckCircle, Info, Zap, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CFG = {
  emergency:{ Icon:AlertTriangle, color:'#E74C3C', bg:'rgba(231,76,60,0.08)', border:'rgba(231,76,60,0.2)' },
  task:     { Icon:Zap,          color:'#F39C12', bg:'rgba(243,156,18,0.08)', border:'rgba(243,156,18,0.2)' },
  success:  { Icon:CheckCircle,  color:'#2ECC71', bg:'rgba(46,204,113,0.08)', border:'rgba(46,204,113,0.2)' },
  info:     { Icon:Info,         color:'#3498DB', bg:'rgba(52,152,219,0.08)', border:'rgba(52,152,219,0.2)' },
  warning:  { Icon:AlertTriangle,color:'#E67E22', bg:'rgba(230,126,34,0.08)', border:'rgba(230,126,34,0.2)' },
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllNotificationsRead } = useApp();
  return (
    <>
      <Header title="Notifications" subtitle={unreadCount>0?`${unreadCount} unread`:'All caught up'} />
      <div className="page-body animate-fadeIn" style={{ maxWidth:720 }}>
        {notifications.length > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{notifications.length} total notifications</p>
            {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead}><CheckCheck size={14}/> Mark All Read</button>}
          </div>
        )}
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ paddingTop:80 }}>
            <Bell size={48}/><h3 style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>No Notifications Yet</h3>
            <p>You'll be notified here about assignments, updates and alerts.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {notifications.map((n, i) => {
              const cfg = TYPE_CFG[n.type]||TYPE_CFG.info;
              const Icon = cfg.Icon;
              return (
                <div key={n._id||n.id} style={{ padding:'16px', borderRadius:14, background:n.read?'rgba(255,255,255,0.02)':cfg.bg, border:n.read?'1px solid rgba(255,255,255,0.05)':`1px solid ${cfg.border}`, display:'flex', gap:14, alignItems:'flex-start', transition:'all 0.15s', opacity:n.read?0.7:1, animation:`slideInUp 0.35s cubic-bezier(0.34,1.1,0.64,1) ${0.03 + i * 0.05}s both` }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={17} color={cfg.color}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'0.875rem', lineHeight:1.55, color:n.read?'var(--text-secondary)':'#F0EDE4', fontWeight:n.read?400:500, marginBottom:5 }}>{n.message}</p>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{n.createdAt?formatDistanceToNow(new Date(n.createdAt),{addSuffix:true}):'Just now'}</span>
                      {!n.read && <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'1px 7px', borderRadius:20, background:cfg.color, color:'#fff', textTransform:'uppercase', letterSpacing:'0.04em' }}>NEW</span>}
                    </div>
                  </div>
                  {!n.read && <div style={{ width:7, height:7, borderRadius:'50%', background:cfg.color, flexShrink:0, marginTop:5 }}/>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
