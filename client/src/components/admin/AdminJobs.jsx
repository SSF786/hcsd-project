import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { jobsAPI } from '../../services/api';
import { Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '../common/Toast';

const RC = { technician:'#1AB5A0', police:'#3498DB', ambulance:'#E74C3C', fire:'#E67E22' };

export default function AdminJobs() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actioning, setActioning] = useState(null);

  const load = () => {
    jobsAPI.getAll().then(r => { setApps(r.data.applications || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleReview = async (id, action) => {
    setActioning(id + action);
    try { await jobsAPI.review(id, action); load(); } catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    setActioning(null);
  };

  const pending = apps.filter(a => a.status === 'pending').length;
  const filtered = apps.filter(a => filter === 'all' || a.status === filter);

  return (
    <>
      <Header title="Job Applications" subtitle={`${pending} pending review`} />
      <div className="page-body animate-fadeIn">
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {['pending','approved','rejected','all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', background: filter===s ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : 'rgba(255,255,255,0.04)', border: filter===s ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)', color: filter===s ? '#040812' : 'var(--text-secondary)', fontWeight: filter===s ? 700 : 400, transition: 'all 0.15s', textTransform: 'capitalize' }}>
              {s === 'pending' ? `Pending${pending > 0 ? ` (${pending})` : ''}` : s}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><Briefcase size={44} /><h3>No Applications Found</h3><p>No {filter} applications at this time</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((app, i) => {
              const color = RC[app.role] || '#94A3B8';
              return (
                <div key={app._id} className="card" style={{ borderLeft: `4px solid ${color}`, animation: `slideInUp 0.38s cubic-bezier(0.34,1.1,0.64,1) ${0.04 + i * 0.07}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color, flexShrink: 0 }}>
                          {app.userName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#F0EDE4' }}>{app.userName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.userPhone} · {app.userArea}</div>
                        </div>
                        <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: color + '15', color, textTransform: 'capitalize' }}>
                          Applied for: {app.role}
                        </span>
                      </div>
                      {app.message && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' }}>
                          "{app.message}"
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={11} style={{ marginRight: 4 }} />
                        {app.createdAt ? formatDistanceToNow(new Date(app.createdAt), { addSuffix: true }) : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      {app.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleReview(app._id, 'approve')} disabled={actioning === app._id + 'approve'}>
                            <CheckCircle size={13} /> {actioning === app._id + 'approve' ? '...' : 'Approve'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReview(app._id, 'reject')} disabled={actioning === app._id + 'reject'}>
                            <XCircle size={13} /> {actioning === app._id + 'reject' ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: app.status === 'approved' ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)', color: app.status === 'approved' ? '#2ECC71' : '#E74C3C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {app.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
