// ===== AUTH GUARD & GLOBAL NAV HELPER =====

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Get JWT token
function getToken() {
  return localStorage.getItem('token');
}

// Get logged-in user object
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

// Redirect to login with a friendly notification
function requireLogin(message) {
  localStorage.setItem('loginMessage', message || 'Please login to continue.');
  window.location.href = 'login.html';
}

// Global logout
function logout() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
}

// Update User display in navbar
function updateNavUser() {
  const user = getCurrentUser();
  const navBtn = document.getElementById('navLoginBtn');
  if (!navBtn) return;

  if (user) {
    const firstName = user.name ? user.name.split(' ')[0] : 'Account';
    const adminLink = user.isAdmin
      ? `<a href="admin.html" class="admin-link"><i class="fas fa-crown"></i> Admin Dashboard</a>`
      : '';

    // Replace the simple login icon with a user menu dropdown
    const parent = navBtn.parentElement;
    const dropdownWrap = document.createElement('div');
    dropdownWrap.className = 'nav-user-dropdown';
    dropdownWrap.innerHTML = `
      <button class="user-dropdown-btn" id="userDropdownTrigger" type="button" onclick="toggleNavDropdown(event)">
        <i class="fas fa-user-circle"></i>
        <span>${firstName}</span>
        <i class="fas fa-chevron-down" style="font-size: 10px;"></i>
      </button>
      <div class="dropdown-menu" id="userNavMenu">
        <a href="profile.html"><i class="fas fa-id-badge"></i> My Profile</a>
        <a href="orders.html"><i class="fas fa-box"></i> My Orders</a>
        <a href="wishlist.html"><i class="fas fa-heart"></i> Wishlist</a>
        ${adminLink}
        <hr/>
        <a href="javascript:void(0)" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </div>
    `;

    navBtn.replaceWith(dropdownWrap);
  }
}

