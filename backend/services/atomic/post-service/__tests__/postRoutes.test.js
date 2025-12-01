/**
 * Integration Tests for Post Service
 */

const request = require('supertest');
const express = require('express');
const postRoutes = require('../routes/postRoutes');
const { cleanupDatabase, createTestUser, createTestPost } = require('/app/shared/tests/helpers/testHelpers');
const { db } = require('/app/shared/utils/db');

// Create test app
const app = express();
app.use(express.json());
app.use('/api', postRoutes);

describe('Post Service Integration Tests', () => {
  let testUser;

  beforeEach(async () => {
    await cleanupDatabase();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await db.$disconnect();
  });

  describe('GET /api/allposts', () => {
    it('should return all public posts', async () => {
      // Create test posts
      await createTestPost(testUser.id, { name: 'Public Route 1', isPublic: true });
      await createTestPost(testUser.id, { name: 'Public Route 2', isPublic: true });
      await createTestPost(testUser.id, { name: 'Private Route', isPublic: false });

      const response = await request(app)
        .get('/api/allposts')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
      // Should only return public posts
      const publicPosts = response.body.posts.filter((p) => p.isPublic);
      expect(publicPosts.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      // Create multiple posts
      for (let i = 0; i < 25; i++) {
        await createTestPost(testUser.id, { name: `Route ${i}` });
      }

      const response = await request(app)
        .get('/api/allposts')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.posts.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('cursor');
    });
  });

  describe('GET /api/posts', () => {
    it('should return post by ID', async () => {
      const post = await createTestPost(testUser.id, { name: 'Test Route' });

      const response = await request(app)
        .get('/api/posts')
        .query({ postId: post.id })
        .expect(200);

      expect(response.body).toHaveProperty('id', post.id);
      expect(response.body).toHaveProperty('name', 'Test Route');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ postId: '550e8400-e29b-41d4-a716-446655440000' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('GET /api/users/:userID/posts', () => {
    it('should return all posts for a user', async () => {
      await createTestPost(testUser.id, { name: 'Route 1' });
      await createTestPost(testUser.id, { name: 'Route 2' });
      await createTestPost(testUser.id, { name: 'Route 3' });

      const response = await request(app)
        .get(`/api/users/${testUser.id}/posts`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body.posts.length).toBe(3);
    });

    it('should return empty array for user with no posts', async () => {
      const anotherUser = await createTestUser({ username: 'nopostuser' });

      const response = await request(app)
        .get(`/api/users/${anotherUser.id}/posts`)
        .expect(200);

      expect(response.body.posts).toEqual([]);
    });
  });

  describe('Input Validation', () => {
    it('should validate postId format', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ postId: 'invalid-uuid' })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details[0]).toHaveProperty('field', 'postId');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/allposts')
        .query({ limit: -5 })
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Create 100 posts
      const posts = [];
      for (let i = 0; i < 100; i++) {
        posts.push(createTestPost(testUser.id, { name: `Route ${i}` }));
      }
      await Promise.all(posts);

      const start = Date.now();
      const response = await request(app)
        .get('/api/allposts')
        .query({ limit: 20 })
        .expect(200);
      const duration = Date.now() - start;

      expect(response.body.posts.length).toBe(20);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
