import React, { useState, useEffect } from 'react';
import API from '../services/api';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'popular', label: '⭐ Popular' },
  { id: 'upcoming', label: '🚀 Upcoming' },
  { id: 'top-rated', label: '🏆 Top Rated' },
];

const GENRES = [
  { id: 'all', name: 'All Genres' },
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
];

const DiscoveryPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('trending');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');
  const [message, setMessage] = useState('');

  // Fetch movies based on Category or Search
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let endpoint = `/movies/${activeCategory}`;
        if (searchQuery.trim().length > 1) {
          endpoint = `/movies/search?query=${encodeURIComponent(searchQuery.trim())}`;
        }

        const { data } = await API.get(endpoint);
        if (data.success) {
          setMovies(data.data);
        }
      } catch (err) {
        console.error('Error fetching discovery movies', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search by 300ms
    const timer = setTimeout(() => {
      fetchMovies();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery]);

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

      const { data } = await API.post('/watchlist', payload);
      setMessage(`✅ Added "${movie.title}" to your watchlist!`);
      setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      setMessage(`⚠️ ${err.response?.data?.message || 'Could not add to watchlist'}`);
      setTimeout(() => setMessage(''), 3500);
    }
  };

  // Filter & Sort movies on client side
  const filteredMovies = movies
    .filter((m) => {
      if (selectedGenre === 'all') return true;
      return m.genre_ids && m.genre_ids.includes(Number(selectedGenre));
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
      if (sortBy === 'releaseDate') return new Date(b.release_date || 0) - new Date(a.release_date || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return (b.popularity || 0) - (a.popularity || 0);
    });

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

        {message && (
          <div className="alert alert-success" style={{ animation: 'modalFadeIn 0.2s' }}>
            {message}
          </div>
        )}

        {/* Live Search Bar */}
        <div className="search-bar-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search movies by title (e.g. Inception, Avatar, Batman)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter and Sorting Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Category Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`btn btn-sm ${activeCategory === cat.id && !searchQuery ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Genre & Sort Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.9rem' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popularity">Sort by: Popularity</option>
            <option value="rating">Sort by: Rating (High to Low)</option>
            <option value="releaseDate">Sort by: Release Date</option>
            <option value="title">Sort by: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading movies...</p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>No movies found</h3>
          <p>Try a different search keyword or category.</p>
        </div>
      ) : (
        <div className="movies-grid">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onAddToWatchlist={handleAddToWatchlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoveryPage;
