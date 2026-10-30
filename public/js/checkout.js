// ===== CHECKOUT CONTROLLER =====
let selectedPayment = 'card';
let shippingData = {};
let orderCalculations = {};

// Protect checkout
if (!isLoggedIn()) {
  requireLogin('Please login to proceed with checkout!');
}

// Prefill form from user account
async function prefillUserInfo() {
  const user = getCurrentUser();
  if (!user) return;

  const names = user.name ? user.name.split(' ') : ['', ''];
  const firstEl = document.getElementById('firstName');
  const lastEl = document.getElementById('lastName');
  const emailEl = document.getElementById('checkEmail');
  const phoneEl = document.getElementById('phone');
  const addressEl = document.getElementById('address');
  const cityEl = document.getElementById('city');
  const postalEl = document.getElementById('postal');
  const countryEl = document.getElementById('country');

  if (firstEl && !firstEl.value) firstEl.value = names[0] || '';
  if (lastEl && !lastEl.value) lastEl.value = names.slice(1).join(' ') || '';
  if (emailEl && !emailEl.value) emailEl.value = user.email || '';
  if (phoneEl && !phoneEl.value && user.phone) phoneEl.value = user.phone;
  if (addressEl && !addressEl.value && user.address) addressEl.value = user.address;
  if (cityEl && !cityEl.value && user.city) cityEl.value = user.city;
  if (postalEl && !postalEl.value && user.postal) postalEl.value = user.postal;
  if (countryEl && user.country) countryEl.value = user.country;
}

// Load checkout summary
function loadCheckoutSummary() {
  const cart = getCart();
  const itemsContainer = document.getElementById('checkoutItems');
  if (!itemsContainer) return;

  itemsContainer.innerHTML = '';

  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'checkout-item-row';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}"
           onerror="this.src='https://via.placeholder.com/50?text=No+Img'"/>
      <div class="checkout-item-info">
        <h4>${item.name}</h4>
        <span>Qty: ${item.quantity}</span>
      </div>
      <div class="checkout-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
    `;
    itemsContainer.appendChild(row);
  });

  // Calculate totals or read from cart-page calculations
  const savedCalc = localStorage.getItem('checkoutCalculations');
  if (savedCalc) {
    try {
      orderCalculations = JSON.parse(savedCalc);
    } catch (e) {
      orderCalculations = {};
    }
  }

  const subtotal =
    orderCalculations.subtotal !== undefined
      ? orderCalculations.subtotal
      : cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discount = orderCalculations.discount || 0;
  const shipping =
    orderCalculations.shippingFee !== undefined
      ? orderCalculations.shippingFee
      : subtotal >= 50 ? 0 : 9.99;
  const tax =
    orderCalculations.tax !== undefined
      ? orderCalculations.tax
      : (subtotal - discount) * 0.08;
  const total =
    orderCalculations.totalPrice !== undefined
      ? orderCalculations.totalPrice
      : Math.max(0, subtotal - discount + shipping + tax);

  orderCalculations = {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    shippingFee: parseFloat(shipping.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    totalPrice: parseFloat(total.toFixed(2)),
  };

  const coSubtotal = document.getElementById('coSubtotal');
  const coShipping = document.getElementById('coShipping');
  const coTax = document.getElementById('coTax');
  const coTotal = document.getElementById('coTotal');

  if (coSubtotal) coSubtotal.textContent = `$${orderCalculations.subtotal.toFixed(2)}`;
  if (coShipping) coShipping.textContent = orderCalculations.shippingFee === 0 ? '🎉 Free' : `$${orderCalculations.shippingFee.toFixed(2)}`;
  if (coTax) coTax.textContent = `$${orderCalculations.tax.toFixed(2)}`;
  if (coTotal) coTotal.textContent = `$${orderCalculations.totalPrice.toFixed(2)}`;
}

// Payment method switcher
function selectPayment(el, type) {
  selectedPayment = type;
  document.querySelectorAll('.payment-option').forEach((o) => o.classList.remove('active'));
  el.classList.add('active');

  const cardDetails = document.getElementById('cardDetails');
  const codDetails = document.getElementById('codDetails');
  const paypalDetails = document.getElementById('paypalDetails');

  if (cardDetails) cardDetails.style.display = type === 'card' ? 'block' : 'none';
  if (codDetails) codDetails.style.display = type === 'cod' ? 'block' : 'none';
  if (paypalDetails) paypalDetails.style.display = type === 'paypal' ? 'block' : 'none';
}

function formatCard(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 4);
  if (val.length >= 2) val = val.substring(0, 2) + ' / ' + val.substring(2);
  input.value = val;
}

// STEP 1 -> STEP 2
function goToPayment() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('checkEmail').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const city = document.getElementById('city').value.trim();
  const postal = document.getElementById('postal').value.trim();
  const country = document.getElementById('country').value;

  if (!firstName || !lastName || !email || !phone || !address || !city || !postal) {
    showToast('⚠️ Please fill in all required shipping fields.');
    return;
  }

  shippingData = {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    postal,
    country,
  };

  document.getElementById('shippingForm').style.display = 'none';
  document.getElementById('paymentForm').style.display = 'block';

  const step1 = document.querySelector('.progress-step:nth-child(1)');
  const line1 = document.querySelector('.progress-line:nth-child(2)');
  const step2 = document.getElementById('step2');

  if (step1) {
    step1.classList.remove('active');
    step1.classList.add('done');
  }
  if (line1) line1.classList.add('done');
  if (step2) step2.classList.add('active');

  window.scrollTo(0, 0);
}

// STEP 2 -> STEP 3
function goToConfirm() {
  if (selectedPayment === 'card') {
    const cardName = document.getElementById('cardName').value.trim();
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardExpiry = document.getElementById('cardExpiry').value.trim();
    const cardCvv = document.getElementById('cardCvv').value.trim();

    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      showToast('⚠️ Please complete all credit card details.');
      return;
    }
  }

  // Populate confirmation view
  const addrEl = document.getElementById('confirmAddress');
  if (addrEl) {
    addrEl.textContent = `${shippingData.firstName} ${shippingData.lastName}, ${shippingData.address}, ${shippingData.city}, ${shippingData.postal}, ${shippingData.country} | 📞 ${shippingData.phone}`;
  }

  const paymentLabels = {
    card: '💳 Credit / Debit Card',
    cod: '💵 Cash on Delivery (Pay at Doorstep)',
    paypal: '🅿️ PayPal Secure Payment',
  };
  const payEl = document.getElementById('confirmPayment');
  if (payEl) payEl.textContent = paymentLabels[selectedPayment] || selectedPayment;

  // Render items in confirmation
  const cart = getCart();
  const confirmItems = document.getElementById('confirmItems');
  if (confirmItems) {
    confirmItems.innerHTML = '';
    cart.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'confirm-item';
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/50?text=No+Img'"/>
        <div class="confirm-item-info">
          <h4>${item.name}</h4>
          <span>Qty: ${item.quantity}</span>
        </div>
        <div class="confirm-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
      `;
      confirmItems.appendChild(div);
    });
  }

  document.getElementById('paymentForm').style.display = 'none';
  document.getElementById('confirmForm').style.display = 'block';

  const step2 = document.getElementById('step2');
  const line2 = document.querySelector('.progress-line:last-of-type');
  const step3 = document.getElementById('step3');

  if (step2) {
    step2.classList.remove('active');
    step2.classList.add('done');
  }
  if (line2) line2.classList.add('done');
  if (step3) step3.classList.add('active');

  window.scrollTo(0, 0);
}

