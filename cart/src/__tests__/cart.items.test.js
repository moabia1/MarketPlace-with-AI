const request = require("supertest");

// Mocks - jwt must be mocked before app loads so auth middleware uses the mock
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => ({ _id: "userId123", role: "user" })),
}));
// Mock the auth middleware to bypass actual JWT verification in tests
jest.mock("../middlewares/auth.middleware", () => {
  return jest.fn(() => (req, res, next) => {
    req.user = { id: "userId123", role: "user" };
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

describe("PATCH /api/cart/items/:id", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("updates quantity of existing item and returns 200", async () => {
    const existingCart = {
      user: "userId123",
      items: [
        {
          productId: { toString: () => "507f1f77bcf86cd799439011" },
          quantity: 2,
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    cartModel.findOne = jest.fn().mockResolvedValue(existingCart);

    const res = await request(app)
      .patch("/api/cart/items/507f1f77bcf86cd799439011")
      .set("Authorization", "Bearer faketoken")
      .set("Cookie", ["token=faketoken"])
      .send({ qty: 5 });

    expect(res.statusCode).toBe(200);
    expect(existingCart.items[0].quantity).toBe(5);
    expect(existingCart.save).toHaveBeenCalled();
    expect(res.body).toHaveProperty("message", "Cart updated successfully");
  });

  test("removes item when qty is 0", async () => {
    const existingCart = {
      user: "userId123",
      items: [
        {
          productId: { toString: () => "507f1f77bcf86cd799439011" },
          quantity: 2,
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    cartModel.findOne = jest.fn().mockResolvedValue(existingCart);

    const res = await request(app)
      .patch("/api/cart/items/507f1f77bcf86cd799439011")
      .set("Authorization", "Bearer faketoken")
      .set("Cookie", ["token=faketoken"])
      .send({ qty: 0 });

    expect(res.statusCode).toBe(200);
    expect(existingCart.items.length).toBe(0);
    expect(existingCart.save).toHaveBeenCalled();
  });

  test("returns 400 for invalid id or qty", async () => {
    const res = await request(app)
      .patch("/api/cart/items/invalid-id")
      .set("Authorization", "Bearer faketoken")
      .send({ qty: -1 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });
});

describe("GET /api/cart", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("returns current cart with items and totals", async () => {
    // Sample cart with two items
    const existingCart = {
      user: "userId123",
      items: [
        {
          productId: { toString: () => "507f1f77bcf86cd799439011" },
          quantity: 2,
          price: 10,
        },
        {
          productId: { toString: () => "507f191e810c19729de860ea" },
          quantity: 1,
          price: 20,
        },
      ],
    };

    cartModel.findOne = jest.fn().mockResolvedValue(existingCart);

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", "Bearer faketoken")
      .set("Cookie", ["token=faketoken"]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("cart");
    expect(res.body).toHaveProperty("totals");
    expect(res.body.totals).toHaveProperty("totalQuantity");
    expect(res.body.totals).toHaveProperty("itemCount");
    // totalQuantity is number of distinct items
    expect(res.body.totals.totalQuantity).toBe(2);
    // itemCount = sum of quantities
    expect(res.body.totals.itemCount).toBe(3);
    expect(cartModel.findOne).toHaveBeenCalledWith({ user: "userId123" });
  });

  test("returns 404 when no cart exists", async () => {
    // Simulate no cart existing: controller creates and saves an empty cart
    cartModel.findOne = jest.fn().mockResolvedValue(null);
    const savedCart = { user: "userId123", items: [] };
    cartModel.mockImplementation(() => ({
      items: [],
      save: jest.fn().mockResolvedValue(savedCart),
    }));

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", "Bearer faketoken");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("cart");
    expect(res.body.cart).toHaveProperty("items");
    expect(res.body.cart.items.length).toBe(0);
  });
});

describe("DELETE /api/cart", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("deletes the cart when it exists and returns 200", async () => {
    const existingCart = {
      user: "userId123",
      items: [
        {
          productId: { toString: () => "507f1f77bcf86cd799439011" },
          quantity: 1,
        },
      ],
    };

    cartModel.findOne = jest.fn().mockResolvedValue(existingCart);
    cartModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", "Bearer faketoken")
      .set("Cookie", ["token=faketoken"]);

    expect(res.statusCode).toBe(200);
    expect(cartModel.findOne).toHaveBeenCalledWith({ user: "userId123" });
    expect(cartModel.deleteOne).toHaveBeenCalledWith({ user: "userId123" });
    expect(res.body).toHaveProperty("message");
  });

  test("returns 404 when no cart exists", async () => {
    cartModel.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", "Bearer faketoken")
      .set("Cookie", ["token=faketoken"]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});
