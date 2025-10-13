const express = require("express");
const multer = require("multer");
const {
  productController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  getSellerProductsController,
} = require("../controllers/product.controller");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const validateProduct = require("../middlewares/product.validator");

const router = express.Router();

// memory storage - we use buffer in the controller and tests
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/products/ - accepts fields and multiple images
router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  upload.array("images", 5),
  validateProduct,
  productController
);
// GET /api/products
router.get("/", getProductsController);

// GET products for the authenticated seller
router.get(
  "/seller",
  createAuthMiddleware(["seller"]),
  getSellerProductsController
);

router.get("/:id", getProductByIdController);

router.patch("/:id", createAuthMiddleware(["seller"]), updateProductController);

// DELETE /api/products/:id (seller only)
router.delete(
  "/:id",
  createAuthMiddleware(["seller"]),
  deleteProductController
);

module.exports = router;
