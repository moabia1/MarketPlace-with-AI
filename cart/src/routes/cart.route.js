const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
// Use the clean controller implementation for tests (file created by tests)
const {
  addItemToCart,
  updateCartItem,
} = require("../controllers/cart.controller");
const {
  validateAddItemToCart,
  validateUpdateCartItem,
} = require("../middlewares/validation.middleware");
const router = express.Router();

router.post(
  "/items",
  validateAddItemToCart,
  createAuthMiddleware(["user"]),
  addItemToCart
);

router.patch(
  "/items/:id",
  validateUpdateCartItem,
  createAuthMiddleware(["user"]),
  updateCartItem
);


module.exports = router;
