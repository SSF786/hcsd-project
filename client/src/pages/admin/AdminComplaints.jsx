import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/common/Header';
import { StatusBadge, PhotoViewer, MapView } from '../../components/common/Widgets';
import { COMPLAINT_TYPES } from '../../data/constants';
import { Search, Trash2, UserCheck, ChevronDown, ChevronUp, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../data/api';

export default function AdminComplaints() {
  const { complaints, fetchComplaints, assignComplaint, deleteComplaint } = useApp();
  const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState('all'); const [filterType, setFilterType] = useState('all');
  const [assignModal, setAssignModal] = useState(null); const [techs, setTechs] = useState([]); const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchComplaints(); api.get('/users?role=technician').then(r => setTechs(r.data.users)); }, []);

  const filtered = complaints.filter(c => {
    const ms = filterStatus === 'all' || c.status === filterStatus;
    const mt = filterType === 'all' || c.type === filterType;
    const mq = !search || c.complaintId?.toLowerCase().includes(search.toLowerCase()) || c.userName?.toLowerCase().includes(search.toLowerCase()) || c.userArea?.toLowerCase().includes(search.toLowerCase());
    return ms && mt && mq;
  });

  return (
    <>
      <Header title="All Complaints" subtitle={`${complaints.length} total complaints`} />
      <div className="page-body animate-fadeIn">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents:'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, citizen, area..." style={{ paddingLeft: 35 }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Statuses</option>
            {['pending','assigned','in-progress','completed','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 180 }}>
            <option value="all">All Types</option>
            {COMPLAINT_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.emoji} {ct.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => {
            const ct = COMPLAINT_TYPES.find(t => t.id === c.type) || {};
            const isOpen = expanded === c._id;
            return (
              <div key={c._id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${ct.color||'#C9A84C'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(isOpen?null:c._id)}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily:'monospace', fontSize:'0.72rem', color:'var(--text-muted)' }}>{c.complaintId}</span>
                      <span style={{ padding:'2px 8px', borderRadius:6, fontSize:'0.68rem', background:`${ct.color}15`, color:ct.color, fontWeight:700 }}>{ct.emoji} {ct.label}</span>
                      <StatusBadge status={c.status} />
                      {c.photos?.length > 0 && <span style={{ fontSize:'0.68rem', padding:'2px 7px', borderRadius:6, background:'rgba(201,168,76,0.1)', color:'#C9A84C' }}>📷 {c.photos.length} photos</span>}
                      {c.location?.lat && <span style={{ fontSize:'0.68rem', padding:'2px 7px', borderRadius:6, background:'rgba(52,152,219,0.1)', color:'#3498DB' }}>📍 Location</span>}
                    </div>
                    <div style={{ fontSize:'0.875rem', fontWeight:500, marginBottom:3 }}>{c.userName} — {c.userArea}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{c.description?.slice(0,100)}{c.description?.length>100?'…':''}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:5 }}>
                      {format(new Date(c.createdAt), 'dd MMM yyyy')} {c.assignedToName && `• Assigned: ${c.assignedToName}`}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAssignModal(c)} title="Assign"><UserCheck size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('Delete?')) deleteComplaint(c._id); }} title="Delete"><Trash2 size={14} /></button>
                    <button onClick={() => setExpanded(isOpen?null:c._id)} style={{ color:'var(--text-muted)', cursor:'pointer', padding:6 }}>{isOpen?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:14 }}>
                    <PhotoViewer photos={c.photos} />
                    {c.location?.lat && <MapView lat={c.location.lat} lng={c.location.lng} address={c.location.address} label="Complaint Location" />}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="empty-state"><Search size={36} /><p>No complaints found</p></div>}
        </div>

        {assignModal && (
          <div className="modal-overlay" onClick={() => setAssignModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Assign Technician</h3>
                <button onClick={() => setAssignModal(null)} style={{ color:'var(--text-muted)', cursor:'pointer' }}><X size={18}/></button>
              </div>
              <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:16 }}>Complaint <strong style={{color:'#C9A84C'}}>{assignModal.complaintId}</strong></p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {techs.map(t => (
                  <button key={t._id} onClick={() => { assignComplaint(assignModal._id, t._id); setAssignModal(null); }}
                    style={{ padding:'12px', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', textAlign:'left', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(201,168,76,0.08)'; e.currentTarget.style.borderColor='rgba(201,168,76,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div><div style={{ fontSize:'0.875rem', fontWeight:600 }}>{t.name}</div><div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.area} • {t.specialization||'General'}</div></div>
                      <span style={{ padding:'2px 8px', borderRadius:20, fontSize:'0.68rem', fontWeight:700, background:t.isOnDuty?'rgba(39,174,96,0.15)':'rgba(155,168,192,0.1)', color:t.isOnDuty?'#27AE60':'var(--text-muted)' }}>{t.isOnDuty?'On Duty':'Off'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
