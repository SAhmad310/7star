const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Gallery = require('./models/Gallery');
require('dotenv').config();

// Sample data
const users = [
  {
    email: 'admin@sevenstarpress.pk',
    passwordHash: 'SevenStar@2025Admin',
    name: 'Admin User',
    role: 'admin',
    isActive: true
  }
];

const products = [
  {
    name: 'Sticker Cutting',
    slug: 'sticker-cutting',
    description: 'Custom die-cut and kiss-cut stickers in any shape. Vinyl-grade durability for indoor and outdoor use.',
    basePrice: 50,
    priceUnit: 'per_sticker',
    category: 'sticker-cutting',
    customFieldsRequired: ['designFile', 'dimensions', 'material', 'color'],
    features: ['Kiss-cut & die-cut options', 'Waterproof vinyl material', 'Gloss, matte & clear finishes', 'Full CMYK colour printing'],
    isActive: true,
    isFeatured: true,
    minOrderQuantity: 1,
    preparationTime: 3
  },
  {
    name: 'Laser Cutting',
    slug: 'laser-cutting',
    description: 'Precision laser cutting for wood, acrylic, cardstock, and leather. Complex shapes with hair-line accuracy.',
    basePrice: 200,
    priceUnit: 'per_piece',
    category: 'laser-cutting',
    customFieldsRequired: ['designFile', 'dimensions', 'material'],
    features: ['0.1mm precision tolerance', 'Acrylic, wood, leather, card', 'Engraving & etching', 'Custom sizes up to A0'],
    isActive: true,
    isFeatured: true,
    minOrderQuantity: 1,
    preparationTime: 4
  },
  {
    name: 'T-shirt Printing',
    slug: 'tshirt-printing',
    description: 'DTG, screen printing, and heat transfer. Vivid, wash-fast colours on any garment — perfect for teams and events.',
    basePrice: 850,
    priceUnit: 'per_shirt',
    category: 'tshirt-printing',
    customFieldsRequired: ['designFile', 'color', 'material'],
    features: ['DTG, screen print & heat transfer', 'All fabric types accepted', 'Front, back & sleeve prints', 'Pantone colour matching'],
    isActive: true,
    isFeatured: true,
    minOrderQuantity: 1,
    preparationTime: 5
  },
  {
    name: 'Acrylic Nameplate',
    slug: 'acrylic-nameplate',
    description: 'Premium engraved acrylic nameplates for offices, doors, and desks. Polished edges and UV-stable inks.',
    basePrice: 1200,
    priceUnit: 'per_piece',
    category: 'acrylic-nameplate',
    customFieldsRequired: ['designFile', 'dimensions', 'text', 'color'],
    features: ['5mm cast acrylic standard', 'Multiple colour options', 'Laser engraved text & logo', 'Wall-mount hardware included'],
    isActive: true,
    isFeatured: true,
    minOrderQuantity: 1,
    preparationTime: 5
  }
];

// Gallery sample data
const galleryData = [
  {
    title: 'Holographic Vinyl Stickers',
    category: 'sticker-cutting',
    imageUrl: '/uploads/gallery/holographic-stickers.jpg',
    thumbnailUrl: '/uploads/gallery/thumb_holographic-stickers.jpg',
    isFeatured: true,
    isApproved: true
  },
  {
    title: 'Event T-shirt Collection',
    category: 'tshirt-printing',
    imageUrl: '/uploads/gallery/event-tshirts.jpg',
    thumbnailUrl: '/uploads/gallery/thumb_event-tshirts.jpg',
    isFeatured: true,
    isApproved: true
  },
  {
    title: 'Wooden Logo Cutouts',
    category: 'laser-cutting',
    imageUrl: '/uploads/gallery/wooden-cutouts.jpg',
    thumbnailUrl: '/uploads/gallery/thumb_wooden-cutouts.jpg',
    isFeatured: true,
    isApproved: true
  },
  {
    title: 'Office Door Nameplates',
    category: 'acrylic-nameplate',
    imageUrl: '/uploads/gallery/office-nameplates.jpg',
    thumbnailUrl: '/uploads/gallery/thumb_office-nameplates.jpg',
    isFeatured: true,
    isApproved: true
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Gallery.deleteMany();
    console.log('🗑️  Cleared existing data');

    // Seed users
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Seed products
    const createdProducts = await Product.create(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Seed gallery (with references)
    const galleryWithUser = galleryData.map(item => ({
      ...item,
      uploadedBy: createdUsers[0]._id
    }));
    const createdGallery = await Gallery.create(galleryWithUser);
    console.log(`✅ Created ${createdGallery.length} gallery items`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();