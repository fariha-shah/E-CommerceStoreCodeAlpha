// ===== MY ORDERS & TRACKING CONTROLLER =====
let allOrders = [];

// Require user authentication
if (!isLoggedIn()) {
  requireLogin('Please login to view your orders and shipment tracking.');
}

// Fetch user orders
async function fetchOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px solid #eee;">
      <i class="fas fa-spinner fa-spin" style="font-size: 36px; color: #8b1a2f; margin-bottom: 12px;"></i>
      <p style="color: #666; font-size: 15px;">Loading your orders...</p>
    </div>
  `;

  const token = getToken();

  try {
    const res = await fetch('/api/orders/my-orders', {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch orders');
    allOrders = await res.json();
    renderOrders(allOrders);
  } catch (err) {
    console.warn('Backend unavailable, loading local demo orders.');
    const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
    if (demoOrders.length > 0) {
      allOrders = demoOrders;
    } else {
      allOrders = [
        {
          _id: 'ORD-894215',
          createdAt: new Date().toISOString(),
          status: 'Processing',
          paymentMethod: 'card',
          paymentStatus: 'Paid',
          totalPrice: 149.98,
          address: 'Suite 404, Main Boulevard, Karachi, Pakistan',
          items: [
            {
              product: 'prod_1',
              name: 'Wireless Noise-Cancelling Headphones',
              price: 59.99,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            },
            {
              product: 'prod_2',
              name: 'AeroStride Pro Running Shoes',
              price: 89.99,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            },
          ],
        },
      ];
    }
    renderOrders(allOrders);
  }
}

// Render tracker bar
function renderTracker(status) {
  const s = (status || '').toLowerCase();
  if (s === 'cancelled') {
    return `
      <div class="order-tracker" style="background: #fffafa;">
        <div style="text-align: center; color: #c62828; font-weight: 600; font-size: 13px;">
          <i class="fas fa-times-circle"></i> This order was cancelled.
        </div>
      </div>
    `;
  }

  const steps = [
    { key: 'placed', label: 'Order Placed', icon: 'fa-check' },
    { key: 'processing', label: 'Processing', icon: 'fa-box' },
    { key: 'shipped', label: 'Shipped', icon: 'fa-truck' },
    { key: 'delivered', label: 'Delivered', icon: 'fa-home' },
  ];

  let activeIndex = 0;
  if (s === 'processing') activeIndex = 1;
  else if (s === 'shipped') activeIndex = 2;
  else if (s === 'delivered') activeIndex = 3;

  const stepsHtml = steps
    .map((step, idx) => {
      let stepClass = '';
      if (idx < activeIndex) stepClass = 'completed';
      else if (idx === activeIndex) stepClass = 'active';

      return `
        <div class="tracker-step ${stepClass}">
          <div class="tracker-circle"><i class="fas ${step.icon}"></i></div>
          <div class="tracker-label">${step.label}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="order-tracker">
      <div class="tracker-steps">
        ${stepsHtml}
      </div>
    </div>
  `;
}

// Render orders list
function renderOrders(orders) {
  const container = document.getElementById('ordersContainer');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-orders">
        <i class="fas fa-shopping-bag"></i>
        <h3>No orders found!</h3>
        <p>You haven't placed any orders yet. Discover our latest collections today!</p>
        <a href="index.html" class="btn-reorder" style="display: inline-block; padding: 12px 28px; text-decoration: none;">
          <i class="fas fa-store"></i> Start Shopping
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  orders.forEach((order) => {
    const rawStatus = order.status || 'Pending';
    const statusLower = rawStatus.toLowerCase();
    const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const canCancel = statusLower === 'pending';

    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-card-header">
        <div class="order-meta">
          <div><span>Order ID:</span><br/><strong>#${order._id}</strong></div>
          <div><span>Placed On:</span><br/><strong>${dateFormatted}</strong></div>
          <div><span>Payment:</span><br/><strong>${(order.paymentMethod || 'card').toUpperCase()} (${order.paymentStatus || 'Pending'})</strong></div>
          <div><span>Total:</span><br/><strong style="color: #8b1a2f; font-size: 15px;">$${parseFloat(order.totalPrice).toFixed(2)}</strong></div>
        </div>
        <div>
          <span class="order-status-badge status-${statusLower}">${rawStatus}</span>
        </div>
      </div>

      ${renderTracker(rawStatus)}

      <div class="order-card-body">
        <table class="order-items-table">
          <tbody>
            ${(order.items || [])
              .map(
                (item) => `
              <tr>
                <td style="width: 70px;">
                  <img src="${item.image || 'https://via.placeholder.com/60?text=Item'}"
                       class="order-item-img" alt="${item.name}"
                       onerror="this.src='https://via.placeholder.com/60?text=Item'"/>
                </td>
                <td>
                  <div class="order-item-name">${item.name}</div>
                  <div class="order-item-qty">Qty: ${item.quantity} × $${parseFloat(item.price).toFixed(2)}</div>
                </td>
                <td style="text-align: right; font-weight: 600; color: #333;">
                  $${(item.quantity * item.price).toFixed(2)}
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="order-card-footer">
        <div class="order-shipping-summary">
          <i class="fas fa-map-marker-alt" style="color: #8b1a2f;"></i>
          <strong>Shipping Address:</strong> ${order.address}
        </div>
        <div class="order-action-btns">
          ${
            canCancel
              ? `<button class="btn-cancel-order" onclick="cancelOrder('${order._id}')">
                  <i class="fas fa-times"></i> Cancel Order
                </button>`
              : ''
          }
          <button class="btn-reorder" onclick="reorderItems('${order._id}')">
            <i class="fas fa-cart-plus"></i> Buy Again
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Cancel an order
async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;

  const token = getToken();
  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    const data = await res.json();
    if (res.ok) {
      showToast('✅ Order cancelled successfully.');
      fetchOrders();
    } else {
      showToast(`❌ ${data.message || 'Failed to cancel order.'}`);
    }
  } catch (err) {
    // Static hosting demo fallback
    const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
    const match = demoOrders.find((o) => o._id === orderId);
    if (match) {
      match.status = 'Cancelled';
      localStorage.setItem('demo_orders', JSON.stringify(demoOrders));
    }
    const memMatch = allOrders.find((o) => o._id === orderId);
    if (memMatch) memMatch.status = 'Cancelled';
    showToast('✅ Order cancelled successfully (Demo Mode).');
    renderOrders(allOrders);
  }
}

// Reorder items
function reorderItems(orderId) {
  const order = allOrders.find((o) => o._id === orderId);
  if (!order || !order.items) return;

  const cart = getCart();
  order.items.forEach((item) => {
    const existing = cart.find((c) => (c._id || c.id) == item.product);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push({
        id: item.product,
        _id: item.product,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
      });
    }
  });

  saveCart(cart);
  showToast(`🛒 Re-added ${order.items.length} items to your cart!`);
  setTimeout(() => {
    window.location.href = 'cart.html';
  }, 1000);
}

// Filter orders by status
function filterOrdersByStatus() {
  const select = document.getElementById('statusFilter');
  const val = select ? select.value : 'all';

  if (val === 'all') {
    renderOrders(allOrders);
  } else {
    const filtered = allOrders.filter(
      (o) => (o.status || '').toLowerCase() === val.toLowerCase()
    );
    renderOrders(filtered);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchOrders();
});
