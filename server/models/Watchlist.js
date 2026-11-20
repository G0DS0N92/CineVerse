const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tmdbId: {
      type: Number,
      required: [true, 'TMDB Movie ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    posterPath: {
      type: String,
      default: '',
    },
    backdropPath: {
      type: String,
      default: '',
    },
    overview: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: String,
      default: '',
    },
    voteAverage: {
      type: Number,
      default: 0,
    },
    genres: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Planned to Watch', 'Currently Watching', 'Watched'],
      default: 'Planned to Watch',
    },
    certification: {
      type: String,
      default: '',
    },
    adult: {
      type: Boolean,
      default: false,
    },
    userRating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    // Reminder fields
    reminderDate: {
      type: String, // Stored as YYYY-MM-DD
      default: '',
    },
    reminderTime: {
      type: String, // Stored as HH:mm
      default: '',
    },
    reminderStatus: {
      type: String,
      enum: ['none', 'pending', 'completed'],
      default: 'none',
    },
    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a user from adding the exact same movie to their watchlist twice
watchlistSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
