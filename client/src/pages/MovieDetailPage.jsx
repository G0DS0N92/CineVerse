import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReminderModal from '../components/ReminderModal';
import TrailerModal from '../components/TrailerModal';
import Toast from '../components/Toast';

const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/original';

const COUNTRY_OPTIONS = [
  { code: 'IN', label: 'India (IN)' },
  { code: 'US', label: 'United States (US)' },
  { code: 'GB', label: 'United Kingdom (UK)' },
  { code: 'CA', label: 'Canada (CA)' },
  { code: 'AU', label: 'Australia (AU)' },
];

const MovieDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Trailer states
  const [trailerKey, setTrailerKey] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Watch Providers states
  const [watchProviders, setWatchProviders] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [providersLoading, setProvidersLoading] = useState(true);

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
    const fetchDetailsAndExtras = async () => {
      setLoading(true);
      setProvidersLoading(true);
      try {
        const [detailsRes, videosRes, providersRes] = await Promise.allSettled([
          API.get(`/movies/${id}`),
          API.get(`/movies/${id}/videos`),
          API.get(`/movies/${id}/watch-providers`),
        ]);

        if (detailsRes.status === 'fulfilled' && detailsRes.value.data.success) {
          setMovie(detailsRes.value.data.data);
        }

        if (videosRes.status === 'fulfilled' && videosRes.value.data.success) {
          const videos = videosRes.value.data.data || [];
          if (videos.length > 0) {
            setTrailerKey(videos[0].key);
          } else {
            setTrailerKey(null);
          }
        }

        if (providersRes.status === 'fulfilled' && providersRes.value.data.success) {
          const allResults = providersRes.value.data.data?.results || {};
          setWatchProviders(allResults);
          // If IN has no providers but US does, default selectedCountry to US
          if (!allResults.IN && allResults.US) {
            setSelectedCountry('US');
          }
        }
      } catch (err) {
        console.error('Error fetching movie data', err);
      } finally {
        setLoading(false);
        setProvidersLoading(false);
      }
    };

    fetchDetailsAndExtras();
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

              {trailerKey && (
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(true)}
                  className="btn"
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.25), rgba(229, 9, 20, 0.08))',
                    color: '#ffffff',
                    border: '1px solid rgba(229, 9, 20, 0.6)',
                    boxShadow: '0 0 16px rgba(229, 9, 20, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  title="Watch official movie trailer preview"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Watch Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Where to Watch / Streaming Providers Section */}
      <div
        style={{
          marginTop: '32px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(229, 9, 20, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e50914',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Where to Watch
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Official streaming services, rentals, and digital purchases
              </span>
            </div>
          </div>

          {/* Country Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="country-select" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Region:
            </label>
            <select
              id="country-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="form-control"
              style={{
                width: 'auto',
                padding: '6px 14px',
                fontSize: '0.85rem',
                background: '#0d121d',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '8px',
              }}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} {watchProviders[c.code] ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider Categories or Empty State */}
        {(() => {
          const currentData = watchProviders[selectedCountry];
          if (providersLoading) {
            return (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Checking streaming availability...
              </div>
            );
          }

          if (!currentData || (!currentData.flatrate && !currentData.rent && !currentData.buy)) {
            return (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                }}
              >
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  No streaming or purchase options are currently reported for {COUNTRY_OPTIONS.find((c) => c.code === selectedCountry)?.label || selectedCountry}.
                </p>
                <p style={{ margin: '8px 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Try selecting a different region above (such as United States) or check back closer to theatrical or digital distribution.
                </p>
              </div>
            );
          }

          const categories = [
            { key: 'flatrate', label: 'Stream (Subscription)', items: currentData.flatrate || [] },
            { key: 'rent', label: 'Rent', items: currentData.rent || [] },
            { key: 'buy', label: 'Buy', items: currentData.buy || [] },
          ].filter((cat) => cat.items.length > 0);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {categories.map((cat) => (
                <div key={cat.key}>
                  <h4
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.7px',
                      color: '#e50914',
                      marginBottom: '12px',
                    }}
                  >
                    {cat.label}
                  </h4>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    {cat.items.map((provider) => (
                      <div
                        key={provider.provider_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 14px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.09)',
                          borderRadius: '10px',
                          transition: 'all 0.2s ease',
                        }}
                        title={provider.provider_name}
                      >
                        <img
                          src={`${TMDB_LOGO_BASE}${provider.logo_path}`}
                          alt={provider.provider_name}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                          }}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>
                          {provider.provider_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* JustWatch Link Attribution */}
              {currentData.link && (
                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                  <a
                    href={currentData.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Powered by JustWatch &rarr;
                  </a>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Trailer In-App Player Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoKey={trailerKey}
        movieTitle={movie.title}
      />

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
