import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { emergencyAPI } from '../../services/api';
import { Shield, Heart, Flame, AlertTriangle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EM = { police:{ color:'#3498DB', Icon:Shield }, ambulance:{ color:'#E74C3C', Icon:Heart }, fire:{ color:'#E67E22', Icon:Flame } };

export default function AdminEmergencies() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    emergencyAPI.getAll().then(r => { setEmergencies(r.data.emergencies || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const pending = emergencies.filter(e => e.status === 'pending').length;

  const filtered = emergencies.filter(e => {
    const mt = filterType === 'all' || e.type === filterType;
    const ms = filterStatus === 'all' || e.status === filterStatus;
    const mq = !search || e.userName?.toLowerCase().includes(search.toLowerCase()) || e.emergencyId?.toLowerCase().includes(search.toLowerCase()) || e.userArea?.toLowerCase().includes(search.toLowerCase());
    return mt && ms && mq;
  });

  return (
    <>
      <Header title="Emergency Management" subtitle={`${pending} pending · ${emergencies.length} total`} />
      <div className="page-body animate-fadeIn">
        {pending > 0 && (
          <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 14, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', display: 'flex', alignItems: 'center', gap: 12, animation: 'pulse 2s infinite' }}>
            <AlertTriangle size={20} color="#E74C3C" />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#E74C3C' }}>🚨 {pending} Active Emergency Alert{pending > 1 ? 's' : ''}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Awaiting response from emergency teams</div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid-3" style={{ marginBottom: 22 }}>
          {['police','ambulance','fire'].map((type, i) => {
            const { color, Icon } = EM[type];
            const count = emergencies.filter(e => e.type === type).length;
            const resolved = emergencies.filter(e => e.type === type && e.status === 'completed').length;
            return (
              <div key={type} className="card" style={{ borderLeft: `3px solid ${color}`, animation: `slideInUp 0.4s cubic-bezier(0.34,1.1,0.64,1) ${0.05 + i * 0.09}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'capitalize' }}>{type}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color }}>{count}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#2ECC71' }}>{resolved}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Resolved</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emergencies..." style={{ paddingLeft: 36 }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 150 }}>
            <option value="all">All Types</option>
            <option value="police">Police</option>
            <option value="ambulance">Ambulance</option>
            <option value="fire">Fire</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">Responding</option>
            <option value="completed">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Type</th><th>Citizen</th><th>Area</th><th>Phone</th><th>Status</th><th>Responder</th><th>Location</th><th>Time</th></tr></thead>
              <tbody>
                {filtered.map(e => {
                  const em = EM[e.type] || { color: '#94A3B8', Icon: AlertTriangle };
                  const sc = { pending:'#F39C12', 'in-progress':'#9B59B6', completed:'#2ECC71', assigned:'#3498DB' }[e.status] || '#94A3B8';
                  return (
                    <tr key={e._id}>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: '#C9A84C', fontWeight: 700 }}>{e.emergencyId}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', background: em.color + '15', color: em.color, fontWeight: 600, textTransform: 'capitalize' }}>{e.type}</span>
                      </td>
                      <td style={{ fontWeight: 500, color: '#F0EDE4' }}>{e.userName}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{e.userArea}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{e.userPhone}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: sc + '15', color: sc }}>
                          {e.status === 'in-progress' ? 'Responding' : e.status === 'completed' ? 'Resolved' : e.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{e.assignedToName || '—'}</td>
                      <td>
                        {e.location ? (
                          <a href={`https://maps.google.com/?q=${e.location.lat},${e.location.lng}`} target="_blank" rel="noreferrer"
                            style={{ fontSize: '0.75rem', color: '#1AB5A0', display: 'flex', alignItems: 'center', gap: 3 }}>
                            📍 View
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {e.createdAt ? formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No emergencies found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
