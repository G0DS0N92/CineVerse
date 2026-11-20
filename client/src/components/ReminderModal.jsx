import React, { useState, useEffect } from 'react';
import CustomDatePicker from './CustomDatePicker';

const TIME_PRESETS = [
  { label: '15:00', time: '15:00' },
  { label: '20:00', time: '20:00' },
  { label: '22:00', time: '22:00' },
];

const ReminderModal = ({ isOpen, onClose, movie, onSave }) => {
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('20:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (movie) {
      setReminderDate(movie.reminderDate || new Date().toISOString().split('T')[0]);
      setReminderTime(movie.reminderTime || '20:00');
      setNotes(movie.notes || '');
    }
  }, [movie]);

  if (!isOpen || !movie) return null;

  const movieTitle = movie.title || movie.name || 'Movie';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reminderDate) {
      alert('Please select a reminder date from the calendar');
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
      <div
        className="modal-content custom-reminder-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px' }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '4px' }}>
            Schedule Movie Watch
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Set a reminder for <strong style={{ color: 'var(--text-main)' }}>{movieTitle}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Custom Dark Theme Interactive Calendar */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Select Watch Date
              </label>
              {reminderDate && (
                <span className="selected-date-badge">
                  {reminderDate}
                </span>
              )}
            </div>

            <CustomDatePicker
              selectedDate={reminderDate}
              onDateSelect={(d) => setReminderDate(d)}
            />
          </div>

          {/* Time Selector with Quick Presets */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Reminder Time</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="time"
                className="form-control"
                style={{ width: '130px', padding: '8px 12px' }}
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.time}
                    type="button"
                    className={`btn btn-sm ${
                      reminderTime === p.time ? 'btn-primary' : 'btn-secondary'
                    }`}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem' }}
                    onClick={() => setReminderTime(p.time)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Note */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Personal Note (Optional)</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="e.g., Movie night with friends, grab popcorn!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '140px' }}>
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
