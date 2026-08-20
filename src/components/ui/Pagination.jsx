// Tactile Pagination Bar
import React from 'react';
import { motion } from 'framer-motion';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const range = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - range && i <= currentPage + range)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPages();

  return (
    <nav className={`craft-pag ${className}`} aria-label="Pagination Navigation">
      <button
        className="craft-pag-btn craft-pag-nav"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div className="craft-pag-numbers">
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="craft-pag-ellipsis font-mono">
              …
            </span>
          ) : (
            <motion.button
              key={page}
              className={`craft-pag-btn craft-pag-num font-mono ${
                page === currentPage ? 'craft-pag-active' : ''
              }`}
              onClick={() => onPageChange(page)}
              whileTap={{ scale: 0.94 }}
              type="button"
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </motion.button>
          )
        )}
      </div>

      <button
        className="craft-pag-btn craft-pag-nav"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </nav>
  );
};

export default Pagination;
