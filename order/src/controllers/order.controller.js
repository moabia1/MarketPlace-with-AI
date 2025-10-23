const orderModel = require("../models/order.model");
const axios = require("axios");

async function createOrder(req, res) {
  const user = req.user;
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  try {
    const cartResponse = await axios.get("http://localhost:3002/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const products = await Promise.all(
      cartResponse.data.cart.items.map(async (item) => {
        return (
          await axios.get(
            `http://localhost:3001/api/products/${item.productId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        ).data.product;
      })
    );

    let priceAmount = 0;

    const orderItems = cartResponse.data.cart.items.map((item) => {
      // find product details from products array
      const product = products.find((p) => p._id === item.productId);

      // if not in stock, does not allow to order
      if (product.stock < item.quantity) {
        throw new Error(`Product ${product.title} is out of stock`);
      }

      // calculate total price
      const itemTotal = product.price.amount * item.quantity;
      priceAmount += itemTotal;

      return {
        product: item.productId,
        quantity: item.quantity,
        price: {
          amount: itemTotal,
          currency: product.price.currency,
        },
      };
    });

    const order = await orderModel.create({
      user: user.id,
      items: orderItems,
      status: "pending",
      totalAmount: {
        amount: priceAmount,
        currency: orderItems[0]?.price.currency,
      },
      shippingAddress: req.body.shippingAddress,
    });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Create Order Error : ", error: error.message });
  }
}

async function getMyOrders(req, res) {
  const user = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // only allow admin to fetch all orders; users get their own
    const filter = req.user.role === "admin" ? {} : { user: user.id };

    const [orders, totalOrders] = await Promise.all([
      orderModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      orderModel.countDocuments(filter),
    ]);

    res.status(200).json({
      orders,
      meta: {
        total: totalOrders,
        page,
        limit,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Get My Orders Error : ", error: error.message });
  }
}

async function getOrderById(req, res) {
  const user = req.user;
  const orderId = req.params.id;

  try {
    // admins can fetch any order, users only their own
    const filter =
      req.user.role === "admin"
        ? { _id: orderId }
        : { _id: orderId, user: user.id };
    const order = await orderModel.findOne(filter);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Get Order By ID Error : ", error: error.message });
  }
}

async function cancelOrderById(req, res) {
  const user = req.user;
  const orderId = req.params.id;

  try {
    const order = await orderModel.findOne({ _id: orderId, user: user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role !== "admin" && order.user.toString() !== user.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only cancel your own orders" });
    }
    // allow cancelling when pending, confirmed or paid
    if (!["pending", "confirmed", "paid"].includes(order.status)) {
      return res.status(400).json({
        message: "Only pending, confirmed or paid orders can be cancelled",
      });
    }
    order.status = "cancelled";
    order.timeline.push({ status: "cancelled", date: new Date() });
    await order.save();
    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Cancel Order By ID Error : ", error: error.message });
  }
}

async function updateShippingAddress(req, res) {
  const user = req.user;
  const orderId = req.params.id;
  const { shippingAddress } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() != user.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: you don't have access" });
    }

    if (order.status !== "pending") {
      return res
        .status(409)
        .json({ message: "Order address cannot be updated" });
    }

    order.shippingAddress = shippingAddress;

    await order.save();
    res.status(200).json({ order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Update Address Error : ", error: error.message });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrderById,
  updateShippingAddress,
};
