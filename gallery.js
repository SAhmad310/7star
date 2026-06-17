const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const Gallery = require('../models/Gallery');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// @route   GET /api/gallery
// @desc    Get all gallery items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, featured, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    filter.isApproved = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, total] = await Promise.all([
      Gallery.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('uploadedBy', 'name email'),
      Gallery.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching gallery'
    });
  }
});

// @route   POST /api/gallery
// @desc    Add new gallery item
// @access  Private (Admin/Manager)
router.post('/', [
  protect,
  authorize('admin', 'manager'),
  upload.single('image'),
  handleUploadError,
  body('title').notEmpty().withMessage('Title is required'),
  body('category').isIn(['sticker-cutting', 'laser-cutting', 'tshirt-printing', 'acrylic-nameplate', 'other']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      });
    }

    const { title, category, description, tags, isFeatured, order } = req.body;

    // Generate thumbnail using sharp
    const thumbnailPath = path.join(
      path.dirname(req.file.path),
      'thumb_' + path.basename(req.file.path)
    );
    
    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Get image metadata
    const metadata = await sharp(req.file.path).metadata();

    const galleryItem = new Gallery({
      title: title.trim(),
      category,
      description: description || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      imageUrl: `/uploads/gallery/${path.basename(req.file.path)}`,
      thumbnailUrl: `/uploads/gallery/thumb_${path.basename(req.file.path)}`,
      uploadedBy: req.user._id,
      isFeatured: isFeatured === 'true',
      order: parseInt(order) || 0,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    await galleryItem.save();

    // Populate uploadedBy before sending response
    await galleryItem.populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Gallery item added successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Gallery creation error:', error);
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: 'Server error while adding gallery item'
    });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Update gallery item
// @access  Private (Admin/Manager)
router.put('/:id', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid gallery ID'),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('category').optional().isIn(['sticker-cutting', 'laser-cutting', 'tshirt-printing', 'acrylic-nameplate', 'other']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, category, description, tags, isFeatured, order, isApproved } = req.body;
    const updates = {};

    if (title) updates.title = title.trim();
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags.split(',').map(t => t.trim());
    if (isFeatured !== undefined) updates.isFeatured = isFeatured === 'true';
    if (order !== undefined) updates.order = parseInt(order);
    if (isApproved !== undefined) updates.isApproved = isApproved === 'true';

    const galleryItem = await Gallery.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        error: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Gallery update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating gallery item'
    });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery item
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid gallery ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        error: 'Gallery item not found'
      });
    }

    // Delete files from filesystem
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const imagePath = path.join(uploadDir, 'gallery', path.basename(galleryItem.imageUrl));
    const thumbnailPath = path.join(uploadDir, 'gallery', path.basename(galleryItem.thumbnailUrl));

    [imagePath, thumbnailPath].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await galleryItem.deleteOne();

    res.json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Gallery deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting gallery item'
    });
  }
});

// @route   POST /api/gallery/bulk-upload
// @desc    Bulk upload gallery images
// @access  Private (Admin/Manager)
router.post('/bulk-upload', [
  protect,
  authorize('admin', 'manager'),
  upload.array('images', 10),
  handleUploadError,
  body('category').isIn(['sticker-cutting', 'laser-cutting', 'tshirt-printing', 'acrylic-nameplate', 'other']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one image file is required'
      });
    }

    const { category, description, tags, isFeatured } = req.body;
    const uploadedItems = [];

    for (const file of req.files) {
      // Generate thumbnail
      const thumbnailPath = path.join(
        path.dirname(file.path),
        'thumb_' + path.basename(file.path)
      );
      
      await sharp(file.path)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      const metadata = await sharp(file.path).metadata();

      const galleryItem = new Gallery({
        title: path.basename(file.originalname, path.extname(file.originalname)),
        category,
        description: description || '',
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        imageUrl: `/uploads/gallery/${path.basename(file.path)}`,
        thumbnailUrl: `/uploads/gallery/thumb_${path.basename(file.path)}`,
        uploadedBy: req.user._id,
        isFeatured: isFeatured === 'true',
        metadata: {
          width: metadata.width,
          height: metadata.height,
          size: file.size,
          mimeType: file.mimetype
        }
      });

      await galleryItem.save();
      uploadedItems.push(galleryItem);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedItems.length} gallery items uploaded successfully`,
      data: uploadedItems
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during bulk upload'
    });
  }
});

module.exports = router;