const request = require("supertest");
const mongoose = require("mongoose");
const userModel = require("../src/models/user.model");

// tests/setup.js provides global.app and the in-memory DB

describe("POST /api/auth/login", () => {
  test("logs in an existing user with correct credentials", async () => {
    // create a user directly in DB
    const password = "mypassword";
    const hashed = require("bcryptjs").hashSync(password, 10);
    const user = await userModel.create({
      username: "loginuser",
      email: "login@example.com",
      password: hashed,
      fullName: { firstName: "Log", lastName: "In" },
    });

    const res = await request(global.app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("login@example.com");
    // cookie should be set
    const cookies = res.headers["set-cookie"] || res.headers["cookie"];
    expect(cookies).toBeDefined();
  });

  test("returns 401 for wrong password", async () => {
    const password = "rightpass";
    const hashed = require("bcryptjs").hashSync(password, 10);
    await userModel.create({
      username: "user2",
      email: "user2@example.com",
      password: hashed,
      fullName: { firstName: "U", lastName: "Two" },
    });

    const res = await request(global.app)
      .post("/api/auth/login")
      .send({ email: "user2@example.com", password: "wrongpass" });

    expect(res.statusCode).toBe(401);
  });

  test("returns 400 when fields are missing", async () => {
    const res = await request(global.app)
      .post("/api/auth/login")
      .send({ email: "no-pass@example.com" });

    expect(res.statusCode).toBe(400);
  });
});
