// ============================================================
//  app.js — Seventy Seven Stickers
//  Cart, filtering, Sanity fetch, WhatsApp checkout
// ============================================================

const WHATSAPP_NUMBER = '254756600381'; // Kenya format (no +)
const PRICE_PER_STICKER = 20;

// -------------------------------------------------------
//  CATEGORY METADATA
// -------------------------------------------------------
const CATEGORY_META = {
  all:    { label: 'All Stickers', desc: 'Showing all stickers', emoji: '🎨' },
  anime:  { label: 'Anime',        desc: 'Anime collection',     emoji: '⚔️' },
  game:   { label: 'Game On',      desc: 'Gaming collection',    emoji: '🎮' },
  screen: { label: 'Screen Legends',desc: 'Screen legends',      emoji: '🎬' },
  chill:  { label: 'Chillzone',    desc: 'Chillzone vibes',      emoji: '🌊' },
  wild:   { label: 'Wildcards',    desc: 'Wildcard picks',       emoji: '🃏' },
};

const BADGE_CLASS = {
  anime:  'badge-anime',
  game:   'badge-game',
  screen: 'badge-screen',
  chill:  'badge-chill',
  wild:   'badge-wild',
};

// -------------------------------------------------------
//  DEMO / FALLBACK STICKERS (used when Sanity is not yet set up)
// -------------------------------------------------------
const DEMO_STICKERS = [
  { _id: 'd1', name: 'Naruto Run', category: 'anime',  image: null, emoji: '🍃' },
  { _id: 'd2', name: 'Akira Slide', category: 'anime', image: null, emoji: '🛵' },
  { _id: 'd3', name: 'Gojo Drip',  category: 'anime', image: null, emoji: '👁️' },
  { _id: 'd4', name: 'Luffy Gear 5',category:'anime', image: null, emoji: '🌀' },

  { _id: 'd5', name: 'Controller King', category: 'game', image: null, emoji: '🎮' },
  { _id: 'd6', name: 'Pixel Life',      category: 'game', image: null, emoji: '🕹️' },
  { _id: 'd7', name: 'GG No Re',        category: 'game', image: null, emoji: '🏆' },
  { _id: 'd8', name: 'Respawn',         category: 'game', image: null, emoji: '💀' },

  { _id: 'd9',  name: 'Tony Stark',     category: 'screen', image: null, emoji: '🔴' },
  { _id: 'd10', name: 'Morpheus Pill',  category: 'screen', image: null, emoji: '💊' },
  { _id: 'd11', name: 'Walter White',   category: 'screen', image: null, emoji: '🧪' },
  { _id: 'd12', name: 'The Dude Abides',category: 'screen', image: null, emoji: '🎳' },

  { _id: 'd13', name: 'Lo-Fi Mood',     category: 'chill',  image: null, emoji: '🎧' },
  { _id: 'd14', name: 'Wave Check',     category: 'chill',  image: null, emoji: '🌊' },
  { _id: 'd15', name: 'Nap Time',       category: 'chill',  image: null, emoji: '😴' },
  { _id: 'd16', name: 'Sunset Drip',    category: 'chill',  image: null, emoji: '🌅' },

  { _id: 'd17', name: 'Chaos Agent',    category: 'wild',   image: null, emoji: '🃏' },
  { _id: 'd18', name: 'Frog Mode',      category: 'wild',   image: null, emoji: '🐸' },
  { _id: 'd19', name: 'Random Drop',    category: 'wild',   image: null, emoji: '🎲' },
  { _id: 'd20', name: 'Caught In 4K',   category: 'wild',   image: null, emoji: '📸' },
];

// -------------------------------------------------------
//  STATE
// -------------------------------------------------------
let allStickers = [];
let cart = JSON.parse(localStorage.getItem('s77_cart') || '[]');
let currentCategory = 'all';

// -------------------------------------------------------
//  INIT
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  updateCartUI();
  await loadStickers();
});

// -------------------------------------------------------
//  LOAD STICKERS FROM SANITY (or fall back to demo)
// -------------------------------------------------------
async function loadStickers() {
  const grid = document.getElementById('stickerGrid');
  grid.innerHTML = `
    <div class="loading-wrap">
      <div class="spinner"></div>
      <p>LOADING STICKERS...</p>
    </div>`;

  try {
    // GROQ query — fetches all sticker documents
    const query = `*[_type == "sticker"] | order(_createdAt desc) {
      _id,
      name,
      category,
      "image": image
    }`;

    const results = await sanityFetch(query);

    if (results && results.length > 0) {
      allStickers = results;
    } else {
      // Sanity returned empty — use demo data
      allStickers = DEMO_STICKERS;
    }
  } catch (err) {
    console.warn('Sanity not configured yet, using demo stickers:', err.message);
    allStickers = DEMO_STICKERS;
  }

  renderStickers(currentCategory);
}

