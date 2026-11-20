import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>
          <strong>CineVerse</strong> &copy; {new Date().getFullYear()} – Built with the MERN Stack (MongoDB, Express, React, Node.js).
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          This product uses the TMDB API for live movie data but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
