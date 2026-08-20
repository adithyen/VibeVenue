// EventFilters — category pills, sort dropdown, and status filter
import React from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../../data/mockData';
import SearchBar from '../ui/SearchBar';
import './EventFilters.css';

const SORT_OPTIONS = [
  { value: 'date-asc',          label: 'Date (Earliest)' },
  { value: 'date-desc',         label: 'Date (Latest)' },
  { value: 'name-asc',          label: 'Name (A-Z)' },
  { value: 'name-desc',         label: 'Name (Z-A)' },
  { value: 'registrations-desc', label: 'Most Registered' },
  { value: 'capacity-desc',     label: 'Fullest First' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All' },
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
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="event-filters">
      {/* Search + Sort row */}
      <div className="filters-top-row">
        <SearchBar
          id="events-search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search events, venues, tags..."
          className="filters-search"
        />

        {/* Status tabs */}
        <div className="status-tabs">
          {STATUS_FILTERS.map(s => (
            <button
              key={s.value}
              className={`status-tab ${status === s.value ? 'status-tab-active' : ''}`}
              onClick={() => onStatusChange(s.value)}
              type="button"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          id="events-sort"
          className="filters-sort"
          value={sort}
          onChange={e => onSortChange(e.target.value)}
          aria-label="Sort events"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      <div className="category-pills-row">
        <button
          className={`cat-pill ${!category ? 'cat-pill-active' : ''}`}
          onClick={() => onCategoryChange('')}
          type="button"
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat.id}
            className={`cat-pill ${category === cat.id ? 'cat-pill-active' : ''}`}
            style={category === cat.id ? {
              borderColor: cat.color,
              background: `${cat.color}18`,
              color: cat.color,
            } : {}}
            onClick={() => onCategoryChange(cat.id === category ? '' : cat.id)}
            whileTap={{ scale: 0.95 }}
            type="button"
          >
            {cat.icon} {cat.label}
          </motion.button>
        ))}
      </div>

      {/* Results count */}
      {(search || category || status) && (
        <p className="filters-result-count">
          Showing <span className="text-cyan">{filteredCount}</span> of {totalCount} events
        </p>
      )}
    </div>
  );
};

export default EventFilters;
