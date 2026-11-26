import React, { useState, useEffect } from 'react';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'trending',
    label: 'Trending',
    defaultSort: 'popularity',
    subtitle: 'Viral buzz & most searched movies this week',
  },
  {
    id: 'now-playing',
    label: 'Now Playing',
    defaultSort: 'popularity',
    subtitle: 'Movies currently playing in theatres and newly released',
  },
  {
    id: 'upcoming',
    label: 'Upcoming',
    defaultSort: 'releaseDate',
    subtitle: 'Unreleased movies coming to theatres in the future',
  },
  {
    id: 'top-rated',
    label: 'Top Rated',
    defaultSort: 'rating',
    subtitle: 'All-time cinematic masterpieces with highest ratings',
  },
];

const GENRES = [
  { id: 'all', name: 'All Genres' },
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Rating (High to Low)' },
  { value: 'releaseDate', label: 'Release Date' },
  { value: 'title', label: 'Title (A-Z)' },
];

const DiscoveryPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState('trending');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync search query from URL if navigated from navbar search bar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) {
      setSearchQuery(q);
    }
  }, [location.search]);

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = React.useRef(null);
  const [toast, setToast] = useState(null);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const observerTarget = React.useRef(null);
  const isFetchingRef = React.useRef(false);
  const pageRef = React.useRef(1);
  const activeCategoryRef = React.useRef(activeCategory);
  const searchQueryRef = React.useRef(searchQuery);

  useEffect(() => {
    activeCategoryRef.current = activeCategory;
    searchQueryRef.current = searchQuery;
  }, [activeCategory, searchQuery]);

  // Close sort dropdown on click outside
  useEffect(() => {
    if (!sortDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdownOpen]);

  // Load user's saved watchlist IDs to show live toggle state (+ Watchlist vs Remove)
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

  // Initial fetch: loads Page 1 in clean sequence
  useEffect(() => {
    let isCancelled = false;

    const fetchInitialMovies = async () => {
      setLoading(true);
      pageRef.current = 1;
      setPage(1);
      setHasMore(true);
      isFetchingRef.current = false;

      try {
        const ep1 =
          searchQuery.trim().length > 1
            ? `/movies/search?query=${encodeURIComponent(searchQuery.trim())}&page=1`
            : `/movies/${activeCategory}?page=1`;

        const { data } = await API.get(ep1);
        if (isCancelled) return;

        if (data.success && Array.isArray(data.data)) {
          // Strictly deduplicate movies by ID
          const seen = new Set();
          const unique = data.data.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });

          setMovies(unique);
          if (unique.length === 0 || unique.length < 10) {
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error('Error fetching discovery movies', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    // Debounce search by 300ms
    const timer = setTimeout(() => {
      fetchInitialMovies();
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategory, searchQuery]);

  // Load next page of movies sequentially when infinite scroll triggers
  const loadMoreMovies = async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasMore) return;
    isFetchingRef.current = true;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;

    const targetCategory = activeCategoryRef.current;
    const targetSearch = searchQueryRef.current.trim();

    try {
      const endpoint =
        targetSearch.length > 1
          ? `/movies/search?query=${encodeURIComponent(targetSearch)}&page=${nextPage}`
          : `/movies/${targetCategory}?page=${nextPage}`;

      const { data } = await API.get(endpoint);

      // Verify user has not switched categories or search query while request was in-flight
      if (activeCategoryRef.current !== targetCategory || searchQueryRef.current.trim() !== targetSearch) {
        return;
      }
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setMovies((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const newUnique = data.data.filter((m) => !seen.has(m.id));
          return [...prev, ...newUnique];
        });
        pageRef.current = nextPage;
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more discovery movies', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  // IntersectionObserver for seamless sequential infinite scrolling
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current && hasMore) {
          loadMoreMovies();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, activeCategory, searchQuery]);

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
        adult: movie.adult === true,
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

  // Remove Movie from Watchlist (Toggle)
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

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat.id);
    setSearchQuery('');
    setSortBy(cat.defaultSort);
    pageRef.current = 1;
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    // Sort movies in-place when user explicitly changes sort dropdown
    setMovies((prev) => {
      return [...prev].sort((a, b) => {
        if (newSort === 'rating') {
          const diff = (b.vote_average || 0) - (a.vote_average || 0);
          if (Math.abs(diff) > 0.01) return diff;
          return (b.vote_count || 0) - (a.vote_count || 0);
        }
        if (newSort === 'releaseDate') {
          return new Date(b.release_date || 0) - new Date(a.release_date || 0);
        }
        if (newSort === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return (b.popularity || 0) - (a.popularity || 0);
      });
    });
  };

  // Filter movies on client side while preserving strict sequential ordering
  const today = new Date().toISOString().split('T')[0];

  const filteredMovies = movies.filter((m) => {
    // In Upcoming category, guarantee only unreleased future movies (release date >= today)
    if (activeCategory === 'upcoming' && m.release_date && m.release_date < today) {
      return false;
    }
    if (selectedGenre === 'all') return true;
    return m.genre_ids && m.genre_ids.includes(Number(selectedGenre));
  });

  // Complete the row grid: show only complete rows of 6 cards while infinite scrolling is active
  // (once user reaches the end of the catalogue, all remaining movies are displayed)
  const completeGridMovies = (() => {
    if (!hasMore || filteredMovies.length <= 6) return filteredMovies;
    const remainder = filteredMovies.length % 6;
    if (remainder !== 0) {
      return filteredMovies.slice(0, filteredMovies.length - remainder);
    }
    return filteredMovies;
  })();

  return (
    <div>
      {/* Search Header Banner */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          Explore Movies
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Search real-time TMDB catalogue or browse by trending categories
        </p>

        {/* Live Search Bar */}
        <div className="search-bar-wrap">
          <span className="search-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search movies by title (e.g. Inception, Avatar, Batman)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category and Sort Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        {/* Category Buttons */}
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm ${activeCategory === cat.id && !searchQuery ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {!searchQuery && (
            <p className="category-subtitle" style={{ margin: '8px 0 0', fontSize: '0.85rem' }}>
              {CATEGORIES.find((c) => c.id === activeCategory)?.subtitle}
            </p>
          )}
        </div>

        {/* Sort Controls (Themed Custom Dropdown) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Sort:
          </span>
          <div ref={sortDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, rgba(19, 26, 40, 0.95), rgba(10, 14, 23, 0.95))',
                border: sortDropdownOpen ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: sortDropdownOpen ? '0 0 14px rgba(var(--accent-rgb), 0.4)' : 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '150px',
                justifyContent: 'space-between',
                outline: 'none',
              }}
              title="Select Sort Order"
            >
              <span>{SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Popularity'}</span>

              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: sortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: sortDropdownOpen ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Floating Menu Popover */}
            {sortDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  minWidth: '210px',
                  width: 'max-content',
                  background: 'linear-gradient(145deg, #131a28 0%, #0a0e17 100%)',
                  border: '1px solid rgba(var(--accent-rgb), 0.45)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(var(--accent-rgb), 0.25)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 200,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div
                  style={{
                    padding: '6px 10px 4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Select Sort Order
                </div>

                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => {
                        handleSortChange(opt.value);
                        setSortDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        background: isSelected
                          ? 'linear-gradient(90deg, rgba(var(--accent-rgb), 0.22), rgba(var(--accent-rgb), 0.08))'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected ? '1px solid rgba(var(--accent-rgb), 0.4)' : '1px solid transparent',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#cbd5e1';
                        }
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent-primary)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick-Filter Genre Pills Bar */}
      <div
        className="cinema-horizontal-scroll"
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          paddingBottom: '12px',
          marginBottom: '26px',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginRight: '4px',
            flexShrink: 0,
          }}
        >
          Genre:
        </span>
        {GENRES.map((g) => {
          const isSelected = String(selectedGenre) === String(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGenre(String(g.id))}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 700 : 500,
                background: isSelected
                  ? 'var(--accent-primary)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                border: isSelected
                  ? '1px solid var(--accent-primary)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isSelected
                  ? '0 0 12px rgba(var(--accent-rgb), 0.45)'
                  : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
              }}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading movies...</p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.6 }}
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
          </div>
          <h3>No movies found</h3>
          <p>Try a different search keyword or category.</p>
        </div>
      ) : (
        <>
          <div className="movies-grid">
            {completeGridMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isInWatchlist={watchlistIds.has(movie.id)}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
              />
            ))}
          </div>

          {/* Sentinel element observed by IntersectionObserver for infinite scrolling */}
          <div ref={observerTarget} className="infinite-scroll-sentinel" />

          {loadingMore && (
            <div className="infinite-scroll-loading">
              <div className="spinner-small" />
              <span>Loading more movies...</span>
            </div>
          )}

          {!hasMore && completeGridMovies.length > 0 && (
            <div className="infinite-scroll-end">
              <span>You have explored all movies in this category.</span>
            </div>
          )}
        </>
      )}

      {/* Center-Bottom Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default DiscoveryPage;
