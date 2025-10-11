const express = require("express");
const multer = require("multer");
const { productController } = require("../controllers/product.controller");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const validateProduct = require("../middlewares/product.validator");


const router = express.Router();

// memory storage - we use buffer in the controller and tests
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/products/ - accepts fields and multiple images
router.post("/",
  createAuthMiddleware(["admin", "seller"]),
  upload.array("images", 5),
  validateProduct,
  productController
);

// GET /api/products
router.get("/", (req, res) => { 

})
module.exports = router;
