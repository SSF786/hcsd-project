import React from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/common/Header';
import { ROLE_META } from '../data/constants';
import { User, Phone, MapPin, Mail, Briefcase, CheckCircle, Clock } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useApp();
  if (!user) return null;
  const meta = ROLE_META[user.role] || ROLE_META.user;
  const isField = ['technician','police','ambulance','fire'].includes(user.role);

  return (
    <>
      <Header title="My Profile" subtitle="Your account information" />
      <div className="page-body animate-fadeIn" style={{ maxWidth:700 }}>
        <div className="card card-gold" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg,${meta.color}30,${meta.color}15)`, border:`2px solid ${meta.color}45`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2rem', color:meta.color, flexShrink:0 }}>
              {user.name?.[0]}
            </div>
            <div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, marginBottom:6 }}>{user.name}</h2>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ padding:'4px 12px', borderRadius:20, background:`${meta.color}15`, border:`1px solid ${meta.color}30`, color:meta.color, fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{meta.label}</span>
                {isField && <span style={{ padding:'4px 12px', borderRadius:20, background:user.isOnDuty?'rgba(39,174,96,0.15)':'rgba(155,168,192,0.1)', border:user.isOnDuty?'1px solid rgba(39,174,96,0.3)':'1px solid rgba(155,168,192,0.2)', color:user.isOnDuty?'#27AE60':'var(--text-muted)', fontSize:'0.72rem', fontWeight:700 }}>{user.isOnDuty?'● On Duty':'○ Off Duty'}</span>}
              </div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:5 }}>@{user.userId}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:18, fontSize:'1rem' }}>Personal Information</h3>
          <div className="grid-2">
            {[{icon:User,label:'Full Name',value:user.name},{icon:Mail,label:'Email',value:user.email},{icon:Phone,label:'Phone',value:user.phone},{icon:MapPin,label:'Area',value:`${user.area} – ${user.pincode}`}].map(({icon:Icon,label,value})=>(
              <div key={label} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={15} color="var(--text-muted)" />
                </div>
                <div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:500 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
          {user.address && <div style={{ marginTop:14, padding:'11px 14px', borderRadius:9, background:'rgba(255,255,255,0.03)', fontSize:'0.84rem', color:'var(--text-secondary)' }}><MapPin size={12} style={{marginRight:6,color:'var(--text-muted)'}} />{user.address}</div>}
        </div>

        {isField && (
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:16, fontSize:'1rem' }}>Performance Stats</h3>
            <div className="grid-3">
              {[{icon:Briefcase,label:'Jobs Accepted',value:user.jobsAccepted||0,color:'#3498DB'},{icon:CheckCircle,label:'Jobs Completed',value:user.jobsCompleted||0,color:'#27AE60'},{icon:Clock,label:'Hours Worked',value:user.hoursWorked||0,color:'#F39C12'}].map(({icon:Icon,label,value,color})=>(
                <div key={label} style={{ textAlign:'center', padding:'18px', borderRadius:12, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}><Icon size={18} color={color} /></div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:800, color }}>{value}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:3 }}>{label}</div>
                </div>
              ))}
            </div>
            {(user.jobsAccepted||0) > 0 && (
              <div style={{ marginTop:14, padding:'12px', borderRadius:9, background:'rgba(255,255,255,0.025)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:7 }}>
                  <span style={{color:'var(--text-secondary)'}}>Success Rate</span>
                  <span style={{ fontWeight:700, color:'#27AE60' }}>{Math.round(((user.jobsCompleted||0)/(user.jobsAccepted||1))*100)}%</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.round(((user.jobsCompleted||0)/(user.jobsAccepted||1))*100)}%`, background:'linear-gradient(90deg,#27AE60,#2ECC71)', borderRadius:3 }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
