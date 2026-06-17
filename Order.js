const mongoose = require('mongoose');
const { ORDER_STATUS, SERVICE_TYPES } = require('../config/constants');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    }
  },
  serviceType: {
    type: String,
    enum: Object.values(SERVICE_TYPES),
    required: true
  },
  specifications: {
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    dimensions: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    finish: {
      type: String,
      trim: true
    },
    additionalNotes: {
      type: String,
      trim: true
    },
    customFields: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  designFiles: [{
    url: String,
    filename: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded', 'partially_paid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'bank_transfer'],
    default: 'cod'
  },
  preferredDeadline: {
    type: Date
  },
  adminNotes: {
    type: String,
    trim: true
  },
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS)
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `SSP-${String(count + 10001).padStart(5, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

// Add status to history when status changes
OrderSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.status) {
    // We'll handle this in the route for better control
  }
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual for estimated completion date
OrderSchema.virtual('estimatedCompletion').get(function() {
  const days = {
    'sticker-cutting': 3,
    'laser-cutting': 4,
    'tshirt-printing': 5,
    'acrylic-nameplate': 5
  };
  const daysToAdd = days[this.serviceType] || 5;
  const date = new Date(this.createdAt);
  date.setDate(date.getDate() + daysToAdd);
  return date;
});

// Virtual for service label
OrderSchema.virtual('serviceLabel').get(function() {
  const labels = {
    'sticker-cutting': 'Sticker Cutting',
    'laser-cutting': 'Laser Cutting',
    'tshirt-printing': 'T-shirt Printing',
    'acrylic-nameplate': 'Acrylic Nameplate'
  };
  return labels[this.serviceType] || this.serviceType;
});

module.exports = mongoose.model('Order', OrderSchema);