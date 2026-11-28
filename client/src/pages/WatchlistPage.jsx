import React, { useState, useEffect } from 'react';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import ReminderModal from '../components/ReminderModal';
import ConfirmModal from '../components/ConfirmModal';
import CinemaTicketModal from '../components/CinemaTicketModal';
import CinemaTicketStub from '../components/CinemaTicketStub';
import Toast from '../components/Toast';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_TABS = ['All', 'Planned to Watch', 'Currently Watching', 'Watched'];

const WatchlistPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [ticketViewMode, setTicketViewMode] = useState('grid'); // 'grid' | 'tickets'
  const [selectedMovieForTicket, setSelectedMovieForTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedMovieForReminder, setSelectedMovieForReminder] = useState(null);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Sync tab from query param if provided (e.g. ?tab=Watched)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && STATUS_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Fetch Watchlist items
  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/watchlist');
      if (data.success) {
        setWatchlist(data.data);
      }
    } catch (err) {
      console.error('Error fetching watchlist', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Handle status update
  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.patch(`/watchlist/${id}`, { status: newStatus });
      setWatchlist((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
      );
      setToast({ message: `Updated status to "${newStatus}"`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  // Request item removal (opens styled cinema prompt)
  const handleDeleteRequest = (itemOrId) => {
    if (typeof itemOrId === 'object' && itemOrId !== null) {
      setMovieToDelete(itemOrId);
    } else {
      const found = watchlist.find((item) => item._id === itemOrId);
      setMovieToDelete(found || { _id: itemOrId });
    }
  };

  // Confirm item removal
  const handleConfirmDelete = async () => {
    if (!movieToDelete) return;
    const id = movieToDelete._id;

    try {
      await API.delete(`/watchlist/${id}`);
      setWatchlist((prev) => prev.filter((item) => item._id !== id));
      setToast({ message: 'Movie removed from watchlist', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete item', type: 'error' });
    } finally {
      setMovieToDelete(null);
    }
  };

  // Handle reminder save
  const handleSaveReminder = async (reminderData) => {
    try {
      const { data } = await API.patch(
        `/watchlist/${selectedMovieForReminder._id}`,
        reminderData
      );
      if (data.success) {
        setWatchlist((prev) =>
          prev.map((item) =>
            item._id === selectedMovieForReminder._id ? data.data : item
          )
        );
        setSelectedMovieForReminder(null);
        window.dispatchEvent(new CustomEvent('cineverse_reminder_updated'));
        setToast({ message: 'Reminder scheduled successfully!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to set reminder', type: 'error' });
    }
  };

  // Construct public share URL
  const getShareUrl = () =>
    `${window.location.origin}/shared/watchlist/${user?._id || user?.id || ''}`;

  const handleCopyShareLink = () => {
    const shareUrl = getShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setLinkCopied(true);
        setToast({ message: 'Public watchlist link copied to clipboard!', type: 'success' });
        setTimeout(() => setLinkCopied(false), 3000);
      });
    } else {
      setToast({ message: 'Link: ' + shareUrl, type: 'info' });
    }
  };

  // Filter items by status tab
  const filteredList = watchlist.filter((item) => {
    if (activeTab === 'All') return true;
    return item.status === activeTab;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
            My Watchlist
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track your movies, organize plans, and manage watching statuses
          </p>
        </div>

        <div className="watchlist-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Get Shareable Public Link"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Share Watchlist</span>
          </button>

          <Link to="/discover" className="btn btn-primary">
            + Add More Movies
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs & Watched View Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="status-tabs-container cinema-horizontal-scroll" style={{ display: 'flex', gap: '8px' }}>
          {STATUS_TABS.map((tab) => {
            const count =
              tab === 'All'
                ? watchlist.length
                : watchlist.filter((m) => m.status === tab).length;

            return (
              <button
                key={tab}
                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle when viewing Watched Movies */}
        {activeTab === 'Watched' && filteredList.length > 0 && (
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${ticketViewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 12px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setTicketViewMode('grid')}
            >
              Cards
            </button>
            <button
              type="button"
              className={`btn btn-sm ${ticketViewMode === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '5px 12px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => setTicketViewMode('tickets')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              <span>Ticket Passes ({filteredList.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Watchlist Grid or Ticket Passes Gallery */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your watchlist...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>No movies in "{activeTab}"</h3>
          <p>Explore trending movies and add them to your collection!</p>
          <Link to="/discover" className="btn btn-primary">
            Explore Catalogue
          </Link>
        </div>
      ) : activeTab === 'Watched' && ticketViewMode === 'tickets' ? (
        /* Collectible Cinema Ticket Stubs Gallery */
        <div className="ticket-passes-collection-view">
          <div className="ticket-collection-banner">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f3e5ab' }}>
                Collectible Cinema Archive Passes
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Your personal digital collection of verified cinema screening ticket stubs. Download high-res PNG passes anytime.
              </p>
            </div>
          </div>

          <div className="ticket-passes-stack">
            {filteredList.map((movie) => (
              <div key={movie._id} className="ticket-gallery-item">
                <CinemaTicketStub
                  movie={movie}
                  watchDate={movie.watchedAt || movie.updatedAt || movie.releaseDate}
                  userRating={movie.voteAverage}
                  showDownloadButton={true}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="movies-grid">
          {filteredList.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              isWatchlistItem={true}
              onStatusChange={handleStatusChange}
              onDelete={() => handleDeleteRequest(movie)}
              onOpenReminder={(m) => setSelectedMovieForReminder(m)}
              onOpenTicketStub={(m) => setSelectedMovieForTicket(m)}
            />
          ))}
        </div>
      )}

      {/* Collectible Ticket Stub Modal */}
      <CinemaTicketModal
        isOpen={!!selectedMovieForTicket}
        onClose={() => setSelectedMovieForTicket(null)}
        movie={selectedMovieForTicket}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={!!selectedMovieForReminder}
        onClose={() => setSelectedMovieForReminder(null)}
        movie={selectedMovieForReminder}
        onSave={handleSaveReminder}
      />

      {/* Cinema-styled Confirm Removal Modal */}
      <ConfirmModal
        isOpen={!!movieToDelete}
        badgeText="Watchlist Action"
        title="Remove from Watchlist?"
        movieTitle={movieToDelete?.title}
        posterPath={movieToDelete?.posterPath}
        message="Are you sure you want to remove this movie from your watchlist? Any scheduled reminders and notes for it will be cleared."
        confirmText="Remove Movie"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setMovieToDelete(null)}
      />

      {/* Share Watchlist Modal */}
      {isShareModalOpen && (
        <div className="modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div
            className="modal-content custom-reminder-modal"
            style={{ maxWidth: '480px', width: '92%', padding: '22px 18px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(var(--accent-rgb), 0.15)',
                    border: '1px solid rgba(var(--accent-rgb), 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Share Your Watchlist
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '18px' }}>
              Anyone with this public link can explore your bookmarked movies, ratings, and watching progress in a clean cinema view.
            </p>

            {/* Link Copy Box */}
            <div className="share-modal-link-box">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="share-modal-input"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="share-modal-copy-btn"
                style={{
                  background: linkCopied ? '#10b981' : 'var(--accent-primary)',
                }}
              >
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Quick Share Targets */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Quick Share
              </span>
              <div className="share-modal-socials">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Check out my movie watchlist on CineVerse: ' + getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm share-modal-social-btn"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my movie watchlist on CineVerse: ' + getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm share-modal-social-btn"
                >
                  X (Twitter)
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent('Check out my movie watchlist on CineVerse')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm share-modal-social-btn"
                >
                  Telegram
                </a>
              </div>
            </div>

            {/* Preview Link */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                to={`/shared/watchlist/${user?._id || user?.id}`}
                target="_blank"
                style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}
              >
                Preview Public View →
              </Link>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default WatchlistPage;
