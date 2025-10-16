const orderModel = require("../models/order.model");
const axios = require("axios");


async function createOrder(req, res) {

  const user = req.user;
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  try {
    const cartResponse = await axios.get("http://localhost:3002/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(cartResponse)
    
    const products = await Promise.all(cartResponse.data.cart.items.map(async (item) => {
      return await axios.get(`http://localhost:3001/api/products/${item.productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    }));

  } catch (error) {
    res.status(500).json({ message: "Create Order Error : ", error: error.message });
  }
};

module.exports = {
  createOrder
}