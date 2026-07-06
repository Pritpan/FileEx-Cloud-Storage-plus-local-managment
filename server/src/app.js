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
import authRoutes from './modules/auth/auth.routes.js';

const app = express();

// ---------------------------------------------------------------------------
// Body Parsers
// ---------------------------------------------------------------------------

// Parse incoming JSON request bodies.
// Sets req.body for Content-Type: application/json requests.
app.use(express.json());

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
app.use('/api/v1/auth', authRoutes);

export default app;
