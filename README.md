# CineVerse – Smart Movie Watchlist, Streaming Hub & Cinema Companion

CineVerse is an all-in-one personal movie platform designed to discover real-time trending titles, locate streaming availability across major OTT providers, stream official YouTube trailers in-app, curate multi-state watchlists, and schedule watch reminders with cinematic audio alerts.

---

## Key Features

### 1. Real-Time Movie Discovery & Genre Quick-Pills
- **Live Catalogues**: Dynamically browse Trending, Popular, Upcoming, and Top-Rated titles sourced from The Movie Database (TMDB) v3 API.
- **Genre Quick-Filter Bar**: Horizontally scrollable genre pill bar on Discover (Action, Comedy, Drama, Sci-Fi, Animation, Horror, Romance, Thriller) with instant reactive filtering.
- **Search & Infinite Scrolling**: Live search with debouncing, race-condition protected infinite scrolling using IntersectionObserver, and client-side sorting by rating, title, or release date.
- **Resilient Poster Fallbacks**: High-definition TMDB posters with automatic fallback to wide backdrops or cinema reel placeholders.

### 2. Embedded Movie Trailers (YouTube Player)
- **Interactive Trailer Modal**: In-app 16:9 widescreen YouTube embed player with backdrop blur and responsive viewport scaling.
- **Smart Playback Controls**: Auto-pauses and unmounts on modal close or `Escape` keypress to prevent background audio bleeding.
- **Official Content**: Prioritizes official trailers and teasers retrieved via `/api/movies/:id/videos`.

### 3. Where to Watch / Streaming Providers (JustWatch Integration)
- **Multi-Country Availability**: Interactive Red & Black country selector supporting India (IN), United States (US), United Kingdom (GB), Canada (CA), and Australia (AU).
- **Categorized Options**: Distinct badges for Subscription ('Stream'), 'Rent', and 'Buy' offerings.
- **Official Branding & Deep-Links**: Official platform logos (Netflix, Prime Video, Apple TV, Disney+, Zee5, Hotstar) with 1-click redirection to verified JustWatch listings.

### 4. Cast & Director Showcase
- **Director Spotlight**: Prominent attribution banner displaying the film's primary director and production department.
- **Cast Roster**: Horizontally scrollable actor cards featuring high-resolution TMDB portraits, real names, and character roles.

### 5. "More Like This" Algorithmic Recommendations
- **Contextual Recommendations**: Horizontally scrollable carousel of correlated titles retrieved via `/api/movies/:id/recommendations`.
- **Instant Actions**: One-click navigation to explore recommended titles alongside instant watchlist toggling with optimistic state sync.

### 6. Personal Movie Watchlists (Tri-State Lifecycle)
- **Workflow State Management**: Organize titles across three viewing states:
  - Planned to Watch
  - Currently Watching
  - Watched
- **Duplicate Prevention**: MongoDB compound unique indexing (`userId` + `tmdbId`) prevents duplicate entries.
- **Optimistic UI**: Instant state toggling and deletion with responsive feedback.

