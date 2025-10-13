const cartModel = require("../models/cart.model");


async function addItemToCart(req, res) {
  const { productId, qty } = req.body;
  let user = req.user;

  let cart = await cartModel.findOne({ user: user._id });
  if (!cart) {
    cart = new cartModel({ user: user._id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += qty;
  } else {
    cart.items.push({ productId, quantity: qty });
  }

  await cart.save();
  res.status(200).json({
    message: "Item added to cart successfully",
    cart
  });
}

module.exports = {
  addItemToCart
}