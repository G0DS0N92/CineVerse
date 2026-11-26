const mongoose = require('mongoose');
const Watchlist = require('../models/Watchlist');
const User = require('../models/User');

// @desc    Get all watchlist items for logged-in user
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res, next) => {
  try {
    const query = { userId: req.user._id };

    // Optional status filter (?status=Watched, ?status=Planned to Watch, etc.)
    if (req.query.status) {
      query.status = req.query.status;
    }

    const items = await Watchlist.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a movie to user watchlist
// @route   POST /api/watchlist
// @access  Private
const addToWatchlist = async (req, res, next) => {
  try {
    const {
      tmdbId,
      title,
      posterPath,
      backdropPath,
      overview,
      releaseDate,
      voteAverage,
      genres,
      status,
      certification,
      adult,
      reminderDate,
      reminderTime,
      notes,
    } = req.body;

    if (!tmdbId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID and title are required.',
      });
    }

    // Age restriction enforcement: Underage users (< 18) cannot add adult / 18+ content
    const parsedAge = Number(req.user.age);
    if (!Number.isNaN(parsedAge) && parsedAge > 0 && parsedAge < 18) {
      let isRestricted = false;
      let certName = certification || '';

      if (adult === true) {
        isRestricted = true;
      }

      const adultCerts = ['R', 'NC-17', '18', '18+', 'A', 'TV-MA', 'X', 'R18'];
      if (certName && adultCerts.includes(certName.toUpperCase())) {
        isRestricted = true;
      }

      if (!isRestricted) {
        try {
          const tmdbService = require('../services/tmdbService');
          const details = await tmdbService.getMovieDetails(tmdbId);
          if (details) {
            if (details.adult) {
              isRestricted = true;
              certName = '18+';
            } else if (details.certification && adultCerts.includes(details.certification.toUpperCase())) {
              isRestricted = true;
              certName = details.certification;
            }
          }
        } catch (e) {
          // ignore lookup failure
        }
      }

      if (isRestricted) {
        return res.status(403).json({
          success: false,
          message: `Content Restricted: This movie is rated ${certName || '18+'} (Adults Only). Underage users (${userAge} y/o) cannot add adult content to their watchlist.`,
        });
      }
    }

    // Check if already in watchlist
    const existing = await Watchlist.findOne({
      userId: req.user._id,
      tmdbId,
    });

    if (existing) {
      // If user is adding/updating a reminder on a movie already in their watchlist
      if (reminderDate !== undefined && reminderDate !== '') {
        existing.reminderDate = reminderDate;
        existing.reminderTime = reminderTime || '20:00';
        existing.reminderStatus = 'pending';
        if (notes !== undefined) existing.notes = notes;
        await existing.save();

        return res.status(200).json({
          success: true,
          message: 'Movie reminder updated in your watchlist!',
          data: existing,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'This movie is already in your watchlist!',
      });
    }

    // Determine initial reminder status if reminderDate is provided
    const reminderStatus = reminderDate ? 'pending' : 'none';

    const watchlistItem = await Watchlist.create({
      userId: req.user._id,
      tmdbId,
      title,
      posterPath: posterPath || '',
      backdropPath: backdropPath || '',
      overview: overview || '',
      releaseDate: releaseDate || '',
      voteAverage: voteAverage || 0,
      genres: Array.isArray(genres) ? genres : [],
      status: status || 'Planned to Watch',
      certification: certification || '',
      adult: adult === true,
      reminderDate: reminderDate || '',
      reminderTime: reminderTime || '',
      reminderStatus,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Movie added to your watchlist!',
      data: watchlistItem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This movie is already in your watchlist!',
      });
    }
    next(error);
  }
};

// @desc    Update a watchlist item (status, rating, reminder, notes)
// @route   PATCH /api/watchlist/:id
// @access  Private
const updateWatchlistItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership: User must only modify their own items
    const item = await Watchlist.findOne({ _id: id, userId: req.user._id });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist item not found or you are not authorized to edit it.',
      });
    }

    const {
      status,
      userRating,
      reminderDate,
      reminderTime,
      reminderStatus,
      notes,
    } = req.body;

    if (status !== undefined) item.status = status;
    if (userRating !== undefined) item.userRating = userRating;
    if (reminderDate !== undefined) item.reminderDate = reminderDate;
    if (reminderTime !== undefined) item.reminderTime = reminderTime;
    if (reminderStatus !== undefined) item.reminderStatus = reminderStatus;
    if (notes !== undefined) item.notes = notes;

    // Auto-update reminder status if date was just added
    if (reminderDate && !reminderStatus) {
      item.reminderStatus = 'pending';
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Watchlist updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a movie from watchlist
// @route   DELETE /api/watchlist/:id
// @access  Private
const deleteFromWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Watchlist.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist item not found or not authorized.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Movie removed from your watchlist.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a movie from watchlist by TMDB ID
// @route   DELETE /api/watchlist/movie/:tmdbId
// @access  Private
const deleteByTmdbId = async (req, res, next) => {
  try {
    const { tmdbId } = req.params;

    const item = await Watchlist.findOneAndDelete({
      tmdbId: parseInt(tmdbId, 10),
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found in your watchlist.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'The Movie has been removed from watchlist',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user reminders (upcoming & pending)
// @route   GET /api/watchlist/reminders
// @access  Private
const getReminders = async (req, res, next) => {
  try {
    const reminders = await Watchlist.find({
      userId: req.user._id,
      reminderDate: { $ne: '' },
    }).sort({ reminderDate: 1, reminderTime: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get summary statistics for User Dashboard
// @route   GET /api/watchlist/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const totalSaved = await Watchlist.countDocuments({ userId });
    const watched = await Watchlist.countDocuments({ userId, status: 'Watched' });
    const planned = await Watchlist.countDocuments({ userId, status: 'Planned to Watch' });
    const currentlyWatching = await Watchlist.countDocuments({ userId, status: 'Currently Watching' });
    const pendingReminders = await Watchlist.countDocuments({
      userId,
      reminderStatus: 'pending',
      reminderDate: { $ne: '' },
    });

    const recentAdded = await Watchlist.find({ userId })
      .sort({ createdAt: -1 })
      .limit(4);

    const upcomingReminders = await Watchlist.find({
      userId,
      reminderStatus: 'pending',
      reminderDate: { $ne: '' },
    })
      .sort({ reminderDate: 1, reminderTime: 1 })
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        totalSaved,
        watched,
        planned,
        currentlyWatching,
        pendingReminders,
        recentAdded,
        upcomingReminders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public shared watchlist for a user
// @route   GET /api/watchlist/shared/:userId
// @access  Public
const getSharedWatchlist = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user identifier.',
      });
    }

    const targetUser = await User.findById(userId).select('name avatar createdAt');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or user account no longer exists.',
      });
    }

    const items = await Watchlist.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        avatar: targetUser.avatar || '',
        memberSince: targetUser.createdAt,
      },
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchlist,
  getSharedWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  deleteFromWatchlist,
  deleteByTmdbId,
  getReminders,
  getDashboardStats,
};
