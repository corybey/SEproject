const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

let userId;
let companyId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("User Profile CRUD", () => {
  test("should create a new user", async () => {
    const res = await request(app).post("/api/profile/user").send({
      name: "Kevin Test",
      email: "kevin@example.com"
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Kevin Test");
    userId = res.body._id;
  });

  test("should update user", async () => {
    const res = await request(app).put(`/api/profile/user/${userId}`).send({
      name: "Kevin Updated"
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Kevin Updated");
  });

  test("should delete user", async () => {
    const res = await request(app).delete(`/api/profile/user/${userId}`);
    expect(res.statusCode).toBe(204);
  });
});

describe("Company Profile CRUD", () => {
  test("should create a company", async () => {
    const res = await request(app).post("/api/profile/company").send({
      name: "Test Company",
      description: "A test company",
      industry: "Tech"
    });
    expect(res.statusCode).toBe(201);
    companyId = res.body._id;
  });

  test("should update company", async () => {
    const res = await request(app).put(`/api/profile/company/${companyId}`).send({
      name: "Updated Company"
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Updated Company");
  });

  test("should delete company", async () => {
    const res = await request(app).delete(`/api/profile/company/${companyId}`);
    expect(res.statusCode).toBe(204);
  });
});



