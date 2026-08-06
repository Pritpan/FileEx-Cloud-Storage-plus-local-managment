// =============================================================================
// app.js — Express application setup
//
// Responsibilities:
//   - Create the Express app instance
//   - Register global middleware (body parsers only at this stage)
//   - Export the app for use in server.js and tests
//
// What does NOT live here:
//   - dotenv loading  → server.js (must happen before anything else)
//   - HTTP server     → server.js
//   - Route mounting  → registered below, one import per module
//   - Error handler   → added when first route is wired
// =============================================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes  from './modules/auth/auth.routes.js';
import fileRoutes  from './modules/files/index.js';

const app = express();

// ---------------------------------------------------------------------------
// CORS
// Must be registered before any routes.
// `credentials: true` is required for the browser to send the HttpOnly
// refresh token cookie on cross-origin requests.
// ---------------------------------------------------------------------------
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : [];
    
    // Allow any localhost or 127.0.0.1 origin for local development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ---------------------------------------------------------------------------
// Body Parsers
// ---------------------------------------------------------------------------

// Parse incoming JSON request bodies.
// Sets req.body for Content-Type: application/json requests.
app.use(express.json());

// Parse cookies (e.g. HttpOnly refresh tokens)
app.use(cookieParser());

// Parse URL-encoded form data (e.g., HTML form submissions).
// extended: false uses the native querystring library — sufficient for this app.
app.use(express.urlencoded({ extended: false }));

// ---------------------------------------------------------------------------
// Health Check
// A minimal endpoint to confirm the server is alive.
// Will be replaced by a proper health module in a later chunk.
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'fileex-server' });
});

// ---------------------------------------------------------------------------
// API Routes — v1
// Each module is mounted as it is implemented.
// ---------------------------------------------------------------------------
app.use('/api/v1/auth',  authRoutes);
app.use('/api/v1/files', fileRoutes);

export default app;
