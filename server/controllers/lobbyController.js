const Lobby = require('../models/Lobby');

// Generate unique 6-character room code (e.g. CV-A8X2)
const generateLobbyCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CV-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Calculate ranking scores for all ballot items: Yes = 2, Maybe = 1, No = 0
const calculateBallotScores = (ballot, participantCount) => {
  return ballot.map((item) => {
    const rawVotes = item.votes || [];
    let score = 0;
    let yesCount = 0;
    let maybeCount = 0;
    let noCount = 0;

    rawVotes.forEach((v) => {
      if (v.vote === 'yes') {
        score += 2;
        yesCount += 1;
      } else if (v.vote === 'maybe') {
        score += 1;
        maybeCount += 1;
      } else if (v.vote === 'no') {
        noCount += 1;
      }
    });

    const maxPossibleScore = Math.max((participantCount || 1) * 2, 1);
    const matchPercentage = Math.round((score / maxPossibleScore) * 100);

    return {
      ...item.toObject ? item.toObject() : item,
      score,
      yesCount,
      maybeCount,
      noCount,
      totalVotes: rawVotes.length,
      matchPercentage: Math.min(matchPercentage, 100),
    };
  });
};

// @desc    Create a new Movie Night Lobby
// @route   POST /api/lobby
// @access  Public (Guest or Authenticated)
const createLobby = async (req, res, next) => {
  try {
    const { title, hostName, hostAvatar, hostParticipantId } = req.body;

    const participantId = hostParticipantId || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanName = (hostName || 'Movie Host').trim();

    let code = generateLobbyCode();
    // Ensure uniqueness
    let attempts = 0;
    while (await Lobby.findOne({ code }) && attempts < 5) {
      code = generateLobbyCode();
      attempts += 1;
    }

    const lobby = await Lobby.create({
      code,
      title: (title || 'Friday Movie Night').trim(),
      hostId: participantId,
      hostName: cleanName,
      status: 'nominating',
      participants: [
        {
          participantId,
          name: cleanName,
          avatar: hostAvatar || '',
          userId: req.user ? req.user._id : null,
          isHost: true,
          joinedAt: new Date(),
        },
      ],
      ballot: [],
    });

    res.status(201).json({
      success: true,
      message: 'Movie Night Lobby created successfully!',
      data: lobby,
      participantId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Lobby details by room code
// @route   GET /api/lobby/:code
// @access  Public
const getLobby = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const lobby = await Lobby.findOne({ code });

    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found or room code has expired.',
      });
    }

    const scoredBallot = calculateBallotScores(lobby.ballot, lobby.participants.length);
    scoredBallot.sort((a, b) => b.score - a.score);

    const lobbyData = lobby.toObject();
    lobbyData.ballot = scoredBallot;

    res.status(200).json({
      success: true,
      data: lobbyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join an existing lobby as participant
// @route   POST /api/lobby/:code/join
// @access  Public
const joinLobby = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { name, avatar, participantId } = req.body;

    const lobby = await Lobby.findOne({ code });
    if (!lobby) {
      return res.status(404).json({
        success: false,
        message: 'Lobby not found or room code has expired.',
      });
    }

    const currentPartId = participantId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanName = (name || 'Movie Fan').trim();

    const existingIndex = lobby.participants.findIndex(
      (p) => p.participantId === currentPartId
    );

    if (existingIndex >= 0) {
      // Update name/avatar if changed
      lobby.participants[existingIndex].name = cleanName;
      if (avatar) lobby.participants[existingIndex].avatar = avatar;
    } else {
      lobby.participants.push({
        participantId: currentPartId,
        name: cleanName,
        avatar: avatar || '',
        userId: req.user ? req.user._id : null,
        isHost: false,
        joinedAt: new Date(),
      });
    }

    await lobby.save();

    const scoredBallot = calculateBallotScores(lobby.ballot, lobby.participants.length);
    const lobbyData = lobby.toObject();
    lobbyData.ballot = scoredBallot;

    res.status(200).json({
      success: true,
      message: `Welcome to ${lobby.title}!`,
      data: lobbyData,
      participantId: currentPartId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Nominate a movie to the lobby ballot
// @route   POST /api/lobby/:code/nominate
// @access  Public
const addNomination = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { movie, participantId, participantName } = req.body;

    if (!movie || !movie.id || !movie.title) {
      return res.status(400).json({
        success: false,
        message: 'Movie information is required.',
      });
    }

    const lobby = await Lobby.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found.' });
    }

    if (lobby.status !== 'nominating') {
      return res.status(400).json({
        success: false,
        message: 'Nominations are closed for this lobby.',
      });
    }

    // Limit maximum nominations to 12
    if (lobby.ballot.length >= 12) {
      return res.status(400).json({
        success: false,
        message: 'The ballot is full (maximum 12 movies reached).',
      });
    }

    // Prevent duplicate nominations
    const duplicate = lobby.ballot.some((item) => item.tmdbId === movie.id);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `"${movie.title}" is already on the voting ballot!`,
      });
    }

    lobby.ballot.push({
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path || movie.posterPath || '',
      backdropPath: movie.backdrop_path || movie.backdropPath || '',
      releaseDate: movie.release_date || movie.releaseDate || '',
      voteAverage: movie.vote_average || movie.voteAverage || 0,
      overview: movie.overview || '',
      addedBy: participantName || 'Guest',
      addedById: participantId || '',
      votes: [],
    });

    await lobby.save();

    const scoredBallot = calculateBallotScores(lobby.ballot, lobby.participants.length);
    const lobbyData = lobby.toObject();
    lobbyData.ballot = scoredBallot;

    res.status(200).json({
      success: true,
      message: `Added "${movie.title}" to the ballot!`,
      data: lobbyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a nominated movie from ballot
// @route   DELETE /api/lobby/:code/nominate/:tmdbId
// @access  Public
const removeNomination = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const tmdbId = parseInt(req.params.tmdbId, 10);
    const { participantId } = req.body;

    const lobby = await Lobby.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found.' });
    }

    if (lobby.status !== 'nominating') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove nominations once voting has begun.',
      });
    }

    const item = lobby.ballot.find((b) => b.tmdbId === tmdbId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Movie not in ballot.' });
    }

    // Allow host or the user who nominated it to remove
    const isHost = lobby.hostId === participantId;
    const isOwner = item.addedById === participantId;

    if (!isHost && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only the host or the nominator can remove this movie.',
      });
    }

    lobby.ballot = lobby.ballot.filter((b) => b.tmdbId !== tmdbId);
    await lobby.save();

    const scoredBallot = calculateBallotScores(lobby.ballot, lobby.participants.length);
    const lobbyData = lobby.toObject();
    lobbyData.ballot = scoredBallot;

    res.status(200).json({
      success: true,
      message: 'Movie removed from ballot.',
      data: lobbyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cast or update a vote on a ballot movie
// @route   POST /api/lobby/:code/vote
// @access  Public
const submitVote = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { tmdbId, vote, participantId, participantName } = req.body;

    if (!['yes', 'maybe', 'no'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote value. Must be yes, maybe, or no.',
      });
    }

    const lobby = await Lobby.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found.' });
    }

    if (lobby.status !== 'voting') {
      return res.status(400).json({
        success: false,
        message: 'Voting is not currently active for this room.',
      });
    }

    const movie = lobby.ballot.find((b) => b.tmdbId === Number(tmdbId));
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found on the ballot.',
      });
    }

    const existingVoteIndex = movie.votes.findIndex(
      (v) => v.participantId === participantId
    );

    if (existingVoteIndex >= 0) {
      movie.votes[existingVoteIndex].vote = vote;
    } else {
      movie.votes.push({
        participantId,
        participantName: participantName || 'Guest',
        vote,
      });
    }

    await lobby.save();

    const scoredBallot = calculateBallotScores(lobby.ballot, lobby.participants.length);
    scoredBallot.sort((a, b) => b.score - a.score);

    const lobbyData = lobby.toObject();
    lobbyData.ballot = scoredBallot;

    res.status(200).json({
      success: true,
      data: lobbyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance or update lobby stage (nominating -> voting -> completed)
// @route   PATCH /api/lobby/:code/stage
// @access  Public (Host only)
const updateStage = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { stage, participantId } = req.body;

    if (!['nominating', 'voting', 'completed'].includes(stage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage. Allowed: nominating, voting, completed.',
      });
    }

    const lobby = await Lobby.findOne({ code });
    if (!lobby) {
      return res.status(404).json({ success: false, message: 'Lobby not found.' });
    }

    if (lobby.hostId !== participantId) {
      return res.status(403).json({
        success: false,
        message: 'Only the room host can change lobby stages.',
      });
    }

    if (stage === 'voting' && lobby.ballot.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please nominate at least 2 movies before opening voting!',
      });
    }

    lobby.status = stage;

    // If moving to completed, crown the winning movie!
    if (stage === 'completed') {
      const scoredBallot = calculateBallotScores(lobby.ballot, lobby.participants.length);
      scoredBallot.sort((a, b) => b.score - a.score);

      if (scoredBallot.length > 0) {
        lobby.winner = scoredBallot[0];
      }
    }

    await lobby.save();

    const scoredBallot = calculateBallotScores(lobby.ballot, lobby.participants.length);
    scoredBallot.sort((a, b) => b.score - a.score);

    const lobbyData = lobby.toObject();
    lobbyData.ballot = scoredBallot;

    res.status(200).json({
      success: true,
      message: `Lobby stage updated to "${stage}"!`,
      data: lobbyData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLobby,
  getLobby,
  joinLobby,
  addNomination,
  removeNomination,
  submitVote,
  updateStage,
};
