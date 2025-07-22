const request = require('supertest');
const app = require('../src/app'); // adjust path if needed

describe('Auth Flow', () => {
  test('User registers successfully', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser', password: 'pass123' });

    expect(res.statusCode).toBe(201);
  });

  test('User registration fails with missing data', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: '' });

    expect(res.statusCode).toBe(400);
  });

  test('User logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'pass123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('User login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
  });
});

