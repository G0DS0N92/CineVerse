const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Fallback mock movies used ONLY when TMDB_API_KEY is not yet added in .env
// This prevents server crashing and allows initial testing
const FALLBACK_MOVIES = [
  {
    id: 550,
    title: 'Fight Club',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
    release_date: '1999-10-15',
    vote_average: 8.4,
    genre_ids: [18, 53],
  },
  {
    id: 155,
    title: 'The Dark Knight',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
    release_date: '2008-07-18',
    vote_average: 8.5,
    genre_ids: [18, 28, 80],
  },
  {
    id: 27205,
    title: 'Inception',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    overview: 'Cobb, a skilled thief who steals secrets from deep within the subconscious during sleep, is offered a chance to regain his old life.',
    release_date: '2010-07-16',
    vote_average: 8.4,
    genre_ids: [28, 878, 12],
  },
  {
    id: 157336,
    title: 'Interstellar',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    release_date: '2014-11-05',
    vote_average: 8.4,
    genre_ids: [12, 18, 878],
  },
  {
    id: 299536,
    title: 'Avengers: Infinity War',
    poster_path: '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
    backdrop_path: '/lmZFxVIz3ujsbUpognM1vIRNCu9.jpg',
    overview: 'As the Avengers and their allies continue to protect the world, a new danger has emerged from the cosmic shadows: Thanos.',
    release_date: '2018-04-27',
    vote_average: 8.3,
    genre_ids: [12, 28, 878],
  },
  {
    id: 238,
    title: 'The Godfather',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
    release_date: '1972-03-24',
    vote_average: 8.7,
    genre_ids: [18, 80],
  },
];

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Helper: Make calls to TMDB API with API Key (supports both v3 key and v4 Bearer token)
const fetchFromTMDB = async (endpoint, params = {}) => {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    console.warn(`[TMDB Service] No TMDB_API_KEY set. Returning sample data for ${endpoint}`);
    return null;
  }

  const isBearer = apiKey.startsWith('eyJ');
  const headers = isBearer ? { Authorization: `Bearer ${apiKey}` } : {};
  const queryParams = {
    language: 'en-US',
    ...params,
  };

  if (!isBearer) {
    queryParams.api_key = apiKey;
  }

  const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    headers,
    params: queryParams,
  });

  return response.data;
};

// Service Methods
const getTrending = async (timeWindow = 'week', page = 1) => {
  const data = await fetchFromTMDB(`/trending/movie/${timeWindow}`, { page });
  return data ? data.results : FALLBACK_MOVIES;
};

const getNowPlaying = async (page = 1) => {
  const data = await fetchFromTMDB('/movie/now_playing', { page });
  return data ? data.results : FALLBACK_MOVIES;
};

const getPopular = async (page = 1) => {
  const data = await fetchFromTMDB('/movie/popular', { page });
  return data ? data.results : FALLBACK_MOVIES;
};

const getUpcoming = async (page = 1) => {
  const today = new Date().toISOString().split('T')[0];
  // Strictly discover unreleased movies with release date >= today
  const data = await fetchFromTMDB('/discover/movie', {
    'primary_release_date.gte': today,
    sort_by: 'popularity.desc',
    include_adult: false,
    include_video: false,
    page,
  });

  const results = data ? data.results : FALLBACK_MOVIES.slice(0, 3);
  // Guarantee only true future movies and sort chronologically (soonest upcoming first)
  return results
    .filter((m) => m.release_date && m.release_date >= today)
    .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
};

const getTopRated = async (page = 1) => {
  const data = await fetchFromTMDB('/movie/top_rated', { page });
  const results = data ? data.results : FALLBACK_MOVIES;
  // Strictly sort descending by vote_average (highest rated first, e.g. 9.0+ at the top)
  return results.sort((a, b) => {
    const diff = (b.vote_average || 0) - (a.vote_average || 0);
    if (Math.abs(diff) > 0.01) return diff;
    return (b.vote_count || 0) - (a.vote_count || 0);
  });
};

const searchMovies = async (query, page = 1) => {
  if (!query) return [];
  const data = await fetchFromTMDB('/search/movie', { query, page, include_adult: false });
  if (data) return data.results;

  // Simple query match on fallback movies if no API key is present
  const q = query.toLowerCase();
  return FALLBACK_MOVIES.filter((m) => m.title.toLowerCase().includes(q));
};

const getMovieDetails = async (movieId) => {
  const data = await fetchFromTMDB(`/movie/${movieId}`, {
    append_to_response: 'videos,credits,similar,release_dates',
  });

  if (data) {
    // Determine the most accurate regional theatrical launch date
    if (data.release_dates && Array.isArray(data.release_dates.results)) {
      const inCountry = data.release_dates.results.find((c) => c.iso_3166_1 === 'IN');
      const usCountry = data.release_dates.results.find((c) => c.iso_3166_1 === 'US');

      const findTheatrical = (c) => {
        if (!c || !Array.isArray(c.release_dates)) return null;
        // Type 3 is general theatrical release; fallback to first available
        const theatrical = c.release_dates.find((d) => d.type === 3) || c.release_dates[0];
        return theatrical ? theatrical.release_date.split('T')[0] : null;
      };

      const inDate = findTheatrical(inCountry);
      const usDate = findTheatrical(usCountry);

      if (inDate) {
        data.release_date = inDate;
      } else if (usDate) {
        data.release_date = usDate;
      }

      // Extract regional age rating / certification (e.g. PG-13, R, 18+, A, U/A)
      let certification = '';
      const gbCountry = data.release_dates.results.find((c) => c.iso_3166_1 === 'GB');

      const getCert = (c) => {
        if (!c || !Array.isArray(c.release_dates)) return '';
        const match = c.release_dates.find((d) => d.certification && d.certification.trim());
        return match ? match.certification.trim() : '';
      };

      certification = getCert(usCountry) || getCert(gbCountry) || getCert(inCountry);
      if (!certification) {
        for (const c of data.release_dates.results) {
          const found = getCert(c);
          if (found) {
            certification = found;
            break;
          }
        }
      }

      data.certification = certification || (data.adult ? '18+' : '');
    }
    return data;
  }

  const fallback = FALLBACK_MOVIES.find((m) => m.id === parseInt(movieId, 10)) || FALLBACK_MOVIES[0];
  return {
    ...fallback,
    genres: fallback.genre_ids ? fallback.genre_ids.map((id) => ({ id, name: GENRE_MAP[id] || 'General' })) : [],
    runtime: 139,
    tagline: 'Mischief. Mayhem. Soap.',
    credits: {
      cast: [
        { name: 'Brad Pitt', character: 'Tyler Durden' },
        { name: 'Edward Norton', character: 'The Narrator' },
        { name: 'Helena Bonham Carter', character: 'Marla Singer' },
      ],
    },
    videos: { results: [] },
  };
};

const getGenres = async () => {
  const data = await fetchFromTMDB('/genre/movie/list');
  if (data && data.genres) return data.genres;

  return Object.entries(GENRE_MAP).map(([id, name]) => ({
    id: parseInt(id, 10),
    name,
  }));
};

module.exports = {
  getTrending,
  getNowPlaying,
  getPopular,
  getUpcoming,
  getTopRated,
  searchMovies,
  getMovieDetails,
  getGenres,
  GENRE_MAP,
};
