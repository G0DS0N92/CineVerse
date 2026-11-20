import React, { useEffect } from 'react';

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast || !toast.message) return null;

  const isError = toast.type === 'error';

  return (
    <div className="toast-container">
      <div className={`toast-notification ${isError ? 'toast-error' : 'toast-success'}`}>
        <span className="toast-icon">
          {isError ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="toast-message">{toast.message}</span>
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="Close notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Toast;
