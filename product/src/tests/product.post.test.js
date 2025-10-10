// Provide manual mocks before importing app so the real modules that require mongoose or ImageKit never run
jest.doMock("../../src/models/product.model", () => jest.fn());
jest.doMock("../../src/services/imagekit", () => ({ uploadFile: jest.fn() }));

const request = require("supertest");
const app = require("../../src/app");

const Product = require("../../src/models/product.model");
const imageKitService = require("../../src/services/imagekit");

describe("POST /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a product without images", async () => {
    const fakeSaved = {
      _id: "abc123",
      title: "Test",
      price: { amount: 10, currency: "USD" },
    };
    // Make Product constructor return an object with save()
    Product.mockImplementation(function (data) {
      this.save = jest.fn().mockResolvedValue({ ...data, _id: "abc123" });
    });

    const res = await request(app)
      .post("/api/products")
      .send({
        title: "Test",
        price: JSON.stringify({ amount: 10, currency: "USD" }),
        seller: "seller123",
      })
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Test" });
    expect(Product).toHaveBeenCalled();
  });

  it("should upload images and create product", async () => {
    // mock imageKitService.uploadFile
    imageKitService.uploadFile.mockResolvedValue({
      url: "https://ik.io/file.jpg",
      thumbnail: "https://ik.io/thumb.jpg",
      fileId: "file123",
    });

    Product.mockImplementation(function (data) {
      this.save = jest.fn().mockResolvedValue({ ...data, _id: "prod456" });
    });

    const res = await request(app)
      .post("/api/products")
      .field("title", "WithImage")
      .field("price", JSON.stringify({ amount: 20, currency: "INR" }))
      .field("seller", "seller456")
      .attach("images", Buffer.from("fake-image-content"), "photo.jpg");

    expect(res.status).toBe(201);
    expect(imageKitService.uploadFile).toHaveBeenCalled();
    expect(res.body).toMatchObject({ title: "WithImage" });
    expect(res.body.images && res.body.images.length).toBeGreaterThan(0);
  });
});