// -------------------------------------------------------
//  RENDER
// -------------------------------------------------------
function renderStickers(category) {
  const grid      = document.getElementById('stickerGrid');
  const emptyState = document.getElementById('emptyState');
  const descEl     = document.getElementById('categoryDesc');

  const filtered = category === 'all'
    ? allStickers
    : allStickers.filter(s => s.category === category);

  descEl.textContent = `${CATEGORY_META[category]?.desc || 'Showing stickers'} — ${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  grid.innerHTML = filtered.map((sticker, i) => buildCard(sticker, i)).join('');
}

function buildCard(sticker, index) {
  const inCart  = cart.some(c => c._id === sticker._id);
  const imgUrl  = sticker.image ? sanityImageUrl(sticker.image, { width: 400, height: 400, fit: 'crop' }) : null;
  const badgeClass = BADGE_CLASS[sticker.category] || '';
  const catLabel   = CATEGORY_META[sticker.category]?.label || sticker.category;
  const delay = Math.min(index * 0.04, 0.4);

  const imgHtml = imgUrl
    ? `<img src="${imgUrl}" alt="${sticker.name}" loading="lazy" />`
    : `<div class="sticker-img-placeholder">${sticker.emoji || '🎨'}</div>`;

  return `
    <div class="sticker-card ${inCart ? 'in-cart' : ''}" id="card-${sticker._id}" style="animation-delay:${delay}s">
      <div class="sticker-img-wrap">
        ${imgHtml}
        <span class="card-badge ${badgeClass}">${catLabel}</span>
      </div>
      <div class="sticker-info">
        <div class="sticker-name">${sticker.name}</div>
        <div class="sticker-bottom">
          <span class="sticker-price">KES ${PRICE_PER_STICKER}</span>
          <button class="add-btn ${inCart ? 'added' : ''}" onclick="addToCart('${sticker._id}')">
            ${inCart ? '✓ ADDED' : '+ ADD'}
          </button>
        </div>
      </div>
    </div>`;
}

// -------------------------------------------------------
//  FILTER
// -------------------------------------------------------
function filterStickers(category, btnEl) {
  currentCategory = category;

  // Update tab active state
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  else {
    const tab = document.querySelector(`.tab[data-cat="${category}"]`);
    if (tab) tab.classList.add('active');
  }

  renderStickers(category);

  // Scroll to shop section
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// -------------------------------------------------------
//  CART OPERATIONS
// -------------------------------------------------------
function addToCart(id) {
  const sticker = allStickers.find(s => s._id === id);
  if (!sticker) return;

  const existing = cart.find(c => c._id === id);
  if (existing) {
    existing.qty += 1;
    showToast(`+1 ${sticker.name} 🛒`);
  } else {
    cart.push({ ...sticker, qty: 1 });
    showToast(`${sticker.name} added! 🔥`, 'gold');
  }

  saveCart();
  updateCartUI();
  refreshCardButton(id);
}

function changeQty(id, delta) {
  const item = cart.find(c => c._id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); }
}

function removeFromCart(id) {
  cart = cart.filter(c => c._id !== id);
  saveCart();
  updateCartUI();
  refreshCardButton(id);
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  // Refresh all card buttons
  allStickers.forEach(s => refreshCardButton(s._id));
  showToast('Cart cleared');
}

function refreshCardButton(id) {
  const card = document.getElementById(`card-${id}`);
  if (!card) return;
  const inCart = cart.some(c => c._id === id);
  const btn = card.querySelector('.add-btn');
  if (btn) {
    btn.textContent = inCart ? '✓ ADDED' : '+ ADD';
    btn.classList.toggle('added', inCart);
  }
  card.classList.toggle('in-cart', inCart);
}

function saveCart() {
  localStorage.setItem('s77_cart', JSON.stringify(cart));
}

// -------------------------------------------------------
//  CART UI
// -------------------------------------------------------
function updateCartUI() {
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalCost  = totalItems * PRICE_PER_STICKER;

  document.getElementById('cartCount').textContent = totalItems;

  const itemsEl  = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const totalEl  = document.getElementById('cartTotal');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';
  totalEl.textContent = `KES ${totalCost}`;

  itemsEl.innerHTML = cart.map(item => {
    const imgUrl = item.image ? sanityImageUrl(item.image, { width: 120, height: 120, fit: 'crop' }) : null;
    const imgHtml = imgUrl
      ? `<img src="${imgUrl}" alt="${item.name}" />`
      : (item.emoji || '🎨');

    return `
      <div class="cart-item">
        <div class="cart-item-img">${imgHtml}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">KES ${PRICE_PER_STICKER} each</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item._id}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item._id}', 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart('${item._id}')" title="Remove">✕</button>
        </div>
      </div>`;
  }).join('');
}

// -------------------------------------------------------
//  CART SIDEBAR TOGGLE
// -------------------------------------------------------
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const isOpen  = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

// -------------------------------------------------------
//  WHATSAPP CHECKOUT
// -------------------------------------------------------
function checkoutWhatsApp() {
  if (cart.length === 0) return;

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalCost  = totalItems * PRICE_PER_STICKER;

  const lines = cart.map(item =>
    `• ${item.name} x${item.qty} = KES ${item.qty * PRICE_PER_STICKER}`
  );

  const message = [
    '🎨 *SEVENTY SEVEN STICKERS — ORDER*',
    '',
    ...lines,
    '',
    `📦 Total Items: ${totalItems}`,
    `💰 Total Cost: *KES ${totalCost}*`,
    '',
    'Please confirm my order and send payment details. Thank you! 🙏'
  ].join('\n');

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// -------------------------------------------------------
//  TOAST
// -------------------------------------------------------
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 2800);
}

// -------------------------------------------------------
//  MOBILE MENU
// -------------------------------------------------------
function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('mobile-open');
}
