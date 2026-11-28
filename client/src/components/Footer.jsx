import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-modern">
      <div className="footer-container-modern">
        {/* Top Grid: Brand & Navigation Columns */}
        <div className="footer-top-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link to="/" className="brand-logo" style={{ marginBottom: '12px' }}>
              <span className="brand-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
              </span>
              <span>Cine<span className="brand-highlight">Verse</span></span>
            </Link>
            <p className="footer-brand-desc">
              Your premier cinematic companion to discover real-time trending releases, host collaborative movie night lobbies, schedule smart reminders, and collect verified archival ticket passes.
            </p>
            <div className="footer-status-pill">
              <span className="status-indicator-dot" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Navigation Columns */}
          <div className="footer-col">
            <h4 className="footer-col-title">Explore Cinema</h4>
            <ul className="footer-nav-list">
              <li><Link to="/">Home Premiere</Link></li>
              <li><Link to="/discover">Discover Movies</Link></li>
              <li><Link to="/lobby">Movie Night Lobby</Link></li>
              <li><Link to="/discover?sort=rating">Top Rated Vault</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Personal Hub</h4>
            <ul className="footer-nav-list">
              <li><Link to="/watchlist">My Watchlist</Link></li>
              <li><Link to="/watchlist?tab=Watched">Collectible Passes</Link></li>
              <li><Link to="/reminders">Scheduled Reminders</Link></li>
              <li><Link to="/dashboard">Activity Dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Signature Tech</h4>
            <ul className="footer-nav-list">
              <li><span className="footer-feature-tag">Smart Ambilight</span></li>
              <li><span className="footer-feature-tag">Real-Time Group Lobby</span></li>
              <li><span className="footer-feature-tag">Canvas PNG Exporter</span></li>
              <li><span className="footer-feature-tag">Adaptive Cinema Glow</span></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Bottom Bar: Copyright & TMDB Attribution */}
        <div className="footer-bottom-bar">
          <div className="footer-copy-text">
            <span>&copy; {new Date().getFullYear()} <strong>CineVerse</strong>. All rights reserved. Built with MongoDB, Express, React, Node.js.</span>
          </div>

          <div className="footer-tmdb-attribution">
            <span>Powered by TMDB API. Not endorsed or certified by TMDB.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
