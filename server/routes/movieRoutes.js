const express = require('express');
const router = express.Router();
const {
  getTrending,
  getPopular,
  getUpcoming,
  getTopRated,
  searchMovies,
  getMovieDetails,
  getGenres,
} = require('../controllers/movieController');

router.get('/trending', getTrending);
router.get('/popular', getPopular);
router.get('/upcoming', getUpcoming);
router.get('/top-rated', getTopRated);
router.get('/search', searchMovies);
router.get('/genres', getGenres);
router.get('/:id', getMovieDetails);

module.exports = router;
