// ===== ADMIN DASHBOARD CONTROLLER =====

// Guard: verify admin status
(function verifyAdminAccess() {
  if (!isLoggedIn()) {
    requireLogin('Admin access requires authentication.');
    return;
  }
  const user = getCurrentUser();
  if (!user || !user.isAdmin) {
    alert('Access Denied: You do not have administrator permissions.');
    window.location.href = 'index.html';
  }
})();

let adminProducts = [];
let adminOrders = [];
let adminUsers = [];

// Tab Switcher
function switchAdminTab(tabName, btn) {
  document.querySelectorAll('.admin-tab-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach((c) => (c.style.display = 'none'));

  if (btn) btn.classList.add('active');

  if (tabName === 'overview') {
    document.getElementById('tabOverview').style.display = 'block';
    loadAdminStats();
  } else if (tabName === 'products') {
    document.getElementById('tabProducts').style.display = 'block';
    loadAdminProducts();
  } else if (tabName === 'orders') {
    document.getElementById('tabOrders').style.display = 'block';
    loadAdminOrders();
  } else if (tabName === 'users') {
    document.getElementById('tabUsers').style.display = 'block';
    loadAdminUsers();
  }
}

// 1. OVERVIEW & METRICS
async function loadAdminStats() {
  const token = getToken();
  try {
    const res = await fetch('/api/orders/admin/stats', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    document.getElementById('kpiRevenue').textContent = `$${parseFloat(data.totalRevenue || 0).toFixed(2)}`;
    document.getElementById('kpiOrders').textContent = data.totalOrders || 0;
    document.getElementById('kpiProducts').textContent = data.totalProducts || 0;
    document.getElementById('kpiUsers').textContent = data.totalUsers || 0;

    renderRecentOrders(data.recentOrders || []);
  } catch (err) {
    console.warn('Backend unavailable, using demo admin stats.');
    document.getElementById('kpiRevenue').textContent = '$3,480.00';
    document.getElementById('kpiOrders').textContent = '28';
    document.getElementById('kpiProducts').textContent = '12';
    document.getElementById('kpiUsers').textContent = '42';
    renderRecentOrders([
      { _id: 'ORD-894215', user: { name: 'Sarah Khan' }, items: [{}, {}], totalPrice: 149.98, status: 'Processing', createdAt: new Date().toISOString() },
      { _id: 'ORD-763190', user: { name: 'Ali Raza' }, items: [{}], totalPrice: 59.99, status: 'Delivered', createdAt: new Date().toISOString() },
      { _id: 'ORD-652014', user: { name: 'Zainab Bibi' }, items: [{}, {}, {}], totalPrice: 219.50, status: 'Pending', createdAt: new Date().toISOString() }
    ]);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersTable');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No orders found.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  orders.forEach((o) => {
    const customer = o.user ? o.user.name : 'Guest';
    const date = new Date(o.createdAt).toLocaleDateString();
    const total = parseFloat(o.totalPrice).toFixed(2);
    const status = o.status || 'Pending';
    const itemsCount = (o.items || []).reduce((acc, i) => acc + i.quantity, 0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${o._id.substring(o._id.length - 8)}</strong></td>
      <td>${customer}</td>
      <td>${itemsCount} items</td>
      <td><strong>$${total}</strong></td>
      <td><span class="badge-pill status-${status.toLowerCase()}">${status}</span></td>
      <td>${date}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 2. PRODUCTS MANAGEMENT
async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsTable');
  if (!tbody) return;

  try {
    const res = await fetch('/api/products');
    adminProducts = await res.json();
    renderAdminProducts(adminProducts);
  } catch (err) {
    console.warn('Backend unavailable, loading local products inventory.');
    adminProducts = typeof fallbackProducts !== 'undefined' ? fallbackProducts : [];
    renderAdminProducts(adminProducts);
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('adminProductsTable');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No products in database.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  products.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.image}" class="table-img" alt="${p.name}" onerror="this.src='https://via.placeholder.com/45?text=No+Img'"/></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge-pill" style="background:#f0e6e9; color:#8b1a2f;">${p.category.toUpperCase()}</span></td>
      <td><strong>$${parseFloat(p.price).toFixed(2)}</strong></td>
      <td>${p.oldPrice ? `$${parseFloat(p.oldPrice).toFixed(2)}` : '—'}</td>
      <td>${p.stock <= 0 ? '<span style="color:red; font-weight:bold;">0 (Out)</span>' : p.stock}</td>
      <td>★ ${p.rating || 5} (${p.numReviews || 0})</td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button onclick="openEditProductModal('${p._id}')" class="btn-primary-admin" style="padding: 5px 10px; font-size: 12px; background: #3498db;">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteProduct('${p._id}')" class="btn-primary-admin" style="padding: 5px 10px; font-size: 12px; background: #e74c3c;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterAdminProducts() {
  const query = document.getElementById('adminProductSearch').value.toLowerCase().trim();
  const filtered = adminProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
  );
  renderAdminProducts(filtered);
}

// Open modal for Adding new product
function openAddProductModal() {
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Product';
  document.getElementById('prodEditId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('productModal').style.display = 'flex';
}

// Open modal for Editing existing product
function openEditProductModal(id) {
  const product = adminProducts.find((p) => p._id === id);
  if (!product) return;

  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Product';
  document.getElementById('prodEditId').value = product._id;
  document.getElementById('prodName').value = product.name;
  document.getElementById('prodCategory').value = product.category;
  document.getElementById('prodPrice').value = product.price;
  document.getElementById('prodOldPrice').value = product.oldPrice || '';
  document.getElementById('prodStock').value = product.stock !== undefined ? product.stock : 10;
  document.getElementById('prodDiscount').value = product.discount || '';
  document.getElementById('prodImage').value = product.image;
  document.getElementById('prodDescription').value = product.description;

  document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
}

// Save Product (Create or Update)
async function saveProduct(e) {
  e.preventDefault();
  const editId = document.getElementById('prodEditId').value;
  const token = getToken();

  const payload = {
    name: document.getElementById('prodName').value.trim(),
    category: document.getElementById('prodCategory').value,
    price: parseFloat(document.getElementById('prodPrice').value),
    oldPrice: document.getElementById('prodOldPrice').value
      ? parseFloat(document.getElementById('prodOldPrice').value)
      : 0,
    stock: parseInt(document.getElementById('prodStock').value),
    discount: document.getElementById('prodDiscount').value.trim(),
    image: document.getElementById('prodImage').value.trim(),
    description: document.getElementById('prodDescription').value.trim(),
  };

  const url = editId ? `/api/products/${editId}` : '/api/products';
  const method = editId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      showToast(`✅ Product ${editId ? 'updated' : 'added'} successfully!`);
      closeProductModal();
      loadAdminProducts();
    } else {
      showToast(`❌ ${data.message || 'Error saving product.'}`);
    }
  } catch (err) {
    showToast('❌ Network error saving product.');
  }
}

// Delete Product
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to permanently delete this product?')) return;
  const token = getToken();

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });

    const data = await res.json();
    if (res.ok) {
      showToast('🗑️ Product deleted successfully.');
      loadAdminProducts();
    } else {
      showToast(`❌ ${data.message || 'Failed to delete.'}`);
    }
  } catch (err) {
    showToast('❌ Network error deleting product.');
  }
}

// 3. ORDERS MANAGEMENT
async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTable');
  if (!tbody) return;

  const token = getToken();
  try {
    const res = await fetch('/api/orders/admin/all', {
      headers: { Authorization: 'Bearer ' + token },
    });
    adminOrders = await res.json();
    renderAdminOrders(adminOrders);
  } catch (err) {
    console.warn('Backend unavailable, loading local demo orders.');
    const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
    adminOrders = demoOrders.length > 0 ? demoOrders : [
      { _id: 'ORD-894215', user: { name: 'Sarah Khan', email: 'sarah@example.com' }, totalPrice: 149.98, status: 'Processing', paymentMethod: 'card', items: [{}, {}] },
      { _id: 'ORD-763190', user: { name: 'Ali Raza', email: 'ali@example.com' }, totalPrice: 59.99, status: 'Delivered', paymentMethod: 'cod', items: [{}] },
      { _id: 'ORD-652014', user: { name: 'Zainab Bibi', email: 'zainab@example.com' }, totalPrice: 219.50, status: 'Pending', paymentMethod: 'card', items: [{}, {}, {}] }
    ];
    renderAdminOrders(adminOrders);
  }
}

function renderAdminOrders(orders) {
  const tbody = document.getElementById('adminOrdersTable');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No customer orders found.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  orders.forEach((o) => {
    const customerName = o.user ? o.user.name : 'Customer';
    const customerEmail = o.user ? o.user.email : '';
    const phone = (o.shippingAddress && o.shippingAddress.phone) || (o.user && o.user.phone) || 'N/A';
    const itemsCount = (o.items || []).reduce((acc, i) => acc + i.quantity, 0);
    const status = o.status || 'Pending';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${o._id.substring(o._id.length - 8)}</strong></td>
      <td><strong>${customerName}</strong><br/><small style="color:#777;">${customerEmail}</small></td>
      <td>${phone}</td>
      <td>${itemsCount} items</td>
      <td><strong style="color:#8b1a2f;">$${parseFloat(o.totalPrice).toFixed(2)}</strong></td>
      <td>${(o.paymentMethod || 'card').toUpperCase()}</td>
      <td><span class="badge-pill status-${status.toLowerCase()}">${status}</span></td>
      <td>
        <select onchange="updateOrderStatus('${o._id}', this.value)" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; font-weight:600;">
          <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterAdminOrders() {
  const filter = document.getElementById('adminOrderStatusFilter').value;
  if (filter === 'all') {
    renderAdminOrders(adminOrders);
  } else {
    const filtered = adminOrders.filter(
      (o) => (o.status || '').toLowerCase() === filter.toLowerCase()
    );
    renderAdminOrders(filtered);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  const token = getToken();
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast(`✅ Status updated to <strong>${newStatus}</strong>!`);
      loadAdminOrders();
    } else {
      showToast(`❌ ${data.message || 'Failed to update status.'}`);
    }
  } catch (err) {
    const o = adminOrders.find(item => item._id === orderId);
    if (o) o.status = newStatus;
    showToast(`✅ Status updated to <strong>${newStatus}</strong> (Demo Mode)!`);
    renderAdminOrders(adminOrders);
  }
}

// 4. USERS MANAGEMENT
async function loadAdminUsers() {
  const tbody = document.getElementById('adminUsersTable');
  if (!tbody) return;

  const token = getToken();
  try {
    const res = await fetch('/api/auth/users', {
      headers: { Authorization: 'Bearer ' + token },
    });
    adminUsers = await res.json();
    renderAdminUsers(adminUsers);
  } catch (err) {
    adminUsers = [
      { name: 'Store Administrator', email: 'admin@shopeasy.com', phone: '+92 300 1234567', isAdmin: true, city: 'Karachi', createdAt: new Date().toISOString() },
      { name: 'Sarah Khan', email: 'sarah@example.com', phone: '+92 321 9876543', isAdmin: false, city: 'Lahore', createdAt: new Date().toISOString() },
      { name: 'Ali Raza', email: 'ali@example.com', phone: '+92 333 4567890', isAdmin: false, city: 'Islamabad', createdAt: new Date().toISOString() }
    ];
    renderAdminUsers(adminUsers);
  }
}

function renderAdminUsers(users) {
  const tbody = document.getElementById('adminUsersTable');
  if (!tbody) return;

  tbody.innerHTML = '';
  users.forEach((u) => {
    const date = new Date(u.createdAt).toLocaleDateString();
    const roleBadge = u.isAdmin
      ? '<span class="badge-pill" style="background:#8b1a2f; color:white;">Admin</span>'
      : '<span class="badge-pill" style="background:#e8f5e9; color:#2e7d32;">Customer</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.phone || '—'}</td>
      <td>${roleBadge}</td>
      <td>${u.city || '—'}</td>
      <td>${date}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminStats();
});
