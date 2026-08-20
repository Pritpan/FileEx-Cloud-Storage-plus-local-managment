
import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[server] Fileex API running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[server] Health check: http://localhost:${PORT}/health`);
});
