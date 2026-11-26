import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import ReminderModal from '../components/ReminderModal';

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
  const target = new Date(`${dateStr.split('T')[0]}T${cleanTime}:00`);
  return !isNaN(target.getTime()) && new Date() >= target;
};

const getRelativeCountdown = (dateStr, timeStr, status) => {
  if (status === 'completed') {
    return { text: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (!dateStr) {
    return { text: 'Scheduled', color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.08)' };
  }

  const time = timeStr || '20:00';
  const cleanTime = time.length === 5 ? time : time.padStart(5, '0');
  const target = new Date(`${dateStr.split('T')[0]}T${cleanTime}:00`);
  const now = new Date();

  if (isNaN(target.getTime())) {
    return { text: 'Scheduled', color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.08)' };
  }

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return { text: 'Due Now / Overdue', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
  }

  if (now.toDateString() === target.toDateString()) {
    return { text: `Today at ${time}`, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' };
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (tomorrow.toDateString() === target.toDateString()) {
    return { text: `Tomorrow at ${time}`, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' };
  }

  if (diffDays > 1 && diffDays <= 7) {
    return { text: `In ${diffDays} days`, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' };
  }

  return { text: `Scheduled for ${formatDDMMYYYY(dateStr)}`, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.08)' };
};

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'due', 'completed'
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [reminderToEdit, setReminderToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleOpenEdit = (reminder) => {
    setReminderToEdit(reminder);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedReminder = async (formData) => {
    if (!reminderToEdit) return;
    try {
      await API.patch(`/watchlist/${reminderToEdit._id}`, {
        reminderDate: formData.reminderDate,
        reminderTime: formData.reminderTime,
        notes: formData.notes,
        reminderStatus: 'pending',
      });

      setReminders((prev) =>
        prev.map((r) =>
          r._id === reminderToEdit._id
            ? { ...r, ...formData, reminderStatus: 'pending' }
            : r
        )
      );

      setIsEditModalOpen(false);
      setReminderToEdit(null);
      window.dispatchEvent(new CustomEvent('cineverse_reminder_updated'));
      setMessage('Reminder rescheduled successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update reminder');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Google Calendar 1-Click Link
  const getGoogleCalendarUrl = (reminder) => {
    const dateStr = reminder.reminderDate ? reminder.reminderDate.split('T')[0] : '';
    const timeStr = reminder.reminderTime || '20:00';
    if (!dateStr) return '#';

    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    const startStr = `${year}${month}${day}T${hours || '20'}${minutes || '00'}00`;
    const endHours = String((parseInt(hours || '20', 10) + 2) % 24).padStart(2, '0');
    const endStr = `${year}${month}${day}T${endHours}${minutes || '00'}00`;

    const title = encodeURIComponent(`Watch: ${reminder.title}`);
    const details = encodeURIComponent(
      `Movie Watch Reminder for "${reminder.title}".\n\nNotes: ${reminder.notes || 'None'}\n\nManaged via CineVerse: https://cineverse-movie-hub.vercel.app`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  };

  // Apple Calendar & Outlook (.ics) Download
  const downloadIcsFile = (reminder) => {
    const dateStr = reminder.reminderDate ? reminder.reminderDate.split('T')[0] : '';
    const timeStr = reminder.reminderTime || '20:00';
    if (!dateStr) return;

    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    const startStr = `${year}${month}${day}T${hours || '20'}${minutes || '00'}00`;
    const endHours = String((parseInt(hours || '20', 10) + 2) % 24).padStart(2, '0');
    const endStr = `${year}${month}${day}T${endHours}${minutes || '00'}00`;

    const cleanTitle = reminder.title.replace(/[,;]/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CineVerse Movie Hub//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:cineverse-${reminder._id || Date.now()}@cineverse.com`,
      `DTSTAMP:${startStr}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Watch: ${cleanTitle}`,
      `DESCRIPTION:Movie watch reminder for ${cleanTitle}.${reminder.notes ? ' Notes: ' + reminder.notes.replace(/\n/g, ' ') : ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${cleanTitle.replace(/[^a-zA-Z0-9]/g, '_')}_reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Counters
  const totalCount = reminders.length;
  const upcomingCount = reminders.filter(
    (r) => r.reminderStatus !== 'completed' && !isDueOrPast(r.reminderDate, r.reminderTime)
  ).length;
  const dueCount = reminders.filter(
    (r) => r.reminderStatus !== 'completed' && isDueOrPast(r.reminderDate, r.reminderTime)
  ).length;
  const completedCount = reminders.filter((r) => r.reminderStatus === 'completed').length;

  // Filtered Reminders List
  const filteredReminders = reminders.filter((r) => {
    const isCompleted = r.reminderStatus === 'completed';
    const isDue = !isCompleted && isDueOrPast(r.reminderDate, r.reminderTime);

    if (activeTab === 'upcoming') return !isCompleted && !isDue;
    if (activeTab === 'due') return !isCompleted && isDue;
    if (activeTab === 'completed') return isCompleted;
    return true; // 'all'
  });

  return (
    <div>
      {/* Dashboard Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(var(--accent-rgb), 0.15)',
                color: 'var(--accent-primary)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            Movie Reminders Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track scheduled movie nights, countdowns, and sync with your favorite calendar apps.
          </p>
        </div>

        <Link to="/watchlist" className="btn btn-secondary" style={{ padding: '9px 18px' }}>
          &larr; Back to Watchlist
        </Link>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {/* Summary Stat Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          onClick={() => setActiveTab('all')}
          style={{
            background: activeTab === 'all' ? 'rgba(var(--accent-rgb), 0.12)' : 'var(--bg-card)',
            border: activeTab === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Reminders</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#ffffff' }}>{totalCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('upcoming')}
          style={{
            background: activeTab === 'upcoming' ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card)',
            border: activeTab === 'upcoming' ? '1px solid #38bdf8' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>Upcoming</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#38bdf8' }}>{upcomingCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('due')}
          style={{
            background: activeTab === 'due' ? 'rgba(239, 68, 68, 0.18)' : 'var(--bg-card)',
            border: activeTab === 'due' ? '1px solid #ef4444' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Due Now / Past Due</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#ef4444' }}>{dueCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          style={{
            background: activeTab === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
            border: activeTab === 'completed' ? '1px solid #10b981' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Completed</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>{completedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="cinema-horizontal-scroll"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '20px', padding: '6px 16px' }}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '20px', padding: '6px 16px' }}
        >
          Upcoming ({upcomingCount})
        </button>
        <button
          onClick={() => setActiveTab('due')}
          className={`btn btn-sm ${activeTab === 'due' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '20px', padding: '6px 16px' }}
        >
          Due Now ({dueCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '20px', padding: '6px 16px' }}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Fetching scheduled reminders...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>No reminders in this view</h3>
          <p>
            {activeTab === 'all'
              ? 'Add reminders to movies in your watchlist so you get notified when to watch!'
              : `You have zero ${activeTab} reminders right now.`}
          </p>
          <Link to="/watchlist" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Schedule a Movie Reminder
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReminders.map((r) => {
            const isCompleted = r.reminderStatus === 'completed';
            const isDue = !isCompleted && isDueOrPast(r.reminderDate, r.reminderTime);
            const countdown = getRelativeCountdown(r.reminderDate, r.reminderTime, r.reminderStatus);

            return (
              <div
                key={r._id}
                style={{
                  background: 'var(--bg-card)',
                  border: isDue ? '1px solid rgba(var(--accent-rgb), 0.45)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap',
                  opacity: isCompleted ? 0.65 : 1,
                  boxShadow: isDue ? '0 4px 20px rgba(var(--accent-rgb), 0.15)' : 'none',
                }}
              >
                {/* Left: Thumbnail and Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: '280px', flex: '1 1 300px' }}>
                  <Link
                    to={r.tmdbId ? `/movies/${r.tmdbId}` : '#'}
                    style={{ display: 'block', textDecoration: 'none', flexShrink: 0 }}
                    title={`View details for ${r.title}`}
                  >
                    {r.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${r.posterPath}`}
                        alt={r.title}
                        style={{
                          width: '64px',
                          height: '92px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'block',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '64px',
                          height: '92px',
                          background: '#1a2233',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                        }}
                      >
                        N/A
                      </div>
                    )}
                  </Link>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <Link
                        to={r.tmdbId ? `/movies/${r.tmdbId}` : '#'}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        title={`View details for ${r.title}`}
                      >
                        <h3
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            margin: 0,
                            cursor: 'pointer',
                          }}
                        >
                          {r.title}
                        </h3>
                      </Link>

                      {/* Dynamic Relative Countdown Pill */}
                      <span
                        style={{
                          background: countdown.bg,
                          color: countdown.color,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {countdown.text}
                      </span>
                    </div>

                    {/* Schedule Date & Time Row */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'center',
                        fontSize: '0.88rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap',
                        marginBottom: r.notes ? '8px' : '0',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDDMMYYYY(r.reminderDate)}
                      </span>

                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {r.reminderTime || '20:00'}
                      </span>
                    </div>

                    {/* Notes */}
                    {r.notes && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '0.82rem',
                          color: 'var(--text-dim)',
                          fontStyle: 'italic',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          borderLeft: '2px solid rgba(var(--accent-rgb), 0.6)',
                        }}
                      >
                        "{r.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions, Calendar Sync & Reschedule */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Google Calendar 1-Click Link */}
                  <a
                    href={getGoogleCalendarUrl(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      padding: '6px 12px',
                      textDecoration: 'none',
                    }}
                    title="Add to Google Calendar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Google Cal
                  </a>

                  {/* Apple / Outlook .ics Export */}
                  <button
                    type="button"
                    onClick={() => downloadIcsFile(r)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      padding: '6px 12px',
                    }}
                    title="Download .ics Calendar File (Apple Calendar, Outlook)"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    .ICS
                  </button>

                  {/* Reschedule / Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(r)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    title="Reschedule or update reminder notes"
                  >
                    Reschedule
                  </button>

                  {/* Toggle Complete Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(r)}
                    className={`btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {isCompleted ? 'Mark Pending' : 'Complete'}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setReminderToDelete(r)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    title="Clear Reminder"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      <ReminderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setReminderToEdit(null);
        }}
        movie={reminderToEdit}
        onSave={handleSaveEditedReminder}
      />

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
