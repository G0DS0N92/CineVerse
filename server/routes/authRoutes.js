const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  checkEmail,
  requestDeleteOtp,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.post('/request-delete-otp', protect, requestDeleteOtp);
router.delete('/profile', protect, deleteAccount);

module.exports = router;
