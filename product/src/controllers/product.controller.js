const productModel = require("../models/product.model");

async function productController(req, res) {
  // require the Product model lazily so importing this module doesn't force mongoose to be loaded
  try {
    const { title, description, priceAmount, priceCurrency } = req.body;

    if (!title || !priceAmount || !priceCurrency) {
      return res.status(400).json({ message: "Title and price are required" });
    }
    const seller = req.user.id; // default seller for tests

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };
    // require image upload lazily so Jest doesn't attempt to parse ESM-only deps at import time
    const { uploadImage } = require("../services/imagekit");
    const images = await Promise.all(
      (req.files || []).map((file) => uploadImage({ buffer: file.buffer }))
    );

    const product = await productModel.create({
      title,
      description,
      price,
      seller,
      images,
    });

    return res.status(201).json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getProductsController(req, res) {
  const { q, minPrice, maxPrice, skip = 0, limit = 10 } = req.query;

  const filter = {};

  if (q) {
    filter.$text = { $search: q };
  }
  if (minPrice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $gte: Number(minPrice),
    };
  }
  if (maxPrice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $lte: Number(maxPrice),
    };
  }

  const products = await productModel
    .find(filter)
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 20));

  return res.status(200).json({ data: products });
}
module.exports = {
  productController,
  getProductsController,
};
