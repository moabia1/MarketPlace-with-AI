const productModel = require("../models/product.model");
const {uploadImage} = require("../services/imagekit");

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
    }
    const images = [];
    const files = await Promise.all(
      (req.files || []).map((file) =>
        uploadImage({ buffer: file.buffer })
      )
    );
    images.push(...files);

    const product = new productModel({
      title,
      description,
      price,
      seller,
      images
    });
    await product.save();
    return res.status(201).json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  productController,
};
