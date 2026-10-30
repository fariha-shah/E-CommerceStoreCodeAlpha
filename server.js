const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mysessionsecret456',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// =====================
// DATABASE CONNECTION
// =====================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully!');

    // Auto-seed admin user and products if needed
    try {
      const User = require('./models/User');
      const Product = require('./models/Product');
      const bcrypt = require('bcryptjs');

      // Check admin
      const adminExists = await User.findOne({ email: 'admin@shopeasy.com' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          name: 'Store Administrator',
          email: 'admin@shopeasy.com',
          password: hashedPassword,
          isAdmin: true,
          phone: '+92 300 1234567',
          address: 'Headquarters, ShopEasy Tower',
          city: 'Karachi',
          postal: '75000',
          country: 'Pakistan',
        });
        console.log('👑 Default Admin Account created: admin@shopeasy.com / admin123');
      }

      // Check test customer
      const testUserExists = await User.findOne({ email: 'test@example.com' });
      if (!testUserExists) {
        const hashedTestPass = await bcrypt.hash('test123456', 10);
        await User.create({
          name: 'Test Customer',
          email: 'test@example.com',
          password: hashedTestPass,
          isAdmin: false,
          phone: '+92 321 9876543',
          address: 'Suite 404, Main Boulevard',
          city: 'Lahore',
          postal: '54000',
          country: 'Pakistan',
        });
        console.log('👤 Default Test Customer created: test@example.com / test123456');
      }
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed check notice:', seedErr.message);
    }
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

// =====================
// API ROUTES
// =====================
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Default root route serves the store homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🛍️ ShopEasy Storefront: http://localhost:${PORT}/index.html`);
  console.log(`⚙️ Admin Dashboard:    http://localhost:${PORT}/admin.html`);
});
