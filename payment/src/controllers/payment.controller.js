const { default: axios } = require("axios");
const Payment = require("../models/payment.model");
const Razorpay = require("razorpay");


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPayment(req, res) {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

  try {
    const orderId = req.params.orderId;

    const orderResponse = await axios.get(`http://localhost:3003/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const price = orderResponse.data.order.totalAmount;
    const order = await razorpay.orders.create(price);
    const payment = await Payment.create({
      order: orderId,
      razorpayOrderId: order.id,
      user: req.user.id,
      price: {
        amount: order.amount,
        currency: order.currency
      }
    })

    return res.status(201).json({message: "Payment Initiated Successfully", payment})

  } catch (error) {
    console.log(error)
    return res.status(500).json({message: "Internal Server Error"})
  }
}


async function verifyPayment(req, res) {
  const { razorpayOrderId, paymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const { validatePaymentVerification } = require("../../node_modules/razorpay/dist/utils/razorpay-utils.js")
    
    const isValid = validatePaymentVerification({
      order_id: razorpayOrderId,
      payment_id: paymentId
    }, signature, secret);
    
    if (!isValid) {
      return res.status(400).json({message: "Invalid Signature"})
    }

    const payment = await Payment.findOne({ razorpayOrderId, status: 'pending'});
    
    if (!payment) {
      return res.status(404).json({mesage:"Payment not found"})
    }

    payment.paymentId = paymentId
    payment.signature = signature
    payment.status = "completed"

    await payment.save();

    return res.status(200).json({message:"Payment Successfuly", payment})
  } catch (error) {
    console.log(error)
  }
}
module.exports = {
  createPayment,
  verifyPayment
}