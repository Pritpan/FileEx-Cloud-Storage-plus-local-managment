import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required.' })
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  password: z
    .string({ error: 'Password is required.' })
    .min(1, { message: 'Password is required.' }),
});
