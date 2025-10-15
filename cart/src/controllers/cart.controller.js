const cartModel = require("../models/cart.model");

async function addItemToCart(req, res) {
  const user = req.user;
  const { productId, qty } = req.body;

  let cart = await cartModel.findOne({ user: user.id });

  if (!cart) {
    cart = new cartModel({ user: user.id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += qty;
  } else {
    cart.items.push({ productId, quantity: qty });
  }

  await cart.save();

  res.status(200).json({ message: "Item added to cart successfully", cart });
}

async function updateCartItem(req, res) {
  const user = req.user;
  const itemId = req.params.id; // productId stored as ObjectId
  const { qty } = req.body;

  const cart = await cartModel.findOne({ user: user.id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const itemIndex = cart.items.findIndex(
    (i) => i.productId.toString() === itemId
  );
  if (itemIndex === -1) {
    return res.status(404).json({ message: "Item not found in cart" });
  }

  if (qty === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = qty;
  }

  await cart.save();

  res.status(200).json({ message: "Cart updated successfully", cart });
}

async function getCart(req, res) {
  const user = req.user;

  let cart = await cartModel.findOne({ user: user.id });

  if (!cart) {
    cart = new cartModel({ user: user.id, items: [] });
    await cart.save();
  }

  res.status(200).json({
    cart,
    totals: {
      totalQuantity: cart.items.length,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    },
  });
}

async function deleteCart(req, res) {
  const user = req.user;

  const cart = await cartModel.findOne({ user: user.id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  await cartModel.deleteOne({ user: user.id });

  res.status(200).json({ message: "Cart deleted successfully" });
}

module.exports = {
  addItemToCart,
  updateCartItem,
  getCart,
  deleteCart,
};
