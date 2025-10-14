const { body, validationResult, param } = require("express-validator");
const mongoose = require("mongoose");

function validateResult(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const validateAddItemToCart = [
  body("productId")
    .isString()
    .withMessage("Product ID must be a string")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Product ID"),
  body("qty")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be an integer greater than 0"),
  validateResult,
];

const validateUpdateCartItem = [
  param("id")
    .isString()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid item id"),
  body("qty")
    .isInt({ min: 0 })
    .withMessage("Quantity must be an integer >= 0"),
  validateResult,
];

module.exports = {
  validateAddItemToCart,
  validateUpdateCartItem,
};
