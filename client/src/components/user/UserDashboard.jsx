import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { complaintsAPI } from '../../services/api';
import { FileText, CheckCircle, Clock, ArrowRight, Zap, MapPin, Shield, Heart, Flame, Image } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCountUp, staggerDelay, slideUp } from '../../hooks/useAnimation';

const TC = { electricity:'#F39C12', water:'#3498DB', roads:'#9B59B6', drainage:'#1AB5A0', garbage:'#2ECC71', facilities:'#E74C3C' };
const TE = { electricity:'⚡', water:'💧', roads:'🛣️', drainage:'🌊', garbage:'🗑️', facilities:'🏛️' };
const SC = { pending:'#F39C12', assigned:'#3498DB', 'in-progress':'#9B59B6', completed:'#2ECC71', rejected:'#E74C3C' };

function useW() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return w;
}

function StatCard({ icon: I, label, value, color, delay }) {
  const animated = useCountUp(value, 700, delay * 1000);
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:18, borderLeft:`3px solid ${color}`, ...slideUp(delay), cursor: 'default' }}>
      <div style={{ width:52, height:52, borderRadius:14, background:color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform 0.25s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12) rotate(-4deg)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0)'}>
        <I size={24} color={color} />
      </div>
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'2.4rem', fontWeight:800, color, lineHeight:1, transition:'transform 0.2s' }}>{animated}</div>
        <div style={{ fontWeight:600, fontSize:'0.875rem', color:'#F0EDE4', marginTop:2 }}>{label}</div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredComplaint, setHoveredComplaint] = useState(null);
  const w = useW();
  const isMobile = w < 768;

  useEffect(() => {
    complaintsAPI.getAll().then(r => { setComplaints(r.data.complaints||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const counts = {
    pending: complaints.filter(c=>['pending','assigned'].includes(c.status)).length,
    inProg:  complaints.filter(c=>c.status==='in-progress').length,
    done:    complaints.filter(c=>c.status==='completed').length,
  };

  const emgBtns = [
    {icon:Shield, label:'Police',    color:'#3498DB'},
    {icon:Heart,  label:'Ambulance', color:'#E74C3C'},
    {icon:Flame,  label:'Fire',      color:'#E67E22'},
  ];

  return (
    <>
      <Header title={`Welcome back, ${currentUser?.name?.split(' ')[0]} 👋`} subtitle={`${currentUser?.area} · ${currentUser?.pincode}`} />
      <div className="page-body animate-fadeIn">

        {/* ── Stat cards ── */}
        <div className="grid-3" style={{ marginBottom:28 }}>
          {loading ? (
            [0,1,2].map(i => (
              <div key={i} className="card" style={{ height:90, background:'rgba(255,255,255,0.03)', animation:`shimmer 1.5s ease infinite ${i*0.2}s`, backgroundSize:'200% 100%' }} />
            ))
          ) : (
            <>
              <StatCard icon={Clock}       label="Pending"     value={counts.pending} color="#F39C12" delay={0.04} />
              <StatCard icon={Zap}         label="In Progress" value={counts.inProg}  color="#9B59B6" delay={0.10} />
              <StatCard icon={CheckCircle} label="Resolved"    value={counts.done}    color="#2ECC71" delay={0.16} />
            </>
          )}
        </div>

        {/* ── Main two-col ── */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap:22, marginBottom:22 }}>

          {/* Quick Actions */}
          <div className="card card-gold" style={{ display:'flex', flexDirection:'column', gap:12, ...slideUp(0.08) }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <div style={{ width:3, height:16, background:'linear-gradient(to bottom,#C9A84C,#8B6914)', borderRadius:2 }} />
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Quick Actions</h3>
            </div>
            {[
              { label:'Raise New Complaint',   path:'/user/complaint',  icon:FileText, primary: true },
              { label:'Track My Complaints',   path:'/user/complaints', icon:Clock },
              { label:'Apply for Field Role',  path:'/user/jobs',       icon:Zap },
            ].map((a, i) => {
              const I = a.icon;
              return (
                <button key={a.label}
                  className={a.primary ? 'btn btn-gold' : 'btn btn-ghost'}
                  onClick={() => navigate(a.path)}
                  style={{ justifyContent:'space-between', width:'100%', padding:'12px 16px', ...slideUp(0.12 + i * 0.06) }}>
                  <span style={{ display:'flex', alignItems:'center', gap:9 }}><I size={16}/>{a.label}</span>
                  <ArrowRight size={15} style={{ transition:'transform 0.2s' }} />
                </button>
              );
            })}

            <div style={{ marginTop:6 }}>
              <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, fontWeight:700 }}>🚨 Emergency Services</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {emgBtns.map((em, i) => {
                  const I = em.icon;
                  return (
                    <button key={em.label} onClick={() => navigate('/user/emergency')}
                      style={{ padding:'12px 6px', borderRadius:10, cursor:'pointer', background:em.color+'10', border:`1px solid ${em.color}25`, color:em.color, fontSize:'0.7rem', fontWeight:700, display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.2s', ...slideUp(0.28 + i * 0.05) }}
                      onMouseEnter={e=>{ e.currentTarget.style.background=em.color+'25'; e.currentTarget.style.transform='translateY(-4px) scale(1.04)'; e.currentTarget.style.boxShadow=`0 8px 24px ${em.color}30`; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=em.color+'10'; e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow='none'; }}>
                      <I size={20}/>{em.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="card" style={slideUp(0.12)}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:3, height:16, background:'linear-gradient(to bottom,#C9A84C,#8B6914)', borderRadius:2 }} />
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Recent Complaints</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/user/complaints')}>View All</button>
            </div>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[0,1,2].map(i => <div key={i} style={{ height:70, borderRadius:12, background:'rgba(255,255,255,0.03)', animation:`shimmer 1.5s ease infinite ${i*0.15}s`, backgroundSize:'200% 100%' }} />)}
              </div>
            ) : complaints.length === 0 ? (
              <div className="empty-state" style={{ padding:'32px 20px' }}>
                <FileText size={36}/>
                <p style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>No complaints yet</p>
                <button className="btn btn-gold btn-sm" onClick={() => navigate('/user/complaint')}>Raise First Complaint</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {complaints.slice(0,5).map((c, i) => {
                  const tc = TC[c.type]||'#94A3B8';
                  const sc = SC[c.status]||'#94A3B8';
                  const isHov = hoveredComplaint === c._id;
                  return (
                    <div key={c._id}
                      onMouseEnter={() => setHoveredComplaint(c._id)}
                      onMouseLeave={() => setHoveredComplaint(null)}
                      style={{ padding:'13px', borderRadius:12, background: isHov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)', border:`1px solid ${isHov ? tc+'40' : 'rgba(255,255,255,0.05)'}`, borderLeft:`3px solid ${tc}`, transition:'all 0.2s', transform: isHov ? 'translateX(4px)' : 'none', cursor:'default', ...slideUp(0.05 + i * 0.06) }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ fontSize:'0.875rem' }}>{TE[c.type]}</span>
                          <span style={{ fontFamily:'var(--font-display)', fontSize:'0.68rem', color:'#C9A84C', fontWeight:700 }}>{c.complaintId}</span>
                        </div>
                        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                          {c.photos?.length>0 && <Image size={11} color="#C9A84C"/>}
                          {c.location && <MapPin size={11} color="#1AB5A0"/>}
                          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:'0.65rem', fontWeight:700, background:sc+'15', color:sc, transition:'all 0.2s' }}>{c.status}</span>
                        </div>
                      </div>
                      <p style={{ fontSize:'0.815rem', color:'var(--text-secondary)', lineHeight:1.5, marginBottom:4 }}>
                        {c.description?.length>90?c.description.slice(0,90)+'...':c.description}
                      </p>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.68rem', color:'var(--text-muted)' }}>
                        <span>{c.createdAt?formatDistanceToNow(new Date(c.createdAt),{addSuffix:true}):'—'}</span>
                        {c.assignedToName&&<span>👷 {c.assignedToName}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Service Categories ── */}
        <div className="card" style={slideUp(0.20)}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <div style={{ width:3, height:16, background:'linear-gradient(to bottom,#C9A84C,#8B6914)', borderRadius:2 }} />
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Service Categories</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:12 }}>
            {Object.entries(TE).map(([id, emoji], i) => {
              const color = TC[id];
              return (
                <button key={id} onClick={() => navigate('/user/complaint')}
                  style={{ padding:'16px 8px', borderRadius:14, cursor:'pointer', background:color+'08', border:`1px solid ${color}18`, textAlign:'center', transition:'all 0.22s', ...slideUp(0.22 + i * 0.04) }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=color+'20'; e.currentTarget.style.transform='translateY(-5px) scale(1.05)'; e.currentTarget.style.borderColor=color+'50'; e.currentTarget.style.boxShadow=`0 10px 28px ${color}25`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=color+'08'; e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.borderColor=color+'18'; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{ fontSize:'1.6rem', marginBottom:6 }}>{emoji}</div>
                  <div style={{ fontSize:'0.66rem', color, fontWeight:700, fontFamily:'var(--font-display)', lineHeight:1.3, textTransform:'capitalize' }}>{id}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
