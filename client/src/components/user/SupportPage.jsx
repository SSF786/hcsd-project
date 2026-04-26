import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Header from '../common/Header';
import { supportAPI } from '../../services/api';
import { MessageSquare, Send, Plus, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SupportPage() {
  const { currentUser } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const canUse = !['admin','moderator'].includes(currentUser?.role);
  const load = () => { supportAPI.getAll().then(r => { setTickets(r.data.tickets||[]); setLoading(false); }).catch(()=>setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!subject.trim() || !message.trim()) return setError('Please fill in all fields');
    setSubmitting(true);
    try { await supportAPI.create({ subject, message }); setSubject(''); setMessage(''); setShowForm(false); load(); }
    catch(e) { setError(e.response?.data?.message || 'Failed to submit'); }
    setSubmitting(false);
  };

  if (!canUse) return (
    <><Header title="Support"/><div className="page-body"><div className="alert alert-info">Support tickets are not available for Admin and Moderator roles.</div></div></>
  );

  return (
    <>
      <Header title="User Support" subtitle="Get help from our support team" />
      <div className="page-body animate-fadeIn">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div className="section-accent"><h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.1rem' }}>Support Tickets</h2></div>
          <button className="btn btn-gold btn-sm" onClick={() => setShowForm(!showForm)}><Plus size={15}/> New Ticket</button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom:20, animation:'fadeIn 0.3s ease' }}>
            <div className="section-accent" style={{ marginBottom:16 }}><h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem' }}>Submit New Ticket</h3></div>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group"><label className="form-label">Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief description of your issue" required/></div>
              <div className="form-group"><label className="form-label">Message</label><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Explain your issue in detail..." rows={4} required/></div>
              {error && <div className="alert alert-error"><AlertCircle size={14}/> {error}</div>}
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={submitting}><Send size={14}/> {submitting ? 'Submitting...' : 'Submit Ticket'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div style={{ display:'flex', justifyContent:'center', padding:60 }}><span className="spinner" style={{ width:32, height:32 }}/></div>
        : tickets.length === 0 ? (
          <div className="empty-state"><MessageSquare size={44}/><h3>No Support Tickets</h3><p>Submit a ticket if you need help</p><button className="btn btn-gold btn-sm" onClick={()=>setShowForm(true)}>Create First Ticket</button></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {tickets.map((t, i) => (
              <div key={t._id} className="card" style={{ padding:'18px', animation:`slideInUp 0.36s cubic-bezier(0.34,1.1,0.64,1) ${0.04 + i * 0.07}s both` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ flex:1, cursor:'pointer' }} onClick={() => setExpanded(expanded===t._id?null:t._id)}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:'0.7rem', color:'var(--text-muted)' }}>{t.ticketId}</span>
                      <span style={{ padding:'2px 8px', borderRadius:20, fontSize:'0.68rem', fontWeight:600, background:t.status==='replied'?'rgba(46,204,113,0.12)':'rgba(52,152,219,0.12)', color:t.status==='replied'?'#2ECC71':'#3498DB' }}>{t.status}</span>
                    </div>
                    <div style={{ fontWeight:600, color:'#F0EDE4', marginBottom:3 }}>{t.subject}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.createdAt?formatDistanceToNow(new Date(t.createdAt),{addSuffix:true}):'—'} · {t.replies?.length||0} replies</div>
                  </div>
                  <button onClick={()=>setExpanded(expanded===t._id?null:t._id)} style={{ color:'var(--text-muted)', cursor:'pointer', padding:8 }}>
                    {expanded===t._id?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
                  </button>
                </div>
                {expanded===t._id && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)', animation:'fadeIn 0.2s ease' }}>
                    <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.6, marginBottom:12 }}>{t.message}</div>
                    {t.replies?.map((r,i) => (
                      <div key={i} style={{ padding:'12px 14px', borderRadius:10, marginBottom:8, background:r.byRole==='user'?'rgba(52,152,219,0.06)':'rgba(201,168,76,0.06)', border:`1px solid ${r.byRole==='user'?'rgba(52,152,219,0.15)':'rgba(201,168,76,0.15)'}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, color:r.byRole==='user'?'#3498DB':'#C9A84C' }}>
                            {r.byRole==='admin'?'🛡️ Admin':r.byRole==='moderator'?'👁️ Moderator':`👤 ${r.byName}`}
                          </span>
                          <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{r.createdAt?formatDistanceToNow(new Date(r.createdAt),{addSuffix:true}):''}</span>
                        </div>
                        <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.55 }}>{r.text}</p>
                      </div>
                    ))}
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
