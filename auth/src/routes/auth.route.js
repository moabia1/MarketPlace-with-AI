const express = require("express");
const {
  registerUserValidation,
  loginUserValidation,
} = require("../middlewares/validator.middleware");
const { registerUser, loginUser, getCurrentUser } = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /auth/register
router.post("/register", registerUserValidation, registerUser);

// POST /auth/register
router.post("/login", loginUserValidation, loginUser);

// GET /auth/me
router.get("/me", authMiddleware, getCurrentUser)

module.exports = router;
