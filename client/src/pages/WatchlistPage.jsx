import React, { useState, useEffect } from 'react';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import ReminderModal from '../components/ReminderModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';

const STATUS_TABS = ['All', 'Planned to Watch', 'Currently Watching', 'Watched'];

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedMovieForReminder, setSelectedMovieForReminder] = useState(null);
  const [movieToDelete, setMovieToDelete] = useState(null);

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

        <Link to="/discover" className="btn btn-primary">
          + Add More Movies
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
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

      {/* Watchlist Grid */}
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
            />
          ))}
        </div>
      )}

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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default WatchlistPage;
