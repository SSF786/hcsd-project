import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { analyticsAPI } from '../../services/api';
import { BarChart3, Users, FileText, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const TC = { electricity:'#F39C12', water:'#3498DB', roads:'#9B59B6', drainage:'#1AB5A0', garbage:'#2ECC71', facilities:'#E74C3C' };

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.get().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      <Header title="Analytics" />
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    </>
  );

  const stats = data?.stats || {};
  const statusCounts = data?.statusCounts || [];
  const typeCounts = data?.typeCounts || [];
  const areaCounts = (data?.areaCounts || []).map(a => [a._id, a.count]);
  const techs = data?.techs || [];
  const total = statusCounts.reduce((a, s) => a + s.count, 0);
  const resolved = statusCounts.find(s => s._id === 'completed')?.count || 0;
  const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const maxArea = areaCounts[0]?.count || 1;

  return (
    <>
      <Header title="Analytics & Reports" subtitle="System-wide performance metrics" />
      <div className="page-body animate-fadeIn">
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: Users,         label: 'Citizens',         value: stats.totalUsers      || 0, color: '#1AB5A0' },
            { icon: FileText,      label: 'Complaints',       value: stats.totalComplaints || 0, color: '#9B59B6' },
            { icon: CheckCircle,   label: 'Resolved',         value: resolved,                   color: '#2ECC71' },
            { icon: AlertTriangle, label: 'Emergencies',      value: stats.totalEmg        || 0, color: '#E74C3C' },
            { icon: TrendingUp,    label: 'Resolution Rate',  value: `${resRate}%`,              color: resRate >= 70 ? '#2ECC71' : '#F39C12' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '20px 14px', borderTop: `2px solid ${s.color}`, ...slideUp(0.04 + i * 0.07) }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'transform 0.25s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-10deg) scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <Icon size={20} color={s.color} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Status Distribution */}
          <div className="card">
            <div className="section-accent" style={{ marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Status Distribution</h3>
            </div>
            {statusCounts.map(s => {
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              const color = { pending:'#F39C12', assigned:'#3498DB', 'in-progress':'#9B59B6', completed:'#2ECC71', rejected:'#E74C3C' }[s._id] || '#94A3B8';
              return (
                <div key={s._id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s._id === 'in-progress' ? 'In Progress' : s._id}</span>
                    <span style={{ fontWeight: 700, color }}>{s.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} className="progress-bar" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Type Breakdown */}
          <div className="card">
            <div className="section-accent" style={{ marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>By Category</h3>
            </div>
            {typeCounts.map(t => {
              const color = TC[t._id] || '#94A3B8';
              const emojis = { electricity:'⚡', water:'💧', roads:'🛣️', drainage:'🌊', garbage:'🗑️', facilities:'🏛️' };
              const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
              return (
                <div key={t._id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{emojis[t._id]} {t._id}</span>
                    <span style={{ fontWeight: 600, color }}>{t.count}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} className="progress-bar" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Areas */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-accent" style={{ marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Top Complaint Areas</h3>
          </div>
          {areaCounts.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data yet</p>
          : areaCounts.map(([area, count], i) => (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 24, fontSize: '0.75rem', fontWeight: 700, color: i < 3 ? '#C9A84C' : 'var(--text-muted)', fontFamily: 'var(--font-display)', textAlign: 'center' }}>#{i+1}</div>
              <div style={{ flex: 1, minWidth: 100, fontSize: '0.875rem', fontWeight: 500 }}>{area}</div>
              <div style={{ flex: 4 }}>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count/maxArea)*100}%`, background: 'linear-gradient(90deg,#C9A84C,#E0CC8F)', borderRadius: 4, transition: 'width 0.6s' }} className="progress-bar" />
                </div>
              </div>
              <div style={{ width: 30, textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#C9A84C' }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Technician Performance */}
        <div className="card">
          <div className="section-accent" style={{ marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Technician Performance</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Area</th><th>Spec.</th><th>Accepted</th><th>Completed</th><th>Success Rate</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {techs.map(t => {
                  const rate = t.jobsAccepted > 0 ? Math.round((t.jobsCompleted / t.jobsAccepted) * 100) : 0;
                  const rateColor = rate >= 80 ? '#2ECC71' : rate >= 50 ? '#F39C12' : '#E74C3C';
                  return (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500, color: '#F0EDE4' }}>{t.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.area}</td>
                      <td><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', background: 'rgba(26,181,160,0.12)', color: '#1AB5A0', fontWeight: 600, textTransform: 'capitalize' }}>{t.specialization || 'General'}</span></td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textAlign: 'center' }}>{t.jobsAccepted}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#2ECC71', textAlign: 'center' }}>{t.jobsCompleted}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${rate}%`, background: rateColor, borderRadius: 3 }} className="progress-bar" />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: 34, color: rateColor }}>{rate}%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, textAlign: 'center' }}>{t.hoursWorked}h</td>
                      <td><span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: t.isOnDuty ? 'rgba(46,204,113,0.12)' : 'rgba(100,116,139,0.12)', color: t.isOnDuty ? '#2ECC71' : '#64748B' }}>{t.isOnDuty ? 'On Duty' : 'Off Duty'}</span></td>
                    </tr>
                  );
                })}
                {techs.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No technicians in system</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
