const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Default initial products catalog used for auto-seeding
const defaultProducts = [
  {
    name: 'Wireless Headphones',
    category: 'electronics',
    price: 59.99,
    oldPrice: 79.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 24,
    stock: 15,
    badge: 'Bestseller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    description: 'High quality wireless headphones with active noise cancellation, deep bass, and 30-hour battery life.',
  },
  {
    name: 'Running Shoes Pro',
    category: 'clothing',
    price: 89.99,
    oldPrice: 119.99,
    discount: '25% OFF',
    rating: 4,
    numReviews: 18,
    stock: 20,
    badge: 'Sale',
    featured: true,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    description: 'Lightweight, ultra-breathable running shoes designed for maximum comfort on all terrains.',
  },
  {
    name: 'Mastering JavaScript Guide',
    category: 'books',
    price: 29.99,
    oldPrice: 39.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 32,
    stock: 25,
    badge: 'Trending',
    featured: false,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    description: 'Learn modern JavaScript from ES6 to advanced asynchronous patterns with real-world project examples.',
  },
  {
    name: 'Smart Watch Series 7',
    category: 'electronics',
    price: 199.99,
    oldPrice: 249.99,
    discount: '20% OFF',
    rating: 5,
    numReviews: 40,
    stock: 12,
    badge: 'Bestseller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    description: 'Feature-packed smartwatch with AMOLED always-on display, heart-rate monitoring, and water resistance.',
  },
  {
    name: 'Italian Espresso Maker',
    category: 'home',
    price: 49.99,
    oldPrice: 69.99,
    discount: '28% OFF',
    rating: 4,
    numReviews: 15,
    stock: 18,
    badge: 'Popular',
    featured: false,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    description: 'Brew barista-style espresso at home every morning with pressurized extraction and milk frother.',
  },
  {
    name: 'Classic Vintage Denim Jacket',
    category: 'clothing',
    price: 69.99,
    oldPrice: 99.99,
    discount: '30% OFF',
    rating: 4,
    numReviews: 19,
    stock: 14,
    badge: 'Sale',
    featured: true,
    image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=400',
    description: 'Timeless denim jacket with durable stitching, metal button accents, and comfortable modern relaxed fit.',
  },
  {
    name: 'Portable Bluetooth Speaker',
    category: 'electronics',
    price: 39.99,
    oldPrice: 54.99,
    discount: '27% OFF',
    rating: 5,
    numReviews: 28,
    stock: 30,
    badge: 'Hot',
    featured: false,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    description: 'Waterproof portable bluetooth speaker with 360-degree surround sound, punchy bass, and 14-hour playback.',
  },
  {
    name: 'Python for Data Science',
    category: 'books',
    price: 34.99,
    oldPrice: 44.99,
    discount: '22% OFF',
    rating: 5,
    numReviews: 12,
    stock: 22,
    badge: 'New',
    featured: false,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    description: 'A comprehensive handbook for learning Python, NumPy, Pandas, visualization, and machine learning models.',
  },
  {
    name: 'Radiance Vitamin C Face Serum',
    category: 'beauty',
    price: 44.99,
    oldPrice: 59.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 50,
    stock: 40,
    badge: 'Bestseller',
    featured: true,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    description: 'Organic antioxidant-rich facial serum for hydration, brightness, fine line reduction, and radiant skin.',
  },
  {
    name: 'Luxury Matte Lipstick Set',
    category: 'beauty',
    price: 24.99,
    oldPrice: 35.00,
    discount: '29% OFF',
    rating: 4,
    numReviews: 35,
    stock: 50,
    badge: 'Popular',
    featured: false,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
    description: 'Velvety smooth, long-lasting matte lipsticks formulated with moisturizing Vitamin E.',
  },
  {
    name: 'Stainless Steel Chef Knife Set',
    category: 'home',
    price: 79.99,
    oldPrice: 110.00,
    discount: '27% OFF',
    rating: 5,
    numReviews: 16,
    stock: 10,
    badge: 'Premium',
    featured: true,
    image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400',
    description: 'High-carbon Japanese stainless steel kitchen knives for precision slicing, chopping, and meal prep.',
  },
  {
    name: 'Minimalist Cotton Casual Shirt',
    category: 'clothing',
    price: 39.99,
    oldPrice: 49.99,
    discount: '20% OFF',
    rating: 4,
    numReviews: 21,
    stock: 18,
    badge: 'New',
    featured: false,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400',
    description: 'Breathable 100% organic cotton casual button-down shirt for effortless daily styling.',
  },
];

