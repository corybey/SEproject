const request = require("supertest");
const app = require("../app");
const path = require("path");
const mongoose = require("mongoose");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Job Application Upload and Tracking", () => {
  let applicationId;

  test("should allow resume upload and job application", async () => {
    const res = await request(app)
      .post("/api/apply")
      .field("user_id", "user_test_1")
      .field("job_id", "job_test_1")
      .attach("resume", path.join(__dirname, "dummy_resume.pdf"));

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("user_id", "user_test_1");
    expect(res.body).toHaveProperty("job_id", "job_test_1");
    applicationId = res.body._id;
  }, 10000);

  test("should return applications for a user", async () => {
    const res = await request(app).get("/api/user/user_test_1/applications");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});






