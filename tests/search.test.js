const request = require('supertest');
const app = require('../server'); // Adjust if needed

describe('GET /jobs/search', () => {
  it('returns jobs that match the keyword', async () => {
    const res = await request(app).get('/jobs/search?keyword=developer');
    expect(res.statusCode).toBe(200);
    expect(res.body.jobs.length).toBeGreaterThan(0);
    res.body.jobs.forEach(job => {
      expect(
        job.title.toLowerCase().includes('developer') ||
        job.description.toLowerCase().includes('developer')
      ).toBe(true);
    });
  });
});

// ✅ Close MongoDB connection after tests to prevent Jest hanging
afterAll(async () => {
  const mongoose = require('mongoose');
  await mongoose.connection.close();
});

