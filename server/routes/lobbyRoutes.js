const express = require('express');
const router = express.Router();
const {
  createLobby,
  getLobby,
  joinLobby,
  addNomination,
  removeNomination,
  submitVote,
  updateStage,
} = require('../controllers/lobbyController');

router.post('/', createLobby);
router.get('/:code', getLobby);
router.post('/:code/join', joinLobby);
router.post('/:code/nominate', addNomination);
router.delete('/:code/nominate/:tmdbId', removeNomination);
router.post('/:code/vote', submitVote);
router.patch('/:code/stage', updateStage);

module.exports = router;
