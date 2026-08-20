// Toast notification system
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../../store/useUIStore';
import './Toast.css';

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 9v5M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 8v.5M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

const COLOR_MAP = {
  success: '#00E676',
  error:   '#FF4757',
  warning: '#FFB300',
  info:    '#00D4FF',
};

const ToastItem = ({ toast }) => {
  const { removeToast } = useUIStore();
  const color = COLOR_MAP[toast.type] || COLOR_MAP.info;

  return (
    <motion.div
      className={`toast toast-${toast.type}`}
      style={{ borderLeftColor: color }}
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      layout
    >
      <span className="toast-icon" style={{ color }}>{ICONS[toast.type]}</span>
      <div className="toast-content">
        {toast.title && <p className="toast-title">{toast.title}</p>}
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button
        className="toast-close"
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </motion.div>
  );
};

const Toast = () => {
  const { toasts } = useUIStore();

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
