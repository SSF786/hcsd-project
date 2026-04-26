import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { emergencyAPI } from '../../services/api';
import { Shield, Heart, Flame, AlertTriangle, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';

const TYPES = [
  { id:'police',    label:'Police',      Icon:Shield, color:'#3498DB', desc:'Crime, assault, law & order' },
  { id:'ambulance', label:'Ambulance',   Icon:Heart,  color:'#E74C3C', desc:'Medical emergency, accidents' },
  { id:'fire',      label:'Fire Brigade',Icon:Flame,  color:'#E67E22', desc:'Fire, gas leak, explosion' },
];

export default function EmergencyPage() {
  const { currentUser } = useApp();
  const [emergencies, setEmergencies] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [activating, setActivating] = useState(null);
  const [done, setDone] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    emergencyAPI.getAll().then(r => setEmergencies(r.data.emergencies||[])).catch(()=>{});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { timeout: 8000 }
      );
    }
  }, []);

  const handleEmergency = async (type) => {
    setConfirm(null); setActivating(type);
    try {
      const body = { type };
      if (location) { body.locationLat = location.lat; body.locationLng = location.lng; body.locationAddress = currentUser.area + ', Hyderabad'; }
      const r = await emergencyAPI.raise(body);
      setDone({ type, id: r.data.emergency.emergencyId });
      emergencyAPI.getAll().then(r2 => setEmergencies(r2.data.emergencies||[])).catch(()=>{});
    } catch (e) {}
    setActivating(null);
  };

  return (
    <>
      <Header title="Emergency Services" subtitle="One-tap emergency response" />
      <div className="page-body animate-fadeIn">
        {location && (
          <div style={{ marginBottom:16, padding:'10px 16px', borderRadius:10, background:'rgba(26,181,160,0.08)', border:'1px solid rgba(26,181,160,0.2)', display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem', color:'#1AB5A0', fontWeight:600 }}>
            <Navigation size={14}/> Location ready — your GPS will be sent with emergency alert
          </div>
        )}
        <div className="alert alert-warning" style={{ marginBottom:24 }}>
          <AlertTriangle size={16}/>
          <div><strong>Genuine Emergencies Only.</strong> Misuse is a punishable offence.</div>
        </div>
        {done && (
          <div style={{ marginBottom:24, padding:'18px 20px', borderRadius:14, background:'rgba(46,204,113,0.08)', border:'1px solid rgba(46,204,113,0.2)', display:'flex', alignItems:'center', gap:14, animation:'fadeIn 0.3s ease' }}>
            <CheckCircle size={26} color="#2ECC71"/>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:3 }}>Emergency Alert Dispatched!</div>
              <div style={{ fontSize:'0.875rem', color:'var(--text-secondary)' }}>{done.type} team alerted. ID: <strong style={{ color:'#C9A84C' }}>{done.id}</strong></div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setDone(null)} style={{ marginLeft:'auto' }}>Dismiss</button>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16, marginBottom:28 }}>
          {TYPES.map((em, i) => {
            const { Icon } = em;
            const isAct = activating===em.id; const isCon = confirm===em.id;
            return (
              <div key={em.id} style={{ padding:'30px 22px', borderRadius:20, background:em.color+'08', border:`1px solid ${em.color}22`, textAlign:'center', position:'relative', overflow:'hidden', animation:`bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.06 + i * 0.12}s both`, transition:'transform 0.22s, box-shadow 0.22s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 16px 48px ${em.color}25`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${em.color}60,transparent)` }}/>
                <div style={{ width:70, height:70, borderRadius:'50%', background:em.color+'18', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:`0 0 0 10px ${em.color}08`, animation:isAct?'emergencyPulse 1s infinite':'none' }}>
                  <Icon size={30} color={em.color}/>
                </div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:800, marginBottom:6 }}>{em.label}</h3>
                <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:18, lineHeight:1.5 }}>{em.desc}</p>
                {!isCon ? (
                  <button onClick={()=>setConfirm(em.id)} disabled={!!activating}
                    style={{ width:'100%', padding:'12px', borderRadius:10, cursor:'pointer', background:isAct?em.color+'30':em.color, border:'none', color:'#fff', fontWeight:700, fontSize:'0.875rem', transition:'all 0.2s', opacity:activating&&!isAct?0.4:1 }}>
                    {isAct ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><span className="spinner" style={{ borderTopColor:'#fff', width:14, height:14 }}/> Sending...</span> : `🚨 Call ${em.label}`}
                  </button>
                ) : (
                  <div>
                    <p style={{ fontSize:'0.8rem', color:em.color, fontWeight:700, marginBottom:10 }}>Confirm real emergency?</p>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>handleEmergency(em.id)} style={{ flex:1, padding:'10px', borderRadius:8, background:em.color, color:'#fff', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', border:'none' }}>Yes!</button>
                      <button onClick={()=>setConfirm(null)} style={{ flex:1, padding:'10px', borderRadius:8, background:'rgba(255,255,255,0.05)', color:'var(--text-secondary)', fontSize:'0.8rem', cursor:'pointer', border:'1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                    </div>
                  </div>
                )}
                <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:10 }}><Clock size={10}/> Avg response &lt; 5 mins</p>
              </div>
            );
          })}
        </div>
        {emergencies.length>0 && (
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <div style={{ width:3, height:16, background:'linear-gradient(to bottom,#C9A84C,#8B6914)', borderRadius:2 }}/>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>My Emergency History</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Responder</th><th>Date</th></tr></thead>
                <tbody>
                  {emergencies.map(e => (
                    <tr key={e._id}>
                      <td style={{ fontFamily:'var(--font-display)', fontSize:'0.72rem', color:'#C9A84C', fontWeight:700 }}>{e.emergencyId}</td>
                      <td style={{ textTransform:'capitalize', fontSize:'0.82rem' }}>{e.type}</td>
                      <td><span style={{ padding:'2px 8px', borderRadius:20, fontSize:'0.68rem', fontWeight:600, background:e.status==='completed'?'rgba(46,204,113,0.12)':'rgba(243,156,18,0.12)', color:e.status==='completed'?'#2ECC71':'#F39C12' }}>{e.status}</span></td>
                      <td style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{e.assignedToName||'—'}</td>
                      <td style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{e.createdAt?new Date(e.createdAt).toLocaleDateString():'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
