const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { ORDER_STATUS } = require('../config/constants');
const { sendOrderConfirmation, sendOrderStatusUpdate, sendAdminNotification } = require('../utils/email');

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public
router.post('/', [
  body('customer.name').notEmpty().withMessage('Customer name is required'),
  body('customer.email').isEmail().withMessage('Valid email is required'),
  body('customer.phone').notEmpty().withMessage('Phone number is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('specifications.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('designFiles').isArray().withMessage('Design files must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      customer,
      serviceType,
      specifications,
      designFiles,
      paymentMethod,
      preferredDeadline,
      adminNotes
    } = req.body;

    // Calculate total amount
    let totalAmount = 0;
    const product = await Product.findOne({ 
      category: serviceType,
      isActive: true
    });
    
    if (product) {
      totalAmount = product.basePrice * specifications.quantity;
      // Add customization fees if any
      // totalAmount += additionalFees;
    } else {
      // Fallback pricing if product not found
      const basePrices = {
        'sticker-cutting': 50,
        'laser-cutting': 200,
        'tshirt-printing': 850,
        'acrylic-nameplate': 1200
      };
      totalAmount = (basePrices[serviceType] || 100) * specifications.quantity;
    }

    // Create order
    const order = new Order({
      customer: {
        name: customer.name.trim(),
        email: customer.email.toLowerCase(),
        phone: customer.phone.trim(),
        address: customer.address || '',
        company: customer.company || ''
      },
      serviceType,
      specifications: {
        quantity: specifications.quantity,
        dimensions: specifications.dimensions || '',
        material: specifications.material || '',
        color: specifications.color || '',
        finish: specifications.finish || '',
        additionalNotes: specifications.additionalNotes || '',
        customFields: specifications.customFields || {}
      },
      designFiles: designFiles || [],
      totalAmount,
      paymentMethod: paymentMethod || 'cod',
      preferredDeadline: preferredDeadline ? new Date(preferredDeadline) : null,
      adminNotes: adminNotes || ''
    });

    await order.save();

    // Send confirmation emails
    await Promise.all([
      sendOrderConfirmation(order),
      sendAdminNotification(order)
    ]);

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        serviceType: order.serviceType,
        totalAmount: order.totalAmount,
        status: order.status,
        estimatedCompletion: order.estimatedCompletion,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating order'
    });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (with filtering)
// @access  Private (Admin/Manager)
router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { 
      status, 
      serviceType,
      startDate,
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (serviceType && serviceType !== 'all') filter.serviceType = serviceType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    // Add virtual fields
    const ordersWithVirtuals = orders.map(order => ({
      ...order.toObject(),
      serviceLabel: order.serviceLabel,
      estimatedCompletion: order.estimatedCompletion
    }));

    res.json({
      success: true,
      data: ordersWithVirtuals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching orders'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get a single order by ID
// @access  Private (Admin/Manager)
router.get('/:id', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid order ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order: {
        ...order.toObject(),
        serviceLabel: order.serviceLabel,
        estimatedCompletion: order.estimatedCompletion
      }
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching order'
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order details
// @access  Private (Admin/Manager)
router.put('/:id', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').optional().isIn(Object.values(ORDER_STATUS)).withMessage('Invalid status'),
  body('customer.name').optional().notEmpty().withMessage('Customer name is required'),
  body('customer.email').optional().isEmail().withMessage('Valid email is required'),
  body('specifications.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const oldStatus = order.status;
    const updates = req.body;

    // Handle status change
    if (updates.status && updates.status !== oldStatus) {
      // Add to status history
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: updates.status,
        note: updates.statusNote || `Status updated from ${oldStatus} to ${updates.status}`,
        updatedBy: req.user._id,
        updatedAt: new Date()
      });

      // Send email notification for status change
      await sendOrderStatusUpdate(order, oldStatus, updates.status);
    }

    // Update fields
    if (updates.customer) {
      order.customer = { ...order.customer, ...updates.customer };
    }
    if (updates.specifications) {
      order.specifications = { ...order.specifications, ...updates.specifications };
    }
    if (updates.totalAmount) order.totalAmount = updates.totalAmount;
    if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus;
    if (updates.paymentMethod) order.paymentMethod = updates.paymentMethod;
    if (updates.adminNotes) order.adminNotes = updates.adminNotes;
    if (updates.status) order.status = updates.status;
    if (updates.designFiles) order.designFiles = updates.designFiles;

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        ...order.toObject(),
        serviceLabel: order.serviceLabel,
        estimatedCompletion: order.estimatedCompletion
      }
    });
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating order'
    });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status only
// @access  Private (Admin/Manager)
router.patch('/:id/status', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').isIn(Object.values(ORDER_STATUS)).withMessage('Invalid status'),
  body('note').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const oldStatus = order.status;
    const newStatus = req.body.status;

    if (oldStatus === newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Order is already in this status'
      });
    }

    // Add to status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: newStatus,
      note: req.body.note || `Status updated from ${oldStatus} to ${newStatus}`,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });

    order.status = newStatus;
    order.updatedAt = new Date();
    await order.save();

    // Send email notification
    await sendOrderStatusUpdate(order, oldStatus, newStatus);

    res.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusHistory: order.statusHistory
      }
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating status'
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete an order
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid order ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Order deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting order'
    });
  }
});

// @route   GET /api/orders/stats
// @desc    Get order statistics
// @access  Private (Admin/Manager)
router.get('/stats/dashboard', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const [totalOrders, pendingOrders, statusCounts, revenue] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const statusMap = {};
    statusCounts.forEach(item => {
      statusMap[item._id] = item.count;
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        statusCounts: statusMap,
        revenue: revenue[0]?.total || 0,
        recentOrders: recentOrders.map(order => ({
          ...order.toObject(),
          serviceLabel: order.serviceLabel
        }))
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching stats'
    });
  }
});

module.exports = router;