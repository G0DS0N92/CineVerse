import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w780';

const AMBILIGHT_MODES = [
  { id: 'movie', label: 'Movie Backdrop', desc: 'Aura matching the film aesthetic' },
  { id: 'accent', label: 'Accent Sync', desc: 'Syncs with your Cinema Glow theme' },
  { id: 'aurora', label: 'Aurora Prism', desc: 'Multicolor cinema color spectrum' },
];

const INTENSITY_OPTIONS = [
  { id: 'soft', label: 'Soft', opacity: 0.45, blur: '40px' },
  { id: 'balanced', label: 'Balanced', opacity: 0.75, blur: '60px' },
  { id: 'vivid', label: 'Vivid', opacity: 1.0, blur: '80px' },
];

const AmbientTheaterModal = ({
  isOpen,
  onClose,
  movie,
  trailerKey,
}) => {
  const { activeTheme } = useTheme();
  const [ambilightMode, setAmbilightMode] = useState('movie');
  const [intensity, setIntensity] = useState('balanced');
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' | '21:9'
  const [isPitchBlack, setIsPitchBlack] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const theaterContainerRef = useRef(null);

  // Close on Escape and manage body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen || !movie) return null;

  const title = movie.title || 'Feature Film';
  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : '';
  const backdropUrl = movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : null;
  const posterUrl = movie.poster_path ? `${TMDB_POSTER_BASE}${movie.poster_path}` : null;

  const currentIntensity = INTENSITY_OPTIONS.find((opt) => opt.id === intensity) || INTENSITY_OPTIONS[1];

  const toggleFullscreen = () => {
    if (!theaterContainerRef.current) return;

    if (!document.fullscreenElement) {
      theaterContainerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Could not enter fullscreen mode:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Could not exit fullscreen mode:', err);
      });
    }
  };

  // Soundtracks search URLs
  const soundtrackQuery = encodeURIComponent(`${title} Soundtrack`);
  const spotifySearchUrl = `https://open.spotify.com/search/${soundtrackQuery}`;
  const ytMusicSearchUrl = `https://music.youtube.com/search?q=${soundtrackQuery}`;
  const appleMusicSearchUrl = `https://music.apple.com/us/search?term=${soundtrackQuery}`;

  return (
    <div
      ref={theaterContainerRef}
      className={`ambient-theater-overlay ${isPitchBlack ? 'pitch-black' : ''}`}
      onClick={() => {
        if (showSettings) setShowSettings(false);
        else onClose();
      }}
    >
      <div
        className="ambient-theater-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="ambient-theater-header">
          <div className="ambient-movie-headline">
            <div className="ambient-cinema-badge">
              <span className="ambient-live-dot" />
              <span>Theater Mode</span>
            </div>
            <div className="ambient-title-group">
              <h2 className="ambient-title">{title}</h2>
              {releaseYear && <span className="ambient-year">({releaseYear})</span>}
              {movie.vote_average > 0 && (
                <span className="ambient-rating">★ {Number(movie.vote_average).toFixed(1)}</span>
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="ambient-header-actions">
            {/* Aspect Ratio Toggle */}
            <button
              type="button"
              className={`ambient-btn-icon ${aspectRatio === '21:9' ? 'active' : ''}`}
              onClick={() => setAspectRatio((prev) => (prev === '16:9' ? '21:9' : '16:9'))}
              title={`Switch aspect ratio (Currently ${aspectRatio})`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                {aspectRatio === '21:9' ? (
                  <>
                    <line x1="2" y1="8" x2="22" y2="8" strokeDasharray="2 2" />
                    <line x1="2" y1="16" x2="22" y2="16" strokeDasharray="2 2" />
                  </>
                ) : (
                  <path d="M7 10l5 4 5-4" />
                )}
              </svg>
              <span>{aspectRatio}</span>
            </button>

            {/* Dimmer / Pitch Black Toggle */}
            <button
              type="button"
              className={`ambient-btn-icon ${isPitchBlack ? 'active' : ''}`}
              onClick={() => setIsPitchBlack((prev) => !prev)}
              title={isPitchBlack ? 'Switch to Ambient Room (Dim)' : 'Switch to Pitch Black (OLED Maximum)'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isPitchBlack ? (
                  <>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  </>
                )}
              </svg>
              <span>{isPitchBlack ? 'Pitch Black' : 'Dim Lights'}</span>
            </button>

            {/* Settings Dropdown Button */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`ambient-btn-icon ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings((prev) => !prev)}
                title="Ambilight Frame Settings"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Aura Settings</span>
              </button>

              {/* Settings Menu Panel */}
              {showSettings && (
                <div className="ambient-settings-panel">
                  <div className="ambient-panel-title">Smart Ambilight Aura</div>

                  {/* Mode Picker */}
                  <div className="ambient-panel-section">
                    <span className="ambient-panel-label">Aura Mode</span>
                    <div className="ambient-mode-options">
                      {AMBILIGHT_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          className={`ambient-mode-btn ${ambilightMode === mode.id ? 'active' : ''}`}
                          onClick={() => setAmbilightMode(mode.id)}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity Picker */}
                  <div className="ambient-panel-section">
                    <span className="ambient-panel-label">Glow Intensity</span>
                    <div className="ambient-mode-options">
                      {INTENSITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`ambient-mode-btn ${intensity === opt.id ? 'active' : ''}`}
                          onClick={() => setIntensity(opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="ambient-btn-icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </>
                ) : (
                  <>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </>
                )}
              </svg>
            </button>

            {/* Exit Button */}
            <button
              type="button"
              className="ambient-close-btn"
              onClick={onClose}
              title="Exit Theater Mode (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Center Stage: The Smart Ambilight Screen */}
        <div className="ambient-stage-wrapper">
          {/* Reactive Ambilight Halo Layer Behind Screen */}
          <div
            className={`ambilight-aura-halo ambilight-${ambilightMode}`}
            style={{
              opacity: currentIntensity.opacity,
              filter: `blur(${currentIntensity.blur})`,
              backgroundImage:
                ambilightMode === 'movie' && (backdropUrl || posterUrl)
                  ? `url(${backdropUrl || posterUrl})`
                  : undefined,
              backgroundColor:
                ambilightMode === 'accent' ? activeTheme.color : undefined,
            }}
          />

          {/* Cinema Screen Frame */}
          <div
            className={`ambient-screen-frame ${aspectRatio === '21:9' ? 'cinemascope' : 'standard'}`}
          >
            {trailerKey ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={`${title} - Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="ambient-iframe"
              />
            ) : backdropUrl ? (
              <div
                className="ambient-placeholder-backdrop"
                style={{ backgroundImage: `url(${backdropUrl})` }}
              >
                <div className="ambient-placeholder-content">
                  <div className="ambient-film-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <h3>No Video Trailer Key Available</h3>
                  <p>Enjoying full visual backdrop presentation for {title}.</p>
                </div>
              </div>
            ) : (
              <div className="ambient-placeholder-backdrop">
                <div className="ambient-placeholder-content">
                  <p>Preview unavailable for this title.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Theater Deck: Soundtrack Integration & Synopsis */}
        <div className="ambient-bottom-deck">
          {/* Soundtrack Links */}
          <div className="ambient-soundtrack-box">
            <div className="ambient-soundtrack-header">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span>Original Motion Picture Score & Soundtrack</span>
            </div>
            <div className="ambient-music-links">
              <a
                href={spotifySearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ambient-music-btn spotify"
                title={`Listen to ${title} soundtrack on Spotify`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <span>Spotify</span>
              </a>

              <a
                href={ytMusicSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ambient-music-btn ytmusic"
                title={`Listen to ${title} soundtrack on YouTube Music`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm-1.896-10.512v6.816L15.696 12l-5.592-3.408z" />
                </svg>
                <span>YouTube Music</span>
              </a>

              <a
                href={appleMusicSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ambient-music-btn applemusic"
                title={`Listen to ${title} soundtrack on Apple Music`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.73-.93 2.76 1 .08 2.02-.51 2.64-1.26z" />
                </svg>
                <span>Apple Music</span>
              </a>
            </div>
          </div>

          {/* Overview or Tagline */}
          {movie.tagline && (
            <div className="ambient-tagline-text">
              "{movie.tagline}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmbientTheaterModal;
