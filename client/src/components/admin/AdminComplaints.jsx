import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import { complaintsAPI, usersAPI, getUploadUrl } from '../../services/api';
import Header from '../common/Header';
import { Search, Trash2, UserCheck, MapPin, Image, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const SC = { pending:{label:'Pending',color:'#F39C12'}, assigned:{label:'Assigned',color:'#3498DB'}, 'in-progress':{label:'In Progress',color:'#9B59B6'}, completed:{label:'Completed',color:'#2ECC71'}, rejected:{label:'Rejected',color:'#E74C3C'} };
const TE = { electricity:'⚡', water:'💧', roads:'🛣️', drainage:'🌊', garbage:'🗑️', facilities:'🏛️' };
const TC = { electricity:'#F39C12', water:'#3498DB', roads:'#9B59B6', drainage:'#1AB5A0', garbage:'#2ECC71', facilities:'#E74C3C' };

function PhotoLightbox({ photos, initial, onClose }) {
  const [idx, setIdx] = useState(initial);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,0.96)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, color: '#F0EDE4', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <img src={getUploadUrl(photos[idx])} alt="" style={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 14, objectFit: 'contain' }} />
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {photos.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === idx ? '#C9A84C' : 'transparent'}`, opacity: i === idx ? 1 : 0.5 }}>
                <img src={getUploadUrl(photos[i])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [assignModal, setAssignModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const load = async () => {
    try {
      const [cr, ur] = await Promise.all([complaintsAPI.getAll({ limit: 200 }), usersAPI.getAll({ role: 'technician' })]);
      setComplaints(cr.data.complaints || []);
      setTechnicians(ur.data.users || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = complaints.filter(c => {
    const ms = filterStatus === 'all' || c.status === filterStatus;
    const mt = filterType === 'all' || c.type === filterType;
    const mq = !search || c.complaintId?.toLowerCase().includes(search.toLowerCase()) || c.userName?.toLowerCase().includes(search.toLowerCase()) || c.userArea?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    return ms && mt && mq;
  });

  const handleAssign = async (complaintId, techId) => {
    try { await complaintsAPI.assign(complaintId, techId); setAssignModal(null); load(); } catch (e) {}
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint permanently?')) return;
    try { await complaintsAPI.delete(id); load(); } catch (e) {}
  };

  if (loading) return (
    <>
      <Header title="All Complaints" />
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    </>
  );

  return (
    <>
      <Header title="All Complaints" subtitle={`${complaints.length} total in system`} />
      {lightbox && <PhotoLightbox photos={lightbox.photos} initial={lightbox.idx} onClose={() => setLightbox(null)} />}

      <div className="page-body animate-fadeIn">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, user, area, description..." style={{ paddingLeft: 36 }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Statuses</option>
            {Object.entries(SC).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 180 }}>
            <option value="all">All Types</option>
            {Object.keys(TE).map(k => <option key={k} value={k}>{TE[k]} {k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
          </select>
        </div>

        {/* Complaints List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((c, i) => {
            const sc = SC[c.status] || SC.pending;
            const tc = TC[c.type] || '#94A3B8';
            const isExp = expanded === c._id;
            return (
              <div key={c._id} className="card" style={{ padding: '18px', borderLeft: `4px solid ${tc}`, animation: `slideInUp 0.36s cubic-bezier(0.34,1.1,0.64,1) ${0.03 + i * 0.05}s both` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: '#C9A84C', fontWeight: 700 }}>{c.complaintId}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', background: tc+'15', color: tc, fontWeight: 700 }}>{TE[c.type]} {c.type}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, color: sc.color, background: sc.color+'15', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color }} />{sc.label}
                      </span>
                      {c.photos?.length > 0 && <span style={{ fontSize: '0.68rem', color: '#C9A84C', cursor: 'pointer', display:'flex', alignItems:'center', gap:3 }} onClick={() => setLightbox({ photos: c.photos, idx: 0 })}><Image size={11} /> {c.photos.length} photos</span>}
                      {c.location && <span style={{ fontSize: '0.68rem', color: '#1AB5A0', display:'flex', alignItems:'center', gap:3 }}><MapPin size={11} /> Location</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginBottom: 6, fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 600, color: '#F0EDE4' }}>{c.userName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>📍 {c.userArea}</span>
                      <span style={{ color: 'var(--text-muted)' }}>📞 {c.userPhone}</span>
                      {c.assignedToName && <span style={{ color: 'var(--text-secondary)' }}>👷 {c.assignedToName}</span>}
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {isExp ? c.description : c.description?.length > 100 ? c.description.slice(0,100)+'...' : c.description}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setAssignModal(c)} title="Assign technician"><UserCheck size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)} title="Delete"><Trash2 size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(isExp ? null : c._id)}>
                        {isExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExp && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s ease', display: 'grid', gridTemplateColumns: c.photos?.length > 0 && c.location ? '1fr 1fr' : '1fr', gap: 16 }}>
                    {c.photos?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>Photos ({c.photos.length})</div>
                        <div className="photo-grid">
                          {c.photos.map((ph, i) => (
                            <div key={i} className="photo-thumb" style={{ height: 90 }} onClick={() => setLightbox({ photos: c.photos, idx: i })}>
                              <img src={getUploadUrl(ph)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.location && (
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>GPS Location</div>
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(26,181,160,0.06)', border: '1px solid rgba(26,181,160,0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <MapPin size={15} color="#1AB5A0" />
                            <span style={{ fontSize: '0.8rem', color: '#1AB5A0', fontWeight: 600 }}>{c.location.address || 'Location captured'}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                            Lat: {c.location.lat?.toFixed(6)}, Lng: {c.location.lng?.toFixed(6)}
                            {c.location.accuracy && ` · ±${Math.round(c.location.accuracy)}m`}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <a href={`https://www.google.com/maps?q=${c.location.lat},${c.location.lng}&z=18`} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: '#C9A84C', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', textDecoration: 'none' }}>
                              <ExternalLink size={12} /> Open in Google Maps
                            </a>
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.location.lat},${c.location.lng}`} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: '#1AB5A0', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(26,181,160,0.08)', border: '1px solid rgba(26,181,160,0.2)', textDecoration: 'none' }}>
                              🧭 Get Directions
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state"><Search size={40} /><h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>No Complaints Found</h3></div>
          )}
        </div>

        {/* Assign Modal */}
        {assignModal && (
          <div className="modal-overlay" onClick={() => setAssignModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)' }} />
              <div className="modal-header">
                <h3 className="modal-title">Assign Technician</h3>
                <button onClick={() => setAssignModal(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div className="alert alert-gold" style={{ marginBottom: 16, fontSize: '0.82rem' }}>
                Complaint <strong>{assignModal.complaintId}</strong> — {assignModal.type} in {assignModal.userArea}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {technicians.map(t => (
                  <button key={t._id} onClick={() => handleAssign(assignModal._id, t._id)}
                    style={{ padding: '13px 16px', borderRadius: 12, cursor: 'pointer', background: assignModal.assignedTo === t._id ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${assignModal.assignedTo === t._id ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = assignModal.assignedTo === t._id ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = assignModal.assignedTo === t._id ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'; }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F0EDE4' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.area} · {t.specialization || 'General'}</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: t.isOnDuty ? 'rgba(46,204,113,0.12)' : 'rgba(100,116,139,0.12)', color: t.isOnDuty ? '#2ECC71' : '#64748B' }}>
                      {t.isOnDuty ? '● On Duty' : '○ Off Duty'}
                    </span>
                  </button>
                ))}
                {technicians.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No technicians in system</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
