require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const lobbyRoutes = require('./routes/lobbyRoutes');

const app = express();

// CORS configuration supporting credentials and dynamic origins across Vercel deployments
app.use(
  cors({
    origin: true, // Dynamically reflects origin so cookies/headers work without wildcard conflict
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Respond to preflight requests immediately
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Ensure MongoDB Atlas connection is active for each incoming request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err.message);
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/watchlist')) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please retry in a few moments.',
      });
    }
    next();
  }
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CineVerse REST API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/lobby', lobbyRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only when running locally (not in Vercel serverless environment)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CineVerse Server] running on port ${PORT}`);
    console.log(`[Health check] available at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
