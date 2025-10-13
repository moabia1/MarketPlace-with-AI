// Tests for DELETE /api/products/:id (seller)

// Mock Product model
jest.mock("../src/models/product.model", () => ({
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
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

describe("DELETE /api/products/:id (seller)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete product when seller owns it and return 200", async () => {
    const productId = "507f1f77bcf86cd799439011";
    const existing = {
      _id: productId,
      title: "To delete",
      seller: "seller123",
    };

    Product.findById.mockResolvedValue(existing);
    Product.findByIdAndDelete.mockResolvedValue(existing);

    const res = await request(app).delete(`/api/products/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(Product.findById).toHaveBeenCalledWith(productId);
    expect(Product.findByIdAndDelete).toHaveBeenCalledWith(productId);
  });

  it("should return 404 when product not found", async () => {
    const productId = "507f191e810c19729de860ea";
    Product.findById.mockResolvedValue(null);

    const res = await request(app).delete(`/api/products/${productId}`);

    expect(res.status).toBe(404);
  });

  it("should return 403 when seller does not own the product", async () => {
    const productId = "507f1f77bcf86cd799439012";
    const otherProduct = {
      _id: productId,
      title: "Other",
      seller: "otherSeller",
    };
    Product.findById.mockResolvedValue(otherProduct);

    const res = await request(app).delete(`/api/products/${productId}`);

    expect(res.status).toBe(403);
  });
});
