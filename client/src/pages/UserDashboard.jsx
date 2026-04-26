import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/common/Header';
import { COMPLAINT_TYPES, EMERGENCY_TYPES, STATUS_CFG } from '../data/constants';
import { FileText, AlertTriangle, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '../components/common/Widgets';

export default function UserDashboard() {
  const { user, complaints, fetchComplaints } = useApp();
  const navigate = useNavigate();
  useEffect(() => { fetchComplaints(); }, []);
  const mine = complaints.filter(c => c.userId === user?._id || c.userId?._id === user?._id);
  const pending = mine.filter(c => ['pending','assigned'].includes(c.status)).length;
  const inprog = mine.filter(c => c.status === 'in-progress').length;
  const done = mine.filter(c => c.status === 'completed').length;

  return (
    <>
      <Header title={`Welcome, ${user?.name?.split(' ')[0]} 👋`} subtitle={`${user?.area} — ${user?.pincode}`} />
      <div className="page-body animate-fadeIn">
        {/* KPIs */}
        <div className="grid-3" style={{ marginBottom: 26 }}>
          {[
            { icon: Clock,       label: 'Pending',    value: pending, color: '#F39C12' },
            { icon: Zap,         label: 'In Progress',value: inprog,  color: '#9B59B6' },
            { icon: CheckCircle, label: 'Resolved',   value: done,    color: '#27AE60' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card card-gold" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={s.color} />
                </div>
                <div>
                  <div className="stat-value" style={{ color: s.color, fontSize: '2rem' }}>{s.value}</div>
                  <div className="stat-label">{s.label} Complaints</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid-2" style={{ marginBottom: 26 }}>
          {/* Actions */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, fontSize: '1.05rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-gold" onClick={() => navigate('/user/complaint')} style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /> Raise New Complaint</span>
                <ArrowRight size={15} />
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/user/complaints')} style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} /> Track My Complaints</span>
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="gold-divider" />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 700 }}>Emergency Services</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {EMERGENCY_TYPES.map(em => (
                <button key={em.id} onClick={() => navigate('/user/emergency')}
                  style={{ padding: '11px 6px', borderRadius: 10, cursor: 'pointer', background: `${em.color}12`, border: `1px solid ${em.color}25`, color: em.color, fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${em.color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${em.color}12`; }}>
                  {em.emoji}<br /><span style={{ fontSize: '0.68rem', marginTop: 3, display: 'block' }}>{em.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent complaints */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>Recent Complaints</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/user/complaints')}>View All</button>
            </div>
            {mine.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: 30, paddingBottom: 30 }}>
                <FileText size={34} />
                <p style={{ fontSize: '0.875rem' }}>No complaints yet</p>
                <button className="btn btn-gold btn-sm" onClick={() => navigate('/user/complaint')}>Raise First Complaint</button>
              </div>
            ) : mine.slice(0, 4).map(c => {
              const ct = COMPLAINT_TYPES.find(t => t.id === c.type) || {};
              return (
                <div key={c._id} style={{ padding: '13px', borderRadius: 11, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.complaintId}</span>
                      <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: '0.68rem', background: `${ct.color}15`, color: ct.color, fontWeight: 700 }}>{ct.emoji} {ct.label}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.description?.slice(0, 80)}{c.description?.length > 80 ? '…' : ''}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5 }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service tiles */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, fontSize: '1.05rem' }}>Available Services</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {COMPLAINT_TYPES.map(ct => (
              <button key={ct.id} onClick={() => navigate('/user/complaint')}
                style={{ padding: '18px 8px', borderRadius: 12, cursor: 'pointer', background: `${ct.color}0A`, border: `1px solid ${ct.color}18`, textAlign: 'center', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${ct.color}18`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${ct.color}0A`; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 7 }}>{ct.emoji}</div>
                <div style={{ fontSize: '0.68rem', color: ct.color, fontWeight: 700, lineHeight: 1.3 }}>{ct.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
