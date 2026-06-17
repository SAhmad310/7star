const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const Contact = require('../models/Contact');
const { protect, authorize } = require('../middleware/auth');
const { sendContactReply } = require('../utils/email');

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message } = req.body;

    const contact = new Contact({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone || '',
      subject: subject || '',
      message: message.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    });

    await contact.save();

    // Auto-reply to user
    // sendContactReply(contact); // Uncomment when email is configured

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We\'ll respond within 24 hours.'
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while sending message'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages
// @access  Private (Admin/Manager)
router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [messages, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Contact.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Contact messages fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching messages'
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get single contact message
// @access  Private (Admin/Manager)
router.get('/:id', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid contact ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Mark as read
    if (!contact.isRead) {
      contact.isRead = true;
      await contact.save();
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Contact message fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching message'
    });
  }
});

// @route   POST /api/contact/:id/reply
// @desc    Reply to contact message
// @access  Private (Admin/Manager)
router.post('/:id/reply', [
  protect,
  authorize('admin', 'manager'),
  param('id').isMongoId().withMessage('Invalid contact ID'),
  body('replyContent').notEmpty().withMessage('Reply content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    contact.isReplied = true;
    contact.repliedAt = new Date();
    contact.repliedBy = req.user._id;
    contact.replyContent = req.body.replyContent.trim();

    await contact.save();

    // Send email reply
    await sendContactReply(contact);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: contact
    });
  } catch (error) {
    console.error('Contact reply error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while sending reply'
    });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact message
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid contact ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Contact message deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting message'
    });
  }
});

module.exports = router;