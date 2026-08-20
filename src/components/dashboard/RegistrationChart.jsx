// Registration Telemetry Chart (Vercel/Linear Style)
import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './RegistrationChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="craft-chart-tooltip">
        <div className="tooltip-date font-mono">{label}</div>
        <div className="tooltip-metrics">
          {payload.map((p, idx) => (
            <div key={idx} className="tooltip-row">
              <span className="tooltip-dot" style={{ backgroundColor: p.color }} />
              <span className="tooltip-name">{p.name}:</span>
              <span className="tooltip-val font-mono">
                {p.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const RegistrationChart = ({ data }) => {
  const [metric, setMetric] = useState('both'); // 'registrations' | 'checkins' | 'both'

  return (
    <div className="craft-card chart-card">
      <div className="chart-header">
        <div className="chart-title-group">
          <h3 className="chart-title">Registration & Check-in Velocity</h3>
          <p className="chart-sub">30-day telemetry stream across all campus events</p>
        </div>

        {/* Metric Switcher */}
        <div className="segmented-control">
          <button
            className={`segmented-option ${metric === 'both' ? 'active' : ''}`}
            onClick={() => setMetric('both')}
            type="button"
          >
            All Telemetry
          </button>
          <button
            className={`segmented-option ${metric === 'registrations' ? 'active' : ''}`}
            onClick={() => setMetric('registrations')}
            type="button"
          >
            Registrations
          </button>
          <button
            className={`segmented-option ${metric === 'checkins' ? 'active' : ''}`}
            onClick={() => setMetric('checkins')}
            type="button"
          >
            Check-ins
          </button>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="irisGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tickLine={false}
              interval={5}
            />

            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255, 255, 255, 0.12)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            {(metric === 'both' || metric === 'registrations') && (
              <Area
                type="monotone"
                name="Registrations"
                dataKey="registrations"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#irisGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#6366F1', stroke: '#090A0D', strokeWidth: 2 }}
              />
            )}

            {(metric === 'both' || metric === 'checkins') && (
              <Area
                type="monotone"
                name="Check-ins"
                dataKey="checkins"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#emeraldGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#10B981', stroke: '#090A0D', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer-legend">
        <div className="legend-item">
          <span className="legend-pip" style={{ backgroundColor: '#6366F1' }} />
          <span className="legend-txt">Daily Registrations</span>
        </div>
        <div className="legend-item">
          <span className="legend-pip" style={{ backgroundColor: '#10B981' }} />
          <span className="legend-txt">Venue Check-ins</span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationChart;
