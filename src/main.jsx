// main.jsx — entry point with Supabase bootstrap
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import useAuthStore from './store/useAuthStore.js';
import useEventStore from './store/useEventStore.js';
import './index.css';

function Bootstrap({ children }) {
  const initAuth   = useAuthStore(s => s.init);
  const initEvents = useEventStore(s => s.init);

  useEffect(() => {
    // Boot both in parallel on app start
    initAuth();
    initEvents();
  }, []);

  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Bootstrap>
        <App />
      </Bootstrap>
    </BrowserRouter>
  </React.StrictMode>
);
