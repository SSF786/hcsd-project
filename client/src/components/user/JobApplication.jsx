import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { jobsAPI } from '../../services/api';
import { Zap, Shield, Heart, Flame, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const ROLES = [
  { id:'technician', label:'Field Technician', Icon:Zap,    color:'#1AB5A0', desc:'Handle civic complaints — electricity, water, roads, drainage.' },
  { id:'police',     label:'Police Officer',   Icon:Shield, color:'#3498DB', desc:'Respond to police emergency alerts and maintain law & order.' },
  { id:'ambulance',  label:'Paramedic',        Icon:Heart,  color:'#E74C3C', desc:'Provide emergency medical assistance and ambulance services.' },
  { id:'fire',       label:'Fire Fighter',     Icon:Flame,  color:'#E67E22', desc:'Respond to fire emergencies and rescue operations.' },
];

export default function JobApplication() {
  const { currentUser } = useApp();
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => { jobsAPI.getAll().then(r => setApps(r.data.applications||[])).catch(()=>{}); };
  useEffect(() => { load(); }, []);

  const pending = apps.find(a => a.status === 'pending');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selected) return setError('Please select a role');
    setLoading(true);
    try { await jobsAPI.apply({ role: selected, message }); setSuccess(true); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed to submit'); }
    setLoading(false);
  };

  return (
    <>
      <Header title="Job Application" subtitle="Apply to become a field responder" />
      <div className="page-body animate-fadeIn">
        {pending && <div className="alert alert-warning" style={{ marginBottom: 20 }}><Clock size={16}/><div>You have a pending application for <strong>{pending.role}</strong>. Wait for admin review.</div></div>}
        {success ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
            <div style={{ textAlign:'center', animation:'scaleIn 0.3s ease' }}>
              <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(46,204,113,0.12)', border:'2px solid rgba(46,204,113,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}><CheckCircle size={40} color="#2ECC71"/></div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, marginBottom:8 }}>Application Submitted!</h2>
              <p style={{ color:'var(--text-secondary)', marginBottom:20 }}>Your application for <strong style={{ color:'#C9A84C' }}>{ROLES.find(r=>r.id===selected)?.label}</strong> is under review.</p>
              <button className="btn btn-ghost" onClick={() => setSuccess(false)}>View My Applications</button>
            </div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap:24 }}>
            <div>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:16 }}>Select a Role</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                {ROLES.map((role, i) => {
                  const { Icon } = role;
                  const isSel = selected === role.id;
                  return (
                    <button key={role.id} onClick={() => !pending && setSelected(role.id)} disabled={!!pending}
                      style={{ padding:'18px', borderRadius:14, cursor:pending?'not-allowed':'pointer', background:isSel?role.color+'12':'rgba(12,22,48,0.9)', border:`2px solid ${isSel?role.color+'50':'rgba(255,255,255,0.06)'}`, textAlign:'left', transition:'all 0.22s', opacity:pending?0.6:1, animation:`slideInUp 0.38s cubic-bezier(0.34,1.1,0.64,1) ${0.05 + i * 0.08}s both`, transform: isSel ? 'scale(1.02)' : 'scale(1)' }}
                      onMouseEnter={e => { if (!isSel && !pending) { e.currentTarget.style.background = role.color+'08'; e.currentTarget.style.borderColor = role.color+'30'; e.currentTarget.style.transform = 'translateY(-3px)'; }}}
                      onMouseLeave={e => { if (!isSel) { e.currentTarget.style.background = 'rgba(12,22,48,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:role.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={22} color={role.color}/></div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:isSel?role.color:'#F0EDE4', marginBottom:3 }}>{role.label}</div>
                          <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{role.desc}</div>
                        </div>
                        {isSel && <div style={{ width:20, height:20, borderRadius:'50%', background:role.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ color:'#fff', fontSize:'0.7rem' }}>✓</span></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:16 }}>Application Details</h3>
              <div className="card" style={{ marginBottom:16 }}>
                <h4 style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:'0.875rem', marginBottom:12, color:'var(--text-secondary)' }}>Your Information</h4>
                {[['Name',currentUser?.name],['Username',currentUser?.userId],['Phone',currentUser?.phone],['Area',currentUser?.area]].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.875rem' }}>
                    <span style={{ color:'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight:500, color:'var(--text-secondary)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div className="form-group">
                  <label className="form-label">Why do you want to join? (Optional)</label>
                  <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tell us about your motivation and experience..." rows={4} style={{ resize:'vertical' }}/>
                </div>
                {error && <div className="alert alert-error"><AlertCircle size={14}/> {error}</div>}
                <button type="submit" className="btn btn-gold" disabled={loading||!!pending||!selected} style={{ width:'100%', justifyContent:'center', padding:'13px' }}>
                  {loading ? <span className="spinner" style={{ borderTopColor:'#040812' }}/> : 'Submit Application'}
                </button>
              </form>
              {apps.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <h4 style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:'0.875rem', marginBottom:12 }}>My Applications</h4>
                  {apps.map(app => (
                    <div key={app._id} style={{ padding:'12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:'0.875rem', fontWeight:600, textTransform:'capitalize', color:'#F0EDE4' }}>{app.role}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</div>
                      </div>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:600, background:app.status==='approved'?'rgba(46,204,113,0.12)':app.status==='rejected'?'rgba(231,76,60,0.12)':'rgba(243,156,18,0.12)', color:app.status==='approved'?'#2ECC71':app.status==='rejected'?'#E74C3C':'#F39C12', textTransform:'capitalize' }}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
