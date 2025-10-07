const request = require("supertest");

// `tests/setup.js` handles starting/stopping the in-memory MongoDB,
// connecting mongoose, and exposing `global.app`.
// So here we just use `global.app` in tests.

describe("POST /api/auth/register", () => {
  test("registers a new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        fullName: { firstName: "Test", lastName: "User" },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.password).toBeUndefined(); // password should not be returned
  });

  test("returns 409 for duplicate email/username", async () => {
    // create first
    await request(app)
      .post("/api/auth/register")
      .send({
        username: "dupuser",
        email: "dup@example.com",
        password: "password123",
        fullName: { firstName: "Dup", lastName: "User" },
      });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "dupuser",
        email: "dup@example.com",
        password: "password456",
        fullName: { firstName: "Dup", lastName: "User" },
      });

    expect(res.statusCode).toBe(409);
  });

  test("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "incomplete" });

    expect(res.statusCode).toBe(400);
  });
});
