import React from 'react';

const StatCard = ({ title, value, icon, color = 'var(--accent-primary)' }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
