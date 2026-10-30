// ===== CART CORE FUNCTIONS =====

// Get cart array from localStorage
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch (e) {
    return [];
  }
}

// Save cart to localStorage and update badge
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

// Update cart counter in navbar
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const countEl = document.getElementById('cartCount');
  if (countEl) countEl.textContent = total;
}

// Add item to cart
async function addToCart(productId, qty = 1) {
  if (!isLoggedIn()) {
    requireLogin('Please login to add items to your shopping cart!');
    return;
  }

  // Find product from memory or fetch
  let product = null;
  if (typeof currentProducts !== 'undefined' && currentProducts.length > 0) {
    product = currentProducts.find((p) => (p._id || p.id) == productId);
  }

  if (!product && typeof fallbackProducts !== 'undefined') {
    product = fallbackProducts.find((p) => (p._id || p.id) == productId);
  }

  // If not found in current memory, try API
  if (!product) {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) {
        product = await res.json();
      }
    } catch (e) {}
  }

  if (!product) {
    showToast('❌ Unable to find product details.');
    return;
  }

  // Stock check
  if (product.stock !== undefined && product.stock <= 0) {
    showToast('⚠️ Sorry, this product is currently out of stock.');
    return;
  }

  const id = product._id || product.id || productId;
  const cart = getCart();
  const existing = cart.find((item) => (item.id || item._id) == id);

  if (existing) {
    if (product.stock && existing.quantity + qty > product.stock) {
      showToast(`⚠️ Only ${product.stock} units available in stock.`);
      return;
    }
    existing.quantity += qty;
  } else {
    cart.push({
      id: id,
      _id: id,
      name: product.name,
      price: parseFloat(product.price),
      oldPrice: product.oldPrice ? parseFloat(product.oldPrice) : null,
      image: product.image,
      category: product.category,
      stock: product.stock,
      quantity: qty,
    });
  }

  saveCart(cart);
  showToast(`🛒 <strong>${product.name}</strong> added to your cart!`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});
