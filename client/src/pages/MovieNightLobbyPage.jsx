import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import CinemaTicketModal from '../components/CinemaTicketModal';
import Toast from '../components/Toast';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// Strict DD/MM/YYYY date formatting helper
const formatToDDMMYYYY = (rawDate) => {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  if (str.includes('/')) return str;
  if (str.includes('-')) {
    const clean = str.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
};

// Local storage participant ID generator / retrieval
const getLocalParticipantId = () => {
  let pid = localStorage.getItem('cineverse_lobby_pid');
  if (!pid) {
    pid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('cineverse_lobby_pid', pid);
  }
  return pid;
};

const MovieNightLobbyPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Participant identity
  const [participantId] = useState(getLocalParticipantId);
  const [participantName, setParticipantName] = useState(() => {
    return user?.name || localStorage.getItem('cineverse_lobby_pname') || '';
  });

  // Lobby state
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Creation & Join form states
  const [newRoomTitle, setNewRoomTitle] = useState('Friday Movie Night');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Nomination search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentTrending, setRecentTrending] = useState([]);
  const [nominatingMovieId, setNominatingMovieId] = useState(null);

  // Voting state
  const [votingMovieId, setVotingMovieId] = useState(null);

  // Winner Ticket Modal
  const [selectedTicketMovie, setSelectedTicketMovie] = useState(null);

  // Stage change loading
  const [stageLoading, setStageLoading] = useState(false);

  // Sync user name changes
  useEffect(() => {
    if (user?.name && !participantName) {
      setParticipantName(user.name);
    }
  }, [user, participantName]);

  // Save participant name locally when updated
  const updateParticipantName = (newName) => {
    setParticipantName(newName);
    localStorage.setItem('cineverse_lobby_pname', newName);
  };

  // Fetch Lobby details by room code
  const fetchLobby = useCallback(async (roomCode, silent = false) => {
    if (!roomCode) return;
    try {
      if (!silent) setLoading(true);
      const { data } = await API.get(`/lobby/${roomCode.toUpperCase()}`);
      if (data.success && data.data) {
        setLobby(data.data);
        setError('');

        // Cache recently visited lobby in localStorage
        try {
          const recents = JSON.parse(localStorage.getItem('cineverse_recent_lobbies') || '[]');
          const updated = [
            { code: data.data.code, title: data.data.title, updatedAt: Date.now() },
            ...recents.filter((r) => r.code !== data.data.code),
          ].slice(0, 5);
          localStorage.setItem('cineverse_recent_lobbies', JSON.stringify(updated));
        } catch {
          // Ignore localStorage errors
        }
      }
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'Movie Night Lobby not found or expired.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial lobby fetch when room code is present in URL
  useEffect(() => {
    if (code) {
      fetchLobby(code);
    } else {
      setLobby(null);
      setLoading(false);
    }
  }, [code, fetchLobby]);

  // Real-time synchronization polling (every 3 seconds when inside a lobby)
  useEffect(() => {
    if (!code || !lobby) return;

    const interval = setInterval(() => {
      fetchLobby(code, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [code, lobby, fetchLobby]);

  // Check if current participant is in the roster
  const isJoined = Boolean(
    lobby?.participants?.some((p) => p.participantId === participantId)
  );

  // Check if current user is the host
  const isHost = Boolean(lobby && lobby.hostId === participantId);

  // Prompt join modal if not yet joined
  useEffect(() => {
    if (lobby && !isJoined && !loading) {
      setShowJoinModal(true);
    } else {
      setShowJoinModal(false);
    }
  }, [lobby, isJoined, loading]);

  // Load trending suggestions on mount
  useEffect(() => {
    const fetchTrendingSuggestions = async () => {
      try {
        const { data } = await API.get('/movies/trending?page=1');
        if (data.success && Array.isArray(data.data)) {
          setRecentTrending(data.data.slice(0, 6));
        }
      } catch {
        // Fallback silently
      }
    };
    fetchTrendingSuggestions();
  }, []);

  // Debounced search for movies to nominate
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await API.get(`/movies/search?query=${encodeURIComponent(searchQuery.trim())}&page=1`);
        if (data.success && Array.isArray(data.data)) {
          setSearchResults(data.data.slice(0, 8));
        }
      } catch (err) {
        console.error('Error searching movies for lobby', err);
      } finally {
        setSearchLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Create a New Lobby Room
  const handleCreateLobby = async (e) => {
    e.preventDefault();
    const cleanHost = (participantName || user?.name || 'Movie Host').trim();
    if (!cleanHost) {
      setToast({ message: 'Please enter your name to host a Movie Night.', type: 'error' });
      return;
    }

    try {
      setCreating(true);
      updateParticipantName(cleanHost);

      const { data } = await API.post('/lobby', {
        title: (newRoomTitle || 'Movie Night').trim(),
        hostName: cleanHost,
        hostParticipantId: participantId,
      });

      if (data.success && data.data) {
        setLobby(data.data);
        setToast({ message: `Movie Night Lobby ${data.data.code} created!`, type: 'success' });
        navigate(`/lobby/${data.data.code}`);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create lobby room', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  // 2. Join an Existing Room
  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setToast({ message: 'Please enter a valid room code (e.g. CV-A8X2)', type: 'error' });
      return;
    }

    const cleanName = (participantName || user?.name || 'Cinephile Guest').trim();
    updateParticipantName(cleanName);
    navigate(`/lobby/${cleanCode}`);
  };

  // Join Room Roster
  const handleJoinRoster = async (e) => {
    if (e) e.preventDefault();
    const cleanName = (participantName || user?.name || 'Cinephile Guest').trim();
    if (!cleanName) {
      setToast({ message: 'Please enter a screen name to enter the room', type: 'error' });
      return;
    }

    try {
      setJoining(true);
      updateParticipantName(cleanName);
      const { data } = await API.post(`/lobby/${lobby.code}/join`, {
        participantId,
        name: cleanName,
      });

      if (data.success && data.data) {
        setLobby(data.data);
        setShowJoinModal(false);
        setToast({ message: `Joined ${data.data.title}!`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Could not join lobby', type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  // 3. Nominate a Movie to Ballot
  const handleNominateMovie = async (movieItem) => {
    if (!lobby) return;
    const cleanName = (participantName || user?.name || 'Participant').trim();

    try {
      setNominatingMovieId(movieItem.id || movieItem.tmdbId);
      const payload = {
        participantId,
        participantName: cleanName,
        tmdbId: movieItem.id || movieItem.tmdbId,
        title: movieItem.title,
        posterPath: movieItem.poster_path || movieItem.posterPath,
        backdropPath: movieItem.backdrop_path || movieItem.backdropPath,
        overview: movieItem.overview,
        releaseDate: movieItem.release_date || movieItem.releaseDate,
        voteAverage: movieItem.vote_average || movieItem.voteAverage,
        genres: Array.isArray(movieItem.genres)
          ? movieItem.genres.map((g) => (typeof g === 'object' ? g.name : g))
          : movieItem.genre_ids || [],
      };

      const { data } = await API.post(`/lobby/${lobby.code}/nominate`, payload);
      if (data.success && data.data) {
        setLobby(data.data);
        setSearchQuery('');
        setSearchResults([]);
        setToast({ message: `Nominated "${movieItem.title}" to the ballot!`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Could not nominate movie', type: 'error' });
    } finally {
      setNominatingMovieId(null);
    }
  };

  // 4. Remove a Nomination
  const handleRemoveNomination = async (tmdbId, movieTitle) => {
    if (!lobby) return;
    try {
      const { data } = await API.delete(`/lobby/${lobby.code}/nominate/${tmdbId}`, {
        data: { participantId },
      });
      if (data.success && data.data) {
        setLobby(data.data);
        setToast({ message: `Removed "${movieTitle}" from ballot`, type: 'info' });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to remove nomination', type: 'error' });
    }
  };

  // 5. Submit Vote on a Nominated Movie
  const handleVote = async (tmdbId, voteType) => {
    if (!lobby) return;
    const cleanName = (participantName || user?.name || 'Participant').trim();

    try {
      setVotingMovieId(tmdbId);
      const { data } = await API.post(`/lobby/${lobby.code}/vote`, {
        participantId,
        participantName: cleanName,
        tmdbId,
        vote: voteType,
      });

      if (data.success && data.data) {
        setLobby(data.data);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to submit vote', type: 'error' });
    } finally {
      setVotingMovieId(null);
    }
  };

  // 6. Host Stage Transition ('nominating' -> 'voting' -> 'completed')
  const handleUpdateStage = async (nextStage) => {
    if (!lobby) return;
    try {
      setStageLoading(true);
      const { data } = await API.patch(`/lobby/${lobby.code}/stage`, {
        stage: nextStage,
        participantId,
      });

      if (data.success && data.data) {
        setLobby(data.data);
        setToast({
          message:
            nextStage === 'voting'
              ? 'Voting round has started! Cast your votes below.'
              : nextStage === 'completed'
              ? 'Voting completed! The group consensus winner is revealed.'
              : 'Ballot reopened for nominations.',
          type: 'success',
        });
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to advance lobby stage', type: 'error' });
    } finally {
      setStageLoading(false);
    }
  };

  // Copy share invite link
  const handleCopyInviteLink = () => {
    const url = `${window.location.origin}/lobby/${lobby.code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(true);
        setToast({ message: 'Lobby invite link copied to clipboard!', type: 'success' });
        setTimeout(() => setCopySuccess(false), 3000);
      });
    } else {
      setToast({ message: `Invite link: ${url}`, type: 'info' });
    }
  };

  // Add winner to user watchlist
  const handleAddWinnerToWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const win = lobby?.winner;
    if (!win) return;

    try {
      await API.post('/watchlist', {
        tmdbId: win.tmdbId,
        title: win.title,
        posterPath: win.posterPath,
        backdropPath: win.backdropPath,
        overview: win.overview,
        releaseDate: win.releaseDate,
        voteAverage: win.voteAverage,
        genres: win.genres || [],
        status: 'Planned to Watch',
      });
      setToast({ message: `Added winning movie "${win.title}" to your watchlist!`, type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Could not add winner to watchlist', type: 'error' });
    }
  };

  // Get recent lobbies from local storage
  const getRecentLobbies = () => {
    try {
      return JSON.parse(localStorage.getItem('cineverse_recent_lobbies') || '[]');
    } catch {
      return [];
    }
  };

  // -------------------------------------------------------------
  // VIEW A: LOBBY HUB (No code specified in URL)
  // -------------------------------------------------------------
  if (!code) {
    const recentLobbies = getRecentLobbies();

    return (
      <div className="lobby-hub-page">
        {/* Hub Hero Header */}
        <div className="lobby-hero-banner">
          <div className="lobby-hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>GROUP CINEMA SYNC</span>
          </div>

          <h1 className="lobby-hero-title">
            Movie Night <span className="brand-highlight">Group Lobby</span>
          </h1>
          <p className="lobby-hero-desc">
            No more endless arguing over what to watch. Host a room, invite friends, nominate movies to a shared ballot, vote together, and crown the consensus winning movie!
          </p>
        </div>

        {/* Dual Actions: Host Room vs Join Room */}
        <div className="lobby-entry-grid">
          {/* Card 1: Host a Room */}
          <div className="lobby-entry-card host-card">
            <div className="entry-card-header">
              <div className="entry-card-icon host-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <h2>Host Movie Night</h2>
                <p>Create a room, pick movies, and invite your movie crew</p>
              </div>
            </div>

            <form onSubmit={handleCreateLobby} className="lobby-entry-form">
              <div className="form-group">
                <label className="form-label">Movie Night Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Friday Sci-Fi Marathon"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Host Screen Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  value={participantName}
                  onChange={(e) => updateParticipantName(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>

              {/* Quick Themes */}
              <div className="lobby-theme-pills">
                <span className="pills-label">Presets:</span>
                {['Action Night', 'Sci-Fi Weekend', 'Popcorn Chill', 'Awards Season'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="theme-pill-btn"
                    onClick={() => setNewRoomTitle(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block host-submit-btn"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <span className="spinner-border-sm" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Create Movie Night Lobby</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card 2: Join a Room */}
          <div className="lobby-entry-card join-card">
            <div className="entry-card-header">
              <div className="entry-card-icon join-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <div>
                <h2>Join with Code</h2>
                <p>Have an invitation code? Jump straight into the room</p>
              </div>
            </div>

            <form onSubmit={handleJoinByCode} className="lobby-entry-form">
              <div className="form-group">
                <label className="form-label">Room Code</label>
                <input
                  type="text"
                  className="form-control room-code-input"
                  placeholder="e.g. CV-A8X2"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Screen Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  value={participantName}
                  onChange={(e) => updateParticipantName(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary btn-block join-submit-btn"
                disabled={!joinCodeInput.trim()}
              >
                <span>Enter Lobby Room</span>
                <span style={{ fontSize: '1.1rem' }}>&rarr;</span>
              </button>
            </form>

            {/* Recent Visited Lobbies */}
            {recentLobbies.length > 0 && (
              <div className="recent-lobbies-section">
                <span className="recent-label">Recent Rooms:</span>
                <div className="recent-pills-list">
                  {recentLobbies.map((r) => (
                    <Link
                      key={r.code}
                      to={`/lobby/${r.code}`}
                      className="recent-lobby-chip"
                    >
                      <span className="chip-code">{r.code}</span>
                      <span className="chip-title">{r.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informational Feature Highlights */}
        <div className="lobby-features-strip">
          <div className="feature-step">
            <span className="step-num">01</span>
            <h4>Nominate Contenders</h4>
            <p>Search CineVerse's entire database and nominate up to 12 movies to the shared ballot.</p>
          </div>
          <div className="feature-step">
            <span className="step-num">02</span>
            <h4>Real-Time Group Vote</h4>
            <p>Every guest votes: Must Watch (2 pts), Fine with It (1 pt), or Skip (0 pts).</p>
          </div>
          <div className="feature-step">
            <span className="step-num">03</span>
            <h4>Consensus Winner</h4>
            <p>Ambilight Spotlight crowns the winning title with streaming availability and tickets.</p>
          </div>
        </div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: ACTIVE LOBBY ROOM (`/lobby/:code`)
  // -------------------------------------------------------------

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Connecting to Movie Night Lobby {code}...</p>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h3>Lobby Not Found</h3>
        <p>{error || 'This room does not exist, or has expired after 48 hours.'}</p>
        <Link to="/lobby" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Movie Night Hub
        </Link>
      </div>
    );
  }

  const { status, ballot = [], participants = [], winner } = lobby;
  const participantCount = participants.length;

  // Participant's votes map: { [tmdbId]: 'yes' | 'maybe' | 'no' }
  const myVotes = {};
  ballot.forEach((item) => {
    const v = (item.votes || []).find((x) => x.participantId === participantId);
    if (v) myVotes[item.tmdbId] = v.vote;
  });

  const myVoteCount = Object.keys(myVotes).length;
  const allVoted = ballot.length > 0 && myVoteCount === ballot.length;

  return (
    <div className="active-lobby-page">
      {/* Lobby Navigation & Status Bar */}
      <div className="lobby-nav-bar">
        <Link to="/lobby" className="btn btn-outline btn-sm">
          &larr; Lobby Hub
        </Link>

        {/* Room Code Badge & Copy Link */}
        <div className="lobby-code-badge-wrap">
          <span className="room-label">ROOM CODE:</span>
          <span className="room-code-tag">{lobby.code}</span>
          <button
            type="button"
            className="btn btn-sm btn-secondary copy-code-btn"
            onClick={handleCopyInviteLink}
            title="Copy Lobby Invite Link"
          >
            {copySuccess ? (
              <span>Copied Link!</span>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy Invite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lobby Room Header */}
      <div className="lobby-header-card">
        <div className="lobby-header-main">
          <div className="lobby-stage-indicator">
            <span
              className={`stage-dot ${
                status === 'completed'
                  ? 'dot-green'
                  : status === 'voting'
                  ? 'dot-yellow'
                  : 'dot-blue'
              }`}
            />
            <span className="stage-text">
              {status === 'nominating'
                ? 'STAGE 1: NOMINATIONS OPEN'
                : status === 'voting'
                ? 'STAGE 2: LIVE VOTING'
                : 'STAGE 3: VERDICT & WINNER'}
            </span>
          </div>

          <h1 className="active-lobby-title">{lobby.title}</h1>
          <p className="lobby-subtitle">
            Hosted by <strong style={{ color: '#ffffff' }}>{lobby.hostName}</strong> • {participantCount} Cinephile{participantCount === 1 ? '' : 's'} in room
          </p>
        </div>

        {/* Host Control Actions */}
        {isHost && (
          <div className="host-controls-panel">
            <span className="host-panel-label">HOST CONTROLS</span>
            <div className="host-buttons-row">
              {status === 'nominating' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleUpdateStage('voting')}
                  disabled={ballot.length < 1 || stageLoading}
                  title={ballot.length < 1 ? 'Nominate at least 1 movie to begin' : 'Start voting round'}
                >
                  {stageLoading ? (
                    'Starting...'
                  ) : (
                    <>
                      <span>Start Voting Round ({ballot.length})</span>
                      <span>&rarr;</span>
                    </>
                  )}
                </button>
              )}

              {status === 'voting' && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateStage('nominating')}
                    disabled={stageLoading}
                  >
                    Add More Movies
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleUpdateStage('completed')}
                    disabled={stageLoading}
                    title="Lock votes and crown the winning movie"
                  >
                    {stageLoading ? 'Tallying...' : 'Lock Votes & Crown Winner'}
                  </button>
                </>
              )}

              {status === 'completed' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleUpdateStage('nominating')}
                  disabled={stageLoading}
                >
                  Restart / New Round
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Participants Roster Ribbon */}
      <div className="participants-ribbon">
        <span className="roster-heading">CREW IN LOBBY ({participantCount}):</span>
        <div className="roster-avatar-list">
          {participants.map((p) => {
            const isMe = p.participantId === participantId;
            return (
              <div
                key={p.participantId}
                className={`participant-pill ${p.isHost ? 'host-pill' : ''} ${isMe ? 'my-pill' : ''}`}
                title={`${p.name}${p.isHost ? ' (Host)' : ''}${isMe ? ' (You)' : ''}`}
              >
                <div className="p-avatar-circle">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="p-name">{p.name}</span>
                {p.isHost && (
                  <span className="p-host-badge" title="Host">
                    HOST
                  </span>
                )}
                {isMe && <span className="p-you-badge">YOU</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* STAGE 1: NOMINATIONS OPEN                                    */}
      {/* ----------------------------------------------------------- */}
      {status === 'nominating' && (
        <div className="lobby-stage-nominating">
          {/* Movie Search Bar for Nominations */}
          <div className="nominate-search-card">
            <div className="nominate-search-header">
              <div className="search-title-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3>Nominate Movies to Ballot</h3>
              </div>
              <span className="nominate-counter">
                {ballot.length} / 12 Nominated
              </span>
            </div>

            <div className="nominate-input-wrap">
              <input
                type="text"
                className="nominate-search-input"
                placeholder="Search movies by title to add to the ballot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={ballot.length >= 12}
              />
              {searchLoading && <div className="nominate-search-spinner spinner-border-sm" />}
            </div>

            {/* Instant Search Results Dropdown/Grid */}
            {searchResults.length > 0 && (
              <div className="nominate-results-grid">
                {searchResults.map((m) => {
                  const alreadyNominated = ballot.some((b) => b.tmdbId === m.id);
                  const isNominating = nominatingMovieId === m.id;
                  const posterUrl = m.poster_path ? `${TMDB_POSTER_BASE}${m.poster_path}` : null;

                  return (
                    <div key={m.id} className="nominate-result-item">
                      <div className="result-thumb">
                        {posterUrl ? (
                          <img src={posterUrl} alt={m.title} loading="lazy" />
                        ) : (
                          <div className="thumb-placeholder">{m.title.charAt(0)}</div>
                        )}
                      </div>
                      <div className="result-info">
                        <span className="result-title">{m.title}</span>
                        <span className="result-meta">
                          {formatToDDMMYYYY(m.release_date)} • Rating: {Number(m.vote_average || 0).toFixed(1)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary nominate-btn"
                        onClick={() => handleNominateMovie(m)}
                        disabled={alreadyNominated || isNominating || ballot.length >= 12}
                      >
                        {alreadyNominated ? (
                          'Nominated'
                        ) : isNominating ? (
                          'Adding...'
                        ) : (
                          '+ Nominate'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Trending Suggestions when search bar is idle */}
            {!searchQuery.trim() && recentTrending.length > 0 && (
              <div className="trending-suggestions-wrap">
                <span className="suggestions-label">Suggested Trending Picks:</span>
                <div className="suggestions-pills">
                  {recentTrending.map((tm) => {
                    const alreadyNominated = ballot.some((b) => b.tmdbId === tm.id);
                    return (
                      <button
                        key={tm.id}
                        type="button"
                        className="suggestion-chip"
                        onClick={() => handleNominateMovie(tm)}
                        disabled={alreadyNominated || ballot.length >= 12}
                      >
                        <span>{tm.title}</span>
                        <span className="chip-plus">{alreadyNominated ? 'Added' : '+'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Current Shared Ballot Display */}
          <div className="shared-ballot-section">
            <div className="ballot-section-header">
              <h2>Shared Ballot ({ballot.length})</h2>
              {ballot.length > 0 && (
                <span className="ballot-subtext">
                  Movies ready for voting when host begins the round
                </span>
              )}
            </div>

            {ballot.length === 0 ? (
              <div className="empty-ballot-state">
                <div className="empty-ballot-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
                <h3>The Ballot is Empty</h3>
                <p>Use the search bar above to nominate your favorite movies for tonight's screening!</p>
              </div>
            ) : (
              <div className="ballot-cards-grid">
                {ballot.map((item) => {
                  const posterUrl = item.posterPath ? `${TMDB_POSTER_BASE}${item.posterPath}` : null;
                  const canRemove = isHost || item.nominatedByParticipantId === participantId;

                  return (
                    <div key={item.tmdbId} className="ballot-movie-card">
                      <div className="ballot-poster-wrap">
                        {posterUrl ? (
                          <img src={posterUrl} alt={item.title} loading="lazy" />
                        ) : (
                          <div className="poster-placeholder">{item.title}</div>
                        )}
                        <span className="ballot-rating-badge">Rating: {Number(item.voteAverage || 0).toFixed(1)}</span>
                      </div>

                      <div className="ballot-card-body">
                        <h4 className="ballot-card-title">{item.title}</h4>
                        <div className="ballot-card-meta">
                          <span>{formatToDDMMYYYY(item.releaseDate)}</span>
                          {item.genres && item.genres.length > 0 && (
                            <span className="ballot-genre-tag">{item.genres[0]}</span>
                          )}
                        </div>

                        <div className="nominator-tag">
                          Nominated by: <strong>{item.nominatedByName}</strong>
                        </div>

                        {canRemove && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline remove-nomination-btn"
                            onClick={() => handleRemoveNomination(item.tmdbId, item.title)}
                            title="Remove nomination from ballot"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* STAGE 2: LIVE VOTING                                         */}
      {/* ----------------------------------------------------------- */}
      {status === 'voting' && (
        <div className="lobby-stage-voting">
          {/* Progress Banner */}
          <div className="voting-progress-card">
            <div className="progress-info">
              <h3>Cast Your Votes</h3>
              <p>
                Vote on each contender. You have voted on <strong style={{ color: '#ffffff' }}>{myVoteCount}</strong> of <strong style={{ color: '#ffffff' }}>{ballot.length}</strong> movies.
              </p>
            </div>
            <div className="progress-indicator">
              <span className={`vote-all-tag ${allVoted ? 'voted-complete' : 'voted-pending'}`}>
                {allVoted ? 'All Voted!' : `${ballot.length - myVoteCount} Remaining`}
              </span>
            </div>
          </div>

          {/* Voting Cards Grid */}
          <div className="voting-ballot-grid">
            {ballot.map((item) => {
              const posterUrl = item.posterPath ? `${TMDB_POSTER_BASE}${item.posterPath}` : null;
              const currentVote = myVotes[item.tmdbId];
              const isVotingThis = votingMovieId === item.tmdbId;

              return (
                <div key={item.tmdbId} className={`voting-card ${currentVote ? 'has-voted' : ''}`}>
                  <div className="voting-card-poster">
                    {posterUrl ? (
                      <img src={posterUrl} alt={item.title} loading="lazy" />
                    ) : (
                      <div className="poster-placeholder">{item.title}</div>
                    )}
                    <span className="voting-rating">Rating: {Number(item.voteAverage || 0).toFixed(1)}</span>
                  </div>

                  <div className="voting-card-details">
                    <h3 className="voting-title">{item.title}</h3>
                    <div className="voting-meta">
                      <span>{formatToDDMMYYYY(item.releaseDate)}</span>
                      <span>•</span>
                      <span>Nominated by {item.nominatedByName}</span>
                    </div>

                    <p className="voting-overview">
                      {item.overview
                        ? item.overview.substring(0, 140) + '...'
                        : 'No description available.'}
                    </p>

                    {/* Three Voting Buttons */}
                    <div className="voting-buttons-bar">
                      <button
                        type="button"
                        className={`vote-btn vote-yes ${currentVote === 'yes' ? 'selected' : ''}`}
                        onClick={() => handleVote(item.tmdbId, 'yes')}
                        disabled={isVotingThis}
                        title="Yes, must watch! (2 points)"
                      >
                        <span className="vote-label">MUST WATCH</span>
                        <span className="vote-pts">+2 pts</span>
                      </button>

                      <button
                        type="button"
                        className={`vote-btn vote-maybe ${currentVote === 'maybe' ? 'selected' : ''}`}
                        onClick={() => handleVote(item.tmdbId, 'maybe')}
                        disabled={isVotingThis}
                        title="Fine with it (1 point)"
                      >
                        <span className="vote-label">FINE WITH IT</span>
                        <span className="vote-pts">+1 pt</span>
                      </button>

                      <button
                        type="button"
                        className={`vote-btn vote-no ${currentVote === 'no' ? 'selected' : ''}`}
                        onClick={() => handleVote(item.tmdbId, 'no')}
                        disabled={isVotingThis}
                        title="Skip movie (0 points)"
                      >
                        <span className="vote-label">SKIP</span>
                        <span className="vote-pts">0 pts</span>
                      </button>
                    </div>

                    {/* Participant's current vote badge */}
                    {currentVote && (
                      <div className="current-vote-indicator">
                        <span>Your selection: </span>
                        <strong className={`vote-tag-${currentVote}`}>
                          {currentVote === 'yes'
                            ? 'Must Watch'
                            : currentVote === 'maybe'
                            ? 'Fine With It'
                            : 'Skip'}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* STAGE 3: VERDICT & WINNER CROWNED                           */}
      {/* ----------------------------------------------------------- */}
      {status === 'completed' && winner && (
        <div className="lobby-stage-verdict">
          {/* Ambilight Winner Spotlight Card */}
          <div className="winner-spotlight-card">
            <div className="winner-glow-backdrop" />

            <div className="winner-content-layout">
              {/* Winner Poster */}
              <div className="winner-poster-column">
                <div className="winner-crown-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>GROUP WINNER</span>
                </div>

                {winner.posterPath ? (
                  <img
                    src={`${TMDB_POSTER_BASE}${winner.posterPath}`}
                    alt={winner.title}
                    className="winner-poster-img"
                  />
                ) : (
                  <div className="winner-placeholder">{winner.title}</div>
                )}
              </div>

              {/* Winner Stats and Details */}
              <div className="winner-details-column">
                <span className="verdict-banner-tag">TONIGHT'S SCREENING SELECTION</span>
                <h1 className="winner-title">{winner.title}</h1>

                <div className="winner-meta-row">
                  <span className="winner-score-badge">Rating: {Number(winner.voteAverage || 0).toFixed(1)} / 10</span>
                  <span className="winner-match-badge">
                    {winner.matchPercentage || 100}% Group Consensus
                  </span>
                  <span className="winner-date">{formatToDDMMYYYY(winner.releaseDate)}</span>
                </div>

                <p className="winner-overview">
                  {winner.overview || 'The crew has spoken! Get your popcorn ready for tonight\'s movie.'}
                </p>

                {/* Score breakdown metrics */}
                <div className="winner-metrics-grid">
                  <div className="metric-box">
                    <span className="m-val">{winner.score || 0}</span>
                    <span className="m-lbl">TOTAL POINTS</span>
                  </div>
                  <div className="metric-box">
                    <span className="m-val">{winner.yesVotes || 0}</span>
                    <span className="m-lbl">MUST WATCH</span>
                  </div>
                  <div className="metric-box">
                    <span className="m-val">{winner.maybeVotes || 0}</span>
                    <span className="m-lbl">FINE WITH IT</span>
                  </div>
                  <div className="metric-box">
                    <span className="m-val">{winner.noVotes || 0}</span>
                    <span className="m-lbl">SKIP</span>
                  </div>
                </div>

                {/* Winner Action Buttons */}
                <div className="winner-actions-row">
                  <Link
                    to={`/movies/${winner.tmdbId}`}
                    className="btn btn-primary"
                  >
                    View Movie Details
                  </Link>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddWinnerToWatchlist}
                  >
                    + Add to Watchlist
                  </button>

                  <button
                    type="button"
                    className="btn winner-ticket-btn"
                    onClick={() => setSelectedTicketMovie(winner)}
                    title="View Collectible Cinema Ticket Stub for Winner"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="2" y="2" width="20" height="20" rx="2" />
                      <line x1="7" y1="2" x2="7" y2="22" />
                      <line x1="17" y1="2" x2="17" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                    <span>Print Group Ticket Pass</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Other Nominees Rankings */}
          {ballot.length > 1 && (
            <div className="runner-up-section">
              <h3 className="runner-up-heading">Full Group Ballot Rankings</h3>
              <div className="runner-up-table-wrap">
                <table className="runner-up-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Movie</th>
                      <th>Score</th>
                      <th>Consensus</th>
                      <th>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ballot
                      .slice()
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((item, index) => {
                        const isWin = item.tmdbId === winner.tmdbId;
                        return (
                          <tr key={item.tmdbId} className={isWin ? 'winner-row' : ''}>
                            <td className="rank-cell">#{index + 1}</td>
                            <td className="title-cell">
                              <strong>{item.title}</strong>
                              {isWin && <span className="table-crown-tag">WINNER</span>}
                            </td>
                            <td className="score-cell">{item.score || 0} pts</td>
                            <td className="consensus-cell">{item.matchPercentage || 0}%</td>
                            <td className="votes-cell">
                              {item.yesCount || 0} Yes • {item.maybeCount || 0} Maybe • {item.noCount || 0} Skip
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Join Screen Name Modal (shown if guest enters room without roster entry) */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-content join-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="join-modal-header">
              <div className="join-modal-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3>Join {lobby.title}</h3>
                <p>Enter your screen name to participate in nominations and voting</p>
              </div>
            </div>

            <form onSubmit={handleJoinRoster} className="join-modal-form">
              <div className="form-group">
                <label className="form-label">Your Screen Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Alex Cinephile"
                  value={participantName}
                  onChange={(e) => updateParticipantName(e.target.value)}
                  maxLength={30}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={joining || !participantName.trim()}
              >
                {joining ? 'Entering Room...' : 'Enter Movie Night Lobby'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Winner Collectible Ticket Modal */}
      <CinemaTicketModal
        isOpen={Boolean(selectedTicketMovie)}
        onClose={() => setSelectedTicketMovie(null)}
        movie={selectedTicketMovie}
        userRating={selectedTicketMovie?.voteAverage}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default MovieNightLobbyPage;
