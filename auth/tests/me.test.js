const request = require("supertest");
const jwt = require("jsonwebtoken");
const userModel = require("../src/models/user.model");

// tests/setup.js provides global.app and the in-memory DB

describe("GET /api/auth/me", () => {
  test("returns current user when token cookie is valid", async () => {
    // create a user directly in DB
    const password = "me-pass";
    const hashed = require("bcryptjs").hashSync(password, 10);
    const user = await userModel.create({
      username: "meuser",
      email: "me@example.com",
      password: hashed,
      fullName: { firstName: "Me", lastName: "User" },
    });

    const secret = process.env.JWT_SECRET || "testsecret";
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: "1d" }
    );

    const res = await request(global.app)
      .get("/api/auth/me")
      .set("Cookie", `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("me@example.com");
    // password should not be returned in the response
    expect(res.body.user.password).toBeUndefined();
  });

  test("returns 401 when token cookie is missing", async () => {
    const res = await request(global.app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  test("returns 401 when token is invalid", async () => {
    const res = await request(global.app)
      .get("/api/auth/me")
      .set("Cookie", "token=invalid.token.value");

    expect(res.statusCode).toBe(401);
  });
});
