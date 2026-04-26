import React from 'react'; import Header from '../../components/common/Header';
export default function Page() { return (<><Header title="Emergency Dashboard" /><div className="page-body"><div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>🚨 Live emergency dashboard — real-time alerts via Socket.IO.</div></div></>); }
