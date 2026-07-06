// =============================================================================
// auth.schema.js — Validation schemas for the Auth module
//
// Responsibility: Define the shape and rules for incoming request data.
//
// These schemas are the single source of truth for what the auth endpoints
// accept. They are used by the validation middleware (added in the next chunk)
// and document the API contract in code.
//
// Nothing in this file touches the database, hashes passwords, or calls
// any service. It only describes what valid input looks like.
//
// See: docs/API_SPEC.md — POST /auth/register
// =============================================================================

import { z } from 'zod';

// -----------------------------------------------------------------------------
// RegisterSchema
//
// Validates the request body for POST /api/v1/auth/register.
//
// Rules:
//   name           — Required. 3–100 characters. Leading/trailing whitespace removed.
//   email          — Required. Must be a valid email format. Lowercased and trimmed.
//   password       — Required. 8–100 characters. Not transformed (hashed in service).
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
