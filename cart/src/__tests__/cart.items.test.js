const request = require("supertest");

// Mocks - jwt must be mocked before app loads so auth middleware uses the mock
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => ({ _id: "userId123", role: "user" })),
}));
// Mock the auth middleware to bypass actual JWT verification in tests
jest.mock("../middlewares/auth.middleware", () => {
  return jest.fn(() => (req, res, next) => {
    req.user = { _id: "userId123", role: "user" };
    next();
  });
});

const app = require("../app");

// Mocks for cart model
jest.mock("../models/cart.model");
const cartModel = require("../models/cart.model");

describe("POST /api/cart/items", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("adds item to a new cart and returns 200", async () => {
    // No cart found
    cartModel.findOne = jest.fn().mockResolvedValue(null);

    // Mock constructor behavior: when new cartModel() is called, return an object with items and save
    const savedCart = {
      user: "userId123",
      items: [{ productId: "507f1f77bcf86cd799439011", quantity: 2 }],
    };
    const fakeCartInstance = function () {};
    fakeCartInstance.prototype.items = [];
    fakeCartInstance.prototype.save = jest.fn().mockResolvedValue(savedCart);
    // When cartModel is used as a constructor, return instance. Simulate by mocking module to be a function.
    cartModel.mockImplementation(() => ({
      items: [],
      save: jest.fn().mockResolvedValue(savedCart),
    }));

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer faketoken")
      .set("Cookie", ["token=faketoken"])
      .send({ productId: "507f1f77bcf86cd799439011", qty: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Item added to cart successfully"
    );
    expect(res.body).toHaveProperty("cart");
    expect(cartModel.findOne).toHaveBeenCalledWith({ user: "userId123" });
  });

  test("increments quantity when item already exists", async () => {
    const existingCart = {
      user: "userId123",
      items: [
        {
          productId: { toString: () => "507f1f77bcf86cd799439011" },
          quantity: 1,
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    cartModel.findOne = jest.fn().mockResolvedValue(existingCart);

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer faketoken")
      .set("Cookie", ["token=faketoken"])
      .send({ productId: "507f1f77bcf86cd799439011", qty: 3 });

    expect(res.statusCode).toBe(200);
    expect(existingCart.items[0].quantity).toBe(4);
    expect(existingCart.save).toHaveBeenCalled();
  });

  test("returns 400 for invalid input", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", "Bearer faketoken")
      .send({ productId: "invalid-id", qty: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});
