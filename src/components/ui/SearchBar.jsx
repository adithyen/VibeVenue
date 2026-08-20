// SearchBar — frosted capsule search with icon
import React from 'react';
import './SearchBar.css';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
  id,
}) => {
  return (
    <div className={`searchbar ${className}`}>
      <span className="searchbar-icon"><SearchIcon /></span>
      <input
        id={id}
        type="search"
        className="searchbar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
      />
      {value && (
        <button
          className="searchbar-clear"
          onClick={() => { onChange(''); onClear?.(); }}
          aria-label="Clear search"
          type="button"
        >
          <ClearIcon />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
