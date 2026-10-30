// ===== PRODUCTS STATE & API INTEGRATION =====
let currentProducts = [];
let activeCategory = 'all';
let activeTab = 'all';

// Fallback dataset in case API is unreachable
const fallbackProducts = [
  {
    _id: 'prod_1',
    name: 'Wireless Noise-Cancelling Headphones',
    category: 'electronics',
    price: 59.99,
    oldPrice: 79.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 24,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    description: 'High-fidelity audio with active noise cancellation and 30-hour battery.',
  },
  {
    _id: 'prod_2',
    name: 'AeroStride Pro Running Shoes',
    category: 'clothing',
    price: 89.99,
    oldPrice: 119.99,
    discount: '25% OFF',
    rating: 4,
    numReviews: 18,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    description: 'Lightweight responsive running shoes designed for all terrains.',
  },
  {
    _id: 'prod_3',
    name: 'Mastering JavaScript & Web Development',
    category: 'books',
    price: 29.99,
    oldPrice: 39.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 32,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    description: 'Learn modern JavaScript from scratch with real-world project examples.',
  },
  {
    _id: 'prod_4',
    name: 'Apex Smart Watch Series 7',
    category: 'electronics',
    price: 199.99,
    oldPrice: 249.99,
    discount: '20% OFF',
    rating: 5,
    numReviews: 40,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    description: 'Feature-packed luxury smartwatch with health and workout tracking.',
  },
  {
    _id: 'prod_5',
    name: 'Artisan Espresso Coffee Machine',
    category: 'home',
    price: 49.99,
    oldPrice: 69.99,
    discount: '28% OFF',
    rating: 4,
    numReviews: 15,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
    description: 'Brew rich, barista-quality espresso at home with automatic milk frother.',
  },
  {
    _id: 'prod_6',
    name: 'Heritage Classic Denim Jacket',
    category: 'clothing',
    price: 69.99,
    oldPrice: 99.99,
    discount: '30% OFF',
    rating: 4,
    numReviews: 19,
    stock: 14,
    image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=500',
    description: 'Classic durable denim jacket for timeless casual style.',
  },
  {
    _id: 'prod_7',
    name: 'Surround Bass Bluetooth Speaker',
    category: 'electronics',
    price: 39.99,
    oldPrice: 54.99,
    discount: '27% OFF',
    rating: 5,
    numReviews: 28,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
    description: 'Rugged portable waterproof bluetooth speaker with 12-hour playback.',
  },
  {
    _id: 'prod_8',
    name: 'Python for Modern Data Science & AI',
    category: 'books',
    price: 34.99,
    oldPrice: 44.99,
    discount: '22% OFF',
    rating: 5,
    numReviews: 12,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
    description: 'Master Python programming, Pandas, visualization, and machine learning.',
  },
  {
    _id: 'prod_9',
    name: 'Glow Boost Vitamin C Radiance Serum',
    category: 'beauty',
    price: 44.99,
    oldPrice: 59.99,
    discount: '25% OFF',
    rating: 5,
    numReviews: 50,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
    description: 'Organic antioxidant-rich facial serum for hydration and youthful glow.',
  },
];

// Helper: generate star symbols
function getStars(rating) {
  const r = Math.round(rating || 5);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

// ===== FETCH PRODUCTS FROM SERVER =====
async function fetchProducts() {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');

  const search = searchInput ? searchInput.value.trim() : '';
  const sort = sortSelect ? sortSelect.value : 'default';
  const minPrice = minPriceInput ? minPriceInput.value : '';
  const maxPrice = maxPriceInput ? maxPriceInput.value : '';

  let url = `/api/products?category=${encodeURIComponent(activeCategory)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (sort && sort !== 'default') url += `&sort=${encodeURIComponent(sort)}`;
  if (minPrice) url += `&minPrice=${encodeURIComponent(minPrice)}`;
  if (maxPrice) url += `&maxPrice=${encodeURIComponent(maxPrice)}`;
  if (activeTab && activeTab !== 'all') url += `&tab=${encodeURIComponent(activeTab)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    currentProducts = data && data.length > 0 ? data : [];
    displayProducts(currentProducts);
  } catch (err) {
    console.warn('Using local fallback products due to server error:', err.message);
    let filtered = [...fallbackProducts];
    if (activeCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    if (search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    currentProducts = filtered;
    displayProducts(currentProducts);
  }
}

// ===== RENDER PRODUCTS GRID =====
function displayProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: white; border-radius: 12px; border: 1px solid #f0e6e8;">
        <i class="fas fa-search" style="font-size: 40px; color: #d0b8be; margin-bottom: 12px;"></i>
        <h3 style="color: #444; margin-bottom: 6px;">No products found</h3>
        <p style="color: #777; font-size: 14px;">Try adjusting your search terms or category filters.</p>
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    const id = product._id || product.id;
    const badgeText = product.badge || product.discount || '';
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      ${badgeText ? `<span class="badge">${badgeText}</span>` : ''}
      <img src="${product.image}" alt="${product.name}"
           onerror="this.src='https://via.placeholder.com/400x250?text=No+Image'"/>
      <div class="product-info">
        <div class="stars">${getStars(product.rating)} <span style="font-size: 11px; color:#888;">(${product.numReviews || 0})</span></div>
        <h3>${product.name}</h3>
        <div class="price-row">
          <span class="price">$${parseFloat(product.price).toFixed(2)}</span>
          ${product.oldPrice ? `<span class="old-price">$${parseFloat(product.oldPrice).toFixed(2)}</span>` : ''}
        </div>
        <div class="stock-status ${isOutOfStock ? 'stock-out' : (product.stock < 5 ? 'stock-low' : 'stock-in')}">
          ${isOutOfStock ? '❌ Out of Stock' : (product.stock < 5 ? `⚠️ Only ${product.stock} left in stock` : '✔️ In Stock')}
        </div>
        <div class="card-btn-row" style="margin-top: 10px;">
          <button class="btn-add-cart" ${isOutOfStock ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''} onclick="event.stopPropagation(); addToCart('${id}')">
            <i class="fas fa-cart-plus"></i> ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
          <button class="btn-wish-icon" data-id="${id}"
                  onclick="event.stopPropagation(); toggleWishlist('${id}')"
                  title="Save to Wishlist">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      localStorage.setItem('selectedProduct', JSON.stringify(product));
      window.location.href = `product-detail.html?id=${id}`;
    });

    grid.appendChild(card);
  });

  if (typeof updateHeartIcons === 'function') {
    updateHeartIcons();
  }
}

// ===== CATEGORY FILTER =====
function filterByCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-nav a').forEach((a) => {
    a.classList.remove('active');
  });

  const activeLink = document.querySelector(`.cat-nav a[data-cat="${cat}"]`);
  if (activeLink) activeLink.classList.add('active');

  fetchProducts();
}

// ===== TAB FILTER (New Arrivals, Bestseller, Special) =====
function switchTab(btn, type) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  activeTab = type;
  fetchProducts();
}

// ===== SEARCH FILTER WITH DEBOUNCE =====
let searchDebounceTimer = null;
function filterProducts() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    fetchProducts();
  }, 300);
}

// ===== INITIALIZE LISTENERS ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', fetchProducts);
  }

  // Parse URL query parameters (?cat=..., ?search=..., ?sort=..., ?tab=...)
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('cat');
  const searchParam = params.get('search');
  const sortParam = params.get('sort');
  const tabParam = params.get('tab');

  if (catParam) {
    activeCategory = catParam;
    document.querySelectorAll('.cat-nav a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-cat') === catParam);
    });
  }

  if (searchParam && searchInput) {
    searchInput.value = searchParam;
  }

  if (sortParam && sortSelect) {
    sortSelect.value = sortParam;
  }

  if (tabParam) {
    activeTab = tabParam;
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.remove('active');
    });
    const matchingTab = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.toLowerCase().includes(tabParam));
    if (matchingTab) matchingTab.classList.add('active');
  }

  if (document.getElementById('productsGrid')) {
    fetchProducts();
  }
});
