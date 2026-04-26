import { slideUp, staggerDelay, bounceIn } from '../../hooks/useAnimation';
import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { usersAPI } from '../../services/api';
import { Search, Edit2, X, Eye, EyeOff, Save, Shield } from 'lucide-react';
import { toast } from '../common/Toast';

const RC = { admin:'#C9A84C', moderator:'#9B59B6', technician:'#1AB5A0', police:'#3498DB', ambulance:'#E74C3C', fire:'#E67E22', user:'#2ECC71' };
const ROLES = ['user','moderator','technician','police','ambulance','fire'];

export default function AdminUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [viewModal, setViewModal] = useState(null);   // user object → view profile
  const [editModal, setEditModal] = useState(null);   // user object → edit credentials
  const [changing, setChanging]   = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [showPw, setShowPw]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  const load = () => {
    usersAPI.getAll({}).then(r => { setUsers(r.data.users || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openEdit = (u) => {
    setEditForm({ name: u.name, email: u.email, phone: u.phone, address: u.address || '', area: u.area, pincode: u.pincode, password: '' });
    setEditModal(u);
    setShowPw(false);
    setSaveMsg('');
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    setChanging(userId);
    try { await usersAPI.changeRole(userId, newRole); load(); } catch (e) { toast.error(e.response?.data?.message || 'Failed to change role'); }
    setChanging(null);
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      await usersAPI.updateCredentials(editModal._id, payload);
      setSaveMsg('✅ Credentials updated successfully');
      load();
      setTimeout(() => { setEditModal(null); setSaveMsg(''); }, 1500);
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Update failed'));
    }
    setSaving(false);
  };

  const filtered = users.filter(u => {
    const mr = filterRole === 'all' || u.role === filterRole;
    const mq = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.userId?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return mr && mq;
  });

  const inp = { style: { width: '100%', fontSize: '0.85rem' } };

  return (
    <>
      <Header title="User Management" subtitle={`${users.length} total accounts`} />
      <div className="page-body animate-fadeIn">
        <div style={{ display:'flex', gap:12, marginBottom:22, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <Search size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ paddingLeft:36 }} />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width:160 }}>
            <option value="all">All Roles</option>
            {['user','moderator','technician','police','ambulance','fire','admin'].map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><span className="spinner" style={{ width:32, height:32 }} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Username</th><th>Email</th><th>Phone</th><th>Area</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const color = RC[u.role] || '#94A3B8';
                  return (
                    <tr key={u._id} style={{ animation: `slideInUp 0.3s ease ${0.02 + i * 0.04}s both` }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:color+'20', border:`1.5px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color, fontSize:'0.85rem', flexShrink:0 }}>
                            {u.name?.[0]?.toUpperCase()||'U'}
                          </div>
                          <span style={{ fontWeight:500, color:'#F0EDE4' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>@{u.userId}</td>
                      <td style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{u.email}</td>
                      <td style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{u.phone}</td>
                      <td style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{u.area}</td>
                      <td>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.68rem', fontWeight:700, background:color+'18', color, textTransform:'capitalize', letterSpacing:'0.04em' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {['technician','police','ambulance','fire'].includes(u.role) ? (
                          <span style={{ padding:'2px 8px', borderRadius:20, fontSize:'0.68rem', fontWeight:600, background:u.isOnDuty?'rgba(46,204,113,0.12)':'rgba(100,116,139,0.12)', color:u.isOnDuty?'#2ECC71':'#64748B' }}>
                            {u.isOnDuty ? '● On Duty' : '○ Off Duty'}
                          </span>
                        ) : <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(u)} style={{ fontSize:'0.72rem' }}>View</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} style={{ fontSize:'0.72rem', color:'#C9A84C', borderColor:'rgba(201,168,76,0.25)' }}>
                            <Edit2 size={11} /> Edit
                          </button>
                          {u.role !== 'admin' && (
                            <select value={u.role} disabled={changing===u._id} onChange={e => handleRoleChange(u._id, e.target.value)}
                              style={{ fontSize:'0.72rem', padding:'4px 6px', width:110 }}>
                              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── View Profile Modal ── */}
        {viewModal && (
          <div className="modal-overlay" onClick={() => setViewModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)' }} />
              <div className="modal-header">
                <h3 className="modal-title">User Profile</h3>
                <button onClick={() => setViewModal(null)} style={{ color:'var(--text-muted)', cursor:'pointer', width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, padding:'14px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:(RC[viewModal.role]||'#94A3B8')+'22', border:`2px solid ${(RC[viewModal.role]||'#94A3B8')}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:800, color:RC[viewModal.role] }}>
                  {viewModal.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem', color:'#F0EDE4' }}>{viewModal.name}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:4 }}>@{viewModal.userId}</div>
                  <span style={{ padding:'2px 10px', borderRadius:20, fontSize:'0.68rem', fontWeight:700, background:(RC[viewModal.role]||'#94A3B8')+'18', color:RC[viewModal.role] }}>{viewModal.role}</span>
                </div>
              </div>
              {[['Email', viewModal.email], ['Phone', viewModal.phone], ['Address', viewModal.address], ['Area', viewModal.area], ['Pincode', viewModal.pincode], ['Joined', viewModal.createdAt ? new Date(viewModal.createdAt).toLocaleDateString() : '—'], ['Last Credential Change', viewModal.lastCredentialChange ? new Date(viewModal.lastCredentialChange).toLocaleDateString() : 'Never']].map(([k, v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.875rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight:500, textAlign:'right', maxWidth:260, color:'var(--text-secondary)' }}>{v||'—'}</span>
                </div>
              ))}
              {['technician','police','ambulance','fire'].includes(viewModal.role) && (
                <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:10 }}>
                  {[['Accepted', viewModal.jobsAccepted||0], ['Completed', viewModal.jobsCompleted||0], ['Hours', viewModal.hoursWorked||0]].map(([k,v]) => (
                    <div key={k} style={{ textAlign:'center', padding:'12px', borderRadius:10, background:'rgba(255,255,255,0.03)' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, color:'#C9A84C' }}>{v}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{k}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop:18 }}>
                <button className="btn btn-gold btn-sm" onClick={() => { setViewModal(null); openEdit(viewModal); }} style={{ width:'100%', justifyContent:'center' }}>
                  <Edit2 size={13} /> Edit Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Credentials Modal ── */}
        {editModal && (
          <div className="modal-overlay" onClick={() => setEditModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:520 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)' }} />
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Edit Credentials</h3>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>Admin override — changes take effect immediately</p>
                </div>
                <button onClick={() => setEditModal(null)} style={{ color:'var(--text-muted)', cursor:'pointer', width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
              </div>

              {/* User badge */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 12px', borderRadius:10, background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.12)' }}>
                <Shield size={14} color="#C9A84C" />
                <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>Editing: <strong style={{ color:'#C9A84C' }}>{editModal.name}</strong> (@{editModal.userId})</span>
              </div>

              <form onSubmit={handleSaveCredentials} style={{ display:'flex', flexDirection:'column', gap:13 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input value={editForm.name||''} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} placeholder="Full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" value={editForm.email||''} onChange={e => setEditForm(f=>({...f,email:e.target.value}))} placeholder="Email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="tel" value={editForm.phone||''} onChange={e => setEditForm(f=>({...f,phone:e.target.value}))} placeholder="10-digit phone" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Area</label>
                    <input value={editForm.area||''} onChange={e => setEditForm(f=>({...f,area:e.target.value}))} placeholder="Area" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input value={editForm.address||''} onChange={e => setEditForm(f=>({...f,address:e.target.value}))} placeholder="Full address" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(leave blank to keep current)</span></label>
                  <div style={{ position:'relative' }}>
                    <input type={showPw?'text':'password'} value={editForm.password||''} onChange={e => setEditForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" style={{ paddingRight:40 }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', cursor:'pointer' }}>
                      {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </div>
                {saveMsg && (
                  <div style={{ padding:'8px 12px', borderRadius:8, background:saveMsg.startsWith('✅')?'rgba(46,204,113,0.1)':'rgba(231,76,60,0.1)', border:`1px solid ${saveMsg.startsWith('✅')?'rgba(46,204,113,0.25)':'rgba(231,76,60,0.25)'}`, fontSize:'0.82rem', color:saveMsg.startsWith('✅')?'#2ECC71':'#E74C3C' }}>
                    {saveMsg}
                  </div>
                )}
                <div style={{ display:'flex', gap:10, marginTop:4 }}>
                  <button type="submit" className="btn btn-gold" disabled={saving} style={{ flex:1, justifyContent:'center' }}>
                    {saving ? <span className="spinner" style={{ borderTopColor:'#040812' }}/> : <><Save size={13}/> Save Changes</>}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
