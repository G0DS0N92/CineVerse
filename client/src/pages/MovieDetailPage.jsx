import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReminderModal from '../components/ReminderModal';
import Toast from '../components/Toast';

const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Helper: Format release date strictly to DD/MM/YYYY
  const formatToDDMMYYYY = (dateStr) => {
    if (!dateStr) return 'N/A';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await API.get(`/movies/${id}`);
        if (data.success) {
          setMovie(data.data);
        }
      } catch (err) {
        console.error('Error fetching movie details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Check if current movie is already in user's watchlist
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!isAuthenticated || !movie) return;
      try {
        const { data } = await API.get('/watchlist');
        if (data.success && Array.isArray(data.data)) {
          const exists = data.data.some((item) => item.tmdbId === movie.id);
          setIsInWatchlist(exists);
        }
      } catch (err) {
        console.error('Failed to check watchlist status', err);
      }
    };

    checkWatchlistStatus();
  }, [movie, isAuthenticated]);

  const handleAddWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const payload = {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        overview: movie.overview,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        genres: movie.genres ? movie.genres.map((g) => g.name) : [],
        status: 'Planned to Watch',
        certification: movie.certification || '',
        adult: movie.adult === true,
      };

      await API.post('/watchlist', payload);
      setIsInWatchlist(true);
      setToast({ message: `Added "${movie.title}" to your watchlist!`, type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Could not add to watchlist', type: 'error' });
    }
  };

  const handleRemoveWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await API.delete(`/watchlist/movie/${movie.id}`);
      setIsInWatchlist(false);
      setToast({ message: 'The Movie has been removed from watchlist', type: 'error' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Could not remove from watchlist', type: 'error' });
    }
  };

  const handleSaveReminder = async (reminderData) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const payload = {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        overview: movie.overview,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        genres: movie.genres ? movie.genres.map((g) => g.name) : [],
        status: 'Planned to Watch',
        certification: movie.certification || '',
        adult: movie.adult === true,
        ...reminderData,
      };

      await API.post('/watchlist', payload);
      setIsInWatchlist(true);
      setIsReminderOpen(false);
      window.dispatchEvent(new CustomEvent('cineverse_reminder_updated'));
      setToast({ message: `Reminder set for ${formatToDDMMYYYY(reminderData.reminderDate)}!`, type: 'success' });
    } catch (err) {
      setIsReminderOpen(false);
      setToast({ message: err.response?.data?.message || 'Failed to save reminder', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="empty-state">
        <h3>Movie not found</h3>
        <Link to="/discover" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Discovery
        </Link>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : null;
  const posterUrl = movie.poster_path ? `${TMDB_POSTER_BASE}${movie.poster_path}` : null;

  return (
    <div>
      {/* Back Button */}
      <Link to="/discover" className="btn btn-outline btn-sm" style={{ marginBottom: '20px' }}>
        &larr; Back to Movies
      </Link>

      {/* Main Details Hero Container */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Backdrop Banner Background */}
        {backdropUrl && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '350px',
              backgroundImage: `linear-gradient(to bottom, rgba(10, 13, 20, 0.4), var(--bg-card)), url(${backdropUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              opacity: 0.7,
            }}
          />
        )}

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '36px',
            display: 'flex',
            gap: '36px',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            marginTop: backdropUrl ? '140px' : '0',
          }}
        >
          {/* Movie Poster */}
          <div
            style={{
              width: '260px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              background: '#111622',
            }}
          >
            {posterUrl ? (
              <img src={posterUrl} alt={movie.title} style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                No Poster
              </div>
            )}
          </div>

          {/* Movie Info Details */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '8px' }}>
              {movie.title}
            </h1>

            {movie.tagline && (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '16px' }}>
                "{movie.tagline}"
              </p>
            )}

            {/* Meta Row: Rating, Year, Runtime, Age Rating */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span className="movie-rating-badge" style={{ position: 'static' }}>
                ★ {Number(movie.vote_average || 0).toFixed(1)} / 10
              </span>

              {movie.certification && (
                <span
                  style={{
                    background: 'rgba(229, 9, 20, 0.18)',
                    color: '#ff4d4d',
                    border: '1px solid rgba(229, 9, 20, 0.45)',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.5px',
                  }}
                  title={`Age Rating: ${movie.certification}`}
                >
                  {movie.certification}
                </span>
              )}

              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                Release Date: {formatToDDMMYYYY(movie.release_date)}
              </span>

              {movie.runtime > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>
                  {movie.runtime} min
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {movie.genres.map((g) => (
                  <span
                    key={g.id || g.name}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Plot Overview */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-main)' }}>Overview</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
              {movie.overview || 'No overview description available for this movie.'}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              {isInWatchlist ? (
                <button
                  type="button"
                  onClick={handleRemoveWatchlist}
                  className="btn btn-sm"
                  style={{
                    background: '#dc2626',
                    borderColor: '#b91c1c',
                    color: '#ffffff',
                    fontWeight: 600,
                    padding: '10px 22px',
                    fontSize: '0.95rem',
                  }}
                  title="Remove this movie from your watchlist"
                >
                  Remove from Watchlist
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddWatchlist}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.95rem' }}
                >
                  + Add to Watchlist
                </button>
              )}

              <button type="button" onClick={() => setIsReminderOpen(true)} className="btn btn-secondary" style={{ padding: '10px 22px' }}>
                Schedule Reminder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        movie={movie}
        onSave={handleSaveReminder}
      />

      {/* Center-Bottom Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default MovieDetailPage;
