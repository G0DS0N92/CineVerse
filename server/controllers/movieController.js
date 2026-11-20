const tmdbService = require('../services/tmdbService');

// @desc    Get trending movies (daily or weekly)
// @route   GET /api/movies/trending
// @access  Public
const getTrending = async (req, res, next) => {
  try {
    const timeWindow = req.query.timeWindow || 'day';
    const movies = await tmdbService.getTrending(timeWindow);
    res.status(200).json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
const getPopular = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const movies = await tmdbService.getPopular(page);
    res.status(200).json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming movies
// @route   GET /api/movies/upcoming
// @access  Public
const getUpcoming = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const movies = await tmdbService.getUpcoming(page);
    res.status(200).json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
const getTopRated = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const movies = await tmdbService.getTopRated(page);
    res.status(200).json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    next(error);
  }
};

// @desc    Search movies by query string
// @route   GET /api/movies/search?query=batman
// @access  Public
const searchMovies = async (req, res, next) => {
  try {
    const { query, page } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }
    const movies = await tmdbService.searchMovies(query, parseInt(page, 10) || 1);
    res.status(200).json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie details
// @route   GET /api/movies/:id
// @access  Public
const getMovieDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await tmdbService.getMovieDetails(id);
    res.status(200).json({ success: true, data: movie });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all movie genres list
// @route   GET /api/movies/genres
// @access  Public
const getGenres = async (req, res, next) => {
  try {
    const genres = await tmdbService.getGenres();
    res.status(200).json({ success: true, data: genres });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrending,
  getPopular,
  getUpcoming,
  getTopRated,
  searchMovies,
  getMovieDetails,
  getGenres,
};
