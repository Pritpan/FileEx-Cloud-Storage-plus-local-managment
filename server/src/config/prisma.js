// =============================================================================
// src/config/prisma.js — Prisma Client Singleton
//
// Exports a single shared PrismaClient instance for the entire application.
//
// Why a singleton?
//   PrismaClient manages a connection pool to the database. Instantiating it
//   multiple times (once per module) would open multiple pools, wasting
//   connections and potentially hitting MySQL's max_connections limit.
//   A singleton guarantees one pool for the entire process lifetime.
//
// Why globalThis in development?
//   nodemon restarts the Node.js process on file changes. However, in some
//   environments (e.g., Next.js), module caches can persist across hot reloads,
//   causing multiple PrismaClient instances to accumulate.
//   Attaching the instance to globalThis prevents this in any runtime.
//   In production, NODE_ENV === 'production' skips the globalThis assignment
//   since module caching is stable and globalThis is unnecessary.
//
// Usage:
//   import prisma from '@/config/prisma.js';   ← repositories only
//   Never import PrismaClient directly in services or controllers.
// =============================================================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
