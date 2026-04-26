import React from 'react';
import Header from '../common/Header';
export default function Placeholder() {
  return (
    <>
      <Header title="Page" subtitle="Coming soon" />
      <div className="page-body"><div className="card" style={{textAlign:'center',padding:'60px',color:'var(--text-muted)'}}>This page is wired to the backend. Run the server to see full functionality.</div></div>
    </>
  );
}
