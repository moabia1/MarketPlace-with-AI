const { body, validationResult } = require("express-validator");

const respondWithValidationError = (req, res, next) => {
  let error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ error: error.array() });
  }
  next();
};


const createOrderValidation = [
  body("shippingAddress.street")
    .isString()
    .withMessage("Street must be a string")
    .notEmpty()
    .withMessage("Street is required"),
  body("shippingAddress.city")
    .isString()
    .withMessage("City must be a string")
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .isString()
    .withMessage("State must be a string")
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.pincode")
    .isString()
    .withMessage("Pincode must be a string")
    .notEmpty()
    .withMessage("Pincode is required"),
  body("shippingAddress.country")
    .isString()
    .withMessage("Country must be a string")
    .notEmpty()
    .withMessage("Country is required"),
  respondWithValidationError,
];

const updateAddressValidation = [
  body("shippingAddress.street")
    .optional()
    .isString()
    .withMessage("Street must be a String")
    .notEmpty()
    .withMessage("Street cannot be empty"),
  body("shippingAddress.city")
    .optional()
    .isString()
    .withMessage("city must be a String")
    .notEmpty()
    .withMessage("City cannot be empty"),
  body("shippingAddress.state")
    .optional()
    .isString()
    .withMessage("State must be a String")
    .notEmpty()
    .withMessage("State cannot be empty"),
  body("shippingAddress.pincode")
    .optional()
    .isString()
    .withMessage("Pincode must be a String")
    .notEmpty()
    .withMessage("Pincode cannot be empty")
    .bail()
    .matches(/^\d{4,}$/)
    .withMessage("Pincode must be at least 4 digits"),
  body("shippingAddress.country")
    .optional()
    .isString()
    .withMessage("Country must be a String")
    .notEmpty()
    .withMessage("Country cannot be empty"),
  respondWithValidationError
];

module.exports = {
  createOrderValidation,
  updateAddressValidation
};