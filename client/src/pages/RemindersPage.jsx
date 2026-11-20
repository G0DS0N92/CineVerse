import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const isDueOrPast = (dateStr, timeStr) => {
  if (!dateStr) return false;
  const time = timeStr || '20:00';
  const cleanTime = time.length === 5 ? time : time.padStart(5, '0');
  const target = new Date(`${dateStr}T${cleanTime}:00`);
  return !isNaN(target.getTime()) && new Date() >= target;
};

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reminderToDelete, setReminderToDelete] = useState(null);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/watchlist/reminders');
      if (data.success) {
        setReminders(data.data);
      }
    } catch (err) {
      console.error('Error fetching reminders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleToggleComplete = async (reminder) => {
    try {
      const newStatus = reminder.reminderStatus === 'completed' ? 'pending' : 'completed';
      await API.patch(`/watchlist/${reminder._id}`, { reminderStatus: newStatus });
      setReminders((prev) =>
        prev.map((r) => (r._id === reminder._id ? { ...r, reminderStatus: newStatus } : r))
      );
      window.dispatchEvent(new CustomEvent('cineverse_reminder_updated'));
      setMessage(`Reminder marked as ${newStatus}!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update reminder status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!reminderToDelete) return;
    const id = reminderToDelete._id;

    try {
      // Clear reminder fields
      await API.patch(`/watchlist/${id}`, {
        reminderDate: '',
        reminderTime: '',
        reminderStatus: 'none',
        notes: '',
      });
      setReminders((prev) => prev.filter((r) => r._id !== id));
      window.dispatchEvent(new CustomEvent('cineverse_reminder_updated'));
      setMessage('Reminder cleared!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to delete reminder');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setReminderToDelete(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Movie Reminders
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Never miss a movie night. Scheduled dates, times, and personal notes.
          </p>
        </div>

        <Link to="/watchlist" className="btn btn-secondary">
          Go to Watchlist
        </Link>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Fetching scheduled reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>No reminders scheduled</h3>
          <p>Add reminders to movies in your watchlist so you get notified when to watch!</p>
          <Link to="/watchlist" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Schedule a Reminder
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reminders.map((r) => {
            const isCompleted = r.reminderStatus === 'completed';
            const isDue = !isCompleted && isDueOrPast(r.reminderDate, r.reminderTime);

            return (
              <div
                key={r._id}
                style={{
                  background: 'var(--bg-card)',
                  border: isDue ? '1px solid rgba(229, 9, 20, 0.4)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap',
                  opacity: isCompleted ? 0.65 : 1,
                  boxShadow: isDue ? '0 4px 20px rgba(229, 9, 20, 0.15)' : 'none',
                }}
              >
                {/* Left: Thumbnail and Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <Link
                    to={r.tmdbId ? `/movies/${r.tmdbId}` : '#'}
                    style={{ display: 'block', textDecoration: 'none' }}
                    title={`View details for ${r.title}`}
                  >
                    {r.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${r.posterPath}`}
                        alt={r.title}
                        style={{
                          width: '56px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          display: 'block',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '80px',
                          background: '#202b3f',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                        }}
                      >
                        N/A
                      </div>
                    )}
                  </Link>

                  <div>
                    <Link
                      to={r.tmdbId ? `/movies/${r.tmdbId}` : '#'}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      title={`View details for ${r.title}`}
                    >
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          marginBottom: '6px',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                      >
                        {r.title}
                      </h3>
                    </Link>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 500 }}>{formatDDMMYYYY(r.reminderDate)}</span>
                      <span>{r.reminderTime || '20:00'}</span>

                      {isCompleted ? (
                        <span className="status-badge status-watched">Completed</span>
                      ) : isDue ? (
                        <span
                          className="status-badge"
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontWeight: 700,
                          }}
                        >
                          Due Now
                        </span>
                      ) : (
                        <span className="status-badge status-planned">Scheduled</span>
                      )}
                    </div>

                    {r.notes && (
                      <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        Note: "{r.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {r.tmdbId && (
                    <Link to={`/movies/${r.tmdbId}`} className="btn btn-secondary btn-sm">
                      Details
                    </Link>
                  )}

                  <button
                    onClick={() => handleToggleComplete(r)}
                    className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  </button>

                  <button
                    onClick={() => setReminderToDelete(r)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cinema Styled Confirm Delete Reminder Modal */}
      <ConfirmModal
        isOpen={!!reminderToDelete}
        badgeText="Movie Reminder"
        title="Delete this reminder?"
        movieTitle={reminderToDelete?.title}
        posterPath={reminderToDelete?.posterPath}
        message="The scheduled reminder will be cleared, but the movie will remain safely in your watchlist."
        confirmText="Delete Reminder"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setReminderToDelete(null)}
      />
    </div>
  );
};

export default RemindersPage;
