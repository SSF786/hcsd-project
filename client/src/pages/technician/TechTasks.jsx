import React from 'react'; import Header from '../../components/common/Header';
export default function Page() { return (<><Header title="My Tasks" /><div className="page-body"><div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>📋 Task list with location map and photo viewer — powered by MongoDB.</div></div></>); }
