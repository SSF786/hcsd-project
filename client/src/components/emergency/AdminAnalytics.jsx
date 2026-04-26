import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { useApp } from '../../context/AppContext';
import { complaintsAPI, emergencyAPI, usersAPI, jobsAPI, supportAPI, analyticsAPI } from '../../services/api';
import { BarChart3, Users, FileText, AlertTriangle, CheckCircle, Clock, MessageSquare, Briefcase, ClipboardList, Shield, Heart, Flame, ToggleLeft, ToggleRight, Send, Plus, ChevronDown, ChevronUp, Search, Trash2, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminAnalytics() {
  const { currentUser, refreshUser } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        let result = {};
        if ('AdminAnalytics' === 'AdminDashboard' || 'AdminAnalytics' === 'ModeratorDashboard') {
          const [ar, cr, er] = await Promise.all([analyticsAPI.get(), complaintsAPI.getAll({limit:5}), emergencyAPI.getAll()]);
          result = { analytics: ar.data, recentComplaints: cr.data.complaints||[], emergencies: er.data.emergencies||[] };
        } else if ('AdminAnalytics' === 'AdminUsers' || 'AdminAnalytics' === 'ModeratorUsers') {
          const r = await usersAPI.getAll({});
          result = { users: r.data.users||[] };
        } else if ('AdminAnalytics' === 'AdminJobs') {
          const r = await jobsAPI.getAll();
          result = { applications: r.data.applications||[] };
        } else if ('AdminAnalytics' === 'AdminSupport') {
          const r = await supportAPI.getAll();
          result = { tickets: r.data.tickets||[] };
        } else if ('AdminAnalytics' === 'AdminEmergencies') {
          const r = await emergencyAPI.getAll();
          result = { emergencies: r.data.emergencies||[] };
        } else if ('AdminAnalytics' === 'AdminAnalytics') {
          const r = await analyticsAPI.get();
          result = r.data;
        } else if ('AdminAnalytics' === 'TechnicianDashboard' || 'AdminAnalytics' === 'TechnicianTasks') {
          const r = await complaintsAPI.getAll({});
          result = { complaints: r.data.complaints||[] };
        } else if ('AdminAnalytics' === 'EmergencyDashboard' || 'AdminAnalytics' === 'EmergencyAlerts') {
          const r = await emergencyAPI.getAll();
          result = { emergencies: r.data.emergencies||[] };
        } else if ('AdminAnalytics' === 'JobApplication') {
          const r = await jobsAPI.getAll();
          result = { applications: r.data.applications||[] };
        } else if ('AdminAnalytics' === 'SupportPage') {
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
      <Header title="AdminAnalytics" />
      <div className="page-body" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
        <span className="spinner" style={{ width:32, height:32, borderWidth:3 }}/>
      </div>
    </>
  );

  return (
    <>
      <Header title="AdminAnalytics" />
      <div className="page-body animate-fadeIn">
        <div className="card card-gold">
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.2rem', marginBottom:10 }}>AdminAnalytics</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:6 }}>Logged in as: <strong style={{ color:'#C9A84C' }}>{currentUser?.name}</strong> ({currentUser?.role})</p>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Data loaded from MongoDB. {error && <span style={{ color:'#E74C3C' }}>Error: {error}</span>}</p>
          {data && <pre style={{ marginTop:12, fontSize:'0.72rem', color:'var(--text-muted)', overflow:'hidden', maxHeight:120 }}>{JSON.stringify(Object.keys(data), null, 2)}</pre>}
        </div>
      </div>
    </>
  );
}
