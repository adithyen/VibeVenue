// 404 Not Found Screen
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-view">
      <div className="craft-card not-found-card">
        <span className="not-found-code font-mono">404</span>
        <h2 className="not-found-title">Page Route Not Found</h2>
        <p className="not-found-desc">
          The symposium route you requested does not exist or has been relocated.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/')}
        >
          Return to Operations Control
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
