# 🎬 CineVerse – Smart Movie Watchlist & Reminder Platform

CineVerse is an all-in-one personal movie companion designed to streamline how film lovers discover, organize, and plan their entertainment. The platform lets users explore real-time trending titles, build curated personal watchlists categorized by custom viewing statuses, and schedule smart watch reminders with personalized notes so they never miss a movie night. With an intuitive cinema dashboard, CineVerse transforms scattered movie recommendations into a beautifully organized viewing experience.

---

## ✨ Key Features

### 1. 🔍 Real-Time Movie Discovery
- **Live Catalogues**: Dynamically browse Trending, Popular, Upcoming, and Top-Rated movies powered by TMDB.
- **Search & Filtering**: Real-time search with client-side debouncing (300ms), genre-based filtering, and sorting by rating, title, or release date.
- **Movie Details**: Comprehensive view with widescreen backdrops, high-definition posters, plot overviews, release years, and audience ratings.

### 2. 📑 Personal Movie Watchlists
- **State Management**: Categorize saved movies into three distinct watching states:
  - ⏳ *Planned to Watch*
  - ▶️ *Currently Watching*
  - ✅ *Watched*
- **Duplicate Prevention**: Database-level compound unique indexing prevents duplicate movie entries for the same user.
- **Instant Controls**: Update statuses in-place or remove titles with immediate UI feedback.

### 3. ⏰ Smart Movie Reminders
- **Watch Scheduling**: Schedule upcoming movie viewings by selecting specific dates (`YYYY-MM-DD`), times (`HH:mm`), and personal notes.
- **Status Tracking**: Visual indicators for *Pending*, *Completed*, and *Overdue* watch events.
- **Quick Actions**: 1-click completion toggle and reminder management directly from the dashboard or reminders hub.

### 4. 📊 Personalized User Dashboard
- **Activity Metrics**: Live statistics cards tracking Total Saved, Planned, Currently Watching, and Watched totals.
- **Quick Access**: Overview of upcoming scheduled reminders and recently added titles.

### 5. 🔐 Authentication & Security
- **JWT Authentication**: Stateless, token-based session management.
- **Encrypted Passwords**: One-way cryptographic password hashing via `bcryptjs`.
- **Protected Routes**: Client-side route guarding and server-side authorization middleware ensuring strict data isolation per user.
- **Secure Backend Proxy**: External TMDB API keys remain strictly on the backend and are never exposed to the client.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Context API |
| **UI & Styling** | Pure Modern CSS, Responsive Grid, Cinematic Dark Theme |
| **Backend** | Node.js, Express.js (REST API Architecture) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **External API** | The Movie Database (TMDB) API v3 |
| **Deployment** | Vercel (Edge Frontend + Serverless Node.js Backend) |

---

## 📁 Project Structure

```text
cineverse/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── assets/styles/      # Cinematic Dark Theme & Master CSS
│   │   ├── components/         # Navbar, Footer, MovieCard, ReminderModal, StatCard
│   │   ├── context/            # AuthContext (global state & session persistence)
│   │   ├── pages/              # Home, Discover, MovieDetail, Watchlist, Reminders, Dashboard, Profile
│   │   ├── services/           # Pre-configured Axios instance with JWT interceptor
│   │   ├── App.jsx             # Route definitions & ProtectedRoute guards
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Express Backend
│   ├── config/db.js            # MongoDB Atlas connection handler
│   ├── controllers/            # Auth, Movies, and Watchlist controllers
│   ├── middleware/             # JWT auth verification & centralized error handling
│   ├── models/                 # User and Watchlist schemas
│   ├── routes/                 # Express REST route handlers
│   ├── services/tmdbService.js # TMDB API integration service
│   ├── server.js               # Application entry point
│   ├── vercel.json             # Vercel serverless deployment config
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB Atlas database URI
- TMDB API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/soham-ecs92/CineVerse.git
   cd CineVerse
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   TMDB_API_KEY=your_tmdb_api_key
   CLIENT_URL=http://localhost:5173
   ```
   Start the backend server:
   ```bash
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Sign in existing user | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | **Yes** |
| `PATCH` | `/api/auth/profile` | Update profile details | **Yes** |
| `GET` | `/api/movies/trending` | Fetch trending movies | No |
| `GET` | `/api/movies/popular` | Fetch popular movies | No |
| `GET` | `/api/movies/upcoming` | Fetch upcoming releases | No |
| `GET` | `/api/movies/top-rated` | Fetch top-rated movies | No |
| `GET` | `/api/movies/search` | Search movies by title | No |
| `GET` | `/api/movies/:id` | Fetch full details for a single movie | No |
| `GET` | `/api/watchlist` | Get current user's watchlist | **Yes** |
| `POST` | `/api/watchlist` | Add movie to watchlist | **Yes** |
| `PATCH` | `/api/watchlist/:id` | Update watching status or reminder | **Yes** |
| `DELETE` | `/api/watchlist/:id` | Remove movie from watchlist | **Yes** |
| `GET` | `/api/watchlist/reminders` | Fetch scheduled reminders | **Yes** |
| `GET` | `/api/watchlist/stats` | Aggregated dashboard statistics | **Yes** |
