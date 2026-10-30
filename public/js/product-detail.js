// ===== PRODUCT DETAIL CONTROLLER =====
let currentProduct = null;
let currentQty = 1;
let selectedRating = 5;

// Star symbols helper
function getStars(rating) {
  const r = Math.round(rating || 5);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

// Extract product ID from query parameter
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Load product details
async function loadProductDetail() {
  const urlId = getProductIdFromUrl();
  let localData = null;

  try {
    localData = JSON.parse(localStorage.getItem('selectedProduct'));
  } catch (e) {}

  let productId = urlId || (localData ? (localData._id || localData.id) : null);

  if (!productId) {
    window.location.href = 'index.html';
    return;
  }

  // Fetch full details from API
  try {
    const res = await fetch(`/api/products/${productId}`);
    if (res.ok) {
      currentProduct = await res.json();
    } else if (localData) {
      currentProduct = localData;
    }
  } catch (err) {
    if (localData) currentProduct = localData;
    if (!currentProduct && typeof fallbackProducts !== 'undefined') {
      currentProduct = fallbackProducts.find((p) => p._id === productId || p.id == productId) || fallbackProducts[0];
    }
  }

  if (!currentProduct) {
    window.location.href = 'index.html';
    return;
  }

  // Set document title
  document.title = `${currentProduct.name} - ShopEasy`;

  // Breadcrumb
  const breadcrumb = document.getElementById('breadcrumbName');
  if (breadcrumb) breadcrumb.textContent = currentProduct.name;

  // Main Image
  const mainImg = document.getElementById('mainImage');
  if (mainImg) mainImg.src = currentProduct.image;

  // Badge
  const badge = document.getElementById('detailBadge');
  const badgeText = currentProduct.badge || currentProduct.discount || '';
  if (badge) {
    if (badgeText) {
      badge.textContent = badgeText;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  // Thumbnails gallery
  const thumbRow = document.getElementById('thumbRow');
  if (thumbRow) {
    thumbRow.innerHTML = '';
    const images = [currentProduct.image, currentProduct.image, currentProduct.image];
    images.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'thumb-img' + (idx === 0 ? ' active' : '');
      img.alt = 'Thumbnail ' + (idx + 1);
      img.onclick = () => {
        if (mainImg) mainImg.src = src;
        document.querySelectorAll('.thumb-img').forEach((t) => t.classList.remove('active'));
        img.classList.add('active');
      };
      thumbRow.appendChild(img);
    });
  }

  // Category
  const catEl = document.getElementById('detailCategory');
  if (catEl) catEl.textContent = (currentProduct.category || '').toUpperCase();

  // Name
  const nameEl = document.getElementById('detailName');
  if (nameEl) nameEl.textContent = currentProduct.name;

  // Stars & Reviews count
  const starsEl = document.getElementById('detailStars');
  if (starsEl) {
    const reviewCount = currentProduct.numReviews || (currentProduct.reviews ? currentProduct.reviews.length : 0);
    starsEl.textContent = `${getStars(currentProduct.rating)} (${reviewCount} customer reviews)`;
  }

  // Price
  const priceEl = document.getElementById('detailPrice');
  if (priceEl) priceEl.textContent = `$${parseFloat(currentProduct.price).toFixed(2)}`;

  // Old Price
  const oldPriceEl = document.getElementById('detailOldPrice');
  if (oldPriceEl) {
    oldPriceEl.textContent = currentProduct.oldPrice ? `$${parseFloat(currentProduct.oldPrice).toFixed(2)}` : '';
  }

  // Discount
  const discEl = document.getElementById('detailDiscount');
  if (discEl) {
    discEl.textContent = currentProduct.discount || '';
    discEl.style.display = currentProduct.discount ? 'inline-block' : 'none';
  }

  // Stock status
  const stockEl = document.getElementById('detailStock');
  const btnAdd = document.getElementById('btnAddToCartDetail');
  const stock = currentProduct.stock !== undefined ? currentProduct.stock : 10;

  if (stockEl) {
    if (stock <= 0) {
      stockEl.innerHTML = '<span style="color:#e74c3c;">❌ Out of Stock</span>';
      if (btnAdd) {
        btnAdd.disabled = true;
        btnAdd.style.opacity = '0.6';
        btnAdd.style.cursor = 'not-allowed';
        btnAdd.innerHTML = '<i class="fas fa-ban"></i> Out of Stock';
      }
    } else if (stock < 5) {
      stockEl.innerHTML = `<span style="color:#e67e22;">⚠️ Only ${stock} left in stock - order soon!</span>`;
      if (btnAdd) btnAdd.disabled = false;
    } else {
      stockEl.innerHTML = `<span style="color:#27ae60;">✔️ In Stock (${stock} units available)</span>`;
      if (btnAdd) btnAdd.disabled = false;
    }
  }

  // Description
  const descEl = document.getElementById('detailDescription');
  if (descEl) descEl.textContent = currentProduct.description;

  // Load reviews & related products
  renderReviewsList(currentProduct.reviews || []);
  loadRelatedProducts();
  updateWishBtn();
}

// Quantity controls
function changeQty(change) {
  const maxStock = currentProduct && currentProduct.stock !== undefined ? currentProduct.stock : 99;
  currentQty = Math.max(1, Math.min(maxStock, currentQty + change));
  const qtyEl = document.getElementById('qtyDisplay');
  if (qtyEl) qtyEl.textContent = currentQty;
}

// Add to Cart
function addToCartDetail() {
  if (!isLoggedIn()) {
    requireLogin('Please login to add items to your cart!');
    return;
  }

  if (!currentProduct) return;
  const id = currentProduct._id || currentProduct.id;
  addToCart(id, currentQty);
}

// Wishlist toggle
function toggleWishlistDetail() {
  if (!currentProduct) return;
  const id = currentProduct._id || currentProduct.id;
  toggleWishlist(id);
  updateWishBtn();
}

function updateWishBtn() {
  const btn = document.getElementById('wishBtn');
  if (!btn || !currentProduct) return;

  const id = currentProduct._id || currentProduct.id;
  if (isWishlisted(id)) {
    btn.style.background = '#8b1a2f';
    btn.style.color = 'white';
    btn.innerHTML = '<i class="fas fa-heart"></i> Saved to Wishlist';
  } else {
    btn.style.background = 'white';
    btn.style.color = '#8b1a2f';
    btn.innerHTML = '<i class="fas fa-heart"></i> Add to Wishlist';
  }
}

// Render reviews list
function renderReviewsList(reviews) {
  const listEl = document.getElementById('reviewsList');
  if (!listEl) return;

  if (!reviews || reviews.length === 0) {
    listEl.innerHTML = `
      <div style="background: #fafafa; padding: 20px; border-radius: 8px; border: 1px dashed #ddd; text-align: center; color: #777;">
        <i class="far fa-comment-dots" style="font-size: 28px; margin-bottom: 8px; color: #ccc;"></i>
        <p style="margin: 0; font-size: 13px;">No customer reviews yet. Be the first to share your experience!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = '';
  reviews.forEach((r) => {
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Verified Buyer';
    const card = document.createElement('div');
    card.style.cssText = 'background: white; border: 1px solid #eee; border-radius: 8px; padding: 14px 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <strong style="color: #333; font-size: 14px;"><i class="fas fa-user-check" style="color: #27ae60; font-size: 12px;"></i> ${r.name}</strong>
        <span style="font-size: 12px; color: #999;">${dateStr}</span>
      </div>
      <div style="color: #f1c40f; font-size: 14px; margin-bottom: 6px;">${getStars(r.rating)}</div>
      <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.5;">${r.comment}</p>
    `;
    listEl.appendChild(card);
  });
}

