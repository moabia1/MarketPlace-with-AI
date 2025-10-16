const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const {createOrder} = require("../controllers/order.controller");
const {createOrderValidation} = require("../middlewares/validation.middleware")


const router = express.Router();



router.post("/",createAuthMiddleware(["user"]),createOrderValidation, createOrder)


module.exports = router;