const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');

// Helper: Generate signed JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'cineverse_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, age } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password is automatically hashed by pre-save hook)
    const parsedAge = age !== undefined && age !== null && age !== '' ? Number(age) : null;
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      age: parsedAge,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age || null,
        avatar: user.avatar || '',
        isNewUser: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user and explicitly include hashed password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare passwords using bcrypt method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age || null,
        avatar: user.avatar || '',
        isNewUser: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private (Requires JWT)
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        age: req.user.age || null,
        avatar: req.user.avatar || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile name, email, age, and avatar
// @route   PATCH /api/auth/profile
// @access  Private (Requires JWT)
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, age, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      // Verify email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      // Check if another user already has this email
      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use by another account.',
        });
      }

      user.email = cleanEmail;
    }

    if (age !== undefined) {
      user.age = age !== null && age !== '' ? Number(age) : null;
    }

    if (typeof avatar === 'string') {
      user.avatar = avatar;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age || null,
        avatar: user.avatar || '',
        isNewUser: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if email is already taken before sending OTP
// @route   POST /api/auth/check-email
// @access  Public
const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        exists: true,
        message: 'An account with this email already exists.',
      });
    }

    res.status(200).json({
      success: true,
      exists: false,
      message: 'Email is available.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and all associated watchlist and reminder data
// @route   DELETE /api/auth/profile
// @access  Private (Requires JWT)
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Delete all watchlists and reminders associated with this user
    await Watchlist.deleteMany({ userId });

    // 2. Delete the user document
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account and associated data deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  checkEmail,
  deleteAccount,
};
