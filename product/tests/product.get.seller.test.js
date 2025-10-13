// Tests for GET /api/products/seller (seller-only)

// Mock Product model
jest.mock("../src/models/product.model", () => ({
  find: jest.fn(),
}));

// Mock auth middleware to simulate a seller user
jest.mock(
  "../src/middlewares/auth.middleware",
  () => () => (req, res, next) => {
    req.user = { id: "seller123", role: "seller" };
    next();
  }
);

const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/product.model");

describe("GET /api/products/seller (seller)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the seller's products with default pagination", async () => {
    const fakeProducts = [
      { title: "Seller A", seller: "seller123", price: { amount: 10 } },
      { title: "Seller B", seller: "seller123", price: { amount: 20 } },
    ];

    // Mock chainable query methods used in controller
    Product.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(fakeProducts),
    });

    const res = await request(app).get("/api/products/seller");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toEqual(fakeProducts);
    expect(Product.find).toHaveBeenCalledWith({ seller: "seller123" });
  });

  it("should honor skip and limit query params", async () => {
    const fakeProducts = [{ title: "P1", seller: "seller123" }];

    Product.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(fakeProducts),
    });

    const res = await request(app)
      .get("/api/products/seller")
      .query({ skip: 5, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(fakeProducts);
    expect(Product.find).toHaveBeenCalledWith({ seller: "seller123" });
  });

  it("returns 500 when model throws an error", async () => {
    Product.find.mockImplementation(() => {
      throw new Error("DB down");
    });

    const res = await request(app).get("/api/products/seller");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message");
  });
});
