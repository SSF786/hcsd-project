import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { analyticsAPI, complaintsAPI } from '../../services/api';
import { FileText, Users, Briefcase, MessageSquare, AlertCircle, ArrowRight } from 'lucide-react';
import { useCountUp, slideUp } from '../../hooks/useAnimation';

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.get(), complaintsAPI.getAll({ limit: 5 })])
      .then(([ar, cr]) => { setStats(ar.data.stats); setComplaints(cr.data.complaints || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const unassigned = complaints.filter(c => !c.assignedTo && c.status === 'pending').length;

  const cards = [
    { icon: AlertCircle,   label: 'Unassigned',      value: unassigned,             color: '#E74C3C', path: '/moderator/complaints', urgent: unassigned > 0 },
    { icon: FileText,      label: 'Total Complaints', value: stats?.totalComplaints || 0, color: '#9B59B6', path: '/moderator/complaints' },
    { icon: Briefcase,     label: 'Pending Jobs',     value: stats?.pendingApps     || 0, color: '#F39C12', path: '/moderator/jobs' },
    { icon: MessageSquare, label: 'Open Tickets',     value: stats?.openTickets     || 0, color: '#3498DB', path: '/moderator/support' },
  ];

  return (
    <>
      <Header title="Moderator Dashboard" subtitle="Monitor and manage civic operations" />
      <div className="page-body animate-fadeIn">
        {unassigned > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: 22 }}>
            <AlertCircle size={16} />
            <div><strong>{unassigned} complaint{unassigned > 1 ? 's' : ''}</strong> need technician assignment immediately.</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/moderator/complaints')} style={{ marginLeft: 'auto' }}>Assign Now</button>
          </div>
        )}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {cards.map((c, i) => {
            const Icon = c.icon;
            const AnimatedValue = () => { const v = useCountUp(typeof c.value === 'number' ? c.value : 0, 700, i * 100); return loading ? '—' : v; };
            return (
              <button key={c.label} onClick={() => navigate(c.path)}
                className="stat-card" style={{ cursor: 'pointer', textAlign: 'left', width: '100%', borderLeft: `3px solid ${c.color}`, animation: c.urgent && c.value > 0 ? `goldGlow 3s infinite, slideInUp 0.4s cubic-bezier(0.34,1.1,0.64,1) ${0.04 + i * 0.08}s both` : `slideInUp 0.4s cubic-bezier(0.34,1.1,0.64,1) ${0.04 + i * 0.08}s both`, transition: 'transform 0.22s, box-shadow 0.22s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${c.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, transition: 'transform 0.25s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-10deg) scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <Icon size={20} color={c.color} />
                </div>
                <div className="stat-value" style={{ color: c.color }}><AnimatedValue /></div>
                <div className="stat-label">{c.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: '0.72rem', color: 'var(--text-muted)', transition: 'gap 0.2s' }}>View <ArrowRight size={11} /></div>
              </button>
            );
          })}
        </div>
        <div className="card">
          <div className="section-accent" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Recent Complaints</h3>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" /></div>
          : complaints.length === 0 ? <div className="empty-state" style={{ padding: '30px' }}><FileText size={32} /><p>No complaints yet</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Citizen</th><th>Area</th><th>Type</th><th>Status</th><th>Assigned</th></tr></thead>
                <tbody>
                  {complaints.map(c => {
                    const sc = { pending:'#F39C12', assigned:'#3498DB', 'in-progress':'#9B59B6', completed:'#2ECC71' }[c.status] || '#94A3B8';
                    return (
                      <tr key={c._id}>
                        <td style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: '#C9A84C', fontWeight: 700 }}>{c.complaintId}</td>
                        <td style={{ fontWeight: 500, color: '#F0EDE4' }}>{c.userName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{c.userArea}</td>
                        <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{c.type}</td>
                        <td><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: sc + '15', color: sc }}>{c.status}</span></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{c.assignedToName || <span style={{ color: '#E74C3C' }}>Unassigned</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
