// =============================================================================
// server.js — HTTP server entry point
//
// Responsibilities:
//   1. Load environment variables (must be first)
//   2. Import the configured Express app
//   3. Start the HTTP server on the configured PORT
//
// What does NOT live here:
//   - Middleware configuration → app.js
//   - Route definitions        → feature modules
//   - Business logic           → service layer
// =============================================================================

import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[server] Fileex API running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[server] Health check: http://localhost:${PORT}/health`);
});
