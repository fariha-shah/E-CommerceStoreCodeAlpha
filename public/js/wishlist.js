// ===== WISHLIST CORE FUNCTIONS =====

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(wishlist) {
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishCount();
}

function updateWishCount() {
  const wishlist = getWishlist();
  const countEl = document.getElementById('wishCount');
  if (countEl) countEl.textContent = wishlist.length;
}

function isWishlisted(productId) {
  const wishlist = getWishlist();
  return wishlist.some((p) => (p._id || p.id) == productId);
}

// Toggle Wishlist item
async function toggleWishlist(productId) {
  if (!isLoggedIn()) {
    requireLogin('Please login to save items to your wishlist!');
    return;
  }

  let product = null;
  if (typeof currentProducts !== 'undefined' && currentProducts.length > 0) {
    product = currentProducts.find((p) => (p._id || p.id) == productId);
  }
  if (!product && typeof fallbackProducts !== 'undefined') {
    product = fallbackProducts.find((p) => (p._id || p.id) == productId);
  }
  if (!product) {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) product = await res.json();
    } catch (e) {}
  }

  if (!product) return;

  const id = product._id || product.id || productId;
  let wishlist = getWishlist();
  const exists = wishlist.find((p) => (p._id || p.id) == id);

  if (exists) {
    wishlist = wishlist.filter((p) => (p._id || p.id) != id);
    saveWishlist(wishlist);
    showToast(`💔 <strong>${product.name}</strong> removed from wishlist.`);
  } else {
    wishlist.push({
      id: id,
      _id: id,
      name: product.name,
      category: product.category,
      price: parseFloat(product.price),
      oldPrice: product.oldPrice ? parseFloat(product.oldPrice) : null,
      discount: product.discount || '',
      rating: product.rating || 5,
      image: product.image,
      stock: product.stock,
      description: product.description,
    });
    saveWishlist(wishlist);
    showToast(`❤️ <strong>${product.name}</strong> saved to your wishlist!`);
  }

  updateHeartIcons();

  if (document.getElementById('wishlistGrid')) {
    renderWishlist();
  }
}

// Update heart icons appearance
function updateHeartIcons() {
  document.querySelectorAll('.btn-wish-icon').forEach((btn) => {
    const id = btn.getAttribute('data-id');
    if (isWishlisted(id)) {
      btn.classList.add('wishlisted');
      btn.style.color = '#8b1a2f';
      btn.style.background = '#fdf0f3';
      btn.style.borderColor = '#8b1a2f';
    } else {
      btn.classList.remove('wishlisted');
      btn.style.color = '#ccc';
      btn.style.background = 'white';
      btn.style.borderColor = '#f0e6e9';
    }
  });
}

// Render wishlist page
function renderWishlist() {
  const wishlist = getWishlist();
  const grid = document.getElementById('wishlistGrid');
  const emptyEl = document.getElementById('emptyWishlist');
  const footerEl = document.getElementById('wishFooter');
  const countEl = document.getElementById('wishlistCount');

  if (!grid) return;

  if (countEl) {
    countEl.textContent = `${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'}`;
  }

  if (wishlist.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    grid.style.display = 'none';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  grid.style.display = 'grid';
  if (footerEl) footerEl.style.display = 'flex';

  grid.innerHTML = '';

  wishlist.forEach((product) => {
    const id = product._id || product.id;
    const card = document.createElement('div');
    card.className = 'wish-card';
    card.innerHTML = `
      ${product.discount ? `<span class="wish-badge">${product.discount}</span>` : ''}
      <button class="btn-remove-wish" onclick="toggleWishlist('${id}')" title="Remove">
        <i class="fas fa-times"></i>
      </button>
      <img src="${product.image}" alt="${product.name}"
           onerror="this.src='https://via.placeholder.com/400x220?text=No+Image'"
           onclick="viewProduct('${id}')"/>
      <div class="wish-card-info">
        <div class="stars">${getStars ? getStars(product.rating) : '★★★★★'}</div>
        <p class="wish-category">${product.category.toUpperCase()}</p>
        <h3>${product.name}</h3>
        <div class="wish-price-row">
          <span class="price">$${parseFloat(product.price).toFixed(2)}</span>
          ${product.oldPrice ? `<span class="old-price">$${parseFloat(product.oldPrice).toFixed(2)}</span>` : ''}
        </div>
        <div class="wish-btn-row">
          <button class="btn-wish-cart" onclick="addToCart('${id}')">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
          <button class="btn-wish-view" onclick="viewProduct('${id}')">
            <i class="fas fa-eye"></i> View
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function viewProduct(productId) {
  const wishlist = getWishlist();
  const product = wishlist.find((p) => (p._id || p.id) == productId);
  if (product) {
    localStorage.setItem('selectedProduct', JSON.stringify(product));
  }
  window.location.href = `product-detail.html?id=${productId}`;
}

function clearWishlist() {
  if (!confirm('Are you sure you want to clear your entire wishlist?')) return;
  localStorage.removeItem('wishlist');
  updateWishCount();
  showToast('💔 Wishlist cleared.');
  renderWishlist();
}

document.addEventListener('DOMContentLoaded', () => {
  updateWishCount();
  if (document.getElementById('wishlistGrid')) {
    renderWishlist();
  }
});
