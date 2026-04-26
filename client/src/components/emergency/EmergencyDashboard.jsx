import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../common/Header';
import { useApp } from '../../context/AppContext';
import { emergencyAPI, authAPI } from '../../services/api';
import { toast } from '../common/Toast';
import { Shield, Heart, Flame, ToggleLeft, ToggleRight, Clock, CheckCircle, AlertTriangle, User, Phone, MapPin, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ROLE_META = {
  police:    { icon: Shield, color: '#3498DB', label: 'Police Officer',  emg: 'Law & Order',   emoji: '🚔' },
  ambulance: { icon: Heart,  color: '#E74C3C', label: 'Paramedic',       emg: 'Medical',       emoji: '🚑' },
  fire:      { icon: Flame,  color: '#E67E22', label: 'Fire Fighter',    emg: 'Fire & Rescue', emoji: '🚒' },
};

const STATUS_COLOR = { pending: '#F39C12', 'in-progress': '#3498DB', completed: '#2ECC71' };

export default function EmergencyDashboard() {
  const { currentUser, setCurrentUser } = useApp();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [acting, setActing] = useState(null);

  const meta = ROLE_META[currentUser?.role] || ROLE_META.police;
  const RoleIcon = meta.icon;

  const load = useCallback(async () => {
    try {
      const r = await emergencyAPI.getAll();
      setEmergencies(r.data.emergencies || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const handleDuty = async () => {
    setToggling(true);
    try {
      const res = await authAPI.toggleDuty();
      const updatedUser = res.data.user;
      localStorage.setItem('ghmc_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      toast[updatedUser.isOnDuty ? 'success' : 'info'](
        updatedUser.isOnDuty ? '✅ You are now ON DUTY — alerts will be sent to you' : '⏸️ You are now OFF DUTY'
      );
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to toggle duty status');
    }
    setToggling(false);
  };

  const handleAction = async (id, action) => {
    setActing(id + action);
    try { await emergencyAPI.respond(id, action); await load(); } catch (e) {}
    setActing(null);
  };

  const mine = emergencies.filter(e => e.assignedTo === currentUser?._id || e.assignedTo?._id === currentUser?._id);
  const pending = emergencies.filter(e => e.status === 'pending');
  const inProgress = emergencies.filter(e => e.status === 'in-progress');
  const completed = emergencies.filter(e => e.status === 'completed');

  return (
    <>
      <Header title="Emergency Dashboard" subtitle={`${meta.emg} Response · ${currentUser?.area}`} />
      <div className="page-body animate-fadeIn">

        {/* Duty Toggle */}
        <div className="card card-gold" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RoleIcon size={18} color={meta.color} /> {meta.label} Status
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {currentUser?.isOnDuty ? '✅ On duty — receiving emergency alerts' : '⏸️ Off duty — not receiving alerts'}
            </div>
          </div>
          <button onClick={handleDuty} disabled={toggling}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: currentUser?.isOnDuty ? 'rgba(46,204,113,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${currentUser?.isOnDuty ? 'rgba(46,204,113,0.3)' : 'rgba(100,116,139,0.3)'}`, color: currentUser?.isOnDuty ? '#2ECC71' : '#64748B', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.2s', flexShrink: 0 }}>
            {toggling ? <span className="spinner" style={{ borderTopColor: currentUser?.isOnDuty ? '#2ECC71' : '#64748B' }} />
              : currentUser?.isOnDuty ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {currentUser?.isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Pending',     value: pending.length,    color: '#F39C12', icon: AlertTriangle },
            { label: 'In Progress', value: inProgress.length, color: '#3498DB', icon: Clock },
            { label: 'Completed',   value: completed.length,  color: '#2ECC71', icon: CheckCircle },
            { label: 'My Cases',    value: mine.length,       color: meta.color, icon: RoleIcon },
          ].map((s, i) => {
            const Ic = s.icon;
            return (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px 12px', borderTop: `2px solid ${s.color}`, animation: `slideInUp 0.38s cubic-bezier(0.34,1.1,0.64,1) ${0.04 + i * 0.08}s both` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Ic size={18} color={s.color} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* My Active Cases */}
        {mine.filter(e => e.status !== 'completed').length > 0 && (
          <div className="card" style={{ marginBottom: 24, borderTop: `2px solid ${meta.color}` }}>
            <div className="section-accent" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>My Active Cases</h3>
            </div>
            {mine.filter(e => e.status !== 'completed').map(e => (
              <EmergencyCard key={e._id} e={e} meta={meta} onAction={handleAction} acting={acting} isMine />
            ))}
          </div>
        )}

        {/* Pending Alerts */}
        <div className="card">
          <div className="section-accent" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
              All {meta.emg} Emergencies
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>Auto-refreshes every 15s</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
          ) : emergencies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{meta.emoji}</div>
              <p style={{ fontSize: '0.875rem' }}>No {meta.emg.toLowerCase()} emergencies at this time</p>
            </div>
          ) : (
            emergencies.map(e => (
              <EmergencyCard key={e._id} e={e} meta={meta} onAction={handleAction} acting={acting}
                isMine={e.assignedTo === currentUser?._id || e.assignedTo?._id === currentUser?._id} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function EmergencyCard({ e, meta, onAction, acting, isMine }) {
  const statusColor = STATUS_COLOR[e.status] || '#94A3B8';
  const isActing = acting?.startsWith(e._id);
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: isMine ? `rgba(${meta.color === '#3498DB' ? '52,152,219' : meta.color === '#E74C3C' ? '231,76,60' : '230,126,34'},0.06)` : 'rgba(255,255,255,0.02)', border: `1px solid ${isMine ? meta.color + '30' : 'rgba(255,255,255,0.05)'}`, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: '#C9A84C' }}>{e.emergencyId}</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}30`, textTransform: 'capitalize' }}>{e.status === 'in-progress' ? 'In Progress' : e.status}</span>
            <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: '0.65rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.06)', textTransform: 'capitalize' }}>{e.priority || 'urgent'}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{e.description || 'Emergency assistance required'}</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {e.userName || 'Citizen'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {e.userPhone || 'N/A'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {e.userArea || 'Hyderabad'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {e.createdAt ? formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }) : 'Just now'}</span>
          </div>
          {e.location && (
            <a href={`https://www.google.com/maps?q=${e.location.lat},${e.location.lng}&z=17`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: '0.74rem', color: '#1AB5A0', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(26,181,160,0.08)', border: '1px solid rgba(26,181,160,0.2)', textDecoration: 'none' }}>
              <MapPin size={11} /> View on Google Maps <ExternalLink size={10} />
            </a>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {e.status === 'pending' && (
            <button onClick={() => onAction(e._id, 'accept')} disabled={isActing}
              style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(52,152,219,0.12)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498DB', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isActing ? <span className="spinner" style={{ borderTopColor: '#3498DB', width: 12, height: 12 }} /> : '✅'} Accept
            </button>
          )}
          {e.status === 'in-progress' && isMine && (
            <button onClick={() => onAction(e._id, 'resolve')} disabled={isActing}
              style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isActing ? <span className="spinner" style={{ borderTopColor: '#2ECC71', width: 12, height: 12 }} /> : '✔'} Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
