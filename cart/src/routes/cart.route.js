const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const {addItemToCart} = require("../controllers/cart.controller")
const {validateAddItemToCart} = require("../middlewares/validation.middleware")
const router = express.Router();

router.post(
  "/items",
  validateAddItemToCart,
  createAuthMiddleware(["user"]),
  addItemToCart
);

module.exports = router;