const express = require("express");
const {
  registerUserValidation,
  loginUserValidation,
} = require("../middlewares/validator.middleware");
const { registerUser, loginUser } = require("../controllers/auth.controller");

const router = express.Router();

// POST /auth/register
router.post("/register", registerUserValidation, registerUser);

// POST /auth/register
router.post("/login", loginUserValidation, loginUser);

// GET /auth/me
router.get("/auth/me",)
module.exports = router;
