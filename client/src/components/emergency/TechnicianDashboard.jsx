import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { useApp } from '../../context/AppContext';
import { complaintsAPI, emergencyAPI, usersAPI, jobsAPI, supportAPI, analyticsAPI } from '../../services/api';
import { BarChart3, Users, FileText, AlertTriangle, CheckCircle, Clock, MessageSquare, Briefcase, ClipboardList, Shield, Heart, Flame, ToggleLeft, ToggleRight, Send, Plus, ChevronDown, ChevronUp, Search, Trash2, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TechnicianDashboard() {
  const { currentUser, refreshUser } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        let result = {};
        if ('TechnicianDashboard' === 'AdminDashboard' || 'TechnicianDashboard' === 'ModeratorDashboard') {
          const [ar, cr, er] = await Promise.all([analyticsAPI.get(), complaintsAPI.getAll({limit:5}), emergencyAPI.getAll()]);
          result = { analytics: ar.data, recentComplaints: cr.data.complaints||[], emergencies: er.data.emergencies||[] };
        } else if ('TechnicianDashboard' === 'AdminUsers' || 'TechnicianDashboard' === 'ModeratorUsers') {
          const r = await usersAPI.getAll({});
          result = { users: r.data.users||[] };
        } else if ('TechnicianDashboard' === 'AdminJobs') {
          const r = await jobsAPI.getAll();
          result = { applications: r.data.applications||[] };
        } else if ('TechnicianDashboard' === 'AdminSupport') {
          const r = await supportAPI.getAll();
          result = { tickets: r.data.tickets||[] };
        } else if ('TechnicianDashboard' === 'AdminEmergencies') {
          const r = await emergencyAPI.getAll();
          result = { emergencies: r.data.emergencies||[] };
        } else if ('TechnicianDashboard' === 'AdminAnalytics') {
          const r = await analyticsAPI.get();
          result = r.data;
        } else if ('TechnicianDashboard' === 'TechnicianDashboard' || 'TechnicianDashboard' === 'TechnicianTasks') {
          const r = await complaintsAPI.getAll({});
          result = { complaints: r.data.complaints||[] };
        } else if ('TechnicianDashboard' === 'EmergencyDashboard' || 'TechnicianDashboard' === 'EmergencyAlerts') {
          const r = await emergencyAPI.getAll();
          result = { emergencies: r.data.emergencies||[] };
        } else if ('TechnicianDashboard' === 'JobApplication') {
          const r = await jobsAPI.getAll();
          result = { applications: r.data.applications||[] };
        } else if ('TechnicianDashboard' === 'SupportPage') {
          const r = await supportAPI.getAll();
          result = { tickets: r.data.tickets||[] };
        }
        setData(result);
      } catch(e) { setError(e.message); }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return (
    <>
      <Header title="TechnicianDashboard" />
      <div className="page-body" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
        <span className="spinner" style={{ width:32, height:32, borderWidth:3 }}/>
      </div>
    </>
  );

  return (
    <>
      <Header title="TechnicianDashboard" />
      <div className="page-body animate-fadeIn">
        <div className="card card-gold">
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.2rem', marginBottom:10 }}>TechnicianDashboard</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:6 }}>Logged in as: <strong style={{ color:'#C9A84C' }}>{currentUser?.name}</strong> ({currentUser?.role})</p>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Data loaded from MongoDB. {error && <span style={{ color:'#E74C3C' }}>Error: {error}</span>}</p>
          {data && <pre style={{ marginTop:12, fontSize:'0.72rem', color:'var(--text-muted)', overflow:'hidden', maxHeight:120 }}>{JSON.stringify(Object.keys(data), null, 2)}</pre>}
        </div>
      </div>
    </>
  );
}
