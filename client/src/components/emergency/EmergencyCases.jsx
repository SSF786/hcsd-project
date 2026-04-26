import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../common/Header';
import { useApp } from '../../context/AppContext';
import { emergencyAPI } from '../../services/api';
import { ClipboardList, Clock, MapPin, Phone, User, CheckCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ROLE_META = {
  police:    { color: '#3498DB', emg: 'Law & Order',   emoji: '🚔' },
  ambulance: { color: '#E74C3C', emg: 'Medical',       emoji: '🚑' },
  fire:      { color: '#E67E22', emg: 'Fire & Rescue', emoji: '🚒' },
};

export default function EmergencyCases() {
  const { currentUser } = useApp();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const meta = ROLE_META[currentUser?.role] || ROLE_META.police;

  const load = useCallback(async () => {
    try {
      const r = await emergencyAPI.getAll();
      const all = r.data.emergencies || [];
      setEmergencies(all.filter(e => e.assignedTo === currentUser?._id || e.assignedTo?._id === currentUser?._id));
    } catch (e) {}
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const handleResolve = async (id) => {
    setActing(id);
    try { await emergencyAPI.respond(id, 'resolve'); await load(); } catch (e) {}
    setActing(null);
  };

  const active = emergencies.filter(e => e.status !== 'completed');
  const resolved = emergencies.filter(e => e.status === 'completed');

  return (
    <>
      <Header title="My Cases" subtitle="Cases assigned to you" />
      <div className="page-body animate-fadeIn">

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Cases',  value: emergencies.length, color: meta.color },
            { label: 'Active',       value: active.length,      color: '#F39C12' },
            { label: 'Resolved',     value: resolved.length,    color: '#2ECC71' },
          ].map((s, i) => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px', borderTop: `2px solid ${s.color}`, animation: `bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.06 + i * 0.09}s both` }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active Cases */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-accent" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Active Cases</h3>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
          ) : active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <ClipboardList size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ fontSize: '0.875rem' }}>No active cases assigned to you</p>
            </div>
          ) : (
            active.map(e => <CaseCard key={e._id} e={e} meta={meta} onResolve={handleResolve} acting={acting} />)
          )}
        </div>

        {/* Resolved Cases */}
        {resolved.length > 0 && (
          <div className="card">
            <div className="section-accent" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Resolved Cases</h3>
            </div>
            {resolved.map(e => <CaseCard key={e._id} e={e} meta={meta} resolved />)}
          </div>
        )}
      </div>
    </>
  );
}

function CaseCard({ e, meta, onResolve, acting, resolved }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: resolved ? 'rgba(46,204,113,0.04)' : `rgba(${meta.color === '#3498DB' ? '52,152,219' : meta.color === '#E74C3C' ? '231,76,60' : '230,126,34'},0.06)`, border: `1px solid ${resolved ? 'rgba(46,204,113,0.15)' : meta.color + '25'}`, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: '#C9A84C' }}>{e.emergencyId}</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: resolved ? 'rgba(46,204,113,0.15)' : 'rgba(52,152,219,0.15)', color: resolved ? '#2ECC71' : '#3498DB', border: `1px solid ${resolved ? 'rgba(46,204,113,0.3)' : 'rgba(52,152,219,0.3)'}` }}>{resolved ? 'Resolved' : 'In Progress'}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{e.description || 'Emergency assistance'}</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {e.userName || 'Citizen'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {e.userPhone || 'N/A'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {e.userArea || 'Hyderabad'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {e.createdAt ? formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }) : ''}</span>
          </div>
          {e.location && (
            <a href={`https://www.google.com/maps?q=${e.location.lat},${e.location.lng}&z=17`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: '0.74rem', color: '#1AB5A0', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(26,181,160,0.08)', border: '1px solid rgba(26,181,160,0.2)', textDecoration: 'none' }}>
              <MapPin size={11} /> Open in Google Maps <ExternalLink size={10} />
            </a>
          )}
        </div>
        {!resolved && onResolve && (
          <button onClick={() => onResolve(e._id)} disabled={acting === e._id}
            style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {acting === e._id ? <span className="spinner" style={{ borderTopColor: '#2ECC71', width: 12, height: 12 }} /> : <CheckCircle size={13} />} Resolve
          </button>
        )}
      </div>
    </div>
  );
}
