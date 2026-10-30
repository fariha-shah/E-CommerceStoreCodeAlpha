# 🛍️ ShopEasy - Full-Stack E-Commerce Web Application

[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2.1-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Protected-blue.svg)](https://jwt.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

> **CodeAlpha Internship — Full Stack Web Development — Task 1**  
> **Built by:** Fareeha Shah ([farihashah2812@gmail.com](mailto:farihashah2812@gmail.com))

---

## 🌟 Overview

**ShopEasy** is a production-ready, full-stack e-commerce web platform engineered with a decoupled REST API backend and a responsive front-end. It provides end-to-end e-commerce capabilities ranging from dynamic catalog browsing, live multi-field filtering, cart & wishlist management, coupon verification, order processing with 4-stage tracking, user profile management, customer reviews, and a full-featured centralized **Admin Dashboard**.

---

## ✨ Key Features

### 🛒 Customer Storefront
- **Dynamic Catalog:** Real-time product inventory loaded dynamically from MongoDB.
- **Search & Live Filtering:** Search by product title, description, or category with instant debounced response.
- **Price Range & Sorting:** Interactive price range filtering (Min - Max) and sorting (Price: Low to High, Price: High to Low, Highest Rated, Alphabetical).
- **Category Navigation:** One-click filtering across Electronics, Clothing, Books, Home & Kitchen, and Beauty.
- **Product Details & Gallery:** High-resolution product images, thumbnail switching, stock status badges, and discount calculations.
- **Real Customer Reviews & Ratings:** Verified customer reviews and an interactive star-rating feedback submission form.
- **Shopping Cart & Wishlist:** Persistent local storage carts with live item counters and stock threshold limits.
- **Discount Coupons:** Backend-validated coupon codes (`SAVE10` for 10% off, `WELCOME20` for 20% off, `FREESHIP` for free shipping).
- **Streamlined 3-Step Checkout:** Shipping information (auto-prefilled from user account), payment selection (Card, Cash on Delivery, PayPal), and final order review.
- **Order Tracking (`orders.html`):** Visual 4-step progress tracker (*Order Placed ➔ Processing ➔ Shipped ➔ Delivered*), order cancellation, and one-click re-ordering.
- **User Account Settings (`profile.html`):** Update delivery addresses, contact details, and secure password updates.

### 👑 Administrator Dashboard (`admin.html`)
- **Key Performance Indicators (KPIs):** Real-time analytics for Total Revenue ($), Total Orders, Total Products, and Total Registered Customers.
- **Product Catalog Management:** Add new products with image URLs, categories, prices, discounts, and initial stock; edit existing products; and permanently delete discontinued items.
- **Order Pipeline Control:** View every order across the platform, inspect buyer details, and transition order statuses (*Pending ➔ Processing ➔ Shipped ➔ Delivered ➔ Cancelled*).
- **Customer Directory:** View registered customers, emails, contact numbers, and privilege levels.

---

## 🌐 Pages & URLs

| Page | URL | Description |
|---|---|---|
| **Storefront Home** | [http://localhost:5000](http://localhost:5000) | Main marketplace, categories, search, price slider, and products grid |
| **Product Detail** | `product-detail.html?id=...` | Detailed specs, thumbnail switcher, stock status, and reviews |
| **Shopping Cart** | [http://localhost:5000/cart.html](http://localhost:5000/cart.html) | Cart items table, quantity controls, and coupon code application |
| **Checkout** | [http://localhost:5000/checkout.html](http://localhost:5000/checkout.html) | 3-step checkout with address prefill, Card/COD selection, and confirmation |
| **My Orders** | [http://localhost:5000/orders.html](http://localhost:5000/orders.html) | Order history, 4-step shipment progress tracker, and order cancellation |
| **Admin Dashboard** | [http://localhost:5000/admin.html](http://localhost:5000/admin.html) | Central administration console: metrics, product CRUD, and order management |
| **User Profile** | [http://localhost:5000/profile.html](http://localhost:5000/profile.html) | Account settings, saved delivery addresses, and password update |
| **Wishlist** | [http://localhost:5000/wishlist.html](http://localhost:5000/wishlist.html) | Saved favorite products with one-click transfer to cart |
| **Login** | [http://localhost:5000/login.html](http://localhost:5000/login.html) | Authentication with 1-click test credentials autofill |
| **Register** | [http://localhost:5000/register.html](http://localhost:5000/register.html) | New customer account registration with password strength meter |

---

## 🔑 Default Test Accounts

For testing and evaluation, the following pre-configured credentials can be used directly or autofilled on the [Login Page](http://localhost:5000/login.html):

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Store Administrator** | `admin@shopeasy.com` | `admin123` | Full access to Admin Dashboard, Product Inventory CRUD, and Order Management |
| **Verified Customer** | `test@example.com` | `test123456` | Shopping, Cart, Checkout, Order Tracking, Profile, and Reviews |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or v22.x LTS): [Download](https://nodejs.org/)
- **MongoDB** (Local instance on port `27017` or MongoDB Atlas URI): [Download](https://www.mongodb.com/try/download/community)

### 2. Installation
Open your terminal in the project directory:
```bash
# Clone or navigate to the directory
cd D:\CodeAlpha\ecommerce-store

# Install dependencies (already included in node_modules)
npm install
```

### 3. Seed Database (Optional)
Populate MongoDB with default accounts and 12 premium products across all categories:
```bash
node seed.js
```

### 4. Start Server
Launch the application:
```bash
node server.js
```
The server will boot and display:
```text
🚀 Server running on http://localhost:5000
🛍️ ShopEasy Storefront: http://localhost:5000/index.html
⚙️ Admin Dashboard:    http://localhost:5000/admin.html
✅ MongoDB Connected Successfully!
```

### 5. Run Automated Verification Tests
Run the built-in end-to-end integration test suite:
```bash
node test-all.js
```
*Output: 13 Passed, 0 Failed.*

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js 5.x, Mongoose ODM
- **Database:** MongoDB (Collections: `products`, `orders`, `users`)
- **Authentication:** JSON Web Tokens (JWT), Bcrypt.js (Password Hashing)
- **Frontend:** Vanilla HTML5, Modern CSS3 (Grid & Flexbox), ES6+ JavaScript, FontAwesome 6
- **Architecture:** Decoupled RESTful API with static file serving

---

## 📁 Project Structure

```text
ecommerce-store/
├── middleware/
│   └── auth.js             # JWT and Admin authorization guards
├── models/
│   ├── Order.js            # Order schema with subtotal, tax, tracking, address
│   ├── Product.js          # Product schema with stock, category, discount, reviews
│   └── User.js             # User schema with roles, profile address, phone
├── routes/
│   ├── auth.js             # /api/auth (Login, Register, Me, Profile, Password, Users)
│   ├── orders.js           # /api/orders (Place order, My orders, Status, Coupons, Stats)
│   └── product.js          # /api/products (CRUD, Categories, Filter, Sort, Reviews)
├── public/                 # Static frontend application
│   ├── css/                # Style sheets for all pages
│   ├── js/                 # Client controllers and API connectors
│   ├── index.html          # Storefront homepage
│   ├── product-detail.html # Product detail & customer review page
│   ├── cart.html           # Shopping cart page
│   ├── checkout.html       # 3-step checkout page
│   ├── orders.html         # Order history & live tracking page
│   ├── admin.html          # Central Admin Dashboard
│   ├── profile.html        # Account & address settings page
│   ├── wishlist.html       # Saved favorites page
│   ├── login.html          # Login page with 1-click test fill
│   └── register.html       # Registration page
├── server.js               # Main Express application entrypoint
├── seed.js                 # Database seeder script
├── test-all.js             # Automated 13-point test suite
├── GUIDE.md                # Comprehensive Urdu & English project guide
├── README.md               # Repository documentation
└── package.json            # NPM dependencies & scripts
```

---

## 📞 Developer Credits

- **Developer:** Fareeha Shah
- **Email:** [farihashah2812@gmail.com](mailto:farihashah2812@gmail.com)
- **Internship:** CodeAlpha - Full Stack Web Development
- **Task:** Task 1 - Modern E-Commerce Web Store
