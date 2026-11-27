export const TMDB_GENRES = {
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

/**
 * Resolves TMDB genre_ids or genre objects into human-readable genre name strings
 * @param {object} movie
 * @returns {string[]}
 */
export const resolveMovieGenres = (movie) => {
  if (!movie) return [];
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres.map((g) => (typeof g === 'object' && g?.name ? g.name : String(g)));
  }
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
    return movie.genre_ids.map((id) => TMDB_GENRES[id] || String(id));
  }
  return [];
};
