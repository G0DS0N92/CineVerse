import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress header/footer on title cover

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(54, letter[1] - 36, "CINEVERSE — Project Architecture & Technical Documentation")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer
        self.line(54, 45, letter[0] - 54, 45)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#94a3b8"))
        self.drawString(54, 32, "CineVerse Platform | MERN Stack & Cloud Architecture")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 32, page_str)

        self.restoreState()


def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    RED = colors.HexColor("#E50914")
    DARK = colors.HexColor("#0f172a")
    TEXT = colors.HexColor("#1e293b")
    MUTED = colors.HexColor("#475569")
    LIGHT_BG = colors.HexColor("#f8fafc")
    BORDER_COLOR = colors.HexColor("#cbd5e1")

    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=30,
        leading=36,
        textColor=RED,
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=DARK,
        spaceAfter=14
    ))
    styles.add(ParagraphStyle(
        name='DocH1',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=21,
        textColor=DARK,
        spaceBefore=0,
        spaceAfter=8,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='DocH2',
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=16,
        textColor=RED,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='DocBody',
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=TEXT,
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='CalloutText',
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=DARK
    ))
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.white
    ))
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT
    ))
    styles.add(ParagraphStyle(
        name='TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=TEXT
    ))

    story = []

    # =========================================================================
    # PAGE 1: TITLE & EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Spacer(1, 25))
    story.append(Paragraph("CINE<font color='#111827'>VERSE</font>", styles['CoverTitle']))
    story.append(Paragraph("Your Personal Movie Companion & Smart Watchlist Platform", styles['CoverSubtitle']))
    story.append(HRFlowable(width="100%", thickness=2.5, color=RED, spaceBefore=0, spaceAfter=18))

    meta_rows = [
        [Paragraph("<b>Project Name:</b>", styles['TableCellBold']), Paragraph("CineVerse — Full-Stack Movie Platform", styles['TableCell'])],
        [Paragraph("<b>Architecture:</b>", styles['TableCellBold']), Paragraph("MERN Stack (MongoDB, Express, React 18, Node.js) + Vite", styles['TableCell'])],
        [Paragraph("<b>Live Website:</b>", styles['TableCellBold']), Paragraph("https://cineverse-movie-hub.vercel.app", styles['TableCell'])],
        [Paragraph("<b>Backend API:</b>", styles['TableCellBold']), Paragraph("https://cineverse-api-seven.vercel.app/api", styles['TableCell'])],
        [Paragraph("<b>Git Repository:</b>", styles['TableCellBold']), Paragraph("https://github.com/G0DS0N92/CineVerse.git (branch: main)", styles['TableCell'])],
        [Paragraph("<b>Primary Services:</b>", styles['TableCellBold']), Paragraph("The Movie Database (TMDB) API v3, EmailJS Cloud SMTP", styles['TableCell'])],
        [Paragraph("<b>Security Model:</b>", styles['TableCellBold']), Paragraph("Bcrypt Salting, Stateless JWT Auth, 2-Step Cryptographic Email OTP", styles['TableCell'])],
        [Paragraph("<b>Release Version:</b>", styles['TableCellBold']), Paragraph("v2.4 Production Release (2026)", styles['TableCell'])],
    ]
    meta_table = Table(meta_rows, colWidths=[120, 384])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 16))

    callout_data = [[
        Paragraph(
            "<b>Executive Overview:</b> CineVerse is an end-to-end full-stack web application designed to solve "
            "movie-discovery paralysis and fragmented viewing schedules. The platform combines real-time streaming catalogue "
            "intelligence from TMDB with an interactive 3-state personal watchlist, custom watch session reminders, international "
            "age-rating content filters (18+ protection), and bank-grade email OTP verification for registration and account deletion.",
            styles['CalloutText']
        )
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff1f2")),
        ('BOX', (0, 0), (-1, -1), 1.5, RED),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Key Value Propositions:", styles['DocH2']))
    story.append(Paragraph(
        "&bull; <b>Zero-Friction Discovery:</b> Instant access to real-time Trending, Now Playing, Top Rated, and Upcoming movies.<br/>"
        "&bull; <b>Tri-State Organization:</b> Segment bookmarked titles into 'Planned to Watch', 'Currently Watching', and 'Watched'.<br/>"
        "&bull; <b>Intelligent Reminders:</b> Schedule viewing sessions on an interactive Red & Black cinema calendar with custom notes.<br/>"
        "&bull; <b>Underage Protection:</b> Automated content restriction preventing adult titles from reaching users under 18.<br/>"
        "&bull; <b>Verified Accounts:</b> EmailJS 2-step verification ensures genuine user accounts and secure permanent account deletion.",
        styles['DocBody']
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: ARCHITECTURE & TECH STACK
    # =========================================================================
    story.append(Paragraph("1. System Architecture & Technical Stack", styles['DocH1']))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK, spaceBefore=0, spaceAfter=10))

    story.append(Paragraph(
        "CineVerse implements a modern decoupled Client-Server architecture deployed across serverless infrastructure on Vercel. "
        "The frontend is an optimized Single Page Application (SPA) communicating with a Node.js/Express REST API backed by MongoDB Atlas.",
        styles['DocBody']
    ))

    arch_layers = [
        [Paragraph("Tier", styles['TableHeader']), Paragraph("Technology", styles['TableHeader']), Paragraph("Role & Key Responsibilities", styles['TableHeader'])],
        [
            Paragraph("<b>Frontend (UI)</b>", styles['TableCellBold']),
            Paragraph("React 18<br/>Vite Bundler<br/>React Router v6", styles['TableCell']),
            Paragraph("Component-driven SPA, cinema Red & Black styling, client-side route rewrites (`client/vercel.json`), Canvas image compression, and optimistic UI updates.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Backend (API)</b>", styles['TableCellBold']),
            Paragraph("Node.js<br/>Express.js<br/>Vercel Serverless", styles['TableCell']),
            Paragraph("RESTful endpoints, JWT authorization middleware, dynamic CORS reflection (`origin: true`), input sanitization, and TMDB API gateway.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Database</b>", styles['TableCellBold']),
            Paragraph("MongoDB Atlas<br/>Mongoose ODM", styles['TableCell']),
            Paragraph("Cloud NoSQL database storing user credentials, base64 avatars, and compound-indexed (`userId` + `tmdbId`) watchlist entries.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Movie Intelligence</b>", styles['TableCellBold']),
            Paragraph("The Movie Database<br/>(TMDB) REST v3", styles['TableCell']),
            Paragraph("Supplies high-resolution posters, backdrops, cast metadata, release calendars, genres, and international age rating certifications.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Email Services</b>", styles['TableCellBold']),
            Paragraph("EmailJS SDK<br/>Cloud SMTP Gateway", styles['TableCell']),
            Paragraph("Sends branded HTML emails with 6-digit cryptographic verification codes directly from the browser without server SMTP overhead.", styles['TableCell'])
        ],
    ]
    arch_table = Table(arch_layers, colWidths=[95, 115, 294])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph("System Data Flow:", styles['DocH2']))
    story.append(Paragraph(
        "<b>1. Discovery Flow:</b> Client requests `/api/movies/trending` &rarr; Express validates and queries TMDB &rarr; TMDB returns raw payload &rarr; Express normalizes and filters age-restricted movies for underage users &rarr; Client renders movie grid with fallback cinema reel posters.<br/>"
        "<b>2. Watchlist Flow:</b> User clicks '+ Watchlist' on any title &rarr; Axios interceptor injects Bearer JWT &rarr; Express validates token claims &rarr; Mongoose upserts into `watchlists` with compound index &rarr; UI updates state optimistically.<br/>"
        "<b>3. Reminder Flow:</b> User schedules movie watch &rarr; Custom calendar modal captures date, AM/PM time, and note &rarr; Express updates sub-document in MongoDB &rarr; Status updates with color-coded tags.",
        styles['DocBody']
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: CORE FUNCTIONAL MODULES
    # =========================================================================
    story.append(Paragraph("2. Core Functional Modules", styles['DocH1']))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK, spaceBefore=0, spaceAfter=10))

    story.append(Paragraph("A. Real-Time Movie Discovery Engine", styles['DocH2']))
    story.append(Paragraph(
        "Users explore TMDB's catalogue through categorized feeds (Trending, Now Playing, Upcoming, Top Rated) or instant search. "
        "Each movie card features vote averages, formatted release dates, status dropdowns, and reminder shortcuts. If a poster is missing, "
        "the card automatically falls back to the movie's backdrop; if both are missing, a cinema reel placeholder is rendered.",
        styles['DocBody']
    ))

    story.append(Paragraph("B. Tri-State Watchlist Lifecycle", styles['DocH2']))
    story.append(Paragraph(
        "CineVerse treats movie tracking as an active workflow rather than a static list. Titles move seamlessly across: "
        "<br/>&bull; <b>Planned to Watch:</b> Movies queued for future viewing with scheduled reminders."
        "<br/>&bull; <b>Currently Watching:</b> Movies actively being watched (e.g. series or paused films)."
        "<br/>&bull; <b>Watched:</b> Completed movies archived for user history with personal ratings."
        "<br/>Status dropdowns open downward with flex-shrink tags to prevent layout clipping on narrow screens.",
        styles['DocBody']
    ))

    story.append(Paragraph("C. Interactive Watch Reminder System", styles['DocH2']))
    story.append(Paragraph(
        "Clicking 'Remind' opens an interactive modal with: "
        "<br/>&bull; <b>Cinema Calendar:</b> Styled in Red and Black (`#e50914` / `#0f1522`) replacing default cyan styles."
        "<br/>&bull; <b>Shortcut Presets:</b> Instant date selection for 'Today', 'Tomorrow', and 'Weekend'."
        "<br/>&bull; <b>Custom Time Selection:</b> 12-hour format with AM/PM toggle."
        "<br/>&bull; <b>Auto-Expanding Personal Note:</b> Textarea grows automatically as user types notes (e.g. 'Movie night with friends!').",
        styles['DocBody']
    ))

    story.append(Paragraph("D. Age-Rating Protection (18+ Filter)", styles['DocH2']))
    story.append(Paragraph(
        "User age captured during registration enables dynamic content filtering. For users under 18, the system checks TMDB certification "
        "codes (R, NC-17, 18+, A) and automatically hides adult titles from discovery feeds, category listings, and search results.",
        styles['DocBody']
    ))

    story.append(Paragraph("E. Profile Management & Client-Side Image Compression", styles['DocH2']))
    story.append(Paragraph(
        "In the Account Profile (User Details) page, users can edit their Full Name, Email, and Age. A custom avatar can be uploaded directly "
        "from their device. To prevent database bloat, the client uses an HTML5 Canvas to downsize and compress images to a maximum of 400x400 "
        "at 88% JPEG quality before base64 encoding.",
        styles['DocBody']
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: EMAILJS OTP & SECURITY
    # =========================================================================
    story.append(Paragraph("3. EmailJS OTP Verification Architecture", styles['DocH1']))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK, spaceBefore=0, spaceAfter=10))

    story.append(Paragraph(
        "CineVerse enforces 2-Step OTP Verification for both <b>Account Registration</b> and <b>Account Deletion</b> using EmailJS.",
        styles['DocBody']
    ))

    otp_steps = [
        [Paragraph("Step", styles['TableHeader']), Paragraph("Process", styles['TableHeader']), Paragraph("Technical Implementation", styles['TableHeader'])],
        [
            Paragraph("<b>1. Pre-Check</b>", styles['TableCellBold']),
            Paragraph("Duplicate Email Validation", styles['TableCell']),
            Paragraph("Calls `POST /api/auth/check-email` before generating OTP to ensure the email is available and prevent wasted email API credits.", styles['TableCell'])
        ],
        [
            Paragraph("<b>2. OTP Generation</b>", styles['TableCellBold']),
            Paragraph("Cryptographic 6-Digit Code", styles['TableCell']),
            Paragraph("Generates `Math.floor(100000 + Math.random() * 900000)` with a strict 5-minute expiration timestamp (`Date.now() + 5*60*1000`).", styles['TableCell'])
        ],
        [
            Paragraph("<b>3. Email Dispatch</b>", styles['TableCellBold']),
            Paragraph("EmailJS Cloud Delivery", styles['TableCell']),
            Paragraph("Dispatches via `service_cineverse` using template `cineverse_auth_otp`. Passes `{ to_email, email, to_name, otp_code, expiry_minutes: '5' }`.", styles['TableCell'])
        ],
        [
            Paragraph("<b>4. Input Validation</b>", styles['TableCellBold']),
            Paragraph("Spaced Monospace Code", styles['TableCell']),
            Paragraph("Spaced monospace 6-digit input with real-time numeric regex filter, 60-second resend cooldown timer, and expiry verification.", styles['TableCell'])
        ],
        [
            Paragraph("<b>5. Persistence</b>", styles['TableCellBold']),
            Paragraph("Account Create / Delete", styles['TableCell']),
            Paragraph("On registration: executes `POST /api/auth/register`. On account deletion: executes `DELETE /api/auth/profile` and wipes all associated records.", styles['TableCell'])
        ],
    ]
    otp_table = Table(otp_steps, colWidths=[90, 130, 284])
    otp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(otp_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Mobile-Responsive HTML Email Template (`cineverse-otp-template.html`):", styles['DocH2']))
    story.append(Paragraph(
        "The email template was custom-built for email clients (including the Gmail app on Android and iOS): "
        "<br/>&bull; <b>100% Fluid Container:</b> Uses `width: 100% !important; max-width: 480px;` to eliminate horizontal scrollbars on mobile devices down to 320px."
        "<br/>&bull; <b>Cinema Red & Black Branding:</b> Rendered with `#070a10` background, `#0f1522` card body, and neon red `#e50914` glowing borders."
        "<br/>&bull; <b>Dark Mode Protection:</b> Incorporates CSS meta overrides (`color-scheme: dark only`) to prevent mobile clients from inverting dark themes into bright white."
        "<br/>&bull; <b>Data Detector Defense:</b> Prevents Apple Mail from styling the 6-digit verification code as an unclickable blue telephone link.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Danger Zone: Secure OTP-Verified Account Deletion", styles['DocH2']))
    story.append(Paragraph(
        "Under User Details, a designated Danger Zone allows users to permanently delete their CineVerse account. "
        "To prevent accidental loss or unauthorized takeover, the system sends a 6-digit deletion confirmation code to the user's verified email. "
        "Upon successful verification, `DELETE /api/auth/profile` wipes all watchlist entries, scheduled reminders, and the user record from MongoDB.",
        styles['DocBody']
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: DATABASE SCHEMA & DATA MODELING
    # =========================================================================
    story.append(Paragraph("4. Database Schema Design (MongoDB Atlas)", styles['DocH1']))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK, spaceBefore=0, spaceAfter=10))

    story.append(Paragraph("A. User Collection Schema (`server/models/User.js`)", styles['DocH2']))
    story.append(Paragraph(
        "Stores member credentials and profiles. Passwords are automatically hashed via a Mongoose pre-save hook using Bcrypt (10 rounds).",
        styles['DocBody']
    ))

    user_fields = [
        [Paragraph("Field", styles['TableHeader']), Paragraph("Type", styles['TableHeader']), Paragraph("Constraints / Description", styles['TableHeader'])],
        [Paragraph("`name`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Required, trimmed, max length 50.", styles['TableCell'])],
        [Paragraph("`email`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Required, unique index, lowercase, trimmed, validated via RFC email regex.", styles['TableCell'])],
        [Paragraph("`password`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Required, min 6 chars, `select: false` so hashes never leak in queries.", styles['TableCell'])],
        [Paragraph("`age`", styles['TableCellBold']), Paragraph("Number", styles['TableCell']), Paragraph("Optional integer (1–120). Used for 18+ content filtering.", styles['TableCell'])],
        [Paragraph("`avatar`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Base64 string of compressed 400x400 JPEG profile photo.", styles['TableCell'])],
        [Paragraph("`createdAt`", styles['TableCellBold']), Paragraph("Date", styles['TableCell']), Paragraph("Automatically recorded by Mongoose `{ timestamps: true }`.", styles['TableCell'])],
        [Paragraph("`updatedAt`", styles['TableCellBold']), Paragraph("Date", styles['TableCell']), Paragraph("Automatically updated on profile changes.", styles['TableCell'])],
    ]
    user_table = Table(user_fields, colWidths=[80, 75, 349])
    user_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(user_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("B. Watchlist Collection Schema (`server/models/Watchlist.js`)", styles['DocH2']))
    story.append(Paragraph(
        "Stores bookmarked movies, watch states, and reminder data. Uses a <b>compound unique index on `{ userId: 1, tmdbId: 1 }`</b> "
        "to prevent duplicate entries per user while providing fast index lookups.",
        styles['DocBody']
    ))

    wl_fields = [
        [Paragraph("Field", styles['TableHeader']), Paragraph("Type", styles['TableHeader']), Paragraph("Constraints / Description", styles['TableHeader'])],
        [Paragraph("`userId`", styles['TableCellBold']), Paragraph("ObjectId", styles['TableCell']), Paragraph("Ref to `User` model, indexed, required.", styles['TableCell'])],
        [Paragraph("`tmdbId`", styles['TableCellBold']), Paragraph("Number", styles['TableCell']), Paragraph("TMDB Movie ID, required.", styles['TableCell'])],
        [Paragraph("`title`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Cached movie title for zero-latency rendering.", styles['TableCell'])],
        [Paragraph("`posterPath`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Relative TMDB image path for primary poster.", styles['TableCell'])],
        [Paragraph("`backdropPath`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Relative TMDB image path for backdrop fallback.", styles['TableCell'])],
        [Paragraph("`releaseDate`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Movie release date (formatted DD/MM/YYYY).", styles['TableCell'])],
        [Paragraph("`voteAverage`", styles['TableCellBold']), Paragraph("Number", styles['TableCell']), Paragraph("TMDB audience rating score (0.0 to 10.0).", styles['TableCell'])],
        [Paragraph("`status`", styles['TableCellBold']), Paragraph("String", styles['TableCell']), Paragraph("Enum: `'Planned to Watch'`, `'Currently Watching'`, `'Watched'`.", styles['TableCell'])],
        [Paragraph("`reminder`", styles['TableCellBold']), Paragraph("Object", styles['TableCell']), Paragraph("Sub-document: `{ date: Date, time: String, note: String, active: Boolean }`.", styles['TableCell'])],
    ]
    wl_table = Table(wl_fields, colWidths=[80, 75, 349])
    wl_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(wl_table)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: COMPLETE REST API SPECIFICATIONS & OPERATIONS
    # =========================================================================
    story.append(Paragraph("5. Complete REST API Specifications", styles['DocH1']))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        "Base URL: `https://cineverse-api-seven.vercel.app/api`. Protected endpoints require `Authorization: Bearer <jwt_token>`.",
        styles['DocBody']
    ))

    api_routes = [
        [Paragraph("Method", styles['TableHeader']), Paragraph("Endpoint", styles['TableHeader']), Paragraph("Auth", styles['TableHeader']), Paragraph("Description", styles['TableHeader'])],
        [Paragraph("GET", styles['TableCellBold']), Paragraph("/health", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Verifies API uptime and database connectivity.", styles['TableCell'])],
        [Paragraph("POST", styles['TableCellBold']), Paragraph("/auth/check-email", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Validates if an email is already registered before OTP dispatch.", styles['TableCell'])],
        [Paragraph("POST", styles['TableCellBold']), Paragraph("/auth/register", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Creates user account, returns JWT token & profile.", styles['TableCell'])],
        [Paragraph("POST", styles['TableCellBold']), Paragraph("/auth/login", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Authenticates credentials, returns signed JWT token.", styles['TableCell'])],
        [Paragraph("GET", styles['TableCellBold']), Paragraph("/auth/me", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Fetches logged-in user profile from verified token.", styles['TableCell'])],
        [Paragraph("PATCH", styles['TableCellBold']), Paragraph("/auth/profile", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Updates user name, email, age, and avatar photo.", styles['TableCell'])],
        [Paragraph("DELETE", styles['TableCellBold']), Paragraph("/auth/profile", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Permanently deletes user account and all watchlist records.", styles['TableCell'])],
        [Paragraph("GET", styles['TableCellBold']), Paragraph("/movies/trending", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Fetches real-time trending movies from TMDB.", styles['TableCell'])],
        [Paragraph("GET", styles['TableCellBold']), Paragraph("/movies/search", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Searches TMDB catalogue by movie title or actor.", styles['TableCell'])],
        [Paragraph("GET", styles['TableCellBold']), Paragraph("/movies/:id", styles['TableCell']), Paragraph("Public", styles['TableCell']), Paragraph("Fetches comprehensive movie details, genres, & runtime.", styles['TableCell'])],
        [Paragraph("GET", styles['TableCellBold']), Paragraph("/watchlist", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Retrieves all movies bookmarked by the authenticated user.", styles['TableCell'])],
        [Paragraph("POST", styles['TableCellBold']), Paragraph("/watchlist", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Adds a movie to the user's watchlist.", styles['TableCell'])],
        [Paragraph("PATCH", styles['TableCellBold']), Paragraph("/watchlist/:tmdbId/status", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Updates watch status ('Planned', 'Watching', 'Watched').", styles['TableCell'])],
        [Paragraph("PATCH", styles['TableCellBold']), Paragraph("/watchlist/:tmdbId/reminder", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Schedules or updates movie watch reminder calendar & time.", styles['TableCell'])],
        [Paragraph("DELETE", styles['TableCellBold']), Paragraph("/watchlist/:tmdbId", styles['TableCell']), Paragraph("JWT", styles['TableCell']), Paragraph("Removes a movie from the user's watchlist.", styles['TableCell'])],
    ]
    api_table = Table(api_routes, colWidths=[52, 138, 44, 270])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(api_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("6. Deployment Configuration & Environment Variables", styles['DocH1']))
    story.append(HRFlowable(width="100%", thickness=1, color=DARK, spaceBefore=0, spaceAfter=8))

    env_data = [
        [Paragraph("Project", styles['TableHeader']), Paragraph("Environment Variable", styles['TableHeader']), Paragraph("Purpose & Value", styles['TableHeader'])],
        [Paragraph("Frontend (`cineverse`)", styles['TableCellBold']), Paragraph("`VITE_API_URL`", styles['TableCell']), Paragraph("Backend URL (`https://cineverse-api-seven.vercel.app/api`).", styles['TableCell'])],
        [Paragraph("Frontend (`cineverse`)", styles['TableCellBold']), Paragraph("`VITE_EMAILJS_SERVICE_ID`", styles['TableCell']), Paragraph("Connected service ID (`service_cineverse`).", styles['TableCell'])],
        [Paragraph("Frontend (`cineverse`)", styles['TableCellBold']), Paragraph("`VITE_EMAILJS_TEMPLATE_ID`", styles['TableCell']), Paragraph("Template ID (`cineverse_auth_otp`).", styles['TableCell'])],
        [Paragraph("Frontend (`cineverse`)", styles['TableCellBold']), Paragraph("`VITE_EMAILJS_PUBLIC_KEY`", styles['TableCell']), Paragraph("Account public key (`-NZ5ZGoHWoNhhMb6W`).", styles['TableCell'])],
        [Paragraph("Backend (`cineverse-api`)", styles['TableCellBold']), Paragraph("`MONGODB_URI`", styles['TableCell']), Paragraph("MongoDB Atlas connection string with replica set cluster.", styles['TableCell'])],
        [Paragraph("Backend (`cineverse-api`)", styles['TableCellBold']), Paragraph("`JWT_SECRET`", styles['TableCell']), Paragraph("Cryptographic signature key for JSON Web Tokens.", styles['TableCell'])],
        [Paragraph("Backend (`cineverse-api`)", styles['TableCellBold']), Paragraph("`TMDB_API_KEY`", styles['TableCell']), Paragraph("API Key for authenticating requests with TMDB v3 API.", styles['TableCell'])],
    ]
    env_table = Table(env_data, colWidths=[110, 160, 234])
    env_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG])
    ]))
    story.append(env_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename}")


if __name__ == '__main__':
    output_path = r"d:\Internship Project\CineVerse_Project_Documentation.pdf"
    build_pdf(output_path)
