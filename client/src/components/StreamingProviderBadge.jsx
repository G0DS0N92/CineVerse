import React, { useState } from 'react';

const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/original';

// Helper: Determine redirect link for the specific movie on the streaming platform
export const getProviderRedirectUrl = (providerName, movieTitle, countryCode, justWatchLink) => {
  const name = (providerName || '').toLowerCase();
  const q = encodeURIComponent(movieTitle || '');

  if (name.includes('netflix')) {
    return `https://www.netflix.com/search?q=${q}`;
  }
  if (name.includes('amazon') || name.includes('prime video')) {
    if (countryCode === 'IN') {
      return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`;
    }
    return `https://www.amazon.com/s?k=${q}&i=instant-video`;
  }
  if (name.includes('apple')) {
    return `https://tv.apple.com/search?term=${q}`;
  }
  if (name.includes('hotstar') || name.includes('disney')) {
    if (countryCode === 'IN') {
      return `https://www.hotstar.com/in/explore?search_query=${q}`;
    }
    return `https://www.disneyplus.com/search?q=${q}`;
  }
  if (name.includes('zee5') || name.includes('zee')) {
    return `https://www.zee5.com/search?q=${q}`;
  }
  if (name.includes('jiocinema') || name.includes('jio')) {
    return `https://www.jiocinema.com/search/${q}`;
  }
  if (name.includes('sonyliv') || name.includes('sony liv')) {
    return `https://www.sonyliv.com/search/${q}`;
  }
  if (name.includes('youtube')) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent((movieTitle || '') + ' movie')}`;
  }
  if (name.includes('google play')) {
    return `https://play.google.com/store/search?q=${q}&c=movies`;
  }
  if (name.includes('hulu')) {
    return `https://www.hulu.com/search?q=${q}`;
  }
  if (name.includes('max') || name.includes('hbo')) {
    return `https://www.max.com/search?q=${q}`;
  }
  if (name.includes('peacock')) {
    return `https://www.peacocktv.com/search?q=${q}`;
  }
  if (name.includes('paramount')) {
    return `https://www.paramountplus.com/search/?query=${q}`;
  }
  if (name.includes('crunchyroll')) {
    return `https://www.crunchyroll.com/search?q=${q}`;
  }
  if (name.includes('mubi')) {
    return `https://mubi.com/search?query=${q}`;
  }

  // Fallback to JustWatch movie link or targeted search
  if (justWatchLink) {
    return justWatchLink;
  }
  return `https://www.google.com/search?q=${encodeURIComponent('watch ' + (movieTitle || '') + ' on ' + providerName)}`;
};

