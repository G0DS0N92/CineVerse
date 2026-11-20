import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// Curated high-res upcoming movies starting with Avengers: Doomsday as Slide #1
const DEFAULT_UPCOMING_SLIDES = [
  {
    id: 1003596,
    title: 'Avengers: Doomsday',
    backdrop_path: '/rObL4of4eFA8yWaN9pRFo9aOVNi.jpg',
    release_date: '17/12/2026',
    tagline: 'A Multiverse on a collision course.',
    overview:
      "Beloved heroes from three distinct universes are set on a deadly collision course against Doctor Doom and face an existential threat unlike anything they've ever encountered.",
  },
  {
    id: 1170608,
    title: 'Dune: Part Three',
    backdrop_path: '/i5E9H7Ik0u61ylDDTbmUpTL3Yw.jpg',
    release_date: '15/12/2026',
    tagline: 'The Holy War unfolds across the stars.',
    overview:
      'Paul Atreides faces the galactic fallout of the Holy War as he grapples with the terrifying destiny of his prescience and the fate of the known universe.',
  },
  {
    id: 1003598,
    title: 'Avengers: Secret Wars',
    backdrop_path: '/rytc6Lf4447C0CDncwFa4gxe0vY.jpg',
    release_date: '17/12/2027',
    tagline: 'The collapse of reality.',
    overview:
      'The ultimate culmination of the Multiverse Saga where realities clash and heroes from across all time fight for the survival of the cosmos.',
  },
  {
    id: 1260649,
    title: 'Jumanji: Open World',
    backdrop_path: '/vaYfhMuwFwsMqyMnu9amtS9hUHE.jpg',
    release_date: '23/12/2026',
    tagline: 'The game enters reality.',
    overview:
      "The perils of Jumanji escape the jungle into the modern world, forcing unexpected heroes to team up and survive the game's deadliest levels.",
  },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [upcomingSlides, setUpcomingSlides] = useState(DEFAULT_UPCOMING_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [watchlistIds, setWatchlistIds] = useState(new Set());

  // Helper: Format release date strictly to DD/MM/YYYY
  const formatToDDMMYYYY = (dateStr) => {
    if (!dateStr) return 'TBA';
    if (dateStr.includes('/')) return dateStr;
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // Fetch Trending and Live Upcoming Movies
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trending movies for the preview row
        const { data: trendData } = await API.get('/movies/trending');
        if (trendData.success) {
          setTrendingMovies(trendData.data.slice(0, 6)); // Top 6 trending
        }

        {/* Fetch upcoming movies to enhance slides with premier live TMDB data */}
        const { data: upData } = await API.get('/movies/upcoming');
        if (upData.success && Array.isArray(upData.data)) {
          // Filter to high-popularity blockbuster upcoming titles with backdrops
          const premierUpcoming = upData.data.filter(
            (m) => m.backdrop_path && (m.popularity >= 25 || m.vote_count > 0)
          );

          // Find Doomsday or keep curated Doomsday as #1
          const doomsday =
            premierUpcoming.find((m) => m.id === 1003596 || m.title.includes('Doomsday')) ||
            DEFAULT_UPCOMING_SLIDES[0];

          // Filter out doomsday from the others and take top 3
          const others = premierUpcoming
            .filter((m) => m.id !== doomsday.id && m.id !== 1003596)
            .slice(0, 3)
            .map((m) => ({
              ...m,
              release_date: formatToDDMMYYYY(m.release_date),
            }));

          const combined = [
            {
              ...DEFAULT_UPCOMING_SLIDES[0],
              ...doomsday,
              backdrop_path: DEFAULT_UPCOMING_SLIDES[0].backdrop_path,
              release_date: '17/12/2026',
            },
            ...others,
          ];

          if (combined.length >= 2) {
            setUpcomingSlides(combined);
          }
        }
      } catch (err) {
        console.error('Failed to load homepage movies', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch user watchlist IDs for live toggle states (+ Watchlist vs Remove)
  useEffect(() => {
    const fetchUserWatchlist = async () => {
      if (!isAuthenticated) {
        setWatchlistIds(new Set());
        return;
      }
      try {
        const { data } = await API.get('/watchlist');
        if (data.success && Array.isArray(data.data)) {
          setWatchlistIds(new Set(data.data.map((item) => item.tmdbId)));
        }
      } catch (err) {
        console.error('Failed to load user watchlist status', err);
      }
    };

    fetchUserWatchlist();
  }, [isAuthenticated]);

  // Auto-advance slideshow every 5.5 seconds unless paused on hover
  useEffect(() => {
    if (isPaused || upcomingSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % upcomingSlides.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused, upcomingSlides.length, currentSlide]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? upcomingSlides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % upcomingSlides.length);
  };

  // Add Movie to Watchlist
  const handleAddToWatchlist = async (movie) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const payload = {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        overview: movie.overview,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        genres: movie.genre_ids ? movie.genre_ids.map(String) : [],
        status: 'Planned to Watch',
      };

      await API.post('/watchlist', payload);
      setWatchlistIds((prev) => new Set(prev).add(movie.id));
      setToast({
        message: `Added "${movie.title}" to your watchlist!`,
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Could not add to watchlist',
        type: 'error',
      });
    }
  };

  // Remove Movie from Watchlist
  const handleRemoveFromWatchlist = async (movie) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await API.delete(`/watchlist/movie/${movie.id}`);
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        next.delete(movie.id);
        return next;
      });
      setToast({
        message: 'The Movie has been removed from watchlist',
        type: 'error',
      });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Could not remove from watchlist',
        type: 'error',
      });
    }
  };

  const activeSlide = upcomingSlides[currentSlide] || upcomingSlides[0];

  return (
    <div>
      {/* ========================================================
          HERO CAROUSEL SECTION (MATCHING CINEMATIC MOCKUP)
          ======================================================== */}
      <section
        className="hero-showcase-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Backdrop Artwork on the Right with Dark Fade */}
        <div className="hero-backdrop-wrap">
          <img
            key={activeSlide.id}
            src={`${TMDB_BACKDROP_BASE}${activeSlide.backdrop_path}`}
            alt={activeSlide.title}
            className="hero-backdrop-img"
          />
          <div className="hero-backdrop-overlay" />
        </div>

        {/* Content on the Left */}
        <div className="hero-content-left">
          {/* Pill Badge */}
          <div className="hero-pill-badge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
            </svg>
            <span>Your Personal Movie Companion</span>
          </div>

          {/* Main Cinematic Title */}
          <h1 className="hero-main-title">
            Discover. Watchlist.{' '}
            <span className="hero-title-highlight">Remind.</span>
          </h1>

          {/* Upcoming Featured Movie Pill */}
          <div className="hero-slide-preview-badge">
            <span>Upcoming Premiere:</span>
            <strong style={{ color: '#ffffff' }}>{activeSlide.title}</strong>
            <span style={{ opacity: 0.7 }}>• {activeSlide.release_date}</span>
          </div>

          {/* Subtitle Description */}
          <p className="hero-description">
            CineVerse is an all-in-one movie platform to discover real-time trending titles, curate
            personalized watchlists, and schedule smart reminders so you never miss a movie night.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions-row">
            <Link to="/discover" className="hero-btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Explore Movies</span>
            </Link>

            {isAuthenticated ? (
              <Link to="/watchlist" className="hero-btn-secondary">
                <span>+ My Watchlist</span>
              </Link>
            ) : (
              <Link to="/register" className="hero-btn-secondary">
                <span>+ My Watchlist</span>
              </Link>
            )}
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          type="button"
          className="hero-nav-arrow left"
          onClick={handlePrevSlide}
          aria-label="Previous upcoming movie"
        >
          &#8249;
        </button>
        <button
          type="button"
          className="hero-nav-arrow right"
          onClick={handleNextSlide}
          aria-label="Next upcoming movie"
        >
          &#8250;
        </button>

        {/* Slide Indicator Dots with Animated Red Progress Fill in Active Pill */}
        <div className="hero-dots-row">
          {upcomingSlides.map((s, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={s.id || idx}
                type="button"
                className={`hero-dot ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Jump to slide ${idx + 1}`}
              >
                {isActive && (
                  <span
                    key={`dot-fill-${currentSlide}`}
                    className={`hero-dot-fill ${isPaused ? 'paused' : 'running'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          FOUR HORIZONTAL FEATURE TAGS (ALL IN ONE LINE)
          ======================================================== */}
      <section className="feature-cards-grid-modern">
        <Link to="/discover" className="feature-card-modern">
          <div className="feature-card-icon-box">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Discover Movies</h3>
          </div>
        </Link>

        <Link to="/watchlist" className="feature-card-modern">
          <div className="feature-card-icon-box">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Curate Watchlists</h3>
          </div>
        </Link>

        <Link to="/reminders" className="feature-card-modern">
          <div className="feature-card-icon-box">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Smart Reminders</h3>
          </div>
        </Link>

        <Link to="/dashboard" className="feature-card-modern">
          <div className="feature-card-icon-box">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Your Movie Stats</h3>
          </div>
        </Link>
      </section>

      {/* ========================================================
          TRENDING NOW SECTION (MATCHING REFERENCE MOCKUP)
          ======================================================== */}
      <section className="home-trending-section">
        <div className="section-header-modern">
          <div className="section-title-wrap">
            <div className="section-title-bar" />
            <div className="section-title-text">
              <h2>Trending Now</h2>
              <p>The most popular movies right now</p>
            </div>
          </div>

          <Link to="/discover" className="section-view-all-link">
            <span>View All</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching trending movies...</p>
          </div>
        ) : (
          <div className="home-movies-grid">
            {trendingMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isInWatchlist={watchlistIds.has(movie.id)}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
              />
            ))}
          </div>
        )}
      </section>

      {/* Center-Bottom Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default HomePage;
