const { body, validationResult } = require("express-validator")

const respondWithValidationError = (req,res,next) => {
  let error = validationResult(req)
  if (!error.isEmpty()) {
    return res.status(400).json({error:error.array()})
  }
  next()
}

const registerUserValidation = [
  body("username")
    .isString()
    .withMessage("username must be string")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email")
    .isEmail()
    .withMessage("Invalid Email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("fullName.firstName")
    .isString()
    .withMessage("First Name must be a string")
    .notEmpty()
    .withMessage("First Name is required"),
  body("fullName.lastName")
    .isString()
    .withMessage("Last Name must be a string")
    .notEmpty()
    .withMessage("Last Name is required"),
  respondWithValidationError
];


const loginUserValidation = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),
  body("username")
    .optional()
    .isString()
    .withMessage("Username must be a string"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  (req, res, next) => {
    if (!req.body.email && !req.body.username) {
      return res.status(400).json({errors:[{msg:"Either Email or Username is required"}]})
    }
    respondWithValidationError(req,res,next)
  }
]

module.exports = {
  registerUserValidation,
  loginUserValidation
}