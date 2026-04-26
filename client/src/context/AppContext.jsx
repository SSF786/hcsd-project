import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI, notificationsAPI } from '../services/api';
import { playNotificationSound } from '../hooks/useNotificationSound';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ghmc_user')); } catch { return null; }
  });
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [loading, setLoading]               = useState(false);
  const prevUnreadRef                       = useRef(0);

  // On mount: validate token (skip for demo tokens)
  useEffect(() => {
    const token = localStorage.getItem('ghmc_token');
    if (!token || !currentUser) return;
    if (token.startsWith('demo_token_')) return;
    authAPI.me()
      .then(r => { setCurrentUser(r.data.user); localStorage.setItem('ghmc_user', JSON.stringify(r.data.user)); })
      .catch(e => { if (e.response?.status === 401) logout(); });
  }, []);

  // Poll notifications every 12 seconds
  useEffect(() => {
    if (!currentUser) return;
    const fetch = async () => {
      try {
        const r = await notificationsAPI.getAll();
        const newNotifs  = r.data.notifications || [];
        const newUnread  = r.data.unreadCount   || 0;

        // Play sound if unread count increased
        if (newUnread > prevUnreadRef.current && prevUnreadRef.current >= 0) {
          // Determine sound type from latest unread notification
          const latest = newNotifs.find(n => !n.read);
          const type   = latest?.type || 'info';
          playNotificationSound(type);
        }
        prevUnreadRef.current = newUnread;

        setNotifications(newNotifs);
        setUnreadCount(newUnread);
      } catch (e) {}
    };
    fetch();
    const iv = setInterval(fetch, 12000);
    return () => clearInterval(iv);
  }, [currentUser]);

  const login = useCallback(async (userId, password) => {
    try {
      setLoading(true);
      const r = await authAPI.login({ userId, password });
      const { token, user } = r.data;
      localStorage.setItem('ghmc_token', token);
      localStorage.setItem('ghmc_user', JSON.stringify(user));
      setCurrentUser(user);
      prevUnreadRef.current = 0;
      return { success: true, user };
    } catch (e) {
      return { success: false, error: e.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ghmc_token');
    localStorage.removeItem('ghmc_user');
    setCurrentUser(null);
    setNotifications([]);
    setUnreadCount(0);
    prevUnreadRef.current = 0;
  }, []);

  const register = useCallback(async (data) => {
    try { setLoading(true); await authAPI.register(data); return { success: true }; }
    catch (e) { return { success: false, error: e.response?.data?.message || 'Registration failed' }; }
    finally { setLoading(false); }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('ghmc_token');
    if (token?.startsWith('demo_token_')) return;
    try {
      const r = await authAPI.me();
      setCurrentUser(r.data.user);
      localStorage.setItem('ghmc_user', JSON.stringify(r.data.user));
    } catch (e) {}
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(p => p.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch (e) {}
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, loading, notifications, unreadCount,
      login, logout, register, refreshUser,
      markAllNotificationsRead, setCurrentUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
};
