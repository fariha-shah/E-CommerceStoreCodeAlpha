const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Available discount coupons
const COUPONS = {
  SAVE10: { code: 'SAVE10', type: 'percentage', value: 10, description: '10% off your entire order' },
  WELCOME20: { code: 'WELCOME20', type: 'percentage', value: 20, description: '20% off for new shoppers' },
  FREESHIP: { code: 'FREESHIP', type: 'shipping', value: 100, description: 'Free shipping on any order' },
};

// ===== COUPON VALIDATION ENDPOINT =====
router.post('/validate-coupon', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Please provide a coupon code.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = COUPONS[cleanCode];

  if (!coupon) {
    return res.status(400).json({
      valid: false,
      message: 'Invalid coupon code. Try SAVE10 or WELCOME20',
    });
  }

  const currentSubtotal = parseFloat(subtotal) || 0;
  let discountAmount = 0;

  if (coupon.type === 'percentage') {
    discountAmount = parseFloat(((currentSubtotal * coupon.value) / 100).toFixed(2));
  }

  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discountAmount,
    description: coupon.description,
    message: `Coupon ${coupon.code} applied successfully!`,
  });
});

// ===== PLACE ORDER =====
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      items,
      totalPrice,
      subtotal,
      shippingFee,
      tax,
      discount,
      address,
      shippingData,
      paymentMethod,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order.' });
    }

    // Format items cleanly
    const formattedItems = items.map((item) => ({
      product: String(item.product || item.id || item._id),
      name: item.name || 'Product',
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity) || 1,
      image: item.image || '',
    }));

    // Calculate or fallback prices
    const calcSubtotal =
      subtotal !== undefined
        ? parseFloat(subtotal)
        : formattedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

    const calcShipping = shippingFee !== undefined ? parseFloat(shippingFee) : (calcSubtotal >= 50 ? 0 : 9.99);
    const calcTax = tax !== undefined ? parseFloat(tax) : parseFloat((calcSubtotal * 0.08).toFixed(2));
    const calcDiscount = discount !== undefined ? parseFloat(discount) : 0;
    const calcTotal =
      totalPrice !== undefined
        ? parseFloat(totalPrice)
        : parseFloat((calcSubtotal - calcDiscount + calcShipping + calcTax).toFixed(2));

    const method = paymentMethod || 'card';
    const payStatus = method === 'cod' ? 'Cash on Delivery' : 'Paid';

    const newOrder = new Order({
      user: req.user.userId,
      items: formattedItems,
      shippingAddress: shippingData || {},
      address:
        address ||
        (shippingData
          ? `${shippingData.firstName} ${shippingData.lastName}, ${shippingData.address}, ${shippingData.city}, ${shippingData.country}`
          : 'Standard Delivery Address'),
      subtotal: parseFloat(calcSubtotal.toFixed(2)),
      shippingFee: parseFloat(calcShipping.toFixed(2)),
      tax: parseFloat(calcTax.toFixed(2)),
      discount: parseFloat(calcDiscount.toFixed(2)),
      totalPrice: parseFloat(calcTotal.toFixed(2)),
      paymentMethod: method,
      paymentStatus: payStatus,
      status: 'Pending',
    });

    const savedOrder = await newOrder.save();

    // Decrement stock for matching products if found in database
    for (const item of formattedItems) {
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        }).catch(() => {});
      }
    }

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: savedOrder._id,
      order: savedOrder,
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ===== GET MY ORDERS =====
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error('Fetch my-orders error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===== GET SINGLE ORDER BY ID =====
router.get('/single/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Check authorization: must be the owner or an admin
    if (order.user._id.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied to this order.' });
    }

    res.json(order);
  } catch (err) {
    console.error('Fetch order detail error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===== USER: CANCEL PENDING ORDER =====
router.post('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.user.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this order.' });
    }

    const currentStatus = order.status.toLowerCase();
    if (currentStatus !== 'pending') {
      return res.status(400).json({
        message: `Order cannot be cancelled because it is already ${order.status}.`,
      });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully!', order });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Failed to cancel order.' });
  }
});

// ===== ADMIN: GET ALL ORDERS =====
router.get('/admin/all', verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Admin fetch orders error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===== ADMIN: DASHBOARD STATS =====
router.get('/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();

    // Total revenue from all non-cancelled orders
    const nonCancelled = await Order.find({ status: { $ne: 'Cancelled' } });
    const totalRevenue = nonCancelled.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    // Status breakdown
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['Pending', 'pending'] },
    });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

    // Latest 6 orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      totalProducts,
      totalUsers,
      breakdown: {
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      recentOrders,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to fetch admin stats.' });
  }
});

// ===== ADMIN: UPDATE ORDER STATUS =====
router.patch('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.status = status;
    if (status === 'Delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'Paid';
    }

    const updated = await order.save();
    res.json({ message: `Order status updated to ${status}!`, order: updated });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Failed to update order status.' });
  }
});

module.exports = router;
