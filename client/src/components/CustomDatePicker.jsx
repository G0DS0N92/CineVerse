import React, { useState } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CustomDatePicker = ({ selectedDate, onDateSelect }) => {
  // Parse initial date or default to today
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Today for disabling past dates and highlighting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Format date helper: YYYY-MM-DD
  const formatYMD = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Quick preset handlers
  const handleSelectToday = () => {
    const now = new Date();
    onDateSelect(formatYMD(now.getFullYear(), now.getMonth(), now.getDate()));
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const handleSelectTomorrow = () => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    onDateSelect(formatYMD(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate()));
    setViewYear(tmrw.getFullYear());
    setViewMonth(tmrw.getMonth());
  };

  const handleSelectThisWeekend = () => {
    const sat = new Date();
    const dayOfWeek = sat.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    sat.setDate(sat.getDate() + daysUntilSaturday);
    onDateSelect(formatYMD(sat.getFullYear(), sat.getMonth(), sat.getDate()));
    setViewYear(sat.getFullYear());
    setViewMonth(sat.getMonth());
  };

  // Calendar calculations
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days = [];
  // Empty padding slots for days before the 1st
  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ day: null });
  }
  // Days of the month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const thisDate = new Date(viewYear, viewMonth, d);
    thisDate.setHours(0, 0, 0, 0);

    const isPast = thisDate < today;
    const isToday = thisDate.getTime() === today.getTime();
    const dateStr = formatYMD(viewYear, viewMonth, d);
    const isSelected = selectedDate === dateStr;

    days.push({
      day: d,
      dateStr,
      isPast,
      isToday,
      isSelected,
    });
  }

  return (
    <div className="custom-calendar-widget">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-month-title">
          <span>{MONTH_NAMES[viewMonth]}</span>
          <span className="calendar-year-badge">{viewYear}</span>
        </div>

        <div className="calendar-nav-buttons">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            title="Previous Month"
          >
            &#8249;
          </button>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            title="Next Month"
          >
            &#8242;
          </button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="calendar-weekdays-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-weekday-cell">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-days-grid">
        {days.map((item, index) => {
          if (!item.day) {
            return <div key={`empty-${index}`} className="calendar-day-empty" />;
          }

          return (
            <button
              key={item.dateStr}
              type="button"
              className={`calendar-day-btn ${item.isSelected ? 'selected' : ''} ${
                item.isToday ? 'today' : ''
              } ${item.isPast ? 'disabled' : ''}`}
              disabled={item.isPast}
              onClick={() => onDateSelect(item.dateStr)}
            >
              <span>{item.day}</span>
              {item.isToday && !item.isSelected && <span className="today-dot" />}
            </button>
          );
        })}
      </div>

      {/* Quick Presets */}
      <div className="calendar-quick-presets">
        <button type="button" className="preset-pill" onClick={handleSelectToday}>
          Today
        </button>
        <button type="button" className="preset-pill" onClick={handleSelectTomorrow}>
          Tomorrow
        </button>
        <button type="button" className="preset-pill" onClick={handleSelectThisWeekend}>
          Weekend
        </button>
      </div>
    </div>
  );
};

export default CustomDatePicker;
