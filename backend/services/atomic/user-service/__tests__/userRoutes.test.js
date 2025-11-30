const path = require('path');
/**
 * Integration Tests for User Service
 */

const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const { cleanupDatabase, createTestUser } = require(path.join(__dirname, '../../../../shared/tests/helpers/testHelpers');
const { db } = require(path.join(__dirname, '../../../../shared/utils/db');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Service Integration Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await db.$disconnect();
  });

  describe('GET /api/users/getallusers', () => {
    it('should return all users', async () => {
      // Create test users
      await createTestUser({ username: 'user1' });
      await createTestUser({ username: 'user2' });
      await createTestUser({ username: 'user3' });

      const response = await request(app)
        .get('/api/users/getallusers')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      // Create multiple users
      for (let i = 0; i < 25; i++) {
        await createTestUser({ username: `user${i}` });
      }

      const response = await request(app)
        .get('/api/users/getallusers')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.users.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('cursor');
    });
  });

  describe('GET /api/users/:userID', () => {
    it('should return user by ID', async () => {
      const user = await createTestUser({ username: 'testuser' });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', user.id);
      expect(response.body).toHaveProperty('username', 'testuser');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/users/batch', () => {
    it('should return multiple users by IDs', async () => {
      const user1 = await createTestUser({ username: 'user1' });
      const user2 = await createTestUser({ username: 'user2' });
      const user3 = await createTestUser({ username: 'user3' });

      const response = await request(app)
        .post('/api/users/batch')
        .send({ userIds: [user1.id, user2.id, user3.id] })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.users.length).toBe(3);
    });

    it('should handle empty user IDs array', async () => {
      const response = await request(app)
        .post('/api/users/batch')
        .send({ userIds: [] })
        .expect(200);

      expect(response.body.users).toEqual([]);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on public endpoints', async () => {
      const user = await createTestUser();

      // Make requests up to the limit
      for (let i = 0; i < 500; i++) {
        await request(app)
          .get(`/api/users/${user.id}`)
          .expect(200);
      }

      // Next request should be rate limited
      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(429);

      expect(response.body.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
    }, 60000); // Increase timeout for this test
  });

  describe('Input Validation', () => {
    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users/getallusers')
        .query({ limit: -1 }) // Invalid limit
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate limit parameter range', async () => {
      const response = await request(app)
        .get('/api/users/getallusers')
        .query({ limit: 1000 }) // Exceeds max limit
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});
