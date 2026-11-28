import React, { useRef, useState } from 'react';

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Deterministic hash helper for consistent seat/hall/serial generation
const getDeterministicHash = (str) => {
  let hash = 0;
  const input = String(str || 'cineverse_default_stub');
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Strict DD/MM/YYYY date formatting
export const formatStubDate = (rawDate) => {
  if (!rawDate) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(rawDate).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    return str;
  }

  if (str.includes('-')) {
    const clean = str.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }

  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return '15/12/2026';
};

const CinemaTicketStub = ({
  movie,
  watchDate,
  userRating,
  compact = false,
  showDownloadButton = true,
}) => {
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef(null);

  if (!movie) return null;

  const id = movie.tmdbId || movie.id || movie._id || '000';
  const title = movie.title || 'Cinema Screening';
  const poster = movie.posterPath || movie.poster_path || movie.backdropPath || movie.backdrop_path;
  const posterUrl = poster ? `${TMDB_IMG_BASE}${poster}` : null;
  const rating = userRating || movie.voteAverage || movie.vote_average || 8.5;
  const releaseDate = movie.releaseDate || movie.release_date || '';
  const year = (() => {
    if (!releaseDate) return '2026';
    if (releaseDate.includes('/')) return releaseDate.split('/')[2] || '2026';
    return releaseDate.split('-')[0] || '2026';
  })();

  const genres = Array.isArray(movie.genres)
    ? movie.genres.map((g) => (typeof g === 'object' ? g.name : g)).slice(0, 3)
    : ['Cinema', 'Feature'];

  // Deterministic seat, hall, and ticket serial calculations
  const hash = getDeterministicHash(id);
  const hallNumber = (hash % 6) + 1;
  const hallType = ['IMAX LASER', 'DOLBY CINEMA', 'PREMIER LOUNGE', 'ULTRA SCREEN'][hash % 4];
  const rowLetter = String.fromCharCode(65 + (hash % 9)); // Rows A - I
  const seatNumber = (hash % 22) + 1;
  const showTimes = ['17:45', '19:15', '20:30', '21:15', '22:00'];
  const showtime = showTimes[hash % showTimes.length];
  const ticketSerial = `CV-TKT-${String((hash % 8999) + 1000)}-${String(((hash >> 3) % 8999) + 1000)}`;
  const displayDate = formatStubDate(watchDate || movie.watchedAt || movie.updatedAt || releaseDate);

  // High-Resolution HTML5 Canvas PNG Generator (1200 x 520 px)
  const handleDownloadTicketPng = async () => {
    try {
      setDownloading(true);
      const width = 1200;
      const height = 520;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Background fill with dark cinematic obsidian
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, width, height);

      // 2. Ticket outer rounded card
      const margin = 20;
      const cardX = margin;
      const cardY = margin;
      const cardW = width - margin * 2;
      const cardH = height - margin * 2;
      const radius = 24;

      // Card gradient
      const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
      cardGrad.addColorStop(0, '#101726');
      cardGrad.addColorStop(0.5, '#0c101a');
      cardGrad.addColorStop(1, '#080c14');
      ctx.fillStyle = cardGrad;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();

      // Gold border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner subtle border
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX + 10, cardY + 10, cardW - 20, cardH - 20);
      ctx.restore();

      // 3. Perforation seam dividing Main Stub and Coupon Stub at x = 860
      const seamX = 860;

      // Draw dashed line for perforation
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.moveTo(seamX, cardY + 36);
      ctx.lineTo(seamX, cardY + cardH - 36);
      ctx.stroke();

      // Perforation cutout notches (top & bottom semicircles)
      const notchR = 26;
      ctx.fillStyle = '#070a12';
      // Top notch
      ctx.beginPath();
      ctx.arc(seamX, cardY, notchR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(seamX, cardY, notchR, 0, Math.PI);
      ctx.stroke();

      // Bottom notch
      ctx.beginPath();
      ctx.arc(seamX, cardY + cardH, notchR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(seamX, cardY + cardH, notchR, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4. Header Bar (Main Stub)
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 20px "Segoe UI", Montserrat, sans-serif';
      ctx.fillText('CINEVERSE PREMIERE ARCHIVE', cardX + 36, cardY + 50);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('CERTIFIED SCREENING PASS • VERIFIED WATCHLIST ARCHIVE', cardX + 36, cardY + 70);

      // Gold seal badge on top right of main stub
      ctx.save();
      ctx.strokeStyle = '#d4af37';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.beginPath();
      ctx.roundRect(seamX - 220, cardY + 34, 190, 36, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f3e5ab';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('COLLECTOR PASS', seamX - 200, cardY + 56);
      ctx.restore();

      // 5. Load and Draw Poster if available, else placeholder block
      const posterX = cardX + 36;
      const posterY = cardY + 95;
      const posterW = 190;
      const posterH = 285;

      const drawPosterFallback = () => {
        ctx.fillStyle = '#172033';
        ctx.fillRect(posterX, posterY, posterW, posterH);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.strokeRect(posterX, posterY, posterW, posterH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText('CINEVERSE', posterX + 35, posterY + 140);
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(title.substring(0, 18), posterX + 20, posterY + 165);
      };

      if (posterUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = posterUrl;
          });
          ctx.drawImage(img, posterX, posterY, posterW, posterH);
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(posterX, posterY, posterW, posterH);
        } catch {
          drawPosterFallback();
        }
      } else {
        drawPosterFallback();
      }

      // 6. Movie Information Details (Right of Poster)
      const infoX = posterX + posterW + 32;

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Segoe UI", Montserrat, sans-serif';
      const truncatedTitle = title.length > 28 ? `${title.substring(0, 26)}...` : title;
      ctx.fillText(truncatedTitle, infoX, cardY + 135);

      // Year & Genres line
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText(`${year} • ${genres.join(' | ')}`, infoX, cardY + 165);

      // Screening Grid Boxes
      const gridY = cardY + 190;
      const boxW = 120;
      const boxH = 68;

      const drawInfoBox = (bx, by, label, value, highlight) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = highlight ? 'rgba(212, 175, 55, 0.6)' : 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(bx, by, boxW, boxH);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(label, bx + 12, by + 22);

        ctx.fillStyle = highlight ? '#f3e5ab' : '#ffffff';
        ctx.font = 'bold 17px "Segoe UI", sans-serif';
        ctx.fillText(value, bx + 12, by + 50);
      };

      drawInfoBox(infoX, gridY, 'WATCH DATE', displayDate, true);
      drawInfoBox(infoX + 132, gridY, 'SHOWTIME', showtime, false);
      drawInfoBox(infoX + 264, gridY, 'CINEMA HALL', `HALL 0${hallNumber}`, false);
      drawInfoBox(infoX + 396, gridY, 'SEAT ASSIGN', `${rowLetter}-${seatNumber}`, true);

      // Second info row
      const gridY2 = gridY + 80;
      drawInfoBox(infoX, gridY2, 'EXPERIENCE', hallType, false);
      drawInfoBox(infoX + 132, gridY2, 'ADMIT', '01 PASS', false);
      drawInfoBox(infoX + 264, gridY2, 'USER RATING', `${Number(rating).toFixed(1)} / 10`, true);
      drawInfoBox(infoX + 396, gridY2, 'TIER', 'VERIFIED', false);

      // Barcode on Main Stub (bottom left under poster)
      const barcodeX = posterX;
      const barcodeY = cardY + cardH - 58;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(barcodeX, barcodeY, posterW, 28);

      // Draw faux barcode bars
      ctx.fillStyle = '#070a12';
      let bx = barcodeX + 6;
      while (bx < barcodeX + posterW - 8) {
        const barWidth = ((bx * 7) % 3) + 1;
        ctx.fillRect(bx, barcodeY + 2, barWidth, 24);
        bx += barWidth + ((bx * 3) % 4) + 1;
      }

      ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(ticketSerial, posterX + posterW + 32, cardY + cardH - 36);

      // 7. Right Coupon Stub (Tear-off part: x from seamX to cardX + cardW)
      const couponX = seamX + 28;
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('ADMIT ONE', couponX, cardY + 50);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('CINEVERSE PASS', couponX, cardY + 70);

      // Movie Title snippet on stub
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      const shortTitle = title.length > 18 ? `${title.substring(0, 16)}...` : title;
      ctx.fillText(shortTitle, couponX, cardY + 130);

      // Details on Coupon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('DATE', couponX, cardY + 165);
      ctx.fillStyle = '#f3e5ab';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(displayDate, couponX, cardY + 185);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('HALL / SEAT', couponX, cardY + 220);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(`H0${hallNumber} • ${rowLetter}-${seatNumber}`, couponX, cardY + 242);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('SHOWTIME', couponX, cardY + 275);
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText(showtime, couponX, cardY + 295);

      // Gold Seal Stamp on coupon
      ctx.save();
      ctx.translate(couponX + 110, cardY + 360);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 8px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f3e5ab';
      ctx.textAlign = 'center';
      ctx.fillText('CINEVERSE', 0, -8);
      ctx.fillText('VERIFIED', 0, 4);
      ctx.fillText('ARCHIVE', 0, 16);
      ctx.restore();

      // Mini barcode on Coupon
      const miniBarX = couponX;
      const miniBarY = cardY + cardH - 58;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(miniBarX, miniBarY, 210, 24);
      ctx.fillStyle = '#070a12';
      let mbx = miniBarX + 4;
      while (mbx < miniBarX + 204) {
        const barWidth = ((mbx * 5) % 3) + 1;
        ctx.fillRect(mbx, miniBarY + 2, barWidth, 20);
        mbx += barWidth + ((mbx * 2) % 3) + 1;
      }

      ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
      ctx.font = '9px "Courier New", monospace';
      ctx.fillText(`NO. ${ticketSerial}`, couponX, cardY + cardH - 18);

      // 8. Convert to PNG & Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_');
      const link = document.createElement('a');
      link.download = `CineVerse-Pass-${safeTitle}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating ticket PNG:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`cinema-ticket-wrapper ${compact ? 'compact' : ''}`}>
      {/* Interactive Perforated Cinema Ticket Stub */}
      <div className="cinema-ticket-card" ref={ticketRef}>
        {/* Glow Aura */}
        <div className="ticket-glow-aura" />

        {/* Main Ticket Stub Body */}
        <div className="ticket-main-section">
          <div className="ticket-header-row">
            <div className="ticket-brand">
              <span className="ticket-brand-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <rect x="2" y="2" width="20" height="20" rx="2" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
              </span>
              <div>
                <span className="ticket-brand-text">CINEVERSE ARCHIVE CINEMA</span>
                <span className="ticket-tagline">COLLECTIBLE PREMIERE PASS • VERIFIED SCREENING</span>
              </div>
            </div>

            <div className="ticket-collector-badge">
              <span>ARCHIVE PASS</span>
            </div>
          </div>

          <div className="ticket-content-row">
            {/* Poster Thumbnail */}
            <div className="ticket-poster-wrap">
              {posterUrl ? (
                <img src={posterUrl} alt={title} className="ticket-poster-img" loading="lazy" />
              ) : (
                <div className="ticket-poster-placeholder">
                  <span>CINEVERSE</span>
                </div>
              )}
            </div>

            {/* Movie & Screening Details */}
            <div className="ticket-details-wrap">
              <h2 className="ticket-movie-title" title={title}>
                {title}
              </h2>
              <div className="ticket-meta-badges">
                <span className="ticket-year-badge">{year}</span>
                {genres.map((g, idx) => (
                  <span key={idx} className="ticket-genre-badge">
                    {g}
                  </span>
                ))}
              </div>

              <div className="ticket-grid">
                <div className="ticket-grid-cell highlight">
                  <span className="cell-label">DATE</span>
                  <span className="cell-value">{displayDate}</span>
                </div>

                <div className="ticket-grid-cell">
                  <span className="cell-label">SHOWTIME</span>
                  <span className="cell-value">{showtime}</span>
                </div>

                <div className="ticket-grid-cell">
                  <span className="cell-label">CINEMA HALL</span>
                  <span className="cell-value">HALL 0{hallNumber}</span>
                </div>

                <div className="ticket-grid-cell highlight">
                  <span className="cell-label">ROW / SEAT</span>
                  <span className="cell-value">
                    {rowLetter} - {seatNumber}
                  </span>
                </div>

                <div className="ticket-grid-cell">
                  <span className="cell-label">EXPERIENCE</span>
                  <span className="cell-value">{hallType}</span>
                </div>

                <div className="ticket-grid-cell highlight">
                  <span className="cell-label">USER RATING</span>
                  <span className="cell-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{Number(rating).toFixed(1)}</span>
                  </span>
                </div>
              </div>

              {/* Barcode line on main body */}
              <div className="ticket-barcode-wrap">
                <div className="ticket-barcode-lines" />
                <span className="ticket-serial-number">{ticketSerial}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Perforation Seam with Notch Cutouts */}
        <div className="ticket-perforation-seam">
          <div className="perforation-notch top" />
          <div className="perforation-line" />
          <div className="perforation-notch bottom" />
        </div>

        {/* Right Coupon Stub (Tear-Off Part) */}
        <div className="ticket-coupon-section">
          <div className="coupon-header">
            <span className="admit-one-text">ADMIT ONE</span>
            <span className="coupon-subtitle">PASS #{String(hash % 9999).padStart(4, '0')}</span>
          </div>

          <div className="coupon-body">
            <div className="coupon-movie-name">{title}</div>
            <div className="coupon-meta-block">
              <span className="c-label">DATE</span>
              <span className="c-val">{displayDate}</span>
            </div>
            <div className="coupon-meta-block">
              <span className="c-label">HALL & SEAT</span>
              <span className="c-val">
                H0{hallNumber} • {rowLetter}-{seatNumber}
              </span>
            </div>

            {/* Golden Embossed Seal */}
            <div className="ticket-gold-seal" title="CineVerse Certified Screening">
              <div className="seal-inner">
                <span className="seal-text-top">CINEVERSE</span>
                <span className="seal-star">ORIGINAL</span>
                <span className="seal-text-bot">VERIFIED</span>
              </div>
            </div>
          </div>

          <div className="coupon-barcode-wrap">
            <div className="ticket-barcode-lines mini" />
            <span className="coupon-serial">{ticketSerial}</span>
          </div>
        </div>
      </div>

      {/* 1-Click PNG Download Control */}
      {showDownloadButton && (
        <div className="ticket-action-bar">
          <button
            type="button"
            className="btn btn-primary ticket-download-btn"
            onClick={handleDownloadTicketPng}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <span className="spinner-border-sm" />
                <span>Exporting Ticket PNG...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Ticket Pass (PNG)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CinemaTicketStub;
