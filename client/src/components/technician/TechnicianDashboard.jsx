import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { complaintsAPI, authAPI } from '../../services/api';
import { toast } from '../common/Toast';
import { ClipboardList, CheckCircle, Clock, AlertCircle, ToggleLeft, ToggleRight, Phone, MapPin, User, ExternalLink, Home, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TC = { electricity:'#F39C12', water:'#3498DB', roads:'#9B59B6', drainage:'#1AB5A0', garbage:'#2ECC71', facilities:'#E74C3C' };
const TE = { electricity:'⚡', water:'💧', roads:'🛣️', drainage:'🌊', garbage:'🗑️', facilities:'🏛️' };

const PRIORITY_COLOR = { low:'#64748B', medium:'#F39C12', high:'#E67E22', urgent:'#E74C3C' };

export default function TechnicianDashboard() {
  const { currentUser, refreshUser, setCurrentUser } = useApp();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [acceptError, setAcceptError] = useState('');
  const [toggling, setToggling] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'available'

  const load = useCallback(() => {
    complaintsAPI.getAll().then(r => { setComplaints(r.data.complaints || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const myId = currentUser?._id;
  const myName = currentUser?.name;

  // Robust comparison: handles ObjectId strings, populated objects, and demo string IDs
  const isAssignedToMe = (c) => {
    if (!c.assignedTo && !c.assignedToName) return false;
    // Match by name (works for demo users and real users)
    if (c.assignedToName && myName && c.assignedToName === myName) return true;
    // Match by _id string
    const aId = c.assignedTo?._id ?? c.assignedTo;
    if (!aId || !myId) return false;
    return String(aId) === String(myId);
  };

  const myTasks = complaints.filter(isAssignedToMe);
  const active = myTasks.filter(c => ['assigned', 'in-progress'].includes(c.status));
  const done = myTasks.filter(c => c.status === 'completed').length;

  // All pending complaints not assigned to me — available to accept
  const available = complaints.filter(c => c.status === 'pending' && !isAssignedToMe(c));

  // Can accept max 2 active tasks at a time
  const canAcceptMore = active.length < 2;

  const handleDuty = async () => {
    setToggling(true);
    try {
      const res = await authAPI.toggleDuty();
      const updatedUser = res.data.user;
      // Update localStorage + context so demo users see the change
      localStorage.setItem('ghmc_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      toast[updatedUser.isOnDuty ? 'success' : 'info'](
        updatedUser.isOnDuty ? '✅ You are now ON DUTY — tasks will be assigned to you' : '⏸️ You are now OFF DUTY'
      );
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to toggle duty status');
    }
    setToggling(false);
  };

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try { await complaintsAPI.updateStatus(id, { status }); load(); } catch (e) {}
    setUpdating(null);
  };

  const handleAccept = async (id) => {
    if (!canAcceptMore) {
      setAcceptError('You already have 2 active tasks. Complete one before accepting more.');
      setTimeout(() => setAcceptError(''), 4000);
      return;
    }
    setAcceptError('');
    setAccepting(id);
    try {
      await complaintsAPI.updateStatus(id, { status: 'assigned', assignSelf: true });
      load();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to accept complaint. Please try again.';
      setAcceptError(msg);
      setTimeout(() => setAcceptError(''), 5000);
    }
    setAccepting(null);
  };

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const TABS = [
    { id: 'mine',      label: 'My Tasks',          count: myTasks.length },
    { id: 'available', label: 'Available Complaints', count: available.length },
  ];

  return (
    <>
      <Header title="Technician Dashboard" subtitle={`${currentUser?.area} · ${currentUser?.specialization || 'General'}`} />
      <div className="page-body animate-fadeIn">

        {/* Duty Toggle */}
        <div className="card card-gold" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Duty Status</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {currentUser?.isOnDuty ? '✅ On duty — receiving task assignments' : '⏸️ Off duty — not receiving assignments'}
            </div>
          </div>
          <button onClick={handleDuty} disabled={toggling}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: currentUser?.isOnDuty ? 'rgba(46,204,113,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${currentUser?.isOnDuty ? 'rgba(46,204,113,0.3)' : 'rgba(100,116,139,0.3)'}`, color: currentUser?.isOnDuty ? '#2ECC71' : '#64748B', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.2s', flexShrink: 0 }}>
            {toggling ? <span className="spinner" style={{ borderTopColor: currentUser?.isOnDuty ? '#2ECC71' : '#64748B' }} />
              : currentUser?.isOnDuty ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            {currentUser?.isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Active Tasks',  value: active.length,                    color: '#F39C12', icon: Clock },
            { label: 'Completed',     value: done,                             color: '#2ECC71', icon: CheckCircle },
            { label: 'Total Accepted',value: currentUser?.jobsAccepted || 0,  color: '#1AB5A0', icon: ClipboardList },
            { label: 'Accept Slots',  value: `${active.length}/2`,             color: canAcceptMore ? '#C9A84C' : '#E74C3C', icon: AlertCircle },
          ].map((s, i) => {
            const Ic = s.icon;
            return (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px 12px', borderTop: `2px solid ${s.color}`, animation: `bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.05 + i * 0.09}s both` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', transition: 'transform 0.25s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-12deg) scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <Ic size={18} color={s.color} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Accept limit notice */}
        {!canAcceptMore && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', marginBottom: 18, fontSize: '0.82rem', color: '#E74C3C', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} /> You have reached the maximum of 2 active tasks. Complete one to accept more.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '8px 18px', borderRadius: 9, fontSize: '0.83rem', fontWeight: activeTab === t.id ? 700 : 400, background: activeTab === t.id ? 'rgba(26,181,160,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === t.id ? 'rgba(26,181,160,0.35)' : 'rgba(255,255,255,0.07)'}`, color: activeTab === t.id ? '#1AB5A0' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}>
              {t.label}
              <span style={{ background: activeTab === t.id ? '#1AB5A0' : 'rgba(255,255,255,0.1)', color: activeTab === t.id ? '#040812' : 'var(--text-muted)', borderRadius: 10, fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px' }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* MY TASKS TAB */}
        {activeTab === 'mine' && (
          <div className="card tab-content">
            <div className="section-accent" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>My Assigned Tasks</h3>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
            ) : myTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                <ClipboardList size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ fontSize: '0.875rem' }}>No tasks assigned yet. Browse available complaints below.</p>
              </div>
            ) : (
              myTasks.map(c => (
                <ComplaintCard key={c._id} c={c} expanded={expanded[c._id]} onToggle={() => toggle(c._id)}
                  onStatus={handleStatus} updating={updating} showUserDetails />
              ))
            )}
          </div>
        )}

        {/* AVAILABLE COMPLAINTS TAB */}
        {activeTab === 'available' && (
          <div className="card tab-content">
            <div className="section-accent" style={{ marginBottom: 8 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Available Complaints</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: acceptError ? 10 : 16 }}>
              You can accept up to <strong style={{ color: '#1AB5A0' }}>2 complaints</strong> at a time. Currently: {active.length}/2 active.
            </p>
            {acceptError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#E74C3C', fontSize: '0.82rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} /> {acceptError}
              </div>
            )}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
            ) : available.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} color="#2ECC71" style={{ opacity: 0.4, marginBottom: 10 }} />
                <p style={{ fontSize: '0.875rem' }}>No pending complaints available right now</p>
              </div>
            ) : (
              available.map(c => (
                <ComplaintCard key={c._id} c={c} expanded={expanded[c._id]} onToggle={() => toggle(c._id)}
                  canAccept={canAcceptMore} onAccept={() => handleAccept(c._id)} accepting={accepting === c._id}
                  showUserDetails />
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ComplaintCard({ c, expanded, onToggle, onStatus, updating, showUserDetails, canAccept, onAccept, accepting }) {
  const color = TC[c.type] || '#94A3B8';
  const emoji = TE[c.type] || '📋';
  const pColor = PRIORITY_COLOR[c.priority] || '#94A3B8';
  const statusColor = { pending:'#F39C12', assigned:'#3498DB', 'in-progress':'#9B59B6', completed:'#2ECC71', rejected:'#E74C3C' }[c.status] || '#94A3B8';
  const isUpdating = updating === c._id;
  const isActive = ['assigned','in-progress'].includes(c.status);

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${color}22`, background: 'rgba(255,255,255,0.015)', marginBottom: 12, overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexWrap: 'wrap' }} onClick={onToggle}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem', color: '#C9A84C' }}>{c.complaintId}</span>
            <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}30`, textTransform: 'capitalize' }}>{c.status === 'in-progress' ? 'In Progress' : c.status}</span>
            <span style={{ padding: '1px 6px', borderRadius: 6, fontSize: '0.63rem', background: pColor + '15', color: pColor, fontWeight: 600, textTransform: 'capitalize' }}>{c.priority}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description?.slice(0, 80)}...</div>
        </div>
        <div style={{ display: 'flex', align: 'center', gap: 6, flexShrink: 0 }}>
          {onAccept && (
            <button onClick={e => { e.stopPropagation(); onAccept(); }} disabled={!canAccept || accepting}
              style={{ padding: '6px 12px', borderRadius: 8, background: canAccept ? 'rgba(26,181,160,0.12)' : 'rgba(100,116,139,0.08)', border: `1px solid ${canAccept ? 'rgba(26,181,160,0.3)' : 'rgba(100,116,139,0.15)'}`, color: canAccept ? '#1AB5A0' : '#64748B', fontSize: '0.75rem', fontWeight: 700, cursor: canAccept ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4 }}>
              {accepting ? <span className="spinner" style={{ borderTopColor: '#1AB5A0', width: 11, height: 11 }} /> : '✅'} {canAccept ? 'Accept' : 'Full (2/2)'}
            </button>
          )}
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Full description */}
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.description}</p>

            {/* User / Citizen Details */}
            {showUserDetails && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)' }}>
                <div style={{ fontSize: '0.65rem', color: '#C9A84C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>👤 Citizen Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <User size={13} color="#C9A84C" /> <span><strong style={{ color: '#F0EDE4' }}>{c.userName || 'N/A'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Phone size={13} color="#1AB5A0" /> <a href={`tel:${c.userPhone}`} style={{ color: '#1AB5A0', fontWeight: 600 }}>{c.userPhone || 'N/A'}</a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={13} color="#9B59B6" /> <span>{c.userArea || 'N/A'}</span>
                  </div>
                  {c.userAddress && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.8rem', color: 'var(--text-secondary)', gridColumn: '1/-1' }}>
                      <Home size={13} color="#F39C12" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{c.userAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timing */}
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span><Clock size={11} style={{ marginRight: 3 }} />{c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}</span>
              <span>📍 {c.userArea}</span>
            </div>

            {/* GPS Location */}
            {c.location && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(26,181,160,0.07)', border: '1px solid rgba(26,181,160,0.2)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>📍 Exact GPS Location</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {c.location.lat?.toFixed(6)}, {c.location.lng?.toFixed(6)}
                  {c.location.accuracy ? ` · ±${Math.round(c.location.accuracy)}m` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`https://www.google.com/maps?q=${c.location.lat},${c.location.lng}&z=18`} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: '#1AB5A0', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(26,181,160,0.1)', border: '1px solid rgba(26,181,160,0.25)', textDecoration: 'none' }}>
                    <Navigation size={11} /> Open in Google Maps <ExternalLink size={10} />
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.location.lat},${c.location.lng}`} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: '#C9A84C', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', textDecoration: 'none' }}>
                    🧭 Get Directions
                  </a>
                </div>
              </div>
            )}

            {/* Photos */}
            {c.photos?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Photos</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.photos.map((ph, i) => (
                    <a key={i} href={`/uploads/${ph}`} target="_blank" rel="noreferrer">
                      <div style={{ width: 70, height: 70, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={`/uploads/${ph}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Status Actions */}
            {onStatus && isActive && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.status === 'assigned' && (
                  <button onClick={() => onStatus(c._id, 'in-progress')} disabled={isUpdating}
                    style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(155,89,182,0.12)', border: '1px solid rgba(155,89,182,0.3)', color: '#9B59B6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isUpdating ? <span className="spinner" style={{ borderTopColor: '#9B59B6', width: 12, height: 12 }} /> : '▶'} Start Work
                  </button>
                )}
                {c.status === 'in-progress' && (
                  <button onClick={() => onStatus(c._id, 'completed')} disabled={isUpdating}
                    style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ECC71', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isUpdating ? <span className="spinner" style={{ borderTopColor: '#2ECC71', width: 12, height: 12 }} /> : '✔'} Mark Completed
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
