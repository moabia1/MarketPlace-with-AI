// Tests for GET /api/products/:id

// Mock Product model
jest.mock("../src/models/product.model", () => ({
  findById: jest.fn(),
}));

// Keep auth middleware mock consistent with other tests
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

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 and the product when found", async () => {
    const fakeProduct = {
      _id: "507f1f77bcf86cd799439011",
      title: "Test Product",
      price: { amount: 99, currency: "USD" },
    };

    Product.findById.mockResolvedValue(fakeProduct);

    const res = await request(app).get(`/api/products/${fakeProduct._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("product");
    expect(res.body.product).toEqual(fakeProduct);
    expect(Product.findById).toHaveBeenCalledWith(fakeProduct._id);
  });

  it("returns 404 when product is not found", async () => {
    Product.findById.mockResolvedValue(null);

    const res = await request(app).get(
      "/api/products/000000000000000000000000"
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Product not found");
    expect(Product.findById).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when model throws an error", async () => {
    Product.findById.mockRejectedValue(new Error("DB failure"));

    const res = await request(app).get(
      "/api/products/507f1f77bcf86cd799439011"
    );

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message");
  });
});
