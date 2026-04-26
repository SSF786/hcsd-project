import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import { analyticsAPI, complaintsAPI } from '../../services/api';
import { Users, FileText, AlertTriangle, CheckCircle, Clock, BarChart3, Briefcase, MessageSquare, ArrowRight } from 'lucide-react';
import { useCountUp, slideUp } from '../../hooks/useAnimation';

const TC = { electricity:'#F39C12', water:'#3498DB', roads:'#9B59B6', drainage:'#1AB5A0', garbage:'#2ECC71', facilities:'#E74C3C' };

function AnimatedStat({ icon: Icon, label, value, color, path, delay, navigate }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0, 800, delay * 1000);
  const [hov, setHov] = useState(false);
  return (
    <button onClick={() => navigate(path)} className="stat-card"
      style={{ cursor:'pointer', textAlign:'left', borderLeft:`3px solid ${color}`, width:'100%', ...slideUp(delay),
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hov ? `0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px ${color}20` : undefined,
        transition:'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.25s', transform: hov ? 'rotate(-8deg) scale(1.1)' : 'none' }}>
          <Icon size={22} color={color} />
        </div>
        <ArrowRight size={16} style={{ color: hov ? color : 'var(--text-muted)', transition:'color 0.2s, transform 0.2s', transform: hov ? 'translateX(3px)' : 'none' }} />
      </div>
      <div className="stat-value" style={{ color, transition:'transform 0.2s' }}>
        {typeof value === 'number' ? animated : value}
      </div>
      <div className="stat-label">{label}</div>
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.get(), complaintsAPI.getAll({ limit: 6 })])
      .then(([ar, cr]) => { setStats(ar.data.stats); setRecentComplaints(cr.data.complaints || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: Users,         label: 'Total Citizens',   value: stats?.totalUsers      ?? 0, color: '#1AB5A0', path: '/admin/users' },
    { icon: FileText,      label: 'Total Complaints', value: stats?.totalComplaints ?? 0, color: '#9B59B6', path: '/admin/complaints' },
    { icon: AlertTriangle, label: 'Emergencies',      value: stats?.totalEmg        ?? 0, color: '#E74C3C', path: '/admin/emergencies' },
    { icon: Briefcase,     label: 'Pending Jobs',     value: stats?.pendingApps     ?? 0, color: '#F39C12', path: '/admin/jobs' },
    { icon: MessageSquare, label: 'Open Tickets',     value: stats?.openTickets     ?? 0, color: '#3498DB', path: '/admin/support' },
    { icon: BarChart3,     label: 'Analytics',        value: '→',                         color: '#C9A84C', path: '/admin/analytics' },
  ];

  return (
    <>
      <Header title="Admin Dashboard" subtitle="Full system overview" />
      <div className="page-body animate-fadeIn">
        <div className="grid-3" style={{ marginBottom:28 }}>
          {loading
            ? [0,1,2,3,4,5].map(i => <div key={i} className="card" style={{ height:110, background:'rgba(255,255,255,0.03)', animation:`shimmer 1.5s ease infinite ${i*0.12}s`, backgroundSize:'200% 100%' }}/>)
            : statCards.map((s, i) => <AnimatedStat key={s.label} {...s} delay={0.04 + i * 0.07} navigate={navigate} />)
          }
        </div>

        <div className="card" style={slideUp(0.28)}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div className="section-accent">
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Recent Complaints</h3>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/complaints')}>View All</button>
          </div>
          {loading
            ? <div style={{ display:'flex', justifyContent:'center', padding:40 }}><span className="spinner"/></div>
            : recentComplaints.length === 0
              ? <div className="empty-state"><FileText size={36}/><p>No complaints yet</p></div>
              : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>ID</th><th>Citizen</th><th>Area</th><th>Type</th><th>Status</th><th>Assigned To</th><th>Date</th></tr></thead>
                    <tbody>
                      {recentComplaints.map((c, i) => {
                        const sc = { pending:'#F39C12', assigned:'#3498DB', 'in-progress':'#9B59B6', completed:'#2ECC71', rejected:'#E74C3C' }[c.status] || '#94A3B8';
                        return (
                          <tr key={c._id} style={{ animation:`slideInUp 0.3s ease ${0.03 + i * 0.04}s both` }}>
                            <td style={{ fontFamily:'var(--font-display)', fontSize:'0.72rem', color:'#C9A84C', fontWeight:700 }}>{c.complaintId}</td>
                            <td style={{ fontWeight:500, color:'#F0EDE4' }}>{c.userName}</td>
                            <td style={{ color:'var(--text-muted)' }}>{c.userArea}</td>
                            <td><span style={{ padding:'2px 8px', borderRadius:6, fontSize:'0.7rem', background:(TC[c.type]||'#94A3B8')+'18', color:TC[c.type]||'#94A3B8', fontWeight:600, textTransform:'capitalize' }}>{c.type}</span></td>
                            <td><span style={{ padding:'2px 9px', borderRadius:20, fontSize:'0.68rem', fontWeight:600, background:sc+'15', color:sc }}>{c.status}</span></td>
                            <td style={{ color:'var(--text-secondary)' }}>{c.assignedToName||'—'}</td>
                            <td style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      </div>
    </>
  );
}
