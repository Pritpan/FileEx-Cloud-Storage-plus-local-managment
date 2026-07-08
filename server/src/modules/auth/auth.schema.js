// =============================================================================
// auth.schema.js — Validation schemas for the Auth module
// =============================================================================

import { z } from 'zod';

// -----------------------------------------------------------------------------
// RegisterSchema — POST /api/v1/auth/register
// -----------------------------------------------------------------------------
export const RegisterSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(3, 'Name must be at least 3 characters.')
    .max(100, 'Name must not exceed 100 characters.'),

  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must not exceed 100 characters.'),
});

// -----------------------------------------------------------------------------
// LoginSchema — POST /api/v1/auth/login
// -----------------------------------------------------------------------------
export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

// -----------------------------------------------------------------------------
// RefreshSchema — POST /api/v1/auth/refresh
// -----------------------------------------------------------------------------
export const RefreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required.' })
    .min(1, 'Refresh token is required.'),
});