### 7. Dedicated Reminders Dashboard & Cinematic Audio Alerts
- **Dedicated Hub (`/reminders`)**: Standalone dashboard with filter tabs (All, Today, Upcoming, Overdue).
- **Real-Time Countdown Badges**: Color-coded status indicators calculating exact remaining time ('Due Now / Overdue', 'Today at HH:MM', 'Tomorrow at HH:MM', 'In X days', 'Completed').
- **Custom Cinema Calendar**: Interactive Red & Black datepicker with quick presets ('Today', 'Tomorrow', 'Weekend'), 12-hour AM/PM time selector, and auto-expanding personal notes.
- **Dual-Tone Web Audio Chime**: Synthesizes a high-fidelity bell chime (F#5 739.99 Hz & B5 987.77 Hz) via the Web Audio API alongside HTML5 desktop browser notifications when reminders trigger.

### 8. Age-Rating Protection (Hardened 18+ Content Filter)
- **Underage Guard**: Coerced numeric age verification (`Number(age) < 18`) checks TMDB content certifications (R, NC-17, 18, 18+, A, TV-MA, X, R18).
- **Automatic Shielding**: Adult content is systematically excluded from discovery feeds, category lists, search queries, and watchlist addition for underage users.

### 9. Profile Customization & Canvas Image Compression
- **Account Management**: Update user name, email, age, and profile photo.
- **Client-Side Compression**: HTML5 Canvas downsizes uploaded avatars to 400x400 JPEG at 88% quality before base64 encoding, preventing database bloat.

### 10. EmailJS 2-Step OTP Authentication & Account Deletion
- **Cryptographic 6-Digit OTP**: 5-minute expiry verification code sent directly via EmailJS cloud delivery.
- **Pre-Check Validation**: `/api/auth/check-email` verifies email availability prior to OTP generation.
- **Danger Zone Deletion**: Requires OTP confirmation before executing permanent account and watchlist deletion.

---

## Technology Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Context API |
| **Styling & UI** | Pure Modern CSS, Responsive Flex/Grid, Cinema Red & Black Theme (`#e50914`, `#070a10`, `#0f1522`) |
| **Backend** | Node.js, Express.js (REST API Architecture on Vercel Serverless) |
| **Database** | MongoDB Atlas, Mongoose ODM (Compound Unique Indexing) |
| **Media Intelligence** | The Movie Database (TMDB) REST v3 API |
| **Streaming Providers** | JustWatch OTT Data (via TMDB Watch Providers Endpoint) |
| **Audio & Alerts** | Web Audio API (Synthesized Chimes), HTML5 Notifications API |
| **Email Verification** | EmailJS SDK & Cloud SMTP Gateway |
| **Production Hosting** | Vercel (Edge Frontend + Serverless Backend Function) |

---

## Project Structure

```text
cineverse/
├── client/                                 # React Frontend (Vite)
│   ├── public/                             # Static public assets and SVG icons
│   ├── src/
│   │   ├── assets/styles/index.css         # Master Red & Black CSS styling and design tokens
│   │   ├── components/                     # Modular reusable UI components
│   │   │   ├── ConfirmModal.jsx            # Account deletion and action confirmation modal
│   │   │   ├── CustomDatePicker.jsx        # Red & Black cinema calendar modal
│   │   │   ├── Footer.jsx                  # Persistent footer with brand links
│   │   │   ├── MovieCard.jsx               # Movie card with status dropdown & reminder trigger
│   │   │   ├── Navbar.jsx                  # Main navigation bar with search & active route indicators
│   │   │   ├── ProtectedRoute.jsx          # Route guard for authenticated pages
│   │   │   ├── ReminderAlertModal.jsx      # Modal popup when scheduled reminder triggers
│   │   │   ├── ReminderModal.jsx           # Modal for scheduling movie reminders
│   │   │   ├── ReminderNotificationListener.jsx # Background reminder evaluator & Web Audio chime
│   │   │   ├── StatCard.jsx                # Statistics card for dashboard metrics
│   │   │   ├── StreamingProviderBadge.jsx  # Streaming provider badge with JustWatch deep-links
│   │   │   ├── Toast.jsx                   # Non-blocking notification toasts
│   │   │   └── TrailerModal.jsx            # Embedded 16:9 YouTube video player modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx             # Global user authentication state and session persistence
│   │   ├── pages/                          # Application page views
│   │   │   ├── DashboardPage.jsx           # User overview, metrics, and recent activity
│   │   │   ├── DiscoveryPage.jsx           # Catalog explorer, genre quick-pills, infinite scroll
│   │   │   ├── HomePage.jsx                # Cinema banner hero, trending carousels, and feature overview
│   │   │   ├── LoginPage.jsx               # Member credential authentication
│   │   │   ├── MovieDetailPage.jsx         # Full movie details, trailers, providers, credits, recommendations
│   │   │   ├── ProfilePage.jsx             # Profile editing, avatar compression, and Danger Zone deletion
│   │   │   ├── RegisterPage.jsx            # 2-step registration with EmailJS OTP verification
│   │   │   ├── RemindersPage.jsx           # Dedicated reminders dashboard with countdown filters
│   │   │   └── WatchlistPage.jsx           # Multi-state personal watchlist manager
│   │   ├── services/
│   │   │   ├── api.js                      # Axios instance with automatic Bearer JWT interceptors
│   │   │   └── emailService.js             # EmailJS client for dispatching OTP verification codes
│   │   ├── App.jsx                         # Route tree definitions and global notification listeners
│   │   └── main.jsx                        # React root entry point
│   ├── email-templates/                    # Mobile-responsive dark-mode HTML email template
│   ├── vercel.json                         # Client SPA routing rewrite rules
│   └── vite.config.js                      # Vite build and plugin configuration
│
├── server/                                 # Express Backend (REST API)
│   ├── config/
│   │   └── db.js                           # MongoDB Atlas connection handler with connection reuse
│   ├── controllers/
│   │   ├── authController.js               # Registration, login, profile update, and account deletion
│   │   ├── movieController.js              # TMDB gateway (trending, search, credits, videos, providers)
│   │   └── watchlistController.js          # Watchlist CRUD, status updates, reminder scheduling, 18+ filter
│   ├── middleware/
│   │   ├── authMiddleware.js               # Stateless JWT Bearer token authentication
│   │   └── errorMiddleware.js              # Centralized 404 and uncaught exception handlers
│   ├── models/
│   │   ├── User.js                         # User schema with Bcrypt password hashing
│   │   └── Watchlist.js                    # Watchlist schema with compound unique indexing
│   ├── routes/
│   │   ├── authRoutes.js                   # Authentication and profile endpoints
│   │   ├── movieRoutes.js                  # Movie discovery and intelligence endpoints
│   │   └── watchlistRoutes.js              # Watchlist and reminder endpoints
│   ├── services/
│   │   └── tmdbService.js                  # Axios client for external TMDB REST v3 requests
│   ├── server.js                           # Express application entry with fail-fast DB middleware
│   └── vercel.json                         # Serverless configuration and security headers
│
├── generate_pdf.py                         # ReportLab compilation script for technical documentation
└── README.md                               # Project documentation
```

---

## REST API Specifications

Base Production API URL: `https://cineverse-api-seven.vercel.app/api`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Health check verifying API uptime and database connectivity |
| `POST` | `/auth/check-email` | Public | Validates email availability prior to OTP generation |
| `POST` | `/auth/register` | Public | Registers user after OTP verification and returns JWT token |
| `POST` | `/auth/login` | Public | Authenticates credentials and returns JWT token |
| `GET` | `/auth/me` | JWT | Retrieves authenticated profile from token claims |
| `PATCH` | `/auth/profile` | JWT | Updates user name, email, age, and compressed avatar |
| `DELETE` | `/auth/profile` | JWT | Permanently deletes account, watchlist, and reminder records |
| `GET` | `/movies/trending` | Public | Fetches real-time trending titles from TMDB |
| `GET` | `/movies/popular` | Public | Fetches popular titles with pagination |
| `GET` | `/movies/search` | Public | Searches movie catalogue by title, actor, or keyword |
| `GET` | `/movies/:id` | Public | Retrieves full movie details, genres, runtime, and budget |
| `GET` | `/movies/:id/videos` | Public | Retrieves official YouTube trailers and video keys |
| `GET` | `/movies/:id/watch-providers` | Public | Retrieves regional streaming, rental, and buy providers |
| `GET` | `/movies/:id/credits` | Public | Retrieves director attribution and cast roster |
| `GET` | `/movies/:id/recommendations` | Public | Retrieves algorithmically correlated 'More Like This' titles |
| `GET` | `/watchlist` | JWT | Retrieves user's saved watchlist entries (filterable by status) |
| `POST` | `/watchlist` | JWT | Adds title to watchlist with age restriction enforcement |
| `PATCH` | `/watchlist/:tmdbId/status` | JWT | Updates watch state ('Planned to Watch', 'Currently Watching', 'Watched') |
| `PATCH` | `/watchlist/:tmdbId/reminder` | JWT | Schedules or updates watch reminder date, time, and note |
| `DELETE` | `/watchlist/:tmdbId` | JWT | Removes movie from user's watchlist |

---

## Live Deployments

- **Web Application**: [https://cineverse-movie-hub.vercel.app](https://cineverse-movie-hub.vercel.app)
- **RESTful API**: [https://cineverse-api-seven.vercel.app/api](https://cineverse-api-seven.vercel.app/api)
- **Repository**: [https://github.com/G0DS0N92/CineVerse.git](https://github.com/G0DS0N92/CineVerse.git)

---

## License

This project is licensed under the MIT License.
