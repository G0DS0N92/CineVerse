import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const CinemaGlowSwitcher = () => {
  const { accent, setAccent, activeTheme, ACCENT_THEMES } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="glow-switcher-wrap" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        type="button"
        className="glow-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Cinema Glow Accent Palette"
        title={`Cinema Glow: ${activeTheme.name}`}
      >
        <span
          className="glow-switcher-dot"
          style={{
            backgroundColor: activeTheme.color,
            boxShadow: `0 0 10px ${activeTheme.color}`,
          }}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </button>

      {/* Glow Palette Popover */}
      {isOpen && (
        <div className="glow-switcher-popover">
          <div className="glow-switcher-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeTheme.color,
                  boxShadow: `0 0 8px ${activeTheme.color}`,
                }}
              />
              <span className="glow-switcher-title">Cinema Glow</span>
            </div>
            <span className="glow-switcher-badge">{activeTheme.name}</span>
          </div>

          <p className="glow-switcher-desc">
            Select an ambient neon glow for buttons, badges, and highlights across CineVerse.
          </p>

          <div className="glow-palette-list">
            {ACCENT_THEMES.map((theme) => {
              const isSelected = accent === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setAccent(theme.id);
                    setIsOpen(false);
                  }}
                  className={`glow-palette-item ${isSelected ? 'selected' : ''}`}
                >
                  <div
                    className="glow-color-swatch"
                    style={{
                      background: theme.color,
                      boxShadow: isSelected
                        ? `0 0 14px ${theme.color}, inset 0 0 4px rgba(255,255,255,0.6)`
                        : `0 0 6px rgba(${theme.rgb}, 0.35)`,
                    }}
                  >
                    {isSelected && (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#000"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  <div className="glow-palette-meta">
                    <span className="glow-theme-name" style={{ color: isSelected ? theme.color : '#ffffff' }}>
                      {theme.name}
                    </span>
                    <span className="glow-theme-desc">{theme.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemaGlowSwitcher;
