const express = require('express');
const router = express.Router();
const {
  getTrending,
  getNowPlaying,
  getPopular,
  getUpcoming,
  getTopRated,
  searchMovies,
  getMovieDetails,
  getGenres,
  getMovieVideos,
  getMovieWatchProviders,
  getMovieCredits,
  getMovieRecommendations,
} = require('../controllers/movieController');

router.get('/trending', getTrending);
router.get('/now-playing', getNowPlaying);
router.get('/popular', getPopular);
router.get('/upcoming', getUpcoming);
router.get('/top-rated', getTopRated);
router.get('/search', searchMovies);
router.get('/genres', getGenres);
router.get('/:id/videos', getMovieVideos);
router.get('/:id/watch-providers', getMovieWatchProviders);
router.get('/:id/credits', getMovieCredits);
router.get('/:id/recommendations', getMovieRecommendations);
router.get('/:id', getMovieDetails);

module.exports = router;
