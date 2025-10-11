const { validationResult, body } = require("express-validator");


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateProduct = [
  body("title")
    .notEmpty()
    .withMessage("Title is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be in 500 characters"),
  body("priceAmount")
    .notEmpty()
    .withMessage("Price amount is required"),
  body("priceCurrency")
    .isIn(["USD", "INR"])
    .withMessage("Price currency must be either USD or INR"),
  handleValidationErrors
];

module.exports = validateProduct;
