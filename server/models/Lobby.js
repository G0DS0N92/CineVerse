const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    participantId: { type: String, required: true },
    participantName: { type: String, required: true },
    vote: { type: String, enum: ['yes', 'maybe', 'no'], required: true },
  },
  { _id: false }
);

const ballotMovieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    posterPath: { type: String, default: '' },
    backdropPath: { type: String, default: '' },
    releaseDate: { type: String, default: '' },
    voteAverage: { type: Number, default: 0 },
    overview: { type: String, default: '' },
    addedBy: { type: String, default: 'Guest' },
    addedById: { type: String, default: '' },
    votes: [voteSchema],
  },
  { _id: true }
);

const participantSchema = new mongoose.Schema(
  {
    participantId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isHost: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const lobbySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      default: 'CineVerse Movie Night',
      trim: true,
    },
    hostId: {
      type: String,
      required: true,
    },
    hostName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['nominating', 'voting', 'completed'],
      default: 'nominating',
    },
    participants: [participantSchema],
    ballot: [ballotMovieSchema],
    winner: {
      type: Object,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 172800, // 48-hour TTL auto-expiration
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lobby', lobbySchema);