// Back button handler
function goBack(showFormId, stepNum) {
  document.getElementById('shippingForm').style.display = 'none';
  document.getElementById('paymentForm').style.display = 'none';
  document.getElementById('confirmForm').style.display = 'none';
  document.getElementById(showFormId).style.display = 'block';

  document.querySelectorAll('.progress-step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 < stepNum) s.classList.add('done');
    if (i + 1 === stepNum) s.classList.add('active');
  });

  document.querySelectorAll('.progress-line').forEach((l, i) => {
    l.classList.toggle('done', i < stepNum - 1);
  });

  window.scrollTo(0, 0);
}

// PLACE ORDER
async function placeOrder() {
  const cart = getCart();
  const token = getToken();

  if (!token) {
    requireLogin('Please login to place your order.');
    return;
  }

  const btnText = document.getElementById('orderBtnText');
  const btnLoader = document.getElementById('orderBtnLoader');
  const errEl = document.getElementById('orderError');

  if (btnText) btnText.style.display = 'none';
  if (btnLoader) btnLoader.style.display = 'flex';
  if (errEl) errEl.style.display = 'none';

  const fullAddress = `${shippingData.firstName} ${shippingData.lastName}, ${shippingData.address}, ${shippingData.city}, ${shippingData.postal}, ${shippingData.country}`;

  const payload = {
    items: cart.map((item) => ({
      product: item._id || item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    })),
    shippingData,
    address: fullAddress,
    paymentMethod: selectedPayment,
    subtotal: orderCalculations.subtotal,
    shippingFee: orderCalculations.shippingFee,
    tax: orderCalculations.tax,
    discount: orderCalculations.discount,
    totalPrice: orderCalculations.totalPrice,
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      // Clear Cart
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutCalculations');
      updateCartCount();

      // Update Modal
      const orderId = data.orderId || (data.order && data.order._id) || 'ORD-' + Date.now();
      const modalIdEl = document.getElementById('modalOrderId');
      if (modalIdEl) modalIdEl.textContent = orderId;

      const modal = document.getElementById('successModal');
      if (modal) modal.style.display = 'flex';
    } else {
      if (errEl) {
        errEl.textContent = '❌ ' + (data.message || 'Order failed. Please try again.');
        errEl.style.display = 'block';
      }
    }
  } catch (err) {
    // Static hosting demo mode fallback
    console.warn('Backend unavailable, saving order to local demo storage.');
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const demoOrder = {
      _id: orderId,
      items: payload.items,
      totalPrice: payload.totalPrice,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const existingOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
    existingOrders.unshift(demoOrder);
    localStorage.setItem('demo_orders', JSON.stringify(existingOrders));

    localStorage.removeItem('cart');
    localStorage.removeItem('checkoutCalculations');
    updateCartCount();

    const modalIdEl = document.getElementById('modalOrderId');
    if (modalIdEl) modalIdEl.textContent = orderId;

    const modal = document.getElementById('successModal');
    if (modal) modal.style.display = 'flex';
  }

  if (btnText) btnText.style.display = 'flex';
  if (btnLoader) btnLoader.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  prefillUserInfo();
  loadCheckoutSummary();
  updateCartCount();
});
