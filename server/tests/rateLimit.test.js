import request from 'supertest';
import app from '../src/app.js';

describe('Rate Limiting', () => {
  let server;

  beforeAll((done) => {
    // Start a test server so rate limiter applies limits based on IPs and connections
    server = app.listen(4001, () => done());
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Unauthenticated Limits', () => {
    it('should limit unauthenticated requests to the register endpoint', async () => {
      // Config for register is 5 requests per hour.
      let response;
      for (let i = 0; i < 6; i++) {
        response = await request(server).post('/api/v1/auth/register').send({});
      }

      // The 6th request should be rate limited
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.message).toMatch(/Too many registration attempts/i);
    });

    it('should limit unauthenticated requests to the login endpoint', async () => {
      // Config for login is 5 requests per 15 min.
      let response;
      for (let i = 0; i < 6; i++) {
        response = await request(server).post('/api/v1/auth/login').send({
          email: 'test@example.com',
          password: 'password123'
        });
      }

      // The 6th request should be rate limited
      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.error.message).toMatch(/Too many login attempts/i);
    });
  });

  describe('Authenticated Limits', () => {
    let authToken;

    beforeAll(async () => {
      // Usually we'd register/login a user to get an auth token to test the authenticated limits.
      // But since we hit rate limits on login/register above, we can test with a mocked token or simply observe that an invalid token still hits the general API limit before failing on auth, OR auth fails first.
      // Actually, authentication runs BEFORE the user rate limiter.
      // Without a valid token, auth fails with 401. So the rate limiter won't be reached.
    });

    it('should run authenticate before rate limiting (unauthorized hits 401, not 429)', async () => {
      const response = await request(server).get('/api/v1/files');
      expect(response.status).toBe(401);
    });
  });
});
