const express = require("express");
const {
  registerUserValidation,
  loginUserValidation,
} = require("../middlewares/validator.middleware");
const { registerUser, loginUser } = require("../controllers/auth.controller");

const router = express.Router();

// POST /auth/register
router.post("/register", registerUserValidation, registerUser);
router.post("/login", loginUserValidation, loginUser);


module.exports = router;
