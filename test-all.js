const http = require('http');

async function runTests() {
  console.log('🧪 Starting End-to-End System Tests for ShopEasy...');

  // Start server
  const server = require('./server.js');

  // Wait 1.5s for db connection
  await new Promise((r) => setTimeout(r, 1500));

  const BASE_URL = 'http://localhost:5000';

  async function api(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, data: JSON.parse(text) };
    } catch (e) {
      return { status: res.status, ok: res.ok, data: text };
    }
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await api('/api/health');
    assert(health.ok && health.data.status === 'online', 'Health endpoint /api/health');

    // 2. Root Homepage serves HTML
    const home = await api('/');
    assert(home.ok && typeof home.data === 'string' && home.data.includes('ShopEasy'), 'Root / serves ShopEasy HTML storefront');

    // 3. Products listing
    const prods = await api('/api/products');
    assert(prods.ok && Array.isArray(prods.data) && prods.data.length >= 10, `Products API returns ${prods.data.length} items`);

    // 4. Products search & category
    const electronics = await api('/api/products?category=electronics');
    assert(electronics.ok && electronics.data.every(p => p.category === 'electronics'), 'Category filtering works (/api/products?category=electronics)');

    // 5. Admin login
    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@shopeasy.com', password: 'admin123' }),
    });
    assert(adminLogin.ok && adminLogin.data.token && adminLogin.data.user.isAdmin === true, 'Admin login authentication (admin@shopeasy.com)');
    const adminToken = adminLogin.data.token;

    // 6. Customer login
    const customerLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'test123456' }),
    });
    assert(customerLogin.ok && customerLogin.data.token && customerLogin.data.user.isAdmin === false, 'Customer login authentication (test@example.com)');
    const customerToken = customerLogin.data.token;

    // 7. Customer profile /api/auth/me
    const myProfile = await api('/api/auth/me', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(myProfile.ok && myProfile.data.email === 'test@example.com', 'Get current user profile /api/auth/me');

    // 8. Coupon validation
    const coupon = await api('/api/orders/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code: 'SAVE10', subtotal: 100 }),
    });
    assert(coupon.ok && coupon.data.valid === true && coupon.data.discountAmount === 10, 'Coupon code validation (SAVE10 = $10 discount on $100)');

    // 9. Place an order
    const sampleProduct = prods.data[0];
    const newOrder = await api('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [
          {
            product: sampleProduct._id,
            name: sampleProduct.name,
            quantity: 2,
            price: sampleProduct.price,
            image: sampleProduct.image,
          },
        ],
        subtotal: sampleProduct.price * 2,
        shippingFee: 0,
        tax: (sampleProduct.price * 2) * 0.08,
        discount: 0,
        totalPrice: (sampleProduct.price * 2) * 1.08,
        address: '123 Test Street, Lahore, Pakistan',
        paymentMethod: 'cod',
      }),
    });
    assert(newOrder.ok && newOrder.data.orderId, `Place order endpoint: Created order #${newOrder.data.orderId}`);
    const orderId = newOrder.data.orderId;

    // 10. Customer my-orders list
    const myOrders = await api('/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(myOrders.ok && myOrders.data.some(o => o._id === orderId), 'Customer order history (/api/orders/my-orders) contains new order');

    // 11. Admin stats
    const stats = await api('/api/orders/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(stats.ok && stats.data.totalOrders >= 1 && stats.data.totalRevenue > 0, `Admin stats endpoint: Total Orders: ${stats.data.totalOrders}, Revenue: $${stats.data.totalRevenue}`);

    // 12. Admin update order status
    const updateStatus = await api(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Processing' }),
    });
    assert(updateStatus.ok && updateStatus.data.order.status === 'Processing', 'Admin update order status to Processing');

    // 13. Submit a review
    const reviewRes = await api(`/api/products/${sampleProduct._id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 5, comment: 'Phenomenal product! Tested and verified.' }),
    });
    assert(reviewRes.ok && reviewRes.data.numReviews >= 1, 'Submit product review and calculate dynamic rating');

    console.log(`\n========================================`);
    console.log(`🏁 TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (testErr) {
    console.error('Fatal test execution error:', testErr);
    process.exit(1);
  }
}

runTests();
