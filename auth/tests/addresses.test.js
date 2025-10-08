const request = require("supertest");
const jwt = require("jsonwebtoken");
const userModel = require("../src/models/user.model");

describe("Addresses API", () => {
  test("GET /api/auth/users/me/addresses returns 401 when no token", async () => {
    const res = await request(global.app).get("/api/auth/users/me/addresses");
    expect(res.statusCode).toBe(401);
  });

  test("GET returns empty array for new user with valid token", async () => {
    const hashed = require("bcryptjs").hashSync("pass", 10);
    const user = await userModel.create({
      username: "addruser",
      email: "addr@example.com",
      password: hashed,
      fullName: { firstName: "Addr", lastName: "User" },
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
      .get("/api/auth/users/me/addresses")
      .set("Cookie", `token=${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses.length).toBe(0);
  });

  test("POST adds an address when token is valid", async () => {
    const hashed = require("bcryptjs").hashSync("pass2", 10);
    const user = await userModel.create({
      username: "addruser2",
      email: "addr2@example.com",
      password: hashed,
      fullName: { firstName: "Addr2", lastName: "User2" },
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

    const newAddress = {
      street: "123 Test St",
      city: "Testville",
      state: "TS",
      pincode: "12345",
      country: "Testland",
    };

    const res = await request(global.app)
      .post("/api/auth/users/me/addresses")
      .set("Cookie", `token=${token}`)
      .send(newAddress);

    expect(res.statusCode).toBe(201);
    expect(res.body.address).toBeDefined();
    expect(res.body.address.street).toBe(newAddress.street);
  });

  test("POST returns 400 when fields are missing", async () => {
    const hashed = require("bcryptjs").hashSync("pass3", 10);
    const user = await userModel.create({
      username: "addruser3",
      email: "addr3@example.com",
      password: hashed,
      fullName: { firstName: "Addr3", lastName: "User3" },
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
      .post("/api/auth/users/me/addresses")
      .set("Cookie", `token=${token}`)
      .send({ street: "only street" });

    expect(res.statusCode).toBe(400);
  });

  test("DELETE removes an existing address", async () => {
    const hashed = require("bcryptjs").hashSync("pass4", 10);
    const user = await userModel.create({
      username: "addruser4",
      email: "addr4@example.com",
      password: hashed,
      fullName: { firstName: "Addr4", lastName: "User4" },
      addresses: [
        {
          street: "1 A St",
          city: "A",
          state: "AA",
          zip: "00001",
          country: "C",
        },
      ],
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

    // ensure address exists
    const addressId = user.addresses[0]._id.toString();

    const res = await request(global.app)
      .delete(`/api/auth/users/me/addresses/${addressId}`)
      .set("Cookie", `token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Address removed successfully");
  });

  test("DELETE returns 404 when address not found", async () => {
    const hashed = require("bcryptjs").hashSync("pass5", 10);
    const user = await userModel.create({
      username: "addruser5",
      email: "addr5@example.com",
      password: hashed,
      fullName: { firstName: "Addr5", lastName: "User5" },
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

    const fakeId = "000000000000000000000000";

    const res = await request(global.app)
      .delete(`/api/auth/users/me/addresses/${fakeId}`)
      .set("Cookie", `token=${token}`);

    expect(res.statusCode).toBe(404);
  });
});
