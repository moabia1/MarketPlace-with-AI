// Tests for GET /api/products

// Mock Product model
jest.mock("../src/models/product.model", () => ({
  find: jest.fn(),
}));

// Keep other mocks similar to existing POST tests
jest.mock(
  "../src/middlewares/auth.middleware",
  () => () => (req, res, next) => {
    req.user = { id: "seller123", role: "admin" };
    next();
  }
);

const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/product.model");

describe("GET /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return products with default pagination", async () => {
    const fakeProducts = [
      { title: "A", price: { amount: 10, currency: "USD" } },
      { title: "B", price: { amount: 20, currency: "USD" } },
    ];

    Product.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(fakeProducts),
    });

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toEqual(fakeProducts);
    expect(Product.find).toHaveBeenCalledTimes(1);
  });

  it("should apply text query and price filters", async () => {
    const fakeProducts = [
      { title: "QueryMatch", price: { amount: 50, currency: "USD" } },
    ];

    Product.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(fakeProducts),
    });

    const res = await request(app)
      .get("/api/products")
      .query({ q: "match", minPrice: 30, maxPrice: 100, skip: 0, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(fakeProducts);

    // Ensure find was called with a filter containing $text and price.amount range
    const calledWith = Product.find.mock.calls[0][0];
    expect(calledWith).toHaveProperty("$text");
    // 'price.amount' is used as a single key in the controller filter (not a nested object)
    expect(Object.keys(calledWith)).toContain("price.amount");
  });
});