// Toggle user dropdown
function toggleNavDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('userNavMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

// Close dropdown if clicked outside
document.addEventListener('click', function (e) {
  const menu = document.getElementById('userNavMenu');
  const trigger = document.getElementById('userDropdownTrigger');
  if (menu && menu.classList.contains('show')) {
    if (!trigger || !trigger.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
});

// Update global badge counters
function updateAllBadges() {
  // Cart count
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const totalCart = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartEl = document.getElementById('cartCount');
  if (cartEl) cartEl.textContent = totalCart;
  const bottomCartEl = document.getElementById('bottomCartCount');
  if (bottomCartEl) bottomCartEl.textContent = totalCart;
  const drawerCartEl = document.getElementById('drawerCartCount');
  if (drawerCartEl) drawerCartEl.textContent = totalCart;

  // Wishlist count
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const totalWish = wishlist.length;
  const wishEl = document.getElementById('wishCount');
  if (wishEl) wishEl.textContent = totalWish;
  const bottomWishEl = document.getElementById('bottomWishCount');
  if (bottomWishEl) bottomWishEl.textContent = totalWish;
  const drawerWishEl = document.getElementById('drawerWishCount');
  if (drawerWishEl) drawerWishEl.textContent = totalWish;
}

// Global Toast helper
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// ===== MOBILE NAVIGATION (DRAWER & BOTTOM APP BAR) =====
function openMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (drawer) drawer.classList.add('active');
  if (backdrop) backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (drawer) drawer.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

function initMobileNavigation() {
  const user = getCurrentUser();
  const rawPath = window.location.pathname;
  const page = rawPath.substring(rawPath.lastIndexOf('/') + 1) || 'index.html';

  // 1. Injects hamburger toggle into .navbar if not present
  const navbar = document.querySelector('.navbar');
  if (navbar && !document.getElementById('mobileMenuToggle')) {
    const burger = document.createElement('button');
    burger.id = 'mobileMenuToggle';
    burger.className = 'mobile-hamburger-btn';
    burger.setAttribute('aria-label', 'Open navigation menu');
    burger.type = 'button';
    burger.innerHTML = '<i class="fas fa-bars"></i>';
    burger.onclick = openMobileDrawer;
    navbar.insertBefore(burger, navbar.firstChild);
  }

  // 2. Injects Mobile Drawer & Backdrop if not present
  if (!document.getElementById('mobileDrawer')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'mobileDrawerBackdrop';
    backdrop.className = 'mobile-drawer-backdrop';
    backdrop.onclick = closeMobileDrawer;
    document.body.appendChild(backdrop);

    const drawer = document.createElement('div');
    drawer.id = 'mobileDrawer';
    drawer.className = 'mobile-drawer';
    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-brand">
          <i class="fas fa-spa"></i> Shop<span>Easy</span>
        </div>
        <button class="drawer-close-btn" type="button" onclick="closeMobileDrawer()" aria-label="Close menu">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="drawer-user-info">
        ${user ? `
          <div class="drawer-user-card">
            <div class="drawer-avatar"><i class="fas fa-user-circle"></i></div>
            <div class="drawer-user-text">
              <strong>${user.name || 'Valued Customer'}</strong>
              <span>${user.email || ''}</span>
            </div>
          </div>
        ` : `
          <div class="drawer-guest-banner">
            <p><i class="fas fa-user"></i> Welcome to ShopEasy!</p>
            <div class="drawer-auth-btns">
              <a href="login.html" class="btn-drawer-login"><i class="fas fa-sign-in-alt"></i> Log In</a>
              <a href="register.html" class="btn-drawer-reg"><i class="fas fa-user-plus"></i> Register</a>
            </div>
          </div>
        `}
      </div>

      <div class="drawer-section">
        <h4><i class="fas fa-tags"></i> Shop by Category</h4>
        <a href="index.html?cat=all"><span class="drawer-link-left"><i class="fas fa-th-large"></i> All Products</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
        <a href="index.html?cat=electronics"><span class="drawer-link-left"><i class="fas fa-laptop"></i> Electronics</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
        <a href="index.html?cat=clothing"><span class="drawer-link-left"><i class="fas fa-tshirt"></i> Clothing & Apparel</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
        <a href="index.html?cat=books"><span class="drawer-link-left"><i class="fas fa-book"></i> Books & Literature</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
        <a href="index.html?cat=home"><span class="drawer-link-left"><i class="fas fa-couch"></i> Home & Kitchen</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
        <a href="index.html?cat=beauty"><span class="drawer-link-left"><i class="fas fa-magic"></i> Beauty & Care</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
      </div>

      <div class="drawer-section">
        <h4><i class="fas fa-compass"></i> Quick Links</h4>
        <a href="cart.html"><span class="drawer-link-left"><i class="fas fa-shopping-cart"></i> Shopping Cart</span> <span class="drawer-badge" id="drawerCartCount">0</span></a>
        <a href="wishlist.html"><span class="drawer-link-left"><i class="fas fa-heart"></i> My Wishlist</span> <span class="drawer-badge" id="drawerWishCount">0</span></a>
        ${user ? `
          <a href="orders.html"><span class="drawer-link-left"><i class="fas fa-box"></i> My Orders</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
          <a href="profile.html"><span class="drawer-link-left"><i class="fas fa-id-badge"></i> Account Settings</span> <i class="fas fa-chevron-right" style="font-size:11px; color:#bbb;"></i></a>
          ${user.isAdmin ? `<a href="admin.html" class="drawer-admin-link"><span class="drawer-link-left"><i class="fas fa-crown"></i> Admin Dashboard</span> <i class="fas fa-chevron-right" style="font-size:11px;"></i></a>` : ''}
          <a href="javascript:void(0)" onclick="logout()" class="drawer-logout-link"><span class="drawer-link-left"><i class="fas fa-sign-out-alt"></i> Logout</span> <i class="fas fa-chevron-right" style="font-size:11px;"></i></a>
        ` : ''}
      </div>

      <div class="drawer-footer">
        <p><i class="fas fa-phone-alt" style="color:#8b1a2f;"></i> (+92) 321-000-0000</p>
        <p><i class="fas fa-shipping-fast" style="color:#8b1a2f;"></i> Free shipping over $50</p>
        <p><i class="fas fa-shield-alt" style="color:#8b1a2f;"></i> 100% Secure Checkout</p>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  // 3. Injects Mobile Bottom Nav if not present
  if (!document.getElementById('mobileBottomNav')) {
    const isHome = page === 'index.html' || page === '' || page.endsWith('/');
    const isWishlist = page === 'wishlist.html';
    const isCart = page === 'cart.html';
    const isAccount = page === 'profile.html' || page === 'orders.html' || page === 'login.html' || page === 'register.html';

    const bNav = document.createElement('nav');
    bNav.id = 'mobileBottomNav';
    bNav.className = 'mobile-bottom-nav';
    bNav.innerHTML = `
      <a href="index.html" class="bottom-nav-item ${isHome ? 'active' : ''}">
        <i class="fas fa-home"></i>
        <span>Home</span>
      </a>
      <a href="index.html#products" class="bottom-nav-item">
        <i class="fas fa-th-large"></i>
        <span>Shop</span>
      </a>
      <a href="wishlist.html" class="bottom-nav-item ${isWishlist ? 'active' : ''}">
        <div class="bottom-nav-icon-wrap">
          <i class="fas fa-heart"></i>
          <span class="bottom-badge" id="bottomWishCount">0</span>
        </div>
        <span>Wishlist</span>
      </a>
      <a href="cart.html" class="bottom-nav-item ${isCart ? 'active' : ''}">
        <div class="bottom-nav-icon-wrap">
          <i class="fas fa-shopping-cart"></i>
          <span class="bottom-badge" id="bottomCartCount">0</span>
        </div>
        <span>Cart</span>
      </a>
      <a href="${user ? 'profile.html' : 'login.html'}" class="bottom-nav-item ${isAccount ? 'active' : ''}">
        <i class="fas fa-user"></i>
        <span>${user ? 'Account' : 'Login'}</span>
      </a>
    `;
    document.body.appendChild(bNav);
  }
}

// Close drawer on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileDrawer();
});

// Run on page initialization
document.addEventListener('DOMContentLoaded', () => {
  updateNavUser();
  initMobileNavigation();
  updateAllBadges();
});
