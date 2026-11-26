const express = require('express');
const router = express.Router();
const {
  getWatchlist,
  getSharedWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  deleteFromWatchlist,
  deleteByTmdbId,
  getReminders,
  getDashboardStats,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

// 60 requests per minute for public shared watchlists to prevent scraping/DoS
const sharedWatchlistLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Too many requests for shared watchlists. Please try again in a minute.',
});

// Public shared watchlist endpoint (accessible without login with rate limiting)
router.get('/shared/:userId', sharedWatchlistLimiter, getSharedWatchlist);

// All other watchlist and reminder operations require authentication
router.use(protect);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.get('/reminders', getReminders);
router.get('/stats', getDashboardStats);
router.patch('/:id', updateWatchlistItem);
router.delete('/movie/:tmdbId', deleteByTmdbId);
router.delete('/:id', deleteFromWatchlist);

module.exports = router;
