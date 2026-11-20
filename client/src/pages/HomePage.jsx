import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await API.get('/movies/trending');
        if (data.success) {
          setTrendingMovies(data.data.slice(0, 8)); // Top 8 trending
        }
      } catch (err) {
        console.error('Failed to load trending movies', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div>
      {/* Hero Showcase Section */}
      <section
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at center, rgba(229, 9, 20, 0.15) 0%, rgba(10, 13, 20, 0) 70%)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '50px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '4px 14px',
            background: 'rgba(229, 9, 20, 0.15)',
            color: 'var(--accent-hover)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
            border: '1px solid rgba(229, 9, 20, 0.3)',
          }}
        >
          Smart Movie Watchlist & Reminder Platform
        </span>

        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '20px' }}>
          Your Personal Cinema Universe, <br />
          <span style={{ color: 'var(--accent-primary)' }}>Perfected.</span>
        </h1>

        <p style={{ maxWidth: '640px', margin: '0 auto 30px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Discover trending titles with real-time movie data, organize your watchlists by status,
          and schedule reminders so you never miss another cinematic masterpiece.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/discover" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1.05rem' }}>
            Discover Movies
          </Link>
          {!isAuthenticated ? (
            <Link to="/register" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '1.05rem' }}>
              Create Free Account
            </Link>
          ) : (
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '1.05rem' }}>
              Go to Dashboard &rarr;
            </Link>
          )}
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '60px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Real-Time Discovery</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Powered by live TMDB integration. Access popular, top-rated, upcoming releases and instant movie search.
          </p>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--accent-blue)', marginBottom: '16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Personal Watchlists</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Categorize titles as <em>Planned</em>, <em>Currently Watching</em>, or <em>Watched</em>. No duplicate entries, completely private.
          </p>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--accent-gold)', marginBottom: '16px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Smart Reminders</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Schedule specific watch dates, times, and personal notes. Track upcoming and overdue plans from your dashboard.
          </p>
        </div>
      </section>

      {/* Trending Movies Preview */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Trending Today</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The most popular movies right now</p>
          </div>
          <Link to="/discover" className="btn btn-outline btn-sm">
            View All &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching trending movies...</p>
          </div>
        ) : (
          <div className="movies-grid">
            {trendingMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
