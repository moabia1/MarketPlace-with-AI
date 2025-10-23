const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// mock axios (not strictly required here but keep parity with other tests)
jest.mock("axios");
const axios = require("axios");

const jwt = require("jsonwebtoken");

let mongoServer;
let app;
let Order;

describe("Order endpoints - additional tests (with in-memory MongoDB)", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // require app and model after mongoose is connected
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
    jest.spyOn(jwt, "verify").mockImplementation(() => ({
      id: mongoose.Types.ObjectId().toString(),
      role: "user",
    }));

    // clear database
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  test("GET /api/orders/:id returns order with timeline and paymentSummary", async () => {
    const userId = mongoose.Types.ObjectId().toString();

    // create order with timeline and paymentSummary
    const order = await Order.create({
      user: userId,
      items: [
        {
          product: "p1",
          quantity: 1,
          price: { amount: 10, currency: "USD" },
        },
      ],
      status: "pending",
      totalAmount: { amount: 10, currency: "USD" },
      shippingAddress: {
        street: "1 Main",
        city: "City",
        state: "S",
        pincode: "12345",
        country: "US",
      },
      timeline: [{ status: "pending", date: new Date() }],
      paymentSummary: {
        method: "card",
        captured: false,
        amount: { amount: 10, currency: "USD" },
      },
    });

    // ensure jwt returns same user
    jwt.verify.mockImplementation(() => ({ id: userId, role: "user" }));

    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set("Authorization", "Bearer faketoken");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("order");
    expect(res.body.order).toHaveProperty("timeline");
    expect(res.body.order).toHaveProperty("paymentSummary");
  });

  test("GET /api/orders/me returns paginated list of customer's orders", async () => {
    const userId = mongoose.Types.ObjectId().toString();
    jwt.verify.mockImplementation(() => ({ id: userId, role: "user" }));

    // create 5 orders for this user and 2 for another
    const ordersForUser = [];
    for (let i = 0; i < 5; i++) {
      ordersForUser.push({
        user: userId,
        items: [
          {
            product: `p${i}`,
            quantity: 1,
            price: { amount: 5, currency: "USD" },
          },
        ],
        status: "pending",
        totalAmount: { amount: 5, currency: "USD" },
        shippingAddress: {
          street: "S",
          city: "C",
          state: "ST",
          pincode: "11111",
          country: "US",
        },
      });
    }
    await Order.insertMany(ordersForUser);
    // other user orders
    await Order.insertMany([
      {
        user: mongoose.Types.ObjectId().toString(),
        items: [
          { product: "x", quantity: 1, price: { amount: 1, currency: "USD" } },
        ],
        totalAmount: { amount: 1, currency: "USD" },
        shippingAddress: {
          street: "a",
          city: "b",
          state: "c",
          pincode: "1",
          country: "US",
        },
      },
      {
        user: mongoose.Types.ObjectId().toString(),
        items: [
          { product: "y", quantity: 1, price: { amount: 2, currency: "USD" } },
        ],
        totalAmount: { amount: 2, currency: "USD" },
        shippingAddress: {
          street: "a",
          city: "b",
          state: "c",
          pincode: "1",
          country: "US",
        },
      },
    ]);

    const res = await request(app)
      .get(`/api/orders/me?page=1&limit=2`)
      .set("Authorization", "Bearer faketoken");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("orders");
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta).toHaveProperty("total", 5);
    expect(res.body.meta).toHaveProperty("page", 1);
    expect(res.body.meta).toHaveProperty("limit", 2);
  });

  test("POST /api/orders/:id/cancel allows buyer to cancel when status is pending or paid", async () => {
    const userId = mongoose.Types.ObjectId().toString();
    jwt.verify.mockImplementation(() => ({ id: userId, role: "user" }));

    // pending order
    const pendingOrder = await Order.create({
      user: userId,
      items: [
        { product: "p1", quantity: 1, price: { amount: 10, currency: "USD" } },
      ],
      status: "pending",
      totalAmount: { amount: 10, currency: "USD" },
      shippingAddress: {
        street: "1",
        city: "C",
        state: "S",
        pincode: "1",
        country: "US",
      },
    });

    const res = await request(app)
      .post(`/api/orders/${pendingOrder._id}/cancel`)
      .set("Authorization", "Bearer faketoken");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("order");
    expect(res.body.order.status).toBe("cancelled");

    // shipped order cannot be cancelled
    const shippedOrder = await Order.create({
      user: userId,
      items: [
        { product: "p2", quantity: 1, price: { amount: 10, currency: "USD" } },
      ],
      status: "shipped",
      totalAmount: { amount: 10, currency: "USD" },
      shippingAddress: {
        street: "1",
        city: "C",
        state: "S",
        pincode: "1",
        country: "US",
      },
    });

    const res2 = await request(app)
      .post(`/api/orders/${shippedOrder._id}/cancel`)
      .set("Authorization", "Bearer faketoken");

    expect([400, 403]).toContain(res2.status);
    expect(res2.body).toHaveProperty("message");
  });

  test("PATCH /api/orders/:id/address updates delivery address prior to payment capture", async () => {
    const userId = mongoose.Types.ObjectId().toString();
    jwt.verify.mockImplementation(() => ({ id: userId, role: "user" }));

    const order = await Order.create({
      user: userId,
      items: [
        { product: "p1", quantity: 1, price: { amount: 25, currency: "USD" } },
      ],
      status: "pending",
      totalAmount: { amount: 25, currency: "USD" },
      shippingAddress: {
        street: "Old",
        city: "C",
        state: "S",
        pincode: "1",
        country: "US",
      },
      paymentSummary: {
        method: "card",
        captured: false,
        amount: { amount: 25, currency: "USD" },
      },
    });

    const newAddress = {
      street: "New St",
      city: "New City",
      state: "NS",
      pincode: "99999",
      country: "US",
    };

    const res = await request(app)
      .patch(`/api/orders/${order._id}/address`)
      .set("Authorization", "Bearer faketoken")
      .send({ shippingAddress: newAddress });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("order");
    expect(res.body.order.shippingAddress.street).toBe(newAddress.street);

    // when captured, updating address should be rejected
    const paidOrder = await Order.create({
      user: userId,
      items: [
        { product: "p3", quantity: 1, price: { amount: 5, currency: "USD" } },
      ],
      status: "paid",
      totalAmount: { amount: 5, currency: "USD" },
      shippingAddress: {
        street: "Old2",
        city: "C",
        state: "S",
        pincode: "2",
        country: "US",
      },
      paymentSummary: {
        method: "card",
        captured: true,
        amount: { amount: 5, currency: "USD" },
      },
    });

    const res2 = await request(app)
      .patch(`/api/orders/${paidOrder._id}/address`)
      .set("Authorization", "Bearer faketoken")
      .send({ shippingAddress: { street: "X" } });

    expect([400, 403]).toContain(res2.status);
    expect(res2.body).toHaveProperty("message");
  });
});
