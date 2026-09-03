import { expect, describe, it, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { hashToken } from '../src/modules/auth/token.service.js';

describe('Email Verification Flow', () => {
  let server;
  let testUserEmail = 'testverify@example.com';
  let testUserId = null;
  let customRawToken = 'test-token-123456';
  let customTokenHash = hashToken(customRawToken);

  beforeAll((done) => {
    process.env.NODE_ENV = 'test'; // Ensure email service bypasses sending
    server = app.listen(4002, () => done());
  });

  afterAll(async () => {
    server.close();
    await prisma.user.deleteMany({ where: { email: testUserEmail } });
    await prisma.$disconnect();
  });

  it('1. Registration creates an unverified account', async () => {
    const response = await request(server).post('/api/v1/auth/register').send({
      name: 'Test Verify',
      email: testUserEmail,
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.emailVerified).toBe(false);
    expect(response.body.data.accessToken).toBeUndefined(); // No login on register

    testUserId = response.body.data.user.id;
  });

  it('2. Unverified user cannot log in', async () => {
    const response = await request(server).post('/api/v1/auth/login').send({
      email: testUserEmail,
      password: 'password123',
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('3. Invalid token fails verification', async () => {
    const response = await request(server).get('/api/v1/auth/verify-email?token=invalid123');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('4. Resend deletes old tokens and generates a new one', async () => {
    // Initial token should exist from registration
    let tokensCount = await prisma.emailVerificationToken.count({ where: { userId: testUserId } });
    expect(tokensCount).toBe(1);

    const response = await request(server).post('/api/v1/auth/resend-verification').send({
      email: testUserEmail,
    });

    expect(response.status).toBe(200);

    // Old token should be deleted, new one created -> count remains 1 but it's a new record
    tokensCount = await prisma.emailVerificationToken.count({ where: { userId: testUserId } });
    expect(tokensCount).toBe(1);
  });

  it('5. Valid token verifies account', async () => {
    // Inject a known token into the DB to test verification endpoint
    await prisma.emailVerificationToken.create({
      data: {
        userId: testUserId,
        tokenHash: customTokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // +1 hour
      }
    });

    const response = await request(server).get(`/api/v1/auth/verify-email?token=${customRawToken}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/verified/i);
    
    // Check DB
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user.emailVerified).toBe(true);
  });

  it('6. Used token cannot be reused', async () => {
    const response = await request(server).get(`/api/v1/auth/verify-email?token=${customRawToken}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('TOKEN_ALREADY_USED');
  });

  it('7. Verified user can now log in', async () => {
    const response = await request(server).post('/api/v1/auth/login').send({
      email: testUserEmail,
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.emailVerified).toBe(true);
  });

  it('8. Already verified user requesting resend gets generic success', async () => {
    const response = await request(server).post('/api/v1/auth/resend-verification').send({
      email: testUserEmail,
    });

    expect(response.status).toBe(200);
  });
});

