// ===== CART PAGE CONTROLLER =====
let appliedCoupon = null;

function renderCartPage() {
  const cart = getCart();
  const emptyCart = document.getElementById('emptyCart');
  const cartContent = document.getElementById('cartContent');
  const cartItemsList = document.getElementById('cartItemsList');

  if (!cartItemsList) return;

  if (cart.length === 0) {
    if (emptyCart) emptyCart.style.display = 'flex';
    if (cartContent) cartContent.style.display = 'none';
    return;
  }

  if (emptyCart) emptyCart.style.display = 'none';
  if (cartContent) cartContent.style.display = 'grid';
  cartItemsList.innerHTML = '';

  cart.forEach((item) => {
    const id = item._id || item.id;
    const subtotal = item.price * item.quantity;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-product-info">
        <img src="${item.image}" alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/75?text=No+Img'"/>
        <div>
          <h4>${item.name}</h4>
          <span>${item.category ? item.category.toUpperCase() : ''}</span>
        </div>
      </div>
      <div class="cart-price">$${parseFloat(item.price).toFixed(2)}</div>
      <div class="cart-qty-control">
        <button onclick="updateQty('${id}', -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQty('${id}', 1)">+</button>
      </div>
      <div class="cart-subtotal">$${subtotal.toFixed(2)}</div>
      <button class="btn-remove-item" onclick="removeItem('${id}')" title="Remove">
        <i class="fas fa-times"></i>
      </button>
    `;
    cartItemsList.appendChild(row);
  });

  updateSummary();
}

function updateQty(productId, change) {
  const cart = getCart();
  const item = cart.find((i) => (i._id || i.id) == productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeItem(productId);
    return;
  }

  saveCart(cart);
  renderCartPage();
}

function removeItem(productId) {
  let cart = getCart();
  const item = cart.find((i) => (i._id || i.id) == productId);
  cart = cart.filter((i) => (i._id || i.id) != productId);
  saveCart(cart);
  if (item) showToast(`🗑️ <strong>${item.name}</strong> removed from cart.`);
  renderCartPage();
}

function clearCart() {
  if (!confirm('Are you sure you want to clear your cart?')) return;
  localStorage.removeItem('cart');
  appliedCoupon = null;
  updateCartCount();
  showToast('🗑️ Cart cleared!');
  renderCartPage();
}

function updateSummary() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let shipping = subtotal >= 50 ? 0 : 9.99;
  let discount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else if (appliedCoupon.type === 'shipping') {
      shipping = 0;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * 0.08;
  const total = Math.max(0, taxableAmount + shipping + tax);

  const subtotalEl = document.getElementById('summarySubtotal');
  const shippingEl = document.getElementById('summaryShipping');
  const taxEl = document.getElementById('summaryTax');
  const totalEl = document.getElementById('summaryTotal');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? '🎉 Free' : `$${shipping.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

  // Save calculation details for checkout page
  localStorage.setItem(
    'checkoutCalculations',
    JSON.stringify({
      subtotal: parseFloat(subtotal.toFixed(2)),
      shippingFee: parseFloat(shipping.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      totalPrice: parseFloat(total.toFixed(2)),
      couponCode: appliedCoupon ? appliedCoupon.code : null,
    })
  );
}

async function applyCoupon() {
  const input = document.getElementById('couponInput');
  const code = input ? input.value.trim().toUpperCase() : '';

  if (!code) {
    showToast('⚠️ Please enter a coupon code.');
    return;
  }

  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const res = await fetch('/api/orders/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });

    const data = await res.json();
    if (res.ok && data.valid) {
      appliedCoupon = {
        code: data.code,
        type: data.type,
        value: data.type === 'percentage' ? (data.code === 'SAVE10' ? 10 : 20) : 100,
      };
      updateSummary();
      showToast(`🎉 ${data.message}`);
    } else {
      showToast(`❌ ${data.message || 'Invalid coupon code.'}`);
    }
  } catch (err) {
    // Fallback client validation
    if (code === 'SAVE10') {
      appliedCoupon = { code: 'SAVE10', type: 'percentage', value: 10 };
      updateSummary();
      showToast('🎉 Coupon applied! 10% discount added.');
    } else if (code === 'WELCOME20') {
      appliedCoupon = { code: 'WELCOME20', type: 'percentage', value: 20 };
      updateSummary();
      showToast('🎉 Welcome Coupon applied! 20% discount added.');
    } else {
      showToast('❌ Invalid coupon code. Try SAVE10 or WELCOME20');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
  updateCartCount();
});
