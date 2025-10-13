const { default: mongoose } = require("mongoose");
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

async function getSellerProductsController(req, res) {
  try {
    const sellerId = req.user && req.user.id;
    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { skip = 0, limit = 10 } = req.query;

    const products = await productModel
      .find({ seller: sellerId })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));

    return res.status(200).json({ data: products });
  } catch (err) {
    console.error(
      "getSellerProductsController error:",
      err && err.stack ? err.stack : err
    );
    return res.status(500).json({ message: "Server error" });
  }
}

async function getProductByIdController(req, res) {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ product: product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateProductController(req, res) {
  try {
    const { id } = req.params;

    const { title, description, priceAmount, priceCurrency } = req.body;
    // Use findById so tests that mock findById/findByIdAndUpdate work as expected.
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ensure ownership
    if (product.seller && product.seller.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this product" });
    }

    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;

    if (priceAmount !== undefined || priceCurrency !== undefined) {
      update.price = {
        ...(product.price
          ? { amount: product.price.amount, currency: product.price.currency }
          : {}),
      };
      if (priceAmount !== undefined) update.price.amount = Number(priceAmount);
      if (priceCurrency !== undefined) update.price.currency = priceCurrency;
    }

    if (Object.keys(update).length === 0) {
      return res.status(200).json(product);
    }

    const updatedProduct = await productModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    return res.status(200).json(updatedProduct);
  } catch (err) {
    console.error(
      "updateProductController error:",
      err && err.stack ? err.stack : err
    );
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteProductController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ensure ownership
    if (product.seller && product.seller.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this product" });
    }

    await productModel.findByIdAndDelete(id);
    return res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    console.error(
      "deleteProductController error:",
      err && err.stack ? err.stack : err
    );
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  productController,
  getProductsController,
  getSellerProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
};
