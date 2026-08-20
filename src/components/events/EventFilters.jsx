// Multi-Faceted Event Filter & View Switcher Bar
import React from 'react';
import { CATEGORIES } from '../../data/mockData';
import SearchBar from '../ui/SearchBar';
import './EventFilters.css';

const SORT_OPTIONS = [
  { value: 'date-asc',          label: 'Date: Earliest First' },
  { value: 'date-desc',         label: 'Date: Latest First' },
  { value: 'capacity-desc',     label: 'Occupancy: Highest' },
  { value: 'registrations-desc', label: 'Registrations: Most' },
  { value: 'name-asc',          label: 'Title: A → Z' },
  { value: 'name-desc',         label: 'Title: Z → A' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const EventFilters = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  status,
  onStatusChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="event-filters-bar">
      {/* Top Controls Row */}
      <div className="filters-main-row">
        {/* Search */}
        <SearchBar
          id="events-search-input"
          value={search}
          onChange={onSearchChange}
          placeholder="Filter by title, domain, venue, speaker or tag..."
          className="filters-search-box"
        />

        {/* Status Dropdown */}
        <select
          id="events-status-filter"
          className="craft-select"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter events by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          id="events-sort-select"
          className="craft-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort events"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* View Switcher: Grid vs Table */}
        <div className="segmented-control view-switcher" aria-label="View Layout">
          <button
            className={`segmented-option ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid Card View"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Grid</span>
          </button>

          <button
            className={`segmented-option ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => onViewModeChange('table')}
            title="Compact Table View"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Category Pills Row */}
      <div className="category-scroll-strip" role="tablist" aria-label="Domain Filter">
        {CATEGORIES.map((cat) => {
          const isSelected = (!category && cat.id === 'all') || category === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-pill ${isSelected ? 'category-pill-active' : ''}`}
              onClick={() => onCategoryChange(cat.id === 'all' ? '' : cat.id)}
              type="button"
              role="tab"
              aria-selected={isSelected}
            >
              <span className="cat-pill-icon">{cat.icon}</span>
              <span className="cat-pill-label">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Result Status Header */}
      {(search || category || status) && (
        <div className="filter-results-status">
          <span>
            Filtering: <strong className="font-mono text-primary">{filteredCount}</strong> of {totalCount} events match
          </span>
          <button
            className="filter-clear-btn font-mono"
            onClick={() => {
              onSearchChange('');
              onCategoryChange('');
              onStatusChange('');
            }}
            type="button"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EventFilters;
