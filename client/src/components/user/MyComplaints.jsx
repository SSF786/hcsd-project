import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { complaintsAPI, getUploadUrl } from '../../services/api';
import { FileText, MapPin, Image, ChevronDown, ChevronUp, ExternalLink, Search, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_CFG = {
  pending:     { label: 'Pending',     color: '#F39C12', bg: 'rgba(243,156,18,0.12)' },
  assigned:    { label: 'Assigned',    color: '#3498DB', bg: 'rgba(52,152,219,0.12)' },
  'in-progress': { label: 'In Progress', color: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
  completed:   { label: 'Completed',   color: '#2ECC71', bg: 'rgba(46,204,113,0.12)' },
  rejected:    { label: 'Rejected',    color: '#E74C3C', bg: 'rgba(231,76,60,0.12)' },
};
const TYPE_EMOJIS = { electricity:'⚡', water:'💧', roads:'🛣️', drainage:'🌊', garbage:'🗑️', facilities:'🏛️' };
const TYPE_COLORS = { electricity:'#F39C12', water:'#3498DB', roads:'#9B59B6', drainage:'#1AB5A0', garbage:'#2ECC71', facilities:'#E74C3C' };

function PhotoLightbox({ photos, initial, onClose }) {
  const [idx, setIdx] = useState(initial);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, color: '#F0EDE4', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img src={getUploadUrl(photos[idx])} alt="" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 12, objectFit: 'contain' }} />
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {photos.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === idx ? '#C9A84C' : 'transparent'}`, opacity: i === idx ? 1 : 0.5 }}>
                <img src={getUploadUrl(photos[i])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyComplaints() {
  const { currentUser } = useApp();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    complaintsAPI.getAll().then(r => { setComplaints(r.data.complaints || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = complaints.filter(c => {
    const ms = filter === 'all' || c.status === filter;
    const mq = !search || c.complaintId?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()) || c.type?.toLowerCase().includes(search.toLowerCase());
    return ms && mq;
  });

  if (loading) return (
    <>
      <Header title="My Complaints" />
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ color: 'var(--text-muted)', marginTop: 14 }}>Loading complaints...</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header title="My Complaints" subtitle={`${complaints.length} total complaints`} />
      {lightbox && <PhotoLightbox photos={lightbox.photos} initial={lightbox.idx} onClose={() => setLightbox(null)} />}
      <div className="page-body animate-fadeIn">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." style={{ paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'pending', 'assigned', 'in-progress', 'completed'].map((s, i) => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', background: filter === s ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : 'rgba(255,255,255,0.04)', border: filter === s ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.06)', color: filter === s ? '#040812' : 'var(--text-secondary)', fontWeight: filter === s ? 700 : 400, transition: 'all 0.18s', animation: `slideInUp 0.3s cubic-bezier(0.34,1.1,0.64,1) ${0.03 + i * 0.05}s both`, transform: filter === s ? 'scale(1.04)' : 'scale(1)' }}>
                {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No Complaints Found</h3>
            <p>Try a different filter or raise your first complaint</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((c, i) => {
              const sc = STATUS_CFG[c.status] || STATUS_CFG.pending;
              const tc = TYPE_COLORS[c.type] || '#94A3B8';
              const isExp = expanded === c._id;
              return (
                <div key={c._id} className="card" style={{ padding: '20px', borderLeft: `4px solid ${tc}`, cursor: 'pointer', animation: `slideInUp 0.36s cubic-bezier(0.34,1.1,0.64,1) ${0.03 + i * 0.06}s both`, transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.3), -4px 0 0 ${tc}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>{c.complaintId}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', background: tc + '15', color: tc, fontWeight: 700 }}>
                          {TYPE_EMOJIS[c.type]} {c.type?.charAt(0).toUpperCase() + c.type?.slice(1)}
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: sc.bg, color: sc.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color }} />
                          {sc.label}
                        </span>
                        {c.photos?.length > 0 && (
                          <span style={{ fontSize: '0.68rem', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Image size={11} /> {c.photos.length} photo(s)
                          </span>
                        )}
                        {c.location && <span style={{ fontSize: '0.68rem', color: '#1AB5A0', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> Location</span>}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                        {isExp ? c.description : c.description?.length > 120 ? c.description.slice(0, 120) + '...' : c.description}
                      </p>
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>📅 {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy, hh:mm a') : '—'}</span>
                        {c.assignedToName && <span>👷 {c.assignedToName}</span>}
                        {c.completedAt && <span>✅ {format(new Date(c.completedAt), 'dd MMM')}</span>}
                      </div>
                    </div>
                    <button onClick={() => setExpanded(isExp ? null : c._id)} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}>
                      {isExp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {isExp && (
                    <div className="card-expanded-content" style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* Photos */}
                      {c.photos?.length > 0 && (
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 700 }}>Attached Photos</div>
                          <div className="photo-grid">
                            {c.photos.map((ph, i) => (
                              <div key={i} className="photo-thumb" style={{ height: 110 }} onClick={() => setLightbox({ photos: c.photos, idx: i })}>
                                <img src={getUploadUrl(ph)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {c.location && (
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 700 }}>Reported Location</div>
                          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(26,181,160,0.06)', border: '1px solid rgba(26,181,160,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <MapPin size={18} color="#1AB5A0" />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.82rem', color: '#1AB5A0', fontWeight: 600 }}>{c.location.address || 'GPS Location Captured'}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Lat: {c.location.lat?.toFixed(6)}, Lng: {c.location.lng?.toFixed(6)}</div>
                            </div>
                            <a href={`https://maps.google.com/?q=${c.location.lat},${c.location.lng}`} target="_blank" rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#C9A84C', fontWeight: 600, cursor: 'pointer' }}>
                              <ExternalLink size={13} /> View on Map
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Status Timeline */}
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 700 }}>Status Timeline</div>
                        <div style={{ overflowX: 'auto', paddingBottom: 4 }}><div style={{ display: 'flex', gap: 0, minWidth: 280 }}>
                          {['pending', 'assigned', 'in-progress', 'completed'].map((st, i) => {
                            const sc2 = STATUS_CFG[st];
                            const done3 = ['pending','assigned','in-progress','completed'].indexOf(c.status) >= i;
                            return (
                              <React.Fragment key={st}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: done3 ? '#2ECC71' : 'rgba(255,255,255,0.06)', border: `2px solid ${done3 ? '#2ECC71' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', transition: 'all 0.25s' }}>
                                    {done3 ? '✓' : ''}
                                  </div>
                                  <span style={{ fontSize: '0.62rem', color: done3 ? '#2ECC71' : 'var(--text-muted)', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{st === 'in-progress' ? 'In Progress' : st}</span>
                                </div>
                                {i < 3 && <div style={{ flex: 1, height: 1.5, background: done3 && i < ['pending','assigned','in-progress','completed'].indexOf(c.status) ? '#2ECC71' : 'rgba(255,255,255,0.06)', margin: '10px 6px 0', transition: 'background 0.3s' }} />}
                              </React.Fragment>
                            );
                          })}
                        </div></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
