import React, { useState, useEffect } from 'react';

const ReminderModal = ({ isOpen, onClose, movie, onSave }) => {
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('20:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (movie) {
      setReminderDate(movie.reminderDate || '');
      setReminderTime(movie.reminderTime || '20:00');
      setNotes(movie.notes || '');
    }
  }, [movie]);

  if (!isOpen || !movie) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reminderDate) {
      alert('Please select a reminder date');
      return;
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>

        <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>⏰ Set Movie Reminder</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Schedule when you want to watch <strong>{movie.title}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reminder Date</label>
            <input
              type="date"
              className="form-control"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reminder Time</label>
            <input
              type="time"
              className="form-control"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Personal Note (Optional)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g., Movie night with friends, grab popcorn!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
