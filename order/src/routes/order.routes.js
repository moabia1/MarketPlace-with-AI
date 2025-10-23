const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrderById,
  updateShippingAddress,
} = require("../controllers/order.controller");
const {
  createOrderValidation,
  updateAddressValidation
} = require("../middlewares/validation.middleware");

const router = express.Router();

// Create Order
router.post(
  "/",
  createAuthMiddleware(["user"]),
  createOrderValidation,
  createOrder
);

// Get My Orders
router.get("/me", createAuthMiddleware(["user"]), getMyOrders);

//
router.post("/:id/cancel", createAuthMiddleware(["user"]), cancelOrderById);

router.patch(
  "/:id/address",
  createAuthMiddleware(["user"]),
  updateAddressValidation,
  updateShippingAddress
);

router.get("/:id", createAuthMiddleware(["user", "admin"]), getOrderById);

module.exports = router;
