import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../common/Header';
import { useApp } from '../../context/AppContext';
import { emergencyAPI } from '../../services/api';
import { AlertTriangle, Clock, User, Phone, MapPin, ExternalLink, CheckCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ROLE_META = {
  police:    { color: '#3498DB', emg: 'Law & Order',   emoji: '🚔' },
  ambulance: { color: '#E74C3C', emg: 'Medical',       emoji: '🚑' },
  fire:      { color: '#E67E22', emg: 'Fire & Rescue', emoji: '🚒' },
};
const STATUS_COLOR = { pending: '#F39C12', 'in-progress': '#3498DB', completed: '#2ECC71' };

export default function EmergencyAlerts() {
  const { currentUser } = useApp();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);

  const meta = ROLE_META[currentUser?.role] || ROLE_META.police;

  const load = useCallback(async () => {
    try {
      const r = await emergencyAPI.getAll();
      setEmergencies(r.data.emergencies || []);
      setLastUpdated(new Date());
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  const handleAction = async (id, action) => {
    setActing(id + action);
    try { await emergencyAPI.respond(id, action); await load(); } catch (e) {}
    setActing(null);
  };

  const filtered = filter === 'all' ? emergencies : emergencies.filter(e => e.status === filter);
  const pendingCount = emergencies.filter(e => e.status === 'pending').length;

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Resolved' },
  ];

  return (
    <>
      <Header title="Live Emergency Alerts" subtitle={`${meta.emg} · Auto-refreshes every 10s`} />
      <div className="page-body animate-fadeIn">

        {/* Alert banner for pending */}
        {pendingCount > 0 && (
          <div style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color="#E74C3C" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: '#E74C3C', fontWeight: 600 }}>
              {pendingCount} pending emergency {pendingCount === 1 ? 'alert' : 'alerts'} require{pendingCount === 1 ? 's' : ''} response
            </span>
            {lastUpdated && (
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} /> Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: filter === f.id ? 700 : 400, background: filter === f.id ? meta.color + '18' : 'rgba(255,255,255,0.03)', border: `1px solid ${filter === f.id ? meta.color + '40' : 'rgba(255,255,255,0.06)'}`, color: filter === f.id ? meta.color : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}>
              {f.label}
              {f.id === 'pending' && pendingCount > 0 && (
                <span style={{ marginLeft: 6, background: '#E74C3C', color: '#fff', borderRadius: 10, fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px' }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Emergency list */}
        <div className="card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>{meta.emoji}</div>
              <p>No {filter === 'all' ? '' : filter} emergencies</p>
            </div>
          ) : (
            filtered.map((e, i) => {
              const sColor = STATUS_COLOR[e.status] || '#94A3B8';
              const isActing = acting?.startsWith(e._id);
              const isMine = e.assignedTo === currentUser?._id || e.assignedTo?._id === currentUser?._id;
              return (
                <div key={e._id} style={{ padding: '14px 16px', borderRadius: 12, background: e.status === 'pending' ? 'rgba(231,76,60,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${e.status === 'pending' ? 'rgba(231,76,60,0.2)' : 'rgba(255,255,255,0.05)'}`, marginBottom: 10, animation: `slideInUp 0.35s cubic-bezier(0.34,1.1,0.64,1) ${0.03 + i * 0.05}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: '#C9A84C' }}>{e.emergencyId}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: sColor + '18', color: sColor, border: `1px solid ${sColor}30`, textTransform: 'capitalize' }}>{e.status === 'in-progress' ? 'In Progress' : e.status}</span>
                        {isMine && <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: '0.65rem', background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30`, fontWeight: 600 }}>Assigned to you</span>}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{e.description || 'Emergency assistance required'}</p>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {e.userName || 'Citizen'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {e.userPhone || 'N/A'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {e.userArea || 'Hyderabad'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {e.createdAt ? formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }) : 'Just now'}</span>
                      </div>
                      {e.location && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <a href={`https://www.google.com/maps?q=${e.location.lat},${e.location.lng}&z=17`} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: '#1AB5A0', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(26,181,160,0.08)', border: '1px solid rgba(26,181,160,0.2)', textDecoration: 'none' }}>
                            <MapPin size={11} /> Google Maps <ExternalLink size={10} />
                          </a>
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${e.location.lat},${e.location.lng}`} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: '#C9A84C', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', textDecoration: 'none' }}>
                            🧭 Directions
                          </a>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      {e.status === 'pending' && (
                        <button onClick={() => handleAction(e._id, 'accept')} disabled={isActing}
                          style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(52,152,219,0.12)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498DB', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isActing ? <span className="spinner" style={{ borderTopColor: '#3498DB', width: 12, height: 12 }} /> : '✅'} Accept
                        </button>
                      )}
                      {e.status === 'in-progress' && isMine && (
                        <button onClick={() => handleAction(e._id, 'resolve')} disabled={isActing}
                          style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isActing ? <span className="spinner" style={{ borderTopColor: '#2ECC71', width: 12, height: 12 }} /> : <CheckCircle size={13} />} Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