// Render official, pixel-perfect streaming platform vector logos
export const renderOfficialLogo = (providerName, logoPath) => {
  const name = (providerName || '').toLowerCase();

  // 1. Apple TV / Apple TV Store
  if (name.includes('apple')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#000000" />
        <path
          d="M42.5 32.2c-2.3 2.8-5.9 4.7-9.4 4.5-.4-3.4 1.2-7 3.3-9.4 2.3-2.6 6.3-4.5 9.3-4.6.4 3.4-1 6.8-3.2 9.5zm6.5 13.9c.2 8.4 7.4 11.2 7.5 11.3-.1.3-1.2 4-3.9 8-2.4 3.5-4.8 6.9-8.7 7-3.9 0-5.1-2.3-9.5-2.3s-5.8 2.3-9.4 2.4c-3.8.1-6.7-3.8-9.1-7.3-5-7.2-8.8-20.3-3.7-29.2 2.6-4.4 7.2-7.2 12.2-7.3 3.8-.1 7.3 2.6 9.6 2.6 2.3 0 6.6-3.2 11.2-2.7 1.9.1 7.4.8 10.9 5.9-.3.2-6.5 3.8-6.1 11.6z"
          fill="#ffffff"
        />
        <text x="64" y="65" fill="#ffffff" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="28">
          tv
        </text>
      </svg>
    );
  }

  // 2. Zee5 Official Logo
  if (name.includes('zee5') || name.includes('zee')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#0d0415" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="url(#zeeGrad1)" strokeWidth="4" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="url(#zeeGrad2)" strokeWidth="3" opacity="0.8" />
        <defs>
          <linearGradient id="zeeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="35%" stopColor="#9d00ff" />
            <stop offset="70%" stopColor="#ff007f" />
            <stop offset="100%" stopColor="#ff9900" />
          </linearGradient>
          <linearGradient id="zeeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff007f" />
            <stop offset="50%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#ffaa00" />
          </linearGradient>
        </defs>
        <text x="50" y="47" fill="#ffffff" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="17" textAnchor="middle" letterSpacing="0.5">
          ZEE
        </text>
        <text x="50" y="70" fill="#ff007f" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="22" textAnchor="middle">
          5
        </text>
      </svg>
    );
  }

  // 3. Amazon Prime Video / Amazon Video
  if (name.includes('amazon') || name.includes('prime video')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#00050d" />
        <rect x="2" y="2" width="96" height="96" rx="16" fill="#0f172a" stroke="#00a8e1" strokeWidth="1.5" />
        <text x="50" y="43" fill="#00a8e1" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontWeight="800" fontSize="19" textAnchor="middle" letterSpacing="-0.5">
          prime
        </text>
        <text x="50" y="58" fill="#ffffff" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontWeight="600" fontSize="11" textAnchor="middle" letterSpacing="0.5">
          video
        </text>
        <path d="M26 68c14 8 34 8 48 0" fill="none" stroke="#00a8e1" strokeWidth="3" strokeLinecap="round" />
        <polygon points="72,64 78,69 71,71" fill="#00a8e1" />
      </svg>
    );
  }

  // 4. Netflix
  if (name.includes('netflix')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#000000" />
        <path d="M30 18h11v64h-11z" fill="#b81d24" />
        <path d="M59 18h11v64h-11z" fill="#b81d24" />
        <path d="M30 18l40 64h-11l-40-64z" fill="#e50914" />
      </svg>
    );
  }

  // 5. Disney+ / Disney+ Hotstar / Hotstar
  if (name.includes('disney') || name.includes('hotstar')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#040714" />
        <path d="M18 68c18-35 48-42 66-32" fill="none" stroke="url(#disneyArc)" strokeWidth="3" strokeLinecap="round" />
        <defs>
          <linearGradient id="disneyArc" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#113ccf" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <text x="44" y="58" fill="#ffffff" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" textAnchor="middle" fontStyle="italic">
          Disney
        </text>
        <text x="74" y="53" fill="#1175cf" fontFamily="sans-serif" fontWeight="900" fontSize="22">
          +
        </text>
      </svg>
    );
  }

  // 6. YouTube / YouTube Movies
  if (name.includes('youtube')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#0f0f0f" />
        <rect x="15" y="26" width="70" height="48" rx="14" fill="#ff0000" />
        <polygon points="44,38 64,50 44,62" fill="#ffffff" />
      </svg>
    );
  }

  // 7. Google Play Movies
  if (name.includes('google play')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#1e2430" />
        <path d="M25 20l32 28-32 32c-1.2-1.3-2-3-2-5.1V25.1c0-2.1.8-3.8 2-5.1z" fill="#00d3ff" />
        <path d="M68.5 59.5l-11.5-11.5L25 20l43.5 25.1 11.2 6.5-11.2 7.9z" fill="#ff3a44" />
        <path d="M25 80l32-28 11.5 11.5-32 18.5c-4.2 2.4-8.8.7-11.5-2z" fill="#00e676" />
        <path d="M79.7 51.6l-11.2-6.5-11.5 11.5 11.5 11.5 11.3-6.5c3.2-1.8 3.2-8.2-.1-10z" fill="#ffc400" />
      </svg>
    );
  }

  // 8. JioCinema
  if (name.includes('jiocinema') || name.includes('jio')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#800040" />
        <circle cx="50" cy="50" r="32" fill="#9c0e5a" />
        <text x="50" y="47" fill="#ffffff" fontFamily="-apple-system, sans-serif" fontWeight="900" fontSize="18" textAnchor="middle">
          Jio
        </text>
        <text x="50" y="65" fill="#fbcfe8" fontFamily="-apple-system, sans-serif" fontWeight="700" fontSize="11" textAnchor="middle" letterSpacing="0.5">
          Cinema
        </text>
      </svg>
    );
  }

  // 9. SonyLIV
  if (name.includes('sonyliv') || name.includes('sony liv')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#0a0a0f" />
        <rect x="22" y="24" width="10" height="20" rx="3" fill="#00c0f3" />
        <rect x="36" y="20" width="10" height="24" rx="3" fill="#ff7700" />
        <rect x="50" y="24" width="10" height="20" rx="3" fill="#e5097f" />
        <rect x="64" y="22" width="10" height="22" rx="3" fill="#ffdd00" />
        <text x="50" y="68" fill="#ffffff" fontFamily="sans-serif" fontWeight="900" fontSize="18" textAnchor="middle" letterSpacing="1">
          LIV
        </text>
      </svg>
    );
  }

  // 10. Hulu
  if (name.includes('hulu')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#0b0c0f" />
        <text x="50" y="58" fill="#1ce783" fontFamily="-apple-system, sans-serif" fontWeight="900" fontSize="24" textAnchor="middle" letterSpacing="-1">
          hulu
        </text>
      </svg>
    );
  }

  // 11. Max / HBO Max
  if (name.includes('max') || name.includes('hbo')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#002be7" />
        <text x="50" y="59" fill="#ffffff" fontFamily="'Arial Black', sans-serif" fontWeight="900" fontSize="26" textAnchor="middle" letterSpacing="1">
          MAX
        </text>
      </svg>
    );
  }

  // 12. Paramount+
  if (name.includes('paramount')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#0064ff" />
        <polygon points="50,26 32,68 68,68" fill="#ffffff" />
        <polygon points="50,26 44,48 56,48" fill="#0064ff" />
        <text x="50" y="66" fill="#0064ff" fontFamily="sans-serif" fontWeight="900" fontSize="13" textAnchor="middle">
          +
        </text>
      </svg>
    );
  }

  // 13. Peacock
  if (name.includes('peacock')) {
    return (
      <svg viewBox="0 0 100 100" width="38" height="38" style={{ borderRadius: '8px', flexShrink: 0 }}>
        <rect width="100" height="100" rx="18" fill="#000000" />
        <circle cx="28" cy="46" r="6" fill="#facc15" />
        <circle cx="38" cy="34" r="6" fill="#fb923c" />
        <circle cx="50" cy="30" r="6" fill="#f43f5e" />
        <circle cx="62" cy="34" r="6" fill="#c084fc" />
        <circle cx="72" cy="46" r="6" fill="#38bdf8" />
        <circle cx="50" cy="52" r="5" fill="#4ade80" />
        <text x="50" y="74" fill="#ffffff" fontFamily="sans-serif" fontWeight="700" fontSize="12" textAnchor="middle" letterSpacing="1">
          peacock
        </text>
      </svg>
    );
  }

  // Fallback to high-res TMDB logo
  if (logoPath) {
    return (
      <img
        src={`${TMDB_LOGO_BASE}${logoPath}`}
        alt={providerName}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          objectFit: 'cover',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          flexShrink: 0,
        }}
      />
    );
  }

  // Generic streaming service fallback icon
  return (
    <div
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '8px',
        background: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        flexShrink: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    </div>
  );
};