// Interactive Star Picker
function setRating(val) {
  selectedRating = val;
  const spans = document.querySelectorAll('#starPicker span');
  spans.forEach((span, idx) => {
    span.style.color = idx < val ? '#f1c40f' : '#ccc';
  });

  const labels = ['', '1 Star - Poor', '2 Stars - Fair', '3 Stars - Good', '4 Stars - Very Good', '5 Stars - Excellent'];
  const lbl = document.getElementById('ratingLabel');
  if (lbl) lbl.textContent = labels[val];
}

// Submit Customer Review
async function submitReview() {
  if (!isLoggedIn()) {
    requireLogin('Please login to leave a review on this product.');
    return;
  }

  if (!currentProduct) return;

  const commentInput = document.getElementById('reviewComment');
  const comment = commentInput ? commentInput.value.trim() : '';

  if (!comment) {
    showToast('⚠️ Please write a brief review comment before submitting.');
    return;
  }

  const id = currentProduct._id || currentProduct.id;
  const token = getToken();

  try {
    const res = await fetch(`/api/products/${id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ rating: selectedRating, comment }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast('🎉 Thank you! Your review has been published.');
      if (commentInput) commentInput.value = '';
      loadProductDetail(); // Reload detail with new review
    } else {
      showToast(`❌ ${data.message || 'Failed to submit review.'}`);
    }
  } catch (err) {
    // Static hosting demo mode
    const user = getCurrentUser() || { name: 'Verified Customer' };
    if (!currentProduct.reviews) currentProduct.reviews = [];
    currentProduct.reviews.unshift({
      name: user.name,
      rating: selectedRating,
      comment: comment,
      createdAt: new Date().toISOString(),
    });
    showToast('🎉 Thank you! Your review has been published (Demo Mode).');
    if (commentInput) commentInput.value = '';
    renderReviewsList(currentProduct.reviews);
  }
}

// Load Related Products
async function loadRelatedProducts() {
  const grid = document.getElementById('relatedGrid');
  if (!grid || !currentProduct) return;

  grid.innerHTML = '<p style="color:#888;">Loading related products...</p>';

  try {
    const res = await fetch(`/api/products?category=${encodeURIComponent(currentProduct.category)}`);
    if (!res.ok) throw new Error();
    const list = await res.json();
    const related = list
      .filter((p) => (p._id || p.id) != (currentProduct._id || currentProduct.id))
      .slice(0, 4);

    if (related.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; color:#999; text-align:center;">No related products found in this category.</p>';
      return;
    }

    grid.innerHTML = '';
    related.forEach((prod) => {
      const id = prod._id || prod.id;
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        ${prod.discount ? `<span class="badge">${prod.discount}</span>` : ''}
        <img src="${prod.image}" alt="${prod.name}"
             onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'"/>
        <div class="product-info">
          <div class="stars">${getStars(prod.rating)}</div>
          <h3>${prod.name}</h3>
          <div class="price-row">
            <span class="price">$${parseFloat(prod.price).toFixed(2)}</span>
            ${prod.oldPrice ? `<span class="old-price">$${parseFloat(prod.oldPrice).toFixed(2)}</span>` : ''}
          </div>
          <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${id}')">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      `;
      card.addEventListener('click', () => {
        localStorage.setItem('selectedProduct', JSON.stringify(prod));
        window.location.href = `product-detail.html?id=${id}`;
      });
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProductDetail();
});
