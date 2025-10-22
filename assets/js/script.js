/* script.js — TechMart FINAL VERSION (Offline + Login Protection)
   Fully functional: login, register, cart, checkout, theme toggle, offline products.
   Author: Raihana jami
   */

///////////////////////////////////////////////////////////////
// === ACCESS CONTROL: redirect to login if not logged in === //
///////////////////////////////////////////////////////////////
const protectedPages = ["index.html", "cart.html", "checkout.html", "about.html"];
const currentPage = window.location.pathname.split("/").pop();
const loggedIn = sessionStorage.getItem("loggedInUser");
if (protectedPages.includes(currentPage) && !loggedIn) {
  window.location.href = "login.html";
}

///////////////////////////////////////////////////////////////
// === Offline Product List (Always visible) === //
///////////////////////////////////////////////////////////////
const offlineProducts = [
  {
    id: 1,
    title: "Sample Running Shoes",
    price: 49.99,
    description: "Comfortable running shoes for daily training.",
    image: "assets/images/shoes.jpg"
  },
  {
    id: 2,
    title: "Casual Shirt",
    price: 29.99,
    description: "Light cotton shirt, perfect for all-day wear.",
    image: "assets/images/shirt.jpg"
  },
  {
    id: 3,
    title: "Wireless Headphones",
    price: 79.99,
    description: "Noise-isolating wireless headphones with long battery.",
    image: "assets/images/headphones.jpg"
  }
];

///////////////////////////////////////////////////////////////
// === Variables === //
///////////////////////////////////////////////////////////////
let products = offlineProducts;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
const productsGrid = document.getElementById('products-grid');
const loadingEl = document.getElementById('loading');
const cartCount = document.getElementById('cart-count');
const welcomeMsg = document.getElementById('welcome-msg');
const loginLink = document.getElementById('login-link');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search');
const themeToggle = document.getElementById('theme-toggle');

// Bootstrap modal (for product details)
const modalEl = document.getElementById('productModal');
const modal = (typeof bootstrap !== 'undefined' && modalEl) ? new bootstrap.Modal(modalEl) : null;
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalPrice = document.getElementById('modal-price');
const modalQty = document.getElementById('modal-qty');
const modalAddBtn = document.getElementById('modal-add-btn');

///////////////////////////////////////////////////////////////
// === Initialization === //
///////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  handleAuthUI();
  renderProducts(products);
  showLoading(false);

  // Search filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = products.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      renderProducts(filtered);
    });
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
    });
  }

  // === LOGIN ===
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => (u.email === username || u.username === username) && u.password === password);
      if (user) {
        sessionStorage.setItem('loggedInUser', JSON.
          stringify({ username: user.username }));
        window.location.href = 'index.html';
      } else {
        alert('Invalid username or password!');
      }
    });
  }

  // === REGISTER ===
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      if (!name || !email || password.length < 4) {
        regForm.classList.add('was-validated');
        return;
      }
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      users.push({ username: name, email, password });
      localStorage.setItem('users', JSON.stringify(users));
      alert('Registration successful! You can now log in.');
      regForm.reset();
    });
  }

  // === LOGOUT ===
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('loggedInUser');
      handleAuthUI();
      window.location.href = 'login.html';
    });
  }

  // === CHECKOUT ===
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkoutForm.checkValidity()) {
        checkoutForm.classList.add('was-validated');
        return;
      }
      localStorage.removeItem('cart');
      cart = [];
      updateCartUI();
      document.getElementById('checkout-success').classList.remove('d-none');
      setTimeout(() => window.location.href = 'index.html', 2500);
    });
  }

  // === CART PAGE ===
  if (document.getElementById('cart-items')) {
    renderCartPage();
  }
});

///////////////////////////////////////////////////////////////
// === Functions === //
///////////////////////////////////////////////////////////////
function showLoading(show){ if (loadingEl) loadingEl.style.display = show ? 'block' : 'none'; }

function renderProducts(list){
  if (!productsGrid) return;
  productsGrid.innerHTML = '';
  list.forEach(product => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 fade-in-up';
    const card = document.createElement('div');
    card.className = 'card product-card h-100';
    card.innerHTML = `
      <img src="${product.image}" class="card-img-top" alt="${product.title}" style="height:200px;object-fit:contain;">
      <div class="card-body d-flex flex-column">
        <h6 class="product-title">${product.title}</h6>
        <p class="text-truncate small text-muted">${product.description}</p>
        <div class="mt-auto d-flex justify-content-between align-items-center">
          <strong class="text-success">$${product.price}</strong>
          <button class="btn btn-sm btn-outline-primary add-btn"><i class="fa-solid fa-cart-plus"></i></button>
        </div>
      </div>
    `;
    card.querySelector('.add-btn').addEventListener('click', () => addToCart(product.id, 1));
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-btn')) return;
      openModal(product);
    });
    col.appendChild(card);
    productsGrid.appendChild(col);
  });
}

function openModal(p){
  if (!modal) return;
  modalImg.src = p.image;
  modalTitle.textContent = p.title;
  modalDesc.textContent = p.description;
  modalPrice.textContent = `$${p.price}`;
  modalQty.value = 1;
  modalAddBtn.onclick = () => {
    addToCart(p.id, parseInt(modalQty.value) || 1);
    modal.hide();
  };
  modal.show();
}

function addToCart(id, qty){
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI(){
  const total = cart.reduce((s, i) => s + i.qty, 0);
  if (cartCount) cartCount.textContent = total;
  handleAuthUI();
}

function renderCartPage(){
  const listEl = document.
  getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const totalEl = document.getElementById('cart-total');
  if (!listEl) return;
  if (!cart.length) {
    emptyEl.classList.remove('d-none');
    listEl.innerHTML = '';
    totalEl.textContent = '0';
    return;
  }
  emptyEl.classList.add('d-none');
  listEl.innerHTML = '';
  let sum = 0;
  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    const li = document.createElement('div');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${p.image}" alt="${p.title}" style="width:60px;height:60px;object-fit:contain;margin-right:10px;">
        <div>
          <div class="fw-bold">${p.title}</div>
          <div class="small text-muted">$${p.price}</div>
        </div>
      </div>
      <div class="d-flex align-items-center">
        <input type="number" min="1" value="${item.qty}" class="form-control form-control-sm qty-input" style="width:80px">
        <button class="btn btn-sm btn-danger ms-2 remove-btn"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    li.querySelector('.qty-input').addEventListener('change', e => {
      item.qty = Math.max(1, parseInt(e.target.value) || 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCartPage();
    });
    li.querySelector('.remove-btn').addEventListener('click', () => {
      cart = cart.filter(i => i.id !== item.id);
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCartPage();
      updateCartUI();
    });
    listEl.appendChild(li);
    sum += item.qty * p.price;
  });
  totalEl.textContent = sum.toFixed(2);
}

function handleAuthUI(){
  const user = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
  if (user && welcomeMsg && logoutBtn && loginLink) {
    welcomeMsg.textContent = `Welcome, ${user.username}`;
    loginLink.classList.add('d-none');
    logoutBtn.classList.remove('d-none');
  } else if (welcomeMsg && logoutBtn && loginLink) {
    welcomeMsg.textContent = '';
    loginLink.classList.remove('d-none');
    logoutBtn.classList.add('d-none');
  }
}
