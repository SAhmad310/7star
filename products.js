const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { SERVICE_TYPES } = require('../config/constants');

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, featured, active } = req.query;

    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (active === 'true') filter.isActive = true;

    const products = await Product.find(filter)
      .sort({ category: 1, order: 1 });

    res.json({
      success: true,
      data: products.map(product => ({
        ...product.toObject(),
        displayPrice: product.displayPrice
      }))
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching products'
    });
  }
});

// @route   GET /api/products/:slug
// @desc    Get single product by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        displayPrice: product.displayPrice
      }
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching product'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin/Manager)
router.post('/', [
  protect,
  authorize('admin', 'manager'),
  body('name').notEmpty().withMessage('Name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('basePrice').isNumeric().withMessage('Base price must be a number'),
  body('category').isIn(Object.values(SERVICE_TYPES)).withMessage('Invalid category'),
  body('customFieldsRequired').optional().isArray().withMessage('Custom fields must be an array')
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
      name,
      description,
      basePrice,
      priceUnit,
      category,
      customFieldsRequired,
      features,
      imageUrl,
      isActive,
      isFeatured,
      minOrderQuantity,
      maxOrderQuantity,
      preparationTime,
      metadata
    } = req.body;

    // Check if product already exists
    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this name already exists'
      });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      basePrice,
      priceUnit: priceUnit || 'per_piece',
      category,
      customFieldsRequired: customFieldsRequired || [],
      features: features || [],
      imageUrl: imageUrl || '',
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      minOrderQuantity: minOrderQuantity || 1,
      maxOrderQuantity: maxOrderQuantity || null,
      preparationTime: preparationTime || 3,
      metadata: metadata || {}
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating product'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin/Manager)
router.put('/:id', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('basePrice').optional().isNumeric().withMessage('Base price must be a number'),
  body('category').optional().isIn(Object.values(SERVICE_TYPES)).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const updates = req.body;
    
    // If name is being updated, check for duplicates
    if (updates.name && updates.name !== product.name) {
      const existing = await Product.findOne({ 
        name: updates.name.trim(),
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Product with this name already exists'
        });
      }
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        product[key] = updates[key];
      }
    });

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        ...product.toObject(),
        displayPrice: product.displayPrice
      }
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating product'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting product'
    });
  }
});

// @route   PATCH /api/products/:id/toggle-active
// @desc    Toggle product active status
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-active', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: product._id,
        name: product.name,
        isActive: product.isActive
      }
    });
  } catch (error) {
    console.error('Toggle active error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while toggling product status'
    });
  }
});

module.exports = router;