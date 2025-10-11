// Mock dependencies
jest.mock("../../src/models/product.model", () => ({
  create: jest.fn(),
  find: jest.fn(),
}));
jest.mock("../../src/services/imagekit", () => ({ uploadImage: jest.fn() }));

// Mock auth middleware
jest.mock(
  "../../src/middlewares/auth.middleware",
  () => () => (req, res, next) => {
    req.user = { id: "seller123", role: "admin" };
    next();
  }
);

const request = require("supertest");
const app = require("../../src/app");
const Product = require("../../src/models/product.model");
const { uploadImage } = require("../../src/services/imagekit");

describe("POST /api/products/", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a product without images", async () => {
    const created = {
      _id: "abc123",
      title: "Test Product",
      price: { amount: 100, currency: "USD" },
    };
    Product.create.mockResolvedValue(created);

    const res = await request(app)
      .post("/api/products/")
      .field("title", "Test Product")
      .field("priceAmount", "100")
      .field("priceCurrency", "USD")
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Test Product",
      price: { amount: 100, currency: "USD" },
    });
    expect(Product.create).toHaveBeenCalledTimes(1);
  });

  it("should upload images and create a product", async () => {
    uploadImage.mockResolvedValue({
      url: "https://ik.imagekit.io/fake/file.jpg",
      fileId: "fake123",
    });

    const created = {
      _id: "prod456",
      title: "Image Product",
      price: { amount: 200, currency: "INR" },
    };
    Product.create.mockResolvedValue(created);

    const res = await request(app)
      .post("/api/products/")
      .field("title", "Image Product")
      .field("priceAmount", "200")
      .field("priceCurrency", "INR")
      .attach("images", Buffer.from("fake-image-content"), "photo.jpg");

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Image Product");
    expect(res.body.price).toMatchObject({
      amount: 200,
      currency: "INR",
    });
    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(Product.create).toHaveBeenCalledTimes(1);
  });
});
