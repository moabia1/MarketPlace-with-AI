const request = require("supertest");
const jwt = require("jsonwebtoken");
const userModel = require("../src/models/user.model");
const redis = require("../src/db/redis");

describe("GET /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("logs out a user when token cookie is present and blacklists the token", async () => {
    // create a user directly in DB
    const password = "logoutpass";
    const hashed = require("bcryptjs").hashSync(password, 10);
    const user = await userModel.create({
      username: "logoutuser",
      email: "logout@example.com",
      password: hashed,
      fullName: { firstName: "Log", lastName: "Out" },
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
      .get("/api/auth/logout")
      .set("Cookie", `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logout successfully");

    // redis.set should have been called to blacklist the token
    expect(redis.set).toHaveBeenCalledWith(
      `blacklist:${token}`,
      "true",
      "EX",
      24 * 60 * 60
    );

    // cookie cleared - supertest exposes "set-cookie" header only when set, but clearCookie sets Set-Cookie too
    const setCookie = res.headers["set-cookie"] || res.headers["cookie"];
    expect(setCookie).toBeDefined();
  });

  test("returns 200 even when no token cookie is present", async () => {
    const res = await request(global.app).get("/api/auth/logout");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logout successfully");
    // redis.set should not be called in this case
    expect(redis.set).not.toHaveBeenCalled();
  });
});
