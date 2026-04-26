import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/common/Header';
import { StatusBadge, PhotoViewer, MapView } from '../components/common/Widgets';
import { COMPLAINT_TYPES } from '../data/constants';
import { Search, MapPin, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function MyComplaints() {
  const { user, complaints, fetchComplaints } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchComplaints(); }, []);

  const mine = complaints.filter(c => c.userId === user?._id || c.userId?._id === user?._id);
  const filtered = mine.filter(c => {
    const ms = filter === 'all' || c.status === filter;
    const mq = !search || c.description?.toLowerCase().includes(search.toLowerCase()) || c.complaintId?.toLowerCase().includes(search.toLowerCase());
    return ms && mq;
  }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      <Header title="My Complaints" subtitle="Track all your submitted complaints" />
      <div className="page-body animate-fadeIn">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." style={{ paddingLeft: 35 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all','pending','assigned','in-progress','completed'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.79rem', background: filter===s?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.04)', border: filter===s?'1px solid rgba(201,168,76,0.3)':'1px solid rgba(255,255,255,0.07)', color: filter===s?'#C9A84C':'var(--text-secondary)', fontWeight: filter===s?700:400, transition: 'all 0.15s', textTransform: 'capitalize' }}>
                {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><Search size={40} /><h3 style={{ fontFamily:'var(--font-display)', fontWeight:600 }}>No complaints found</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(c => {
              const ct = COMPLAINT_TYPES.find(t => t.id === c.type) || {};
              const isOpen = expanded === c._id;
              return (
                <div key={c._id} className="card" style={{ padding: '18px', borderLeft: `4px solid ${ct.color || '#C9A84C'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : c._id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.complaintId}</span>
                        <span style={{ padding: '2px 9px', borderRadius: 6, fontSize: '0.72rem', background: `${ct.color}15`, color: ct.color, fontWeight: 700 }}>{ct.emoji} {ct.label}</span>
                        <StatusBadge status={c.status} />
                        {c.photos?.length > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Image size={11} />{c.photos.length} photo{c.photos.length>1?'s':''}</span>}
                        {c.location && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />Location</span>}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.description?.slice(0,120)}{c.description?.length>120?'…':''}</p>
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 7 }}>
                        <span>📅 {format(new Date(c.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                        {c.assignedToName && <span>👷 {c.assignedToName}</span>}
                        {c.completedAt && <span>✅ {format(new Date(c.completedAt), 'dd MMM yyyy')}</span>}
                      </div>
                    </div>
                    <button style={{ color: 'var(--text-muted)', marginLeft: 12, padding: 4, cursor: 'pointer' }}>
                      {isOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease' }}>
                      {/* Photos */}
                      <PhotoViewer photos={c.photos} />
                      {/* Map */}
                      {c.location?.lat && <MapView lat={c.location.lat} lng={c.location.lng} address={c.location.address} label="Complaint Location" />}
                      {/* Timeline */}
                      {c.statusHistory?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 700 }}>Status History</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {c.statusHistory.map((h, i) => (
                              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.82rem' }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontSize: '0.6rem', flexShrink: 0, marginTop: 1 }}>✓</div>
                                <div>
                                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{h.status.replace('-',' ')}</span>
                                  {h.updatedByName && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>by {h.updatedByName}</span>}
                                  {h.note && <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontStyle: 'italic' }}>— {h.note}</span>}
                                  {h.timestamp && <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 1 }}>{formatDistanceToNow(new Date(h.timestamp), {addSuffix:true})}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
