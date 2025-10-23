const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// mock axios
jest.mock("axios");
const axios = require("axios");

const jwt = require("jsonwebtoken");

let mongoServer;
let app;
let Order;

describe("POST /api/orders (with in-memory MongoDB)", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // now require the app and model after mongoose is connected
    app = require("../src/app");
    Order = require("../src/models/order.model");
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    process.env.JWT_SECRET = "testsecret";

    // default jwt verify mock for authenticated tests
    jest
      .spyOn(jwt, "verify")
      .mockImplementation(() => ({
        id: mongoose.Types.ObjectId().toString(),
        role: "user",
      }));

    // clear database
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  test("creates order successfully and returns 201", async () => {
    const userId = mongoose.Types.ObjectId().toString();
    jwt.verify.mockImplementation(() => ({ id: userId, role: "user" }));

    // mock cart service response
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: { cart: { items: [{ productId: "p1", quantity: 2 }] } },
        });
      }
      if (url.includes("/api/products/p1")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "p1",
              title: "Product 1",
              stock: 5,
              price: { amount: 10, currency: "USD" },
            },
          },
        });
      }
      return Promise.reject(new Error("not found"));
    });

    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", "Bearer faketoken")
      .send({
        shippingAddress: {
          street: "1 Main St",
          city: "City",
          state: "S",
          pincode: "12345",
          country: "US",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("order");

    // verify order persisted in DB
    const dbOrder = await Order.findOne({});
    expect(dbOrder).not.toBeNull();
    expect(dbOrder.totalAmount.amount).toBeGreaterThan(0);
  });

  test("returns 400 on validation errors", async () => {
    // jwt mocked in beforeEach
    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", "Bearer faketoken")
      .send({ shippingAddress: { street: "", city: "City" } });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("returns 401 when not authenticated", async () => {
    // simulate no token
    // Clear jwt.verify mock so middleware returns 401 when it checks token absence
    jwt.verify.mockRestore();

    const res = await request(app)
      .post("/api/orders/")
      .send({
        shippingAddress: {
          street: "1 Main St",
          city: "City",
          state: "S",
          pincode: "12345",
          country: "US",
        },
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Unauthorized");
  });

  test("returns 500 when product out of stock", async () => {
    const userId = mongoose.Types.ObjectId().toString();
    jwt.verify.mockImplementation(() => ({ id: userId, role: "user" }));

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          data: { cart: { items: [{ productId: "p1", quantity: 10 }] } },
        });
      }
      if (url.includes("/api/products/p1")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "p1",
              title: "Product 1",
              stock: 5,
              price: { amount: 10, currency: "USD" },
            },
          },
        });
      }
      return Promise.reject(new Error("not found"));
    });

    const res = await request(app)
      .post("/api/orders/")
      .set("Authorization", "Bearer faketoken")
      .send({
        shippingAddress: {
          street: "1 Main St",
          city: "City",
          state: "S",
          pincode: "12345",
          country: "US",
        },
      });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/out of stock|Create Order Error/i);
  });
});
