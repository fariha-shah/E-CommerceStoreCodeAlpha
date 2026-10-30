const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

const seedProducts = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    category: 'electronics',
    price: 59.99,
    oldPrice: 79.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 24,
    stock: 15,
    badge: 'Bestseller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    description: 'High-fidelity audio with active noise cancellation, deep bass response, ultra-soft memory foam earcups, and 30 hours of continuous wireless playback.',
    reviews: [
      {
        name: 'Sarah Ahmed',
        rating: 5,
        comment: 'Amazing sound quality and battery life! Noise cancellation is super effective on flights.',
      },
      {
        name: 'Bilal Khan',
        rating: 5,
        comment: 'Best purchase ever. Bass is punchy and microphone is crystal clear for calls.',
      },
    ],
  },
  {
    name: 'AeroStride Pro Running Shoes',
    category: 'clothing',
    price: 89.99,
    oldPrice: 119.99,
    discount: '25% OFF',
    rating: 4,
    numReviews: 18,
    stock: 20,
    badge: 'Sale',
    featured: true,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    description: 'Engineered for athletes and everyday runners with lightweight responsive foam cushioning, reinforced arch support, and breathable honeycomb mesh upper.',
    reviews: [
      {
        name: 'Usman Ali',
        rating: 4,
        comment: 'Very comfortable for 10k morning jogs. Fits true to size.',
      },
    ],
  },
  {
    name: 'Mastering JavaScript & Web Development',
    category: 'books',
    price: 29.99,
    oldPrice: 39.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 32,
    stock: 25,
    badge: 'Trending',
    featured: false,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    description: 'A comprehensive, project-driven guide covering modern JavaScript (ES6+), asynchronous programming, APIs, Node.js backend architecture, and design patterns.',
  },
  {
    name: 'Apex Smart Watch Series 7',
    category: 'electronics',
    price: 199.99,
    oldPrice: 249.99,
    discount: '20% OFF',
    rating: 5,
    numReviews: 40,
    stock: 12,
    badge: 'Bestseller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    description: 'Sleek luxury smartwatch with vibrant AMOLED display, SpO2 blood oxygen tracking, 24/7 heart-rate tracking, GPS tracking, and IP68 waterproof rating.',
    reviews: [
      {
        name: 'Hamza Farooq',
        rating: 5,
        comment: 'Battery lasts 5 days without any issue. Looks ultra-premium on the wrist.',
      },
    ],
  },
  {
    name: 'Artisan Espresso Coffee Machine',
    category: 'home',
    price: 49.99,
    oldPrice: 69.99,
    discount: '28% OFF',
    rating: 4,
    numReviews: 15,
    stock: 18,
    badge: 'Popular',
    featured: false,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
    description: '15-bar Italian pump espresso machine featuring automatic thermo-block heating, integrated high-pressure steam wand, and detachable stainless drip tray.',
  },
  {
    name: 'Heritage Classic Denim Jacket',
    category: 'clothing',
    price: 69.99,
    oldPrice: 99.99,
    discount: '30% OFF',
    rating: 4,
    numReviews: 19,
    stock: 14,
    badge: 'Sale',
    featured: true,
    image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=500',
    description: 'Authentic 100% premium denim jacket with vintage wash, reinforced flat-felled seams, dual chest flap pockets, and custom antique brass hardware buttons.',
  },
  {
    name: 'Surround Bass Bluetooth Speaker',
    category: 'electronics',
    price: 39.99,
    oldPrice: 54.99,
    discount: '27% OFF',
    rating: 5,
    numReviews: 28,
    stock: 30,
    badge: 'Hot',
    featured: false,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
    description: 'Compact rugged bluetooth speaker delivering 360-degree high-clarity sound, passive bass radiator, 12-hour rechargeable battery, and outdoor waterproofing.',
  },
  {
    name: 'Python for Modern Data Science & AI',
    category: 'books',
    price: 34.99,
    oldPrice: 44.99,
    discount: '22% OFF',
    rating: 5,
    numReviews: 12,
    stock: 22,
    badge: 'New',
    featured: false,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
    description: 'Master Python data pipelines, NumPy manipulation, Pandas analysis, Seaborn data visualization, and applied scikit-learn machine learning algorithms.',
  },
  {
    name: 'Glow Boost Vitamin C Radiance Serum',
    category: 'beauty',
    price: 44.99,
    oldPrice: 59.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 50,
    stock: 40,
    badge: 'Bestseller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
    description: 'Concentrated 20% Vitamin C face serum enriched with Hyaluronic Acid and Ferulic Acid to revitalize dull skin, fade blemishes, and provide all-day glow.',
  },
  {
    name: 'Velvet Silk Matte Lipstick Collection',
    category: 'beauty',
    price: 24.99,
    oldPrice: 35.00,
    discount: '29% OFF',
    rating: 4,
    numReviews: 35,
    stock: 50,
    badge: 'Popular',
    featured: false,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500',
    description: 'Pack of rich, transfer-proof matte lipsticks with weightless velvety moisture feel that lasts up to 16 hours without cracking.',
  },
  {
    name: 'Japanese High-Carbon Chef Knife Set',
    category: 'home',
    price: 79.99,
    oldPrice: 110.00,
    discount: '27% OFF',
    rating: 5,
    numReviews: 16,
    stock: 10,
    badge: 'Premium',
    featured: true,
    image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500',
    description: 'Razor-sharp precision culinary cutlery set crafted from high-carbon steel with ergonomic pakkawood handles and acrylic display block.',
  },
  {
    name: 'Relaxed Fit Cotton Oxford Shirt',
    category: 'clothing',
    price: 39.99,
    oldPrice: 49.99,
    discount: '20% OFF',
    rating: 4,
    numReviews: 21,
    stock: 18,
    badge: 'New',
    featured: false,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500',
    description: 'Soft-washed 100% natural organic cotton oxford shirt offering breathable casual style, chest pocket, and mother-of-pearl buttons.',
  },
];

async function runSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products.');

    // Insert new products
    const inserted = await Product.insertMany(seedProducts);
    console.log(`✨ Successfully seeded ${inserted.length} products!`);

    // Ensure Admin account
    const adminHashed = await bcrypt.hash('admin123', 10);
    await User.findOneAndUpdate(
      { email: 'admin@shopeasy.com' },
      {
        name: 'Store Administrator',
        email: 'admin@shopeasy.com',
        password: adminHashed,
        isAdmin: true,
        phone: '+92 300 1234567',
        address: 'ShopEasy Plaza, Main Shahrah-e-Faisal',
        city: 'Karachi',
        postal: '75000',
        country: 'Pakistan',
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('👑 Admin user configured: admin@shopeasy.com / admin123');

    // Ensure Test customer account
    const testHashed = await bcrypt.hash('test123456', 10);
    await User.findOneAndUpdate(
      { email: 'test@example.com' },
      {
        name: 'Test Customer',
        email: 'test@example.com',
        password: testHashed,
        isAdmin: false,
        phone: '+92 321 9876543',
        address: 'Apartment 12, Gulberg III',
        city: 'Lahore',
        postal: '54000',
        country: 'Pakistan',
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('👤 Customer test user configured: test@example.com / test123456');

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
