import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// ── Global toast queue ─────────────────────────────────────────
let _addToast = null;
export function toast(message, type = 'info', duration = 3500) {
  if (_addToast) _addToast({ message, type, duration, id: Date.now() + Math.random() });
}
toast.success = (msg, dur) => toast(msg, 'success', dur);
toast.error   = (msg, dur) => toast(msg, 'error',   dur || 4500);
toast.warning = (msg, dur) => toast(msg, 'warning', dur);
toast.info    = (msg, dur) => toast(msg, 'info',    dur);

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};
const COLORS = {
  success: { bg: 'rgba(46,204,113,0.12)',  border: 'rgba(46,204,113,0.3)',  text: '#2ECC71' },
  error:   { bg: 'rgba(231,76,60,0.12)',   border: 'rgba(231,76,60,0.3)',   text: '#E74C3C' },
  warning: { bg: 'rgba(243,156,18,0.12)',  border: 'rgba(243,156,18,0.3)',  text: '#F39C12' },
  info:    { bg: 'rgba(52,152,219,0.12)',  border: 'rgba(52,152,219,0.3)',  text: '#3498DB' },
};

function ToastItem({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);
  const c = COLORS[type] || COLORS.info;
  const Icon = ICONS[type] || Info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(16px)',
      minWidth: 260, maxWidth: 380,
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }} onClick={dismiss}>
      {/* progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        background: c.text, borderRadius: 1,
        animation: `toastProgress linear forwards`,
        animationDuration: 'var(--toast-dur)',
      }} />
      <Icon size={16} color={c.text} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: '0.84rem', color: '#F0EDE4', lineHeight: 1.5, flex: 1 }}>{message}</span>
      <X size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = ({ id, message, type, duration }) => {
      setToasts(prev => [...prev, { id, message, type, duration }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    };
    return () => { _addToast = null; };
  }, []);

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 80, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all', '--toast-dur': `${t.duration}ms` }}>
          <ToastItem id={t.id} message={t.message} type={t.type} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
