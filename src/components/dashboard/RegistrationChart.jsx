// RegistrationChart — Recharts area chart for registration trends
import React from 'react';
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
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className="chart-tooltip-value">
          <span style={{ color: '#00D4FF' }}>●</span>
          {' '}{payload[0].value} registrations
        </p>
      </div>
    );
  }
  return null;
};

const RegistrationChart = ({ data }) => {
  return (
    <div className="reg-chart-wrapper">
      <div className="reg-chart-header">
        <div>
          <h3 className="reg-chart-title">Registration Trend</h3>
          <p className="reg-chart-sub">Past 30 days</p>
        </div>
        <div className="reg-chart-legend">
          <span className="legend-dot" style={{ background: '#00D4FF' }} />
          <span>Registrations</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: '#4A5A78', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: '#4A5A78', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,212,255,0.2)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="registrations"
            stroke="#00D4FF"
            strokeWidth={2.5}
            fill="url(#regGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#00D4FF', stroke: '#080C10', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RegistrationChart;
