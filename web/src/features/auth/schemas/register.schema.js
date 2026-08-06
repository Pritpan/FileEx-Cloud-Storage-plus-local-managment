import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string({ error: 'Full name is required.' })
      .min(1, { message: 'Full name is required.' })
      .max(100, { message: 'Name is too long.' }),
    email: z
      .string({ error: 'Email is required.' })
      .min(1, { message: 'Email is required.' })
      .email({ message: 'Please enter a valid email address.' }),
    password: z
      .string({ error: 'Password is required.' })
      .min(8, { message: 'Password must be at least 8 characters.' }),
    confirmPassword: z
      .string({ error: 'Please confirm your password.' })
      .min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
