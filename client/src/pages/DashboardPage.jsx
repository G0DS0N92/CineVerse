import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import MovieCard from '../components/MovieCard';
import { Link } from 'react-router-dom';

const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/watchlist/stats');
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const isNewUser =
    user?.isNewUser === true ||
    sessionStorage.getItem('cineverse_is_new_user') === 'true';

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.18) 0%, rgba(19, 24, 34, 0.9) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          border: '1px solid var(--border-color)',
          marginBottom: '32px',
        }}
      >
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
          {isNewUser ? `Welcome, ${user?.name || 'Cinephile'}!` : `Welcome back, ${user?.name || 'Cinephile'}!`}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px' }}>
          {isNewUser
            ? 'Welcome to CineVerse! Explore trending titles, curate your personal watchlists, and schedule watch reminders.'
            : 'Here is your personal watchlist activity and scheduled watch plan.'}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <StatCard
          title="Total Movies Saved"
          value={stats?.totalSaved || 0}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          }
          color="var(--accent-blue)"
        />
        <StatCard
          title="Planned to Watch"
          value={stats?.planned || 0}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          color="var(--accent-gold)"
        />
        <StatCard
          title="Currently Watching"
          value={stats?.currentlyWatching || 0}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          }
          color="var(--accent-primary)"
        />
        <StatCard
          title="Movies Watched"
          value={stats?.watched || 0}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          color="var(--accent-green)"
        />
      </div>

      {/* Two Column Layout: Upcoming Reminders & Recently Added */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginTop: '36px' }}>
        {/* Upcoming Reminders Section */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upcoming Reminders</h2>
            <Link to="/reminders" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>

          {!stats?.upcomingReminders || stats.upcomingReminders.length === 0 ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No upcoming reminders scheduled.</p>
              <Link to="/watchlist" style={{ color: 'var(--accent-hover)', fontSize: '0.9rem', marginTop: '8px', display: 'inline-block' }}>
                Set a reminder from your Watchlist &rarr;
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.upcomingReminders.map((rem) => (
                <div
                  key={rem._id}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{rem.title}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDDMMYYYY(rem.reminderDate)} at {rem.reminderTime || '20:00'}
                    </div>
                  </div>
                  <span className="status-badge status-planned">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Added Movies Section */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recently Added</h2>
            <Link to="/watchlist" className="btn btn-outline btn-sm">
              Watchlist &rarr;
            </Link>
          </div>

          {!stats?.recentAdded || stats.recentAdded.length === 0 ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Your watchlist is currently empty.</p>
              <Link to="/discover" style={{ color: 'var(--accent-hover)', fontSize: '0.9rem', marginTop: '8px', display: 'inline-block' }}>
                Discover trending movies &rarr;
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentAdded.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
                        alt={item.title}
                        style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : (
                      <div style={{ width: '36px', height: '52px', background: '#202b3f', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        N/A
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{item.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ★ {item.voteAverage ? Number(item.voteAverage).toFixed(1) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`status-badge ${
                      item.status === 'Watched'
                        ? 'status-watched'
                        : item.status === 'Currently Watching'
                        ? 'status-watching'
                        : 'status-planned'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
