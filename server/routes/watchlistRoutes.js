const express = require('express');
const router = express.Router();
const {
  getWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  deleteFromWatchlist,
  deleteByTmdbId,
  getReminders,
  getDashboardStats,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

// All watchlist and reminder operations require authentication
router.use(protect);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.get('/reminders', getReminders);
router.get('/stats', getDashboardStats);
router.patch('/:id', updateWatchlistItem);
router.delete('/movie/:tmdbId', deleteByTmdbId);
router.delete('/:id', deleteFromWatchlist);

module.exports = router;
