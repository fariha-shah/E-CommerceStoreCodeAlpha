const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0 },
    discount: { type: String, default: '' },
    image: { type: String, default: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
    category: { type: String, required: true, lowercase: true, trim: true },
    stock: { type: Number, default: 10, min: 0 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    badge: { type: String, default: '' },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