// Helper to auto-seed if empty
async function ensureProductsSeeded() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(defaultProducts);
    console.log('🌱 Database seeded with default products catalog.');
  }
}

// ===== GET ALL PRODUCTS (with Search, Filter, Sort, Category) =====
router.get('/', async (req, res) => {
  try {
    await ensureProductsSeeded();

    const { category, search, minPrice, maxPrice, sort, tab } = req.query;
    let query = {};

    // Category filter
    if (category && category !== 'all') {
      query.category = category.toLowerCase().trim();
    }

    // Tab filter
    if (tab === 'bestseller') {
      query.$or = [{ badge: 'Bestseller' }, { rating: { $gte: 5 } }];
    } else if (tab === 'special') {
      query.discount = { $ne: '' };
    }

    // Search filter
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price-low') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-high') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1, numReviews: -1 };
    } else if (sort === 'name') {
      sortOptions = { name: 1 };
    }

    const products = await Product.find(query).sort(sortOptions);
    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

// ===== GET CATEGORIES & COUNTS =====
router.get('/categories/list', async (req, res) => {
  try {
    await ensureProductsSeeded();
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(categories);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ message: 'Failed to fetch categories.' });
  }
});

// ===== GET SINGLE PRODUCT BY ID =====
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }

    // If not found by ObjectId, try matching by name or default list index
    if (!product) {
      const all = await Product.find();
      const num = parseInt(id);
      if (!isNaN(num) && num > 0 && num <= all.length) {
        product = all[num - 1];
      }
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(product);
  } catch (err) {
    console.error('Fetch product detail error:', err);
    res.status(500).json({ message: 'Failed to fetch product.' });
  }
});

// ===== ADMIN: CREATE NEW PRODUCT =====
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      oldPrice,
      discount,
      image,
      stock,
      description,
      badge,
      featured,
    } = req.body;

    if (!name || !category || price === undefined || !description) {
      return res.status(400).json({
        message: 'Name, category, price, and description are required.',
      });
    }

    const newProduct = new Product({
      name: name.trim(),
      category: category.toLowerCase().trim(),
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : 0,
      discount: discount || '',
      image:
        image ||
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      stock: stock !== undefined ? parseInt(stock) : 10,
      description: description.trim(),
      badge: badge || '',
      featured: featured === true || featured === 'true',
      rating: 5,
      numReviews: 0,
    });

    const saved = await newProduct.save();
    res.status(201).json({ message: 'Product created successfully!', product: saved });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Failed to create product.' });
  }
});

// ===== ADMIN: UPDATE PRODUCT =====
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.oldPrice) updateData.oldPrice = parseFloat(updateData.oldPrice);
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);

    const updated = await Product.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
    if (!updated) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Product updated successfully!', product: updated });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Failed to update product.' });
  }
});

// ===== ADMIN: DELETE PRODUCT =====
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Product deleted successfully!' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
});

// ===== ADD REVIEW TO PRODUCT =====
router.post('/:id/reviews', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const userName = req.userDetails ? req.userDetails.name : 'Verified Customer';

    const newReview = {
      user: req.user.userId,
      name: userName,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date(),
    };

    product.reviews.push(newReview);
    product.numReviews = product.reviews.length;
    const totalStars = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    product.rating = Math.round(totalStars / product.reviews.length);

    await product.save();

    res.status(201).json({
      message: 'Review added successfully!',
      review: newReview,
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({ message: 'Failed to submit review.' });
  }
});

module.exports = router;
