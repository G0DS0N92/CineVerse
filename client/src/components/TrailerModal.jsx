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

const TrailerModal = ({ isOpen, onClose, videoKey, movie, movieTitle }) => {
  const { activeTheme } = useTheme();
  const [activeVideoKey, setActiveVideoKey] = useState(videoKey);

  // Ambient Theater toggle state (persisted in localStorage, default to true for premier experience)
  const [isAmbientTheater, setIsAmbientTheater] = useState(() => {
    const saved = localStorage.getItem('cineverse_ambient_theater_active');
    return saved !== null ? saved === 'true' : true;
  });

  const [ambilightMode, setAmbilightMode] = useState('movie');
  const [intensity, setIntensity] = useState('balanced');
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' | '21:9'
  const [isPitchBlack, setIsPitchBlack] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const modalContainerRef = useRef(null);

  // Sync active key and clear immediately when closing to stop YouTube background audio
  useEffect(() => {
    if (isOpen) {
      setActiveVideoKey(videoKey);
    } else {
      setActiveVideoKey(null);
    }
  }, [isOpen, videoKey]);

  const handleClose = () => {
    setActiveVideoKey(null);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  const handleToggleAmbient = () => {
    setIsAmbientTheater((prev) => {
      const nextVal = !prev;
      localStorage.setItem('cineverse_ambient_theater_active', String(nextVal));
      return nextVal;
    });
  };

  // Close on Escape key press and manage body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  const currentMovie = movie || {};
  const displayTitle = currentMovie.title || movieTitle || 'Official Trailer';
  const releaseYear = currentMovie.release_date ? currentMovie.release_date.split('-')[0] : '';
  const backdropUrl = currentMovie.backdrop_path ? `${TMDB_BACKDROP_BASE}${currentMovie.backdrop_path}` : null;
  const posterUrl = currentMovie.poster_path ? `${TMDB_POSTER_BASE}${currentMovie.poster_path}` : null;

  const currentIntensity = INTENSITY_OPTIONS.find((opt) => opt.id === intensity) || INTENSITY_OPTIONS[1];

  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        const promise = modalContainerRef.current.requestFullscreen?.();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => {});
        }
      } else {
        const promise = document.exitFullscreen?.();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => {});
        }
      }
    } catch (err) {}
  };

  // Soundtrack search links
  const soundtrackQuery = encodeURIComponent(`${displayTitle} Soundtrack`);
  const spotifySearchUrl = `https://open.spotify.com/search/${soundtrackQuery}`;
  const ytMusicSearchUrl = `https://music.youtube.com/search?q=${soundtrackQuery}`;
  const appleMusicSearchUrl = `https://music.apple.com/us/search?term=${soundtrackQuery}`;

  return (
    <div
      ref={modalContainerRef}
      className={isAmbientTheater ? `ambient-theater-overlay ${isPitchBlack ? 'pitch-black' : ''}` : ''}
      style={
        !isAmbientTheater
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              animation: 'fadeIn 0.2s ease-out',
            }
          : undefined
      }
      onClick={() => {
        if (showSettings) setShowSettings(false);
        else handleClose();
      }}
    >
      <div
        className={isAmbientTheater ? 'ambient-theater-container' : ''}
        style={
          !isAmbientTheater
            ? {
                position: 'relative',
                width: '100%',
                maxWidth: '960px',
                background: '#0d111a',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(var(--accent-rgb), 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          className={isAmbientTheater ? 'ambient-theater-header' : ''}
          style={
            !isAmbientTheater
              ? {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 22px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'linear-gradient(to right, rgba(var(--accent-rgb), 0.15), rgba(15, 21, 34, 0.8))',
                  flexWrap: 'wrap',
                  gap: '12px',
                }
              : undefined
          }
        >
          {/* Left Title Info */}
          <div
            className={isAmbientTheater ? 'ambient-movie-headline' : ''}
            style={!isAmbientTheater ? { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 } : undefined}
          >
            {isAmbientTheater && (
              <div className="ambient-cinema-badge">
                <span className="ambient-live-dot" />
                <span>Ambient Theater</span>
              </div>
            )}
            <div
              className={isAmbientTheater ? 'ambient-title-group' : ''}
              style={!isAmbientTheater ? { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 } : undefined}
            >
              {!isAmbientTheater && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </span>
              )}
              <h3
                className={isAmbientTheater ? 'ambient-title' : ''}
                style={
                  !isAmbientTheater
                    ? {
                        fontSize: '1.12rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '480px',
                      }
                    : undefined
                }
              >
                {displayTitle}
              </h3>
              {releaseYear && !isAmbientTheater && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  ({releaseYear})
                </span>
              )}
            </div>
          </div>

          {/* Right Action & Toggle Controls */}
          <div
            className={isAmbientTheater ? 'ambient-header-actions' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'relative',
              flexWrap: 'wrap',
            }}
          >
            {/* Ambient Theater Interactive Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleAmbient}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '24px',
                background: isAmbientTheater
                  ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.35), rgba(var(--accent-rgb), 0.16))'
                  : 'rgba(255, 255, 255, 0.08)',
                border: isAmbientTheater
                  ? '1.5px solid var(--accent-primary)'
                  : '1px solid rgba(255, 255, 255, 0.16)',
                color: isAmbientTheater ? '#ffffff' : 'var(--text-muted)',
                boxShadow: isAmbientTheater ? '0 0 16px rgba(var(--accent-rgb), 0.4)' : 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.25s ease',
              }}
              title={isAmbientTheater ? 'Disable Ambient Theater Mode' : 'Enable Ambient Theater Mode (Smart Ambilight Frame)'}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isAmbientTheater ? 'var(--accent-primary)' : '#64748b',
                  boxShadow: isAmbientTheater ? '0 0 8px var(--accent-primary)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Ambient Theater</span>
              {/* Toggle Switch Pill */}
              <span
                style={{
                  width: '26px',
                  height: '15px',
                  borderRadius: '10px',
                  background: isAmbientTheater ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px',
                  transition: 'background 0.25s ease',
                  marginLeft: '2px',
                }}
              >
                <span
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    transform: isAmbientTheater ? 'translateX(11px)' : 'translateX(0)',
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </span>
            </button>

            {/* Ambilight Extra Controls (Aspect Ratio, Intensity, Fullscreen) shown when Ambient Theater is ON */}
            {isAmbientTheater && (
              <>
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
                </button>

                {/* Ambilight Settings Panel Toggle */}
                <button
                  type="button"
                  className={`ambient-btn-icon ${showSettings ? 'active' : ''}`}
                  onClick={() => setShowSettings((prev) => !prev)}
                  title="Ambilight Settings"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  className={`ambient-btn-icon ${isFullscreen ? 'active' : ''}`}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isFullscreen ? (
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    ) : (
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    )}
                  </svg>
                </button>
              </>
            )}

            {/* Exit Button */}
            <button
              type="button"
              className={isAmbientTheater ? 'ambient-close-btn' : ''}
              onClick={handleClose}
              title="Close Player (Esc)"
              style={
                !isAmbientTheater
                  ? {
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      transition: 'background 0.2s',
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isAmbientTheater) e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.8)';
              }}
              onMouseLeave={(e) => {
                if (!isAmbientTheater) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              ✕
            </button>

            {/* Ambilight Settings Dropdown Panel */}
            {isAmbientTheater && showSettings && (
              <div className="ambient-settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="ambient-panel-header">
                  <h4>Ambilight Settings</h4>
                  <button type="button" onClick={() => setShowSettings(false)}>✕</button>
                </div>

                <div className="ambient-setting-group">
                  <label>Aura Mode</label>
                  <div className="ambient-chip-group">
                    {AMBILIGHT_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`ambient-chip ${ambilightMode === m.id ? 'active' : ''}`}
                        onClick={() => setAmbilightMode(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ambient-setting-group">
                  <label>Glow Intensity</label>
                  <div className="ambient-chip-group">
                    {INTENSITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`ambient-chip ${intensity === opt.id ? 'active' : ''}`}
                        onClick={() => setIntensity(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ambient-setting-group">
                  <label>Blackout Room</label>
                  <button
                    type="button"
                    className={`ambient-toggle-btn ${isPitchBlack ? 'active' : ''}`}
                    onClick={() => setIsPitchBlack((prev) => !prev)}
                  >
                    <span>Pitch Black Theater Mode</span>
                    <span className="toggle-indicator">{isPitchBlack ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Player / Screen Frame Stage */}
        <div className={isAmbientTheater ? 'ambient-stage-wrapper' : ''}>
          {/* Reactive Ambilight Halo Layer Behind Screen (Shown when Ambient Theater is ON) */}
          {isAmbientTheater && (
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
          )}

          {/* Screen Frame Container */}
          <div
            className={
              isAmbientTheater
                ? `ambient-screen-frame ${aspectRatio === '21:9' ? 'cinemascope' : 'standard'}`
                : ''
            }
            style={
              !isAmbientTheater
                ? {
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%', // 16:9 aspect ratio
                    background: '#000000',
                  }
                : undefined
            }
          >
            {activeVideoKey ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoKey}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={`${displayTitle} - Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className={isAmbientTheater ? 'ambient-iframe' : ''}
                style={
                  !isAmbientTheater
                    ? {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }
                    : undefined
                }
              />
            ) : backdropUrl ? (
              <div
                className="ambient-placeholder-backdrop"
                style={{
                  backgroundImage: `url(${backdropUrl})`,
                  position: !isAmbientTheater ? 'absolute' : undefined,
                  inset: !isAmbientTheater ? 0 : undefined,
                }}
              >
                <div className="ambient-placeholder-content">
                  <div className="ambient-film-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <h3>No Video Trailer Key Available</h3>
                  <p>Enjoying full visual backdrop presentation for {displayTitle}.</p>
                </div>
              </div>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  gap: '12px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
                <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>
                  No official trailer preview available for this title at this time.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Theater Deck: Soundtrack Integration & Synopsis (When Ambient Theater is ON) */}
        {isAmbientTheater ? (
          <div className="ambient-bottom-deck">
            {/* Soundtrack Links */}
            <div className="ambient-soundtracks-bar">
              <span className="ambient-deck-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                Original Soundtrack:
              </span>
              <div className="ambient-soundtrack-pills">
                <a
                  href={spotifySearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ambient-soundtrack-pill spotify"
                  title="Search original motion picture score on Spotify"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 11.5c3-1 6-0.5 8 0.5M7.5 14.5c2.5-0.8 5-0.4 7 0.4M8.5 8.5c3.5-1.2 7.5-0.6 10 0.8" stroke="#000" strokeWidth="1.5" fill="none" />
                  </svg>
                  Spotify
                </a>
                <a
                  href={ytMusicSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ambient-soundtrack-pill ytmusic"
                  title="Search original motion picture score on YouTube Music"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16" fill="#000" />
                  </svg>
                  YT Music
                </a>
                <a
                  href={appleMusicSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ambient-soundtrack-pill apple"
                  title="Search soundtrack on Apple Music"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2v14a4 4 0 1 1-2-3.46V6h8v4" />
                  </svg>
                  Apple Music
                </a>
              </div>
            </div>

            {/* Quick Overview */}
            {currentMovie.overview && (
              <p className="ambient-overview-snippet">
                {currentMovie.overview}
              </p>
            )}

            {/* Footer Legend */}
            <div className="ambient-footer-legend">
              <span>Ambilight Reactive Lighting • Auto Cinema Sync</span>
              <div className="ambient-shortcuts-hint">
                <span>Toggle: <strong>Button</strong></span>
                <span>Aspect: <strong>21:9 / 16:9</strong></span>
                <span>Exit: <strong>ESC</strong></span>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Modal Footer */
          <div
            style={{
              padding: '12px 22px',
              background: '#090d15',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem',
              color: '#64748b',
            }}
          >
            <span>HD Cinema Player • Toggle Ambient Theater above for Smart Ambilight</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>ESC</kbd> to exit
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailerModal;
