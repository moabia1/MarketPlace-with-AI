const express = require("express");
const {
  registerUserValidation,
  loginUserValidation,
  addUserAddressValidation,
} = require("../middlewares/validator.middleware");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getUserAddresses,
  addUserAddress,
  removeUserAddress,
  deleteUserAddress,
} = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /auth/register
router.post("/register", registerUserValidation, registerUser);

// POST /auth/register
router.post("/login", loginUserValidation, loginUser);

// GET /auth/me
router.get("/me", authMiddleware, getCurrentUser);

// GWT /auth/logout
router.get("/logout", logoutUser);

// Addresses routes
router.get("/users/me/addresses", authMiddleware, getUserAddresses);
router.post(
  "/users/me/addresses",
  addUserAddressValidation,
  authMiddleware,
  addUserAddress
);
router.delete("/users/me/addresses/:addressId", authMiddleware, deleteUserAddress);

module.exports = router;
