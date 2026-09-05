import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes.js';
import fileRoutes from './modules/files/index.js';
import storageRoutes from './modules/storage/index.js';

const app = express();

// Trust the first proxy in front of Express (e.g. NGINX, ALB, Heroku) 
// This is critical for IP-based rate limiting to function correctly and securely
app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    // Electron packaged apps make requests from file:// which results in a
    // null/undefined origin. We allow this explicitly for the desktop client.
    if (!origin) return callback(null, true);

    // All allowed origins come from the CLIENT_ORIGIN environment variable.
    // Use a comma-separated list for multiple origins:
    //   CLIENT_ORIGIN=https://fileex-web.vercel.app,https://fileex-preview.vercel.app
    const allowedOrigins = process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
      : [];

    const isLocalhost =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');

    if (
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && isLocalhost)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'fileex-server' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/storage', storageRoutes);

export default app;
