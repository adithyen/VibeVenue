// Precision Search Bar with Keyboard Shortcut Integration
import React, { useRef, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
  shortcut = '/',
  id,
}) => {
  const inputRef = useRef(null);

  // Global hotkey '/' to focus search bar if not typing in an input
  useEffect(() => {
    if (!shortcut) return;
    const handleKeyDown = (e) => {
      if (
        e.key === shortcut &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

  return (
    <div className={`craft-searchbar ${className}`}>
      <span className="craft-searchbar-icon" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="craft-searchbar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
      />

      {value ? (
        <button
          className="craft-searchbar-clear"
          onClick={() => {
            onChange('');
            onClear?.();
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      ) : shortcut ? (
        <span className="craft-searchbar-shortcut font-mono" title={`Press ${shortcut} to search`}>
          {shortcut}
        </span>
      ) : null}
    </div>
  );
};

export default SearchBar;
