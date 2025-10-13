// Tests for PATCH /api/products/:id (seller)

// Mock Product model
jest.mock("../src/models/product.model", () => ({
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
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

describe("PATCH /api/products/:id (seller)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update allowed product fields for the seller and return 200", async () => {
    const productId = "prod123";
    const original = {
      _id: productId,
      title: "Old title",
      description: "Old desc",
      price: { amount: 50, currency: "USD" },
      seller: "seller123",
    };

    const updated = {
      _id: productId,
      title: "New title",
      description: "New desc",
      price: { amount: 60, currency: "USD" },
      seller: "seller123",
    };

    // findById to check ownership (controller may call it)
    Product.findById.mockResolvedValue(original);
    // findByIdAndUpdate to perform update
    Product.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .send({ title: "New title", description: "New desc", priceAmount: 60 })
      .set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "New title" });
    expect(Product.findById).toHaveBeenCalledWith(productId);
    expect(Product.findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });

  it("should return 404 when product not found", async () => {
    const productId = "missing123";
    Product.findById.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .send({ title: "Won't matter" })
      .set("Accept", "application/json");

    expect(res.status).toBe(404);
  });

  it("should return 403 when seller does not own the product", async () => {
    const productId = "otherprod";
    const otherProduct = {
      _id: productId,
      title: "Other",
      seller: "otherSeller",
    };
    Product.findById.mockResolvedValue(otherProduct);

    const res = await request(app)
      .patch(`/api/products/${productId}`)
      .send({ title: "Hack" })
      .set("Accept", "application/json");

    expect(res.status).toBe(403);
  });
});
