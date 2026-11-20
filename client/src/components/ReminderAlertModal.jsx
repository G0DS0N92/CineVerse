import React from 'react';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w300';

const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const ReminderAlertModal = ({ reminder, onWatchNow, onSnooze, onDismiss, onClose }) => {
  if (!reminder) return null;

  const title = reminder.title || 'Movie';
  const poster = reminder.posterPath || reminder.poster_path;
  const posterUrl = poster ? `${TMDB_IMG_BASE}${poster}` : null;
  const scheduledDate = formatDDMMYYYY(reminder.reminderDate);
  const scheduledTime = reminder.reminderTime || '20:00';

  return (
    <div className="reminder-alert-overlay" onClick={onClose}>
      <div className="reminder-alert-card" onClick={(e) => e.stopPropagation()}>
        {/* Close &times; Button */}
        <button
          type="button"
          className="reminder-alert-close"
          onClick={onClose}
          title="Close alert"
        >
          &times;
        </button>

        {/* Header with glowing badge */}
        <div className="reminder-alert-header">
          <div className="reminder-alert-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Movie Reminder</span>
          </div>
          <span className="reminder-alert-time-pill">
            {scheduledDate ? `${scheduledDate} at ` : ''}{scheduledTime}
          </span>
        </div>

        {/* Body: Poster + Info */}
        <div className="reminder-alert-body">
          <div className="reminder-alert-poster-wrap">
            {posterUrl ? (
              <img src={posterUrl} alt={title} className="reminder-alert-poster-img" />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  background: '#151c28',
                }}
              >
                No Poster
              </div>
            )}
          </div>

          <div className="reminder-alert-info">
            <h3 className="reminder-alert-title">Time to watch: {title}!</h3>
            <p className="reminder-alert-desc">
              Your scheduled movie night has arrived. Grab your popcorn and enjoy the show!
            </p>
            {reminder.notes ? (
              <div className="reminder-alert-note-box">
                <strong style={{ color: 'var(--text-main)', fontStyle: 'normal' }}>Note: </strong>
                "{reminder.notes}"
              </div>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="reminder-alert-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onDismiss(reminder)}
            title="Mark as completed and dismiss"
          >
            Dismiss
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onSnooze(reminder)}
            title="Remind me again in 10 minutes"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Snooze (10m)
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onWatchNow(reminder)}
            title="Open movie details and mark completed"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderAlertModal;
