import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { toast } from '../common/Toast';
import { supportAPI } from '../../services/api';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [expanded, setExpanded] = useState(null);
  const [replies, setReplies] = useState({});
  const [sending, setSending] = useState(null);

  const load = () => {
    supportAPI.getAll().then(r => { setTickets(r.data.tickets || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleReply = async (ticketId) => {
    if (!replies[ticketId]?.trim()) return;
    setSending(ticketId);
    try { await supportAPI.reply(ticketId, replies[ticketId]); setReplies(r => ({ ...r, [ticketId]: '' })); load(); } catch (e) { toast.error('Reply failed. Please try again.'); }
    setSending(null);
  };

  const filtered = tickets.filter(t => filter === 'all' || t.status === filter);
  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <>
      <Header title="Support Tickets" subtitle={`${openCount} open tickets`} />
      <div className="page-body animate-fadeIn">
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {['open','replied','all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', background: filter===s ? 'linear-gradient(135deg,#C9A84C,#8B6914)' : 'rgba(255,255,255,0.04)', border: filter===s ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)', color: filter===s ? '#040812' : 'var(--text-secondary)', fontWeight: filter===s ? 700 : 400, textTransform: 'capitalize' }}>
              {s === 'open' ? `Open${openCount > 0 ? ` (${openCount})` : ''}` : s}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><MessageSquare size={44} /><h3>No Tickets</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((t, i) => (
              <div key={t._id} className="card" style={{ padding: '18px', animation: `slideInUp 0.36s cubic-bezier(0.34,1.1,0.64,1) ${0.04 + i * 0.06}s both` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(expanded === t._id ? null : t._id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#C9A84C' }}>
                        {t.userName?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#F0EDE4' }}>{t.userName}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{t.userRole}</span>
                      <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: t.status === 'replied' ? 'rgba(46,204,113,0.12)' : 'rgba(52,152,219,0.12)', color: t.status === 'replied' ? '#2ECC71' : '#3498DB' }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#F0EDE4', marginBottom: 3 }}>{t.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.ticketId} · {t.createdAt ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true }) : '—'} · {t.replies?.length || 0} replies
                    </div>
                  </div>
                  <button onClick={() => setExpanded(expanded === t._id ? null : t._id)} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 8, marginLeft: 8 }}>
                    {expanded === t._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {expanded === t._id && (
                  <div style={{ marginTop: 16, animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                      {t.message}
                    </div>
                    {t.replies?.map((r, i) => (
                      <div key={i} style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 8, background: r.byRole === 'user' ? 'rgba(52,152,219,0.06)' : 'rgba(201,168,76,0.06)', border: `1px solid ${r.byRole === 'user' ? 'rgba(52,152,219,0.15)' : 'rgba(201,168,76,0.15)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: r.byRole === 'user' ? '#3498DB' : '#C9A84C', textTransform: 'capitalize' }}>
                            {r.byRole === 'admin' ? '🛡️ Admin' : r.byRole === 'moderator' ? '👁️ Moderator' : `👤 ${r.byName}`}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ''}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{r.text}</p>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <textarea value={replies[t._id] || ''} onChange={e => setReplies(r => ({ ...r, [t._id]: e.target.value }))} placeholder="Type your reply..." rows={2} style={{ flex: 1, resize: 'none' }} />
                      <button className="btn btn-gold" onClick={() => handleReply(t._id)} disabled={sending === t._id} style={{ alignSelf: 'flex-end' }}>
                        <Send size={15} /> {sending === t._id ? '...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
