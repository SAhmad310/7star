const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  priceUnit: {
    type: String,
    required: true,
    enum: ['per_piece', 'per_sqft', 'per_sticker', 'per_shirt', 'per_set'],
    default: 'per_piece'
  },
  category: {
    type: String,
    required: true,
    enum: ['sticker-cutting', 'laser-cutting', 'tshirt-printing', 'acrylic-nameplate']
  },
  customFieldsRequired: [{
    type: String,
    enum: ['designFile', 'dimensions', 'material', 'color', 'finish', 'text']
  }],
  features: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  minOrderQuantity: {
    type: Number,
    default: 1
  },
  maxOrderQuantity: {
    type: Number
  },
  preparationTime: {
    type: Number, // in days
    default: 3
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create slug before saving
ProductSchema.pre('save', function(next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  this.updatedAt = new Date();
  next();
});

// Virtual for display price
ProductSchema.virtual('displayPrice').get(function() {
  const units = {
    'per_piece': '/ piece',
    'per_sqft': '/ sq ft',
    'per_sticker': '/ sticker',
    'per_shirt': '/ shirt',
    'per_set': '/ set'
  };
  return `PKR ${this.basePrice} ${units[this.priceUnit] || ''}`;
});

module.exports = mongoose.model('Product', ProductSchema);