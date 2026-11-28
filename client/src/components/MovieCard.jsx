import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CinemaTicketModal from './CinemaTicketModal';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const STATUS_OPTIONS = [
  { value: 'Planned to Watch', label: 'Planned to Watch', color: '#38bdf8' },
  { value: 'Currently Watching', label: 'Currently Watching', color: '#eab308' },
  { value: 'Watched', label: 'Watched', color: '#10b981' },
];

const MovieCard = ({
  movie,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist = false,
  isWatchlistItem = false,
  onStatusChange,
  onDelete,
  onOpenReminder,
  onOpenTicketStub,
}) => {
  // Support both TMDB object format (poster_path, vote_average)
  // and MongoDB Watchlist item format (posterPath, voteAverage)
  const id = movie.tmdbId || movie.id;
  const title = movie.title || 'Untitled';
  const poster = movie.posterPath || movie.poster_path || movie.backdropPath || movie.backdrop_path;
  const rating = movie.voteAverage || movie.vote_average || 0;
  const releaseDate = movie.releaseDate || movie.release_date || '';
  const year = (() => {
    if (!releaseDate) return 'N/A';
    if (releaseDate.includes('/')) {
      const parts = releaseDate.split('/');
      return parts[2] || parts[0];
    }
    return releaseDate.split('-')[0] || 'N/A';
  })();

  const posterUrl = poster ? `${TMDB_IMG_BASE}${poster}` : null;

  // Custom status dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleTicketClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onOpenTicketStub) {
      onOpenTicketStub(movie);
    } else {
      setIsTicketModalOpen(true);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Determine if the movie should show a Release Date badge (unreleased or newly releasing)
  const isUnreleased = (() => {
    // Explicit override for known titles requested by user
    if (title && title.toLowerCase().includes('perfect liars')) return true;
    if (title && title.toLowerCase().includes('doomsday')) return true;

    if (!releaseDate) return false;

    // Parse YYYY-MM-DD or DD/MM/YYYY format
    let dateObj;
    if (releaseDate.includes('/')) {
      const [d, m, y] = releaseDate.split('/');
      dateObj = new Date(`${y}-${m}-${d}`);
    } else {
      dateObj = new Date(releaseDate.split('T')[0]);
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // If future date, today's release, or unrated (0 stars) with a release date
    return dateObj >= todayMidnight || rating === 0;
  })();

  // Format release date strictly as DD/MM/YYYY for the badge
  const formattedReleaseDate = (() => {
    if (title && title.toLowerCase().includes('perfect liars')) return '20/11/2026';
    if (title && title.toLowerCase().includes('doomsday')) return '17/12/2026';

    if (!releaseDate) return '';
    if (releaseDate.includes('/')) return releaseDate;
    const parts = releaseDate.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return releaseDate;
  })();

  return (
    <div
      className={`movie-card ${dropdownOpen ? 'dropdown-active' : ''}`}
      style={{
        zIndex: dropdownOpen ? 999 : undefined,
        overflow: dropdownOpen ? 'visible' : undefined,
        position: dropdownOpen ? 'relative' : undefined,
      }}
    >
      {/* Poster Image - Clickable to Movie Details */}
      <Link
        to={id ? `/movies/${id}` : '#'}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer', flexShrink: 0 }}
        title={`View details for ${title}`}
      >
        <div className="movie-poster-wrap">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="movie-poster-img"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="poster-placeholder" style={{ display: posterUrl ? 'none' : 'flex' }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.35, marginBottom: '6px' }}
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '0 8px', lineHeight: 1.25 }}>
              {title}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              No Poster Available
            </span>
          </div>

          {/* Rating Badge or Release Date Badge for unreleased movies */}
          {isUnreleased ? (
            <div className="movie-date-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{formattedReleaseDate}</span>
            </div>
          ) : rating > 0 ? (
            <div className="movie-rating-badge">
              <span>★</span>
              <span>{Number(rating).toFixed(1)}</span>
            </div>
          ) : null}

          {/* Collectible Ticket Pass Ribbon for Watched movies */}
          {movie.status === 'Watched' && (
            <button
              type="button"
              className="movie-ticket-badge-btn"
              onClick={handleTicketClick}
              title="View Collectible Cinema Ticket Stub"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              <span>Pass</span>
            </button>
          )}
        </div>
      </Link>

      {/* Info Body */}
      <div className="movie-card-info" style={{ minWidth: 0, overflow: dropdownOpen ? 'visible' : undefined }}>
        <Link
          to={id ? `/movies/${id}` : '#'}
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            minWidth: 0,
            overflow: 'hidden',
          }}
          title={`View details for ${title}`}
        >
          <h3 className="movie-card-title" title={title} style={{ cursor: 'pointer' }}>
            {title}
          </h3>
        </Link>

        <div className="movie-card-meta" style={{ overflow: 'visible' }}>
          <span style={{ flexShrink: 0, fontWeight: 500 }}>{year}</span>
          {isWatchlistItem && (
            <span
              className={`status-badge ${
                movie.status === 'Watched'
                  ? 'status-watched'
                  : movie.status === 'Currently Watching'
                  ? 'status-watching'
                  : 'status-planned'
              }`}
              style={{ flexShrink: 0 }}
            >
              {movie.status}
            </span>
          )}
        </div>

        {/* Watchlist Controls (If on Watchlist Page) */}
        {isWatchlistItem ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            {/* Custom Modern Cinema Status Selector */}
            <div className="custom-status-dropdown-wrap" ref={dropdownRef}>
              <button
                type="button"
                className={`custom-status-trigger ${dropdownOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((prev) => !prev);
                }}
                title="Change Watching Status"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    className="custom-status-dot"
                    style={{
                      backgroundColor:
                        movie.status === 'Watched'
                          ? '#10b981'
                          : movie.status === 'Currently Watching'
                          ? '#eab308'
                          : '#38bdf8',
                      boxShadow:
                        movie.status === 'Watched'
                          ? '0 0 8px rgba(16, 185, 129, 0.7)'
                          : movie.status === 'Currently Watching'
                          ? '0 0 8px rgba(234, 179, 8, 0.7)'
                          : '0 0 8px rgba(56, 189, 248, 0.7)',
                    }}
                  />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {movie.status || 'Planned to Watch'}
                  </span>
                </div>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    opacity: 0.8,
                    flexShrink: 0,
                    marginLeft: '6px',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Floating Glassmorphic Menu */}
              {dropdownOpen && (
                <div className="custom-status-menu">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = movie.status === opt.value;
                    return (
                      <div
                        key={opt.value}
                        className={`custom-status-option ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStatusChange) {
                            onStatusChange(movie._id, opt.value);
                          }
                          setDropdownOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            className="custom-status-dot"
                            style={{
                              backgroundColor: opt.color,
                              boxShadow: `0 0 6px ${opt.color}88`,
                            }}
                          />
                          <span>{opt.label}</span>
                        </div>

                        {isSelected && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--accent-primary)"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {movie.status === 'Watched' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    borderColor: 'rgba(212, 175, 55, 0.45)',
                    color: '#f3e5ab',
                    background: 'rgba(212, 175, 55, 0.08)',
                  }}
                  onClick={handleTicketClick}
                  title="View Collectible Cinema Ticket Stub"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                  <span>Pass</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  flex: movie.status === 'Watched' ? '0 0 36px' : 1,
                  padding: movie.status === 'Watched' ? 0 : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => onOpenReminder && onOpenReminder(movie)}
                title="Schedule Watch Reminder"
              >
                {movie.status === 'Watched' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ) : movie.reminderDate ? (
                  'Edit Reminder'
                ) : (
                  'Remind'
                )}
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onDelete && onDelete(movie._id)}
                title="Remove from Watchlist"
              >
                &times;
              </button>
            </div>
          </div>
        ) : (
          /* General Discovery Action Controls */
          <div className="movie-card-actions">
            <Link to={`/movies/${id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              Details
            </Link>

            {isInWatchlist ? (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: '#dc2626',
                  borderColor: '#b91c1c',
                  color: '#ffffff',
                  fontWeight: 600,
                }}
                onClick={() => onRemoveFromWatchlist && onRemoveFromWatchlist(movie)}
                title="Remove from your watchlist"
              >
                Remove
              </button>
            ) : (
              onAddToWatchlist && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onAddToWatchlist(movie)}
                  title="Add to personal watchlist"
                >
                  + Watchlist
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Fallback Ticket Stub Modal */}
      <CinemaTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        movie={movie}
      />
    </div>
  );
};

export default MovieCard;
