import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['All', 'Planned to Watch', 'Currently Watching', 'Watched'];

const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const SharedWatchlistPage = () => {
  const { userId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [sharedUser, setSharedUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  // Authenticated viewer's own watchlist IDs (to show live "+ Add to Watchlist" or "Saved")
  const [viewerWatchlistIds, setViewerWatchlistIds] = useState(new Set());
  const [savingMovieId, setSavingMovieId] = useState(null);

  useEffect(() => {
    const fetchSharedWatchlist = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await API.get(`/watchlist/shared/${userId}`);
        if (data.success) {
          setSharedUser(data.user);
          setWatchlist(data.data || []);
        } else {
          setError(data.message || 'Failed to load shared watchlist.');
        }
      } catch (err) {
        console.error('Error loading shared watchlist', err);
        setError(err.response?.data?.message || 'Watchlist not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSharedWatchlist();
    }
  }, [userId]);

  // If viewer is logged in, load their own watchlist to allow 1-click adding
  useEffect(() => {
    const fetchViewerWatchlist = async () => {
      if (!isAuthenticated) return;
      try {
        const { data } = await API.get('/watchlist');
        if (data.success && Array.isArray(data.data)) {
          setViewerWatchlistIds(new Set(data.data.map((item) => item.tmdbId)));
        }
      } catch (err) {}
    };

    fetchViewerWatchlist();
  }, [isAuthenticated]);

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setToast({ message: 'Public watchlist link copied to clipboard!', type: 'success' });
        setTimeout(() => setCopied(false), 3000);
      });
    } else {
      setToast({ message: 'Link copied: ' + shareUrl, type: 'info' });
    }
  };

  const handleSaveToMyWatchlist = async (movie) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setSavingMovieId(movie.tmdbId);
      const payload = {
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
        overview: movie.overview || '',
        releaseDate: movie.releaseDate || '',
        voteAverage: movie.voteAverage || 0,
        genres: movie.genres || [],
        status: 'Planned to Watch',
      };

      const { data } = await API.post('/watchlist', payload);
      if (data.success) {
        setViewerWatchlistIds((prev) => new Set([...prev, movie.tmdbId]));
        setToast({ message: `Added "${movie.title}" to your watchlist!`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to add movie', type: 'error' });
    } finally {
      setSavingMovieId(null);
    }
  };

  // Filter movies by tab and search query
  const filteredList = watchlist.filter((item) => {
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (Array.isArray(item.genres) &&
        item.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase().trim())));
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Watched':
        return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Currently Watching':
        return { text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' };
      default:
        return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Loading shared cinema watchlist...</p>
      </div>
    );
  }

  if (error || !sharedUser) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '80px 20px',
          maxWidth: '520px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(var(--accent-rgb), 0.15)',
            border: '1px solid rgba(var(--accent-rgb), 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--accent-primary)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>Watchlist Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          {error || 'This public watchlist is unavailable or the user account may have been removed.'}
        </p>
        <Link to="/discover" className="btn btn-primary" style={{ padding: '10px 24px' }}>
          Explore Trending Movies
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Curator Header Banner */}
      <div className="shared-curator-banner">
        <div className="shared-curator-profile">
          {/* Avatar with Red Glow */}
          <div className="shared-curator-avatar">
            {sharedUser.avatar ? (
              <img
                src={sharedUser.avatar}
                alt={sharedUser.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {sharedUser.name?.charAt(0)?.toUpperCase() || 'C'}
              </span>
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 className="shared-curator-title">
                {sharedUser.name}'s Watchlist
              </h1>
              <span
                style={{
                  background: 'rgba(var(--accent-rgb), 0.18)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(var(--accent-rgb), 0.35)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                Public Curator
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, wordBreak: 'break-word' }}>
              Curated collection of <strong>{watchlist.length}</strong> {watchlist.length === 1 ? 'title' : 'titles'}
              {sharedUser.memberSince && ` • Member since ${formatDDMMYYYY(sharedUser.memberSince)}`}
            </p>
          </div>
        </div>

        {/* Share & Copy Link Actions */}
        <div className="shared-curator-actions">
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{
              borderColor: copied ? '#10b981' : undefined,
              color: copied ? '#10b981' : undefined,
            }}
          >
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy Share Link</span>
              </>
            )}
          </button>

          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary">
              Create Your Own
            </Link>
          )}
        </div>
      </div>

      {/* Controls Bar: Tabs and Live Search */}
      <div className="shared-controls-bar">
        {/* Status Filter Tabs */}
        <div className="status-tabs-container cinema-horizontal-scroll">
          {STATUS_TABS.map((tab) => {
            const count =
              tab === 'All' ? watchlist.length : watchlist.filter((m) => m.status === tab).length;

            return (
              <button
                key={tab}
                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab(tab)}
                style={{ borderRadius: '20px', padding: '6px 14px' }}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Search within this watchlist */}
        <div className="shared-search-wrap">
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search titles or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '8px 14px 8px 36px',
                color: '#ffffff',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {filteredList.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-color)',
            borderRadius: '16px',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No movies found matching current filters.</p>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Try selecting a different status tab or clearing the search query.
          </span>
        </div>
      ) : (
        <div className="shared-watchlist-grid">
          {filteredList.map((movie) => {
            const statusStyle = getStatusColor(movie.status);
            const isSavedByViewer = viewerWatchlistIds.has(movie.tmdbId);
            const isSaving = savingMovieId === movie.tmdbId;

            return (
              <div
                key={movie._id || movie.tmdbId}
                className="shared-movie-card"
              >
                {/* Poster linking to movie details */}
                <Link
                  to={`/movies/${movie.tmdbId}`}
                  className="shared-movie-poster-wrap"
                  title={`View details for ${movie.title}`}
                >
                  {movie.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                      alt={movie.title}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: 'var(--text-dim)',
                        gap: '6px',
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                        <line x1="7" y1="2" x2="7" y2="22" />
                        <line x1="17" y1="2" x2="17" y2="22" />
                      </svg>
                      <span style={{ fontSize: '0.78rem' }}>No Poster</span>
                    </div>
                  )}

                  {/* Rating Tag */}
                  {movie.voteAverage > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.78)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffb800',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '3px 7px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid rgba(255, 184, 0, 0.3)',
                      }}
                    >
                      <span>★</span>
                      <span>{Number(movie.voteAverage).toFixed(1)}</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      backdropFilter: 'blur(6px)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '5px',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {movie.status || 'Planned to Watch'}
                  </div>
                </Link>

                {/* Card Content Info */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1, gap: '5px' }}>
                  <Link to={`/movies/${movie.tmdbId}`} style={{ color: 'inherit' }}>
                    <h3
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        margin: 0,
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={movie.title}
                    >
                      {movie.title}
                    </h3>
                  </Link>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>{movie.releaseDate ? formatDDMMYYYY(movie.releaseDate) : 'TBA'}</span>
                    {Array.isArray(movie.genres) && movie.genres.length > 0 && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75px' }}>
                        {movie.genres[0]}
                      </span>
                    )}
                  </div>

                  {/* Action Button: Add to viewer's own watchlist */}
                  <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                    {isSavedByViewer ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          width: '100%',
                          padding: '7px 6px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'default',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>In Your Watchlist</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveToMyWatchlist(movie)}
                        disabled={isSaving}
                        style={{
                          width: '100%',
                          padding: '7px 6px',
                          background: 'rgba(var(--accent-rgb), 0.15)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(var(--accent-rgb), 0.35)',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--accent-primary)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(229, 9, 20, 0.15)';
                          e.currentTarget.style.color = '#ff4d4d';
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>{isSaving ? 'Saving...' : 'Add to Watchlist'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Center Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default SharedWatchlistPage;
