// Tactile Dialog & Drawer Modal
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showClose = true,
  className = '',
}) => {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="craft-modal-root" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="craft-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className={`craft-modal-panel craft-modal-${size} ${className}`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          >
            {(title || showClose) && (
              <div className="craft-modal-header">
                <div className="craft-modal-header-titles">
                  {title && <h3 className="craft-modal-title">{title}</h3>}
                  {subtitle && <p className="craft-modal-subtitle">{subtitle}</p>}
                </div>
                {showClose && (
                  <button
                    className="craft-modal-close"
                    onClick={onClose}
                    aria-label="Close dialog"
                    type="button"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
            <div className="craft-modal-body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
