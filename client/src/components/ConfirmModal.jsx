import React from 'react';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w300';

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  badgeText = 'Confirmation',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  movieTitle = '',
  posterPath = '',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const posterUrl = posterPath
    ? posterPath.startsWith('http')
      ? posterPath
      : `${TMDB_IMG_BASE}${posterPath}`
    : null;

  return (
    <div className="reminder-alert-overlay" onClick={onCancel}>
      <div className="reminder-alert-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="reminder-alert-close"
          onClick={onCancel}
          title="Close dialog"
        >
          &times;
        </button>

        {/* Header with Cinema-styled glowing badge */}
        <div className="reminder-alert-header">
          <div className="reminder-alert-badge">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {variant === 'danger' ? (
                <>
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
            </svg>
            <span>{badgeText}</span>
          </div>
        </div>

        {/* Body: Poster if provided, or Cinema Alert Graphic + Info */}
        <div className="reminder-alert-body">
          {posterUrl ? (
            <div className="reminder-alert-poster-wrap">
              <img
                src={posterUrl}
                alt={movieTitle || 'Movie'}
                className="reminder-alert-poster-img"
              />
            </div>
          ) : (
            <div
              style={{
                width: '74px',
                height: '110px',
                flexShrink: 0,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(229, 9, 20, 0.1)',
                border: '1px solid rgba(229, 9, 20, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
          )}

          <div className="reminder-alert-info">
            <h3 className="reminder-alert-title">{title}</h3>
            {movieTitle && (
              <div
                style={{
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  marginBottom: '6px',
                }}
              >
                {movieTitle}
              </div>
            )}
            <p className="reminder-alert-desc" style={{ color: 'var(--text-muted)' }}>
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="reminder-alert-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onConfirm}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: variant === 'danger' ? '#dc2626' : undefined,
              borderColor: variant === 'danger' ? '#b91c1c' : undefined,
              color: '#ffffff',
            }}
          >
            {variant === 'danger' && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
