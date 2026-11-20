import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReminderModal from '../components/ReminderModal';

const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [message, setMessage] = useState('');

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
      };

      await API.post('/watchlist', payload);
      setMessage('✅ Movie added to your watchlist!');
      setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      setMessage(`⚠️ ${err.response?.data?.message || 'Could not add to watchlist'}`);
      setTimeout(() => setMessage(''), 3500);
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
        ...reminderData,
      };

      await API.post('/watchlist', payload);
      setIsReminderOpen(false);
      setMessage(`⏰ Reminder set for ${reminderData.reminderDate}!`);
      setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      setMessage(`⚠️ ${err.response?.data?.message || 'Failed to save reminder'}`);
      setIsReminderOpen(false);
      setTimeout(() => setMessage(''), 3500);
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

      {message && <div className="alert alert-success">{message}</div>}

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

            {/* Meta Row: Rating, Year, Runtime */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span className="movie-rating-badge" style={{ position: 'static' }}>
                ★ {Number(movie.vote_average || 0).toFixed(1)} / 10
              </span>

              <span style={{ color: 'var(--text-muted)' }}>
                📅 {movie.release_date || 'Unknown Date'}
              </span>

              {movie.runtime > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>
                  ⏱️ {movie.runtime} min
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
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={handleAddWatchlist} className="btn btn-primary">
                + Add to Watchlist
              </button>

              <button onClick={() => setIsReminderOpen(true)} className="btn btn-secondary">
                ⏰ Schedule Reminder
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
    </div>
  );
};

export default MovieDetailPage;
