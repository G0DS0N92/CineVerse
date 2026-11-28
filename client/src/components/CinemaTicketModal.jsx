import React, { useEffect } from 'react';
import CinemaTicketStub from './CinemaTicketStub';

const CinemaTicketModal = ({ isOpen, onClose, movie, watchDate, userRating }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !movie) return null;

  return (
    <div className="modal-overlay ticket-modal-overlay" onClick={onClose}>
      <div
        className="modal-content ticket-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="ticket-modal-header">
          <div className="ticket-modal-title-group">
            <span className="ticket-modal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </span>
            <div>
              <h3>Collectible Cinema Pass</h3>
              <p>Verified Watched Movie Archival Stub</p>
            </div>
          </div>

          <button
            type="button"
            className="ticket-modal-close-btn"
            onClick={onClose}
            title="Close ticket modal"
          >
            &times;
          </button>
        </div>

        {/* Ticket Stub Component */}
        <div className="ticket-modal-body">
          <CinemaTicketStub
            movie={movie}
            watchDate={watchDate}
            userRating={userRating}
            showDownloadButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default CinemaTicketModal;
