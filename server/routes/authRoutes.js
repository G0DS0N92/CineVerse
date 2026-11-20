const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  checkEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

module.exports = router;
