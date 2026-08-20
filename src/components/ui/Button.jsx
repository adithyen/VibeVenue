// Button component — tactile spring buttons
import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

const VARIANTS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  success:   'btn-success',
  outline:   'btn-outline',
};

const SIZES = {
  xs:  'btn-xs',
  sm:  'btn-sm',
  md:  'btn-md',
  lg:  'btn-lg',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
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
      className={`btn ${VARIANTS[variant] || 'btn-primary'} ${SIZES[size] || 'btn-md'} ${fullWidth ? 'btn-full' : ''} ${className}`}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? {} : { scale: 0.96 }}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...rest}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : icon ? (
        <span className="btn-icon btn-icon-left">{icon}</span>
      ) : null}
      {children && <span className="btn-label">{children}</span>}
      {iconRight && !loading && <span className="btn-icon btn-icon-right">{iconRight}</span>}
    </motion.button>
  );
};

export default Button;