const StreamingProviderBadge = ({ provider, movieTitle, categoryType, countryCode, justWatchLink }) => {
  const [isHovered, setIsHovered] = useState(false);

  const redirectUrl = getProviderRedirectUrl(
    provider.provider_name,
    movieTitle,
    countryCode,
    justWatchLink
  );

  const actionText =
    categoryType === 'rent' ? 'Rent' : categoryType === 'buy' ? 'Buy' : 'Stream';

  return (
    <a
      href={redirectUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Watch "${movieTitle}" on ${provider.provider_name} (Opens in new tab)`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: isHovered
          ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.18), rgba(255, 255, 255, 0.08))'
          : 'rgba(255, 255, 255, 0.04)',
        border: isHovered
          ? '1px solid rgba(var(--accent-rgb), 0.65)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(var(--accent-rgb), 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Official High-Resolution Streaming Platform Vector / TMDB Logo */}
      {renderOfficialLogo(provider.provider_name, provider.logo_path)}

      {/* Provider Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span
          style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: isHovered ? '#ffffff' : '#f1f5f9',
            letterSpacing: '0.2px',
          }}
        >
          {provider.provider_name}
        </span>
        <span
          style={{
            fontSize: '0.74rem',
            color: isHovered ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          {actionText} on {provider.provider_name}
        </span>
      </div>

      {/* Redirect indicator arrow */}
      <span
        style={{
          marginLeft: '6px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: isHovered ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
      >
        ↗
      </span>
    </a>
  );
};

export default StreamingProviderBadge;
