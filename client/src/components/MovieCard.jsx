import React from 'react';
import { Link } from 'react-router-dom';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const MovieCard = ({
  movie,
  onAddToWatchlist,
  isWatchlistItem = false,
  onStatusChange,
  onDelete,
  onOpenReminder,
}) => {
  // Support both TMDB object format (poster_path, vote_average)
  // and MongoDB Watchlist item format (posterPath, voteAverage)
  const id = movie.tmdbId || movie.id;
  const title = movie.title || 'Untitled';
  const poster = movie.posterPath || movie.poster_path;
  const rating = movie.voteAverage || movie.vote_average || 0;
  const releaseDate = movie.releaseDate || movie.release_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : 'N/A';

  const posterUrl = poster ? `${TMDB_IMG_BASE}${poster}` : null;

  return (
    <div className="movie-card">
      {/* Poster Image */}
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
          🎬 No Poster Available
        </div>

        {/* Rating Badge */}
        {rating > 0 && (
          <div className="movie-rating-badge">
            <span>★</span>
            <span>{Number(rating).toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="movie-card-info">
        <h3 className="movie-card-title" title={title}>
          {title}
        </h3>

        <div className="movie-card-meta">
          <span>{year}</span>
          {isWatchlistItem && (
            <span
              className={`status-badge ${
                movie.status === 'Watched'
                  ? 'status-watched'
                  : movie.status === 'Currently Watching'
                  ? 'status-watching'
                  : 'status-planned'
              }`}
            >
              {movie.status}
            </span>
          )}
        </div>

        {/* Watchlist Controls (If on Watchlist Page) */}
        {isWatchlistItem ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            {/* Status Change Selector */}
            <select
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
              value={movie.status}
              onChange={(e) => onStatusChange && onStatusChange(movie._id, e.target.value)}
            >
              <option value="Planned to Watch">Planned to Watch</option>
              <option value="Currently Watching">Currently Watching</option>
              <option value="Watched">Watched</option>
            </select>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => onOpenReminder && onOpenReminder(movie)}
                title="Schedule Watch Reminder"
              >
                ⏰ {movie.reminderDate ? 'Edit Reminder' : 'Remind'}
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onDelete && onDelete(movie._id)}
                title="Remove from Watchlist"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          /* General Discovery Action Controls */
          <div className="movie-card-actions">
            <Link to={`/movies/${id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              Details
            </Link>

            {onAddToWatchlist && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onAddToWatchlist(movie)}
                title="Add to personal watchlist"
              >
                + Watchlist
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
