import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import ReminderAlertModal from './ReminderAlertModal';
import Toast from './Toast';

// Synthesize a high-fidelity cinematic chime using the Web Audio API
const playCinemaChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Harmonic bell note 1: F#5 (739.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(739.99, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Harmonic bell note 2: B5 (987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.16);
    gain2.gain.setValueAtTime(0.22, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 1.2);
  } catch (e) {
    // Autoplay restrictions handle gracefully
  }
};

const getStoredAlertedIds = () => {
  try {
    return new Set(JSON.parse(sessionStorage.getItem('cineverse_alerted_reminder_ids') || '[]'));
  } catch (e) {
    return new Set();
  }
};

const saveAlertedId = (id) => {
  try {
    const ids = Array.from(getStoredAlertedIds());
    if (!ids.includes(id)) {
      ids.push(id);
      sessionStorage.setItem('cineverse_alerted_reminder_ids', JSON.stringify(ids));
    }
  } catch (e) {}
};

const ReminderNotificationListener = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reminders, setReminders] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [toast, setToast] = useState(null);

  // Keep track of alerted and snoozed reminders
  const alertedIdsRef = useRef(getStoredAlertedIds());
  const snoozedMapRef = useRef({});

  // Fetch all pending reminders for current authenticated user
  const fetchReminders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await API.get('/watchlist/reminders');
      if (data.success && Array.isArray(data.data)) {
        setReminders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reminders for listener', err);
    }
  }, [isAuthenticated]);

  // Initial fetch and poll every 25 seconds
  useEffect(() => {
    if (!isAuthenticated) {
      setReminders([]);
      setActiveAlert(null);
      return;
    }

    fetchReminders();

    const pollInterval = setInterval(() => {
      fetchReminders();
    }, 25000);

    // Also listen for instant reminder updates triggered by user actions
    const handleReminderUpdateEvent = () => {
      fetchReminders();
    };

    window.addEventListener('cineverse_reminder_updated', handleReminderUpdateEvent);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('cineverse_reminder_updated', handleReminderUpdateEvent);
    };
  }, [isAuthenticated, fetchReminders]);

  // Fast check loop running every 2.5 seconds to detect when a reminder's time arrives
  useEffect(() => {
    if (!isAuthenticated || !reminders || reminders.length === 0) return;

    const checkInterval = setInterval(() => {
      // If an alert is already active on screen, don't overlap with another
      if (activeAlert) return;

      const now = new Date();
      const nowMs = now.getTime();

      for (const rem of reminders) {
        if (rem.reminderStatus !== 'pending') continue;
        if (!rem.reminderDate) continue;

        // Check if currently snoozed
        if (snoozedMapRef.current[rem._id] && snoozedMapRef.current[rem._id] > nowMs) {
          continue;
        }

        // Check if already popped up in this session
        if (alertedIdsRef.current.has(rem._id)) {
          continue;
        }

        // Construct target Date in browser's local timezone
        const timeStr = rem.reminderTime || '20:00';
        const cleanTime = timeStr.length === 5 ? timeStr : timeStr.padStart(5, '0');
        const targetDate = new Date(`${rem.reminderDate}T${cleanTime}:00`);

        if (isNaN(targetDate.getTime())) continue;

        const diff = nowMs - targetDate.getTime();

        // If target date/time has arrived and was scheduled within the past 24 hours
        if (diff >= 0 && diff < 24 * 60 * 60 * 1000) {
          // Register as alerted
          alertedIdsRef.current.add(rem._id);
          saveAlertedId(rem._id);

          // Play chime sound & set alert modal active
          playCinemaChime();
          setActiveAlert(rem);

          // Trigger native browser notification if granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`CineVerse: Time to watch ${rem.title}!`, {
                body: rem.notes
                  ? `"${rem.notes}" - Scheduled movie reminder.`
                  : `Your scheduled movie night has arrived. Enjoy your watch!`,
                icon: rem.posterPath ? `https://image.tmdb.org/t/p/w200${rem.posterPath}` : undefined,
              });
            } catch (e) {}
          }

          break; // Show one modal at a time
        }
      }
    }, 2500);

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, reminders, activeAlert]);

  // Action: Watch Now
  const handleWatchNow = async (rem) => {
    try {
      await API.patch(`/watchlist/${rem._id}`, { reminderStatus: 'completed' });
      setReminders((prev) =>
        prev.map((item) => (item._id === rem._id ? { ...item, reminderStatus: 'completed' } : item))
      );
      window.dispatchEvent(new CustomEvent('cineverse_reminder_updated'));
    } catch (e) {
      console.error('Failed to mark reminder completed', e);
    }

    setActiveAlert(null);
    if (rem.tmdbId) {
      navigate(`/movies/${rem.tmdbId}`);
    }
  };

  // Action: Snooze for 10 minutes
  const handleSnooze = (rem) => {
    const snoozeDurationMs = 10 * 60 * 1000;
    snoozedMapRef.current[rem._id] = Date.now() + snoozeDurationMs;

    // Allow re-alerting once snooze expires
    alertedIdsRef.current.delete(rem._id);
    try {
      const stored = Array.from(getStoredAlertedIds()).filter((id) => id !== rem._id);
      sessionStorage.setItem('cineverse_alerted_reminder_ids', JSON.stringify(stored));
    } catch (e) {}

    setActiveAlert(null);
    setToast({
      message: `Reminder for "${rem.title}" snoozed for 10 minutes`,
      type: 'success',
    });
  };

  // Action: Dismiss (mark completed)
  const handleDismiss = async (rem) => {
    try {
      await API.patch(`/watchlist/${rem._id}`, { reminderStatus: 'completed' });
      setReminders((prev) =>
        prev.map((item) => (item._id === rem._id ? { ...item, reminderStatus: 'completed' } : item))
      );
      window.dispatchEvent(new CustomEvent('cineverse_reminder_updated'));
    } catch (e) {
      console.error('Failed to mark reminder completed', e);
    }
    setActiveAlert(null);
  };

  // Action: Close &times; (keep pending, but don't re-alert immediately)
  const handleClose = () => {
    setActiveAlert(null);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <ReminderAlertModal
        reminder={activeAlert}
        onWatchNow={handleWatchNow}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
        onClose={handleClose}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
};

export default ReminderNotificationListener;
