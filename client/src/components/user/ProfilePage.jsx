import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { authAPI, usersAPI } from '../../services/api';
import { User, Phone, MapPin, Mail, Clock, CheckCircle, Briefcase, ToggleLeft, ToggleRight, Edit2, Eye, EyeOff, Save, X, Home } from 'lucide-react';
import { toast } from '../common/Toast';

const RC = {
  admin:      { color:'#C9A84C', label:'Administrator' },
  moderator:  { color:'#9B59B6', label:'Moderator' },
  technician: { color:'#1AB5A0', label:'Field Technician' },
  police:     { color:'#3498DB', label:'Police Officer' },
  ambulance:  { color:'#E74C3C', label:'Paramedic' },
  fire:       { color:'#E67E22', label:'Fire Fighter' },
  user:       { color:'#2ECC71', label:'Citizen' },
};

export default function ProfilePage() {
  const { currentUser, refreshUser, setCurrentUser } = useApp();
  const rc = RC[currentUser?.role] || RC.user;
  const isField = ['technician','police','ambulance','fire'].includes(currentUser?.role);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleDutyToggle = async () => {
    try {
      const res = await authAPI.toggleDuty();
      const updatedUser = res.data.user;
      localStorage.setItem('ghmc_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      toast[updatedUser.isOnDuty ? 'success' : 'info'](
        updatedUser.isOnDuty ? '✅ You are now ON DUTY' : '⏸️ You are now OFF DUTY'
      );
    } catch (e) {
      toast.error(e.response?.data?.message || 'Duty toggle failed');
    }
  };

  const openEdit = () => {
    setForm({ name: currentUser.name, phone: currentUser.phone, address: currentUser.address || '', password: '' });
    setMsg('');
    setEditing(true);
  };

  // Check monthly limit
  const canEdit = () => {
    if (!currentUser.lastCredentialChange) return { ok: true };
    const days = (Date.now() - new Date(currentUser.lastCredentialChange).getTime()) / (1000 * 60 * 60 * 24);
    if (days < 30) return { ok: false, daysLeft: Math.ceil(30 - days) };
    return { ok: true };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const { ok, daysLeft } = canEdit();
    if (!ok) { setMsg(`❌ You can only update credentials once per month. Try again in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`); return; }
    setSaving(true); setMsg('');
    try {
      const payload = { name: form.name, phone: form.phone, address: form.address };
      if (form.password && form.password.length >= 6) payload.password = form.password;
      else if (form.password && form.password.length > 0) { setMsg('❌ Password must be at least 6 characters'); setSaving(false); return; }
      const res = await usersAPI.updateMyCredentials(payload);
      const updated = { ...currentUser, ...res.data.user, lastCredentialChange: new Date().toISOString() };
      setCurrentUser(updated);
      localStorage.setItem('ghmc_user', JSON.stringify(updated));
      setMsg('✅ Profile updated successfully!');
      setTimeout(() => { setEditing(false); setMsg(''); }, 1800);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Update failed'));
    }
    setSaving(false);
  };

  if (!currentUser) return null;

  const editCheck = canEdit();

  return (
    <>
      <Header title="My Profile" subtitle="Your account information" />
      <div className="page-body animate-fadeIn" style={{ maxWidth:720 }}>

        {/* ── Header Card ── */}
        <div className="card card-gold" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg,${rc.color}30,${rc.color}15)`, border:`3px solid ${rc.color}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:800, color:rc.color, fontFamily:'var(--font-display)', flexShrink:0 }}>
              {currentUser.name[0]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, color:'#F0EDE4', marginBottom:6 }}>{currentUser.name}</h2>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ padding:'3px 12px', borderRadius:20, background:rc.color+'15', border:`1px solid ${rc.color}30`, color:rc.color, fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{rc.label}</span>
                <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>@{currentUser.userId}</span>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
              {isField && (
                <button onClick={handleDutyToggle}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:12, background:currentUser.isOnDuty?'rgba(46,204,113,0.1)':'rgba(100,116,139,0.1)', border:`1px solid ${currentUser.isOnDuty?'rgba(46,204,113,0.3)':'rgba(100,116,139,0.3)'}`, color:currentUser.isOnDuty?'#2ECC71':'#64748B', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', transition:'all 0.2s' }}>
                  {currentUser.isOnDuty ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                  {currentUser.isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                </button>
              )}
              <button onClick={openEdit}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', color:'#C9A84C', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, transition:'all 0.15s' }}>
                <Edit2 size={13}/> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── Personal Info ── */}
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <div style={{ width:3, height:16, background:'linear-gradient(to bottom,#C9A84C,#8B6914)', borderRadius:2 }}/>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Personal Information</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14 }}>
            {[
              { Icon:User,  label:'Full Name', value:currentUser.name },
              { Icon:Mail,  label:'Email',     value:currentUser.email },
              { Icon:Phone, label:'Phone',     value:currentUser.phone },
              { Icon:MapPin,label:'Area',      value:`${currentUser.area} — ${currentUser.pincode}` },
            ].map(({ Icon, label, value }, i) => (
              <div key={label} style={{ display:'flex', gap:12, alignItems:'flex-start', animation:`slideInUp 0.35s cubic-bezier(0.34,1.1,0.64,1) ${0.05 + i * 0.07}s both` }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform 0.25s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-8deg) scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <Icon size={15} color="#C9A84C"/>
                </div>
                <div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2, fontWeight:700 }}>{label}</div>
                  <div style={{ fontSize:'0.875rem', fontWeight:500 }}>{value||'—'}</div>
                </div>
              </div>
            ))}
          </div>
          {currentUser.address && (
            <div style={{ marginTop:14, padding:'11px 13px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', fontSize:'0.825rem', color:'var(--text-secondary)', display:'flex', alignItems:'flex-start', gap:8 }}>
              <Home size={13} color="var(--text-muted)" style={{ marginTop:2, flexShrink:0 }}/>{currentUser.address}
            </div>
          )}

          {/* Monthly edit note */}
          <div style={{ marginTop:14, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={11}/>
            {editCheck.ok
              ? 'You can update your profile credentials (name, phone, address, password) once per month.'
              : `Next credential update available in ${editCheck.daysLeft} day${editCheck.daysLeft !== 1 ? 's' : ''}.`}
          </div>
        </div>

        {/* ── Field Stats ── */}
        {isField && (
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <div style={{ width:3, height:16, background:'linear-gradient(to bottom,#C9A84C,#8B6914)', borderRadius:2 }}/>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Performance Statistics</h3>
            </div>
            <div className="grid-3">
              {[
                { Icon:Briefcase,   label:'Jobs Accepted',  value:currentUser.jobsAccepted||0,  color:'#3498DB' },
                { Icon:CheckCircle, label:'Jobs Completed', value:currentUser.jobsCompleted||0, color:'#2ECC71' },
                { Icon:Clock,       label:'Hours Worked',   value:currentUser.hoursWorked||0,   color:'#F39C12' },
              ].map(({ Icon, label, value, color }, i) => (
                <div key={label} style={{ textAlign:'center', padding:'18px', borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', animation:`bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.05 + i * 0.1}s both` }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:color+'15', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', transition:'transform 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2) rotate(-10deg)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    <Icon size={20} color={color}/>
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, color }}>{value}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>{label}</div>
                </div>
              ))}
            </div>
            {currentUser.jobsAccepted > 0 && (
              <div style={{ marginTop:16, padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:8 }}>
                  <span style={{ color:'var(--text-secondary)' }}>Success Rate</span>
                  <span style={{ fontWeight:700, color:'#2ECC71' }}>{Math.round((currentUser.jobsCompleted/currentUser.jobsAccepted)*100)}%</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.round((currentUser.jobsCompleted/currentUser.jobsAccepted)*100)}%`, background:'linear-gradient(90deg,#2ECC71,#27AE60)', borderRadius:3, transition:'width 0.6s ease' }}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Edit Modal ── */}
        {editing && (
          <div className="modal-overlay" onClick={() => setEditing(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:460 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)' }}/>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Edit My Profile</h3>
                  <p style={{ fontSize:'0.73rem', color:'var(--text-muted)', marginTop:2 }}>Changes are limited to once per 30 days</p>
                </div>
                <button onClick={() => setEditing(false)} style={{ color:'var(--text-muted)', cursor:'pointer', width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
              </div>

              {!editCheck.ok && (
                <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(243,156,18,0.08)', border:'1px solid rgba(243,156,18,0.2)', color:'#F39C12', fontSize:'0.82rem', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                  <Clock size={13}/> Next update available in {editCheck.daysLeft} day{editCheck.daysLeft !== 1 ? 's' : ''}
                </div>
              )}

              <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:13 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input value={form.name||''} onChange={e => setForm(f=>({...f,name:e.target.value}))} disabled={!editCheck.ok} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" value={form.phone||''} onChange={e => setForm(f=>({...f,phone:e.target.value}))} disabled={!editCheck.ok} placeholder="10-digit number" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input value={form.address||''} onChange={e => setForm(f=>({...f,address:e.target.value}))} disabled={!editCheck.ok} placeholder="House/flat, street, landmark" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(optional)</span></label>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} value={form.password||''} onChange={e => setForm(f=>({...f,password:e.target.value}))} disabled={!editCheck.ok} placeholder="Min 6 characters" style={{ paddingRight:40 }}/>
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', cursor:'pointer' }}>
                      {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </div>
                {msg && (
                  <div style={{ padding:'8px 12px', borderRadius:8, background:msg.startsWith('✅')?'rgba(46,204,113,0.1)':'rgba(231,76,60,0.1)', border:`1px solid ${msg.startsWith('✅')?'rgba(46,204,113,0.25)':'rgba(231,76,60,0.25)'}`, fontSize:'0.82rem', color:msg.startsWith('✅')?'#2ECC71':'#E74C3C' }}>
                    {msg}
                  </div>
                )}
                <div style={{ display:'flex', gap:10, marginTop:4 }}>
                  <button type="submit" className="btn btn-gold" disabled={saving || !editCheck.ok} style={{ flex:1, justifyContent:'center' }}>
                    {saving ? <span className="spinner" style={{ borderTopColor:'#040812' }}/> : <><Save size={13}/> Save Changes</>}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
