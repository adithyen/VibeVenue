// 404 Not Found page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="not-found">
      <motion.div
        className="nf-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page Not Found</h1>
        <p className="nf-desc">The page you're looking for doesn't exist or has been moved.</p>
        <Button variant="primary" onClick={() => navigate('/')} id="nf-home-btn">
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
