import React, { useState, useEffect, useRef } from 'react';
import CustomDatePicker from './CustomDatePicker';

const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const ReminderModal = ({ isOpen, onClose, movie, onSave }) => {
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('20:00');
  const [notes, setNotes] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (movie) {
      setReminderDate(movie.reminderDate || new Date().toISOString().split('T')[0]);
      setReminderTime(movie.reminderTime || '20:00');
      setNotes(movie.notes || '');
    }
  }, [movie]);

  // Auto-expand textarea on content change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [notes, isOpen]);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  if (!isOpen || !movie) return null;

  const movieTitle = movie.title || movie.name || 'Movie';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reminderDate) {
      alert('Please select a reminder date from the calendar');
      return;
    }

    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch (err) {}
    }

    onSave({
      reminderDate,
      reminderTime,
      reminderStatus: 'pending',
      notes,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content custom-reminder-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '94%', padding: '24px 28px' }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '4px' }}>
            Schedule Movie Watch
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Set a reminder for <strong style={{ color: 'var(--text-main)' }}>{movieTitle}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Horizontal 2-Column Layout */}
          <div className="reminder-modal-grid">
            {/* Left Column: Red & Black Interactive Calendar */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label className="form-label" style={{ margin: 0 }}>
                  Select Watch Date
                </label>
                {reminderDate && (
                  <span className="selected-date-badge">
                    {formatDDMMYYYY(reminderDate)}
                  </span>
                )}
              </div>

              <CustomDatePicker
                selectedDate={reminderDate}
                onDateSelect={(d) => setReminderDate(d)}
              />
            </div>

            {/* Right Column: Time Selector, Auto-Expanding Note & Actions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '320px',
              }}
            >
              <div>
                {/* Time Selector (Quick preset buttons removed as requested) */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Reminder Time</label>
                  <input
                    type="time"
                    className="form-control"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.95rem',
                      background: 'rgba(10, 14, 22, 0.8)',
                      borderColor: 'rgba(var(--accent-rgb), 0.25)',
                    }}
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    required
                  />
                </div>

                {/* Personal Note (Auto-extends as user types) */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Personal Note (Optional)</label>
                  <textarea
                    ref={textareaRef}
                    className="form-control"
                    rows="3"
                    placeholder="e.g., Movie night with friends, grab popcorn!"
                    value={notes}
                    onChange={handleNotesChange}
                    maxLength={500}
                    style={{
                      resize: 'none',
                      overflowY: notes.length > 200 ? 'auto' : 'hidden',
                      minHeight: '85px',
                      maxHeight: '180px',
                      transition: 'height 0.12s ease',
                      background: 'rgba(10, 14, 22, 0.8)',
                      borderColor: 'rgba(var(--accent-rgb), 0.25)',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '10px',
                }}
              >
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: '135px' }}
                >
                  Save Reminder
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
