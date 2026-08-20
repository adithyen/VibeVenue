// Tactile Spring Button (Emil Motion + Craftsmanship)
import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  kbd,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  id,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      id={id}
      type={type}
      className={`craft-btn craft-btn-${variant} craft-btn-${size} ${fullWidth ? 'craft-btn-full' : ''} ${className}`}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      whileHover={isDisabled ? {} : { scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      {...rest}
    >
      {loading ? (
        <span className="craft-btn-spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="craft-btn-icon">{icon}</span>
      ) : null}
      
      {children && <span className="craft-btn-label">{children}</span>}
      
      {iconRight && !loading && (
        <span className="craft-btn-icon-right">{iconRight}</span>
      )}

      {kbd && !loading && (
        <span className="craft-btn-kbd font-mono">{kbd}</span>
      )}
    </motion.button>
  );
};

export default Button;
