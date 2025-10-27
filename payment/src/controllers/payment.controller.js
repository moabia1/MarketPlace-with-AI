const { default: axios } = require("axios");
const Payment = require("../models/payment.model");



async function createPayment(req, res) {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

  try {
    const orderId = req.params.orderId;

    const orderResponse = await axios.get(`http://localhost:3003/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const price = orderResponse.data.order.totalAmount.price;
    
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({message: "Internal Server Error"})
  }
}

module.exports = {
  createPayment
}