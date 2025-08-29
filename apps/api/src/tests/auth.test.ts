import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import { UserModel } from '../models/user';

describe('Authentication API', () => {
  let server: any;
  let testUser = {
    email: 'test@shipnorth.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
  };

  beforeAll(async () => {
    server = app.listen(4001);
    // Clean up test user if exists
    try {
      const existing = await UserModel.findByEmail(testUser.email);
      if (existing) {
        await UserModel.delete(existing.id);
      }
    } catch (e) {}
  });

  afterAll(async () => {
    // Clean up test user
    try {
      const user = await UserModel.findByEmail(testUser.email);
      if (user) {
        await UserModel.delete(user.id);
      }
    } catch (e) {}
    server.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app).post('/auth/register').send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register duplicate email', async () => {
      const response = await request(app).post('/auth/register').send(testUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app).post('/auth/register').send({ email: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject invalid password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token', async () => {
      // First login to get tokens
      const loginResponse = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      const refreshToken = loginResponse.body.refreshToken;

      // Now refresh
      const response = await request(app).post('/auth/refresh').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('Protected Routes', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = response.body.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/packages')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/packages');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/packages')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
