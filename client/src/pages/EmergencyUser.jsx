import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/common/Header';
import { EMERGENCY_TYPES } from '../data/constants';
import { LocationPicker } from '../components/common/Widgets';
import { CheckCircle } from 'lucide-react';

export default function EmergencyUser() {
  const { raiseEmergency, emergencies, user } = useApp();
  const [loc, setLoc] = useState(null); const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(null); const [done, setDone] = useState(null);

  const myEmg = emergencies.filter(e => e.userId === user?._id || e.userId?._id === user?._id);

  const handleEmg = async (type) => {
    setLoading(type);
    try { const res = await raiseEmergency(type, loc?.lat, loc?.lng, loc?.address); setDone(res.emergency.emergencyId); }
    catch(e) { import('../components/common/Toast').then(m => m.toast.error(e.response?.data?.message||'Failed')); }
    finally { setLoading(null); setConfirm(null); }
  };

  return (
    <>
      <Header title="Emergency Services" subtitle="One-tap emergency response" />
      <div className="page-body animate-fadeIn">
        {done && (
          <div className="alert alert-success" style={{ marginBottom:20, animation:'fadeIn 0.3s ease' }}>
            <CheckCircle size={16} /> Emergency alert dispatched! ID: <strong style={{color:'#C9A84C'}}>{done}</strong>. Help is on the way.
            <button onClick={()=>setDone(null)} style={{marginLeft:'auto',color:'var(--text-muted)',cursor:'pointer'}}>✕</button>
          </div>
        )}
        <div className="alert alert-warning" style={{ marginBottom:24 }}>⚠️ Only for genuine emergencies. Misuse is punishable by law.</div>

        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, fontWeight:700 }}>📍 Your Location (for accurate dispatch)</div>
          <LocationPicker onLocation={setLoc} value={loc} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:28 }}>
          {EMERGENCY_TYPES.map(em => (
            <div key={em.id} style={{ padding:'36px 24px', borderRadius:20, background:`${em.color}08`, border:`1px solid ${em.color}20`, textAlign:'center' }}>
              <div style={{ fontSize:'2.4rem', marginBottom:14 }}>{em.emoji}</div>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.1rem', marginBottom:8 }}>{em.label}</h3>
              <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:20 }}>
                {em.id==='police'?'Crime, assault, law & order':em.id==='ambulance'?'Medical emergency, accident':' Fire, gas leak, hazard'}
              </p>
              {confirm !== em.id ? (
                <button onClick={()=>setConfirm(em.id)} disabled={!!loading}
                  style={{ width:'100%', padding:'12px', borderRadius:10, background:em.color, color:'#fff', fontWeight:700, fontSize:'0.9rem', border:'none', cursor:'pointer', boxShadow:`0 4px 20px ${em.glow}`, transition:'all 0.2s' }}>
                  {loading===em.id?'Sending…':'🚨 Call '+em.label}
                </button>
              ) : (
                <div>
                  <p style={{ fontSize:'0.8rem', color:em.color, fontWeight:600, marginBottom:8 }}>Confirm emergency?</p>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>handleEmg(em.id)} style={{ flex:1, padding:'10px', borderRadius:8, background:em.color, color:'#fff', fontWeight:700, fontSize:'0.82rem', border:'none', cursor:'pointer' }}>Yes!</button>
                    <button onClick={()=>setConfirm(null)} className="btn btn-ghost btn-sm" style={{ flex:1 }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
