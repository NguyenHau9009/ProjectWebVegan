// Khởi tạo Swup để chuyển trang mượt
const swup = new Swup({
  plugins: [new SwupPreloadPlugin()]
});

// Thêm loading spinner vào body
document.body.insertAdjacentHTML('beforeend', `
  <div class="page-transition-spinner" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1050;">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
`);

// Biến lưu instance modal để tái sử dụng
let productModalInstance = null;

// Khởi tạo modal Bootstrap 1 lần, gọi mỗi khi DOM thay đổi
function initProductModal() {
  const modal = document.getElementById('productDetailModal');
  if (!modal) return;
  productModalInstance = new bootstrap.Modal(modal);
}

// Khởi tạo sản phẩm khi load trang hoặc chuyển trang
function initProductPage() {
  console.log('Initializing product page...');
  loadProducts();
  renderWishlistIcons();
  updateCartUI();
  initProductModal(); // Khởi tạo modal mỗi khi gọi initProductPage (khi Swup thay đổi DOM)
}

// Lắng nghe sự kiện Swup khi thay đổi nội dung trang
swup.hooks.on('content:replace', () => {
  console.log('Page content replaced');
  if (document.getElementById('product-list')) {
    console.log('Product list found, initializing...');
    initProductPage();
  }
});

// Giỏ hàng
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += product.quantity || 1;
  } else {
    cart.push({ ...product, quantity: product.quantity || 1 });
  }
  updateCart();

  // Mở offcanvas giỏ hàng nếu có
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) {
    const offcanvas = new bootstrap.Offcanvas(sidebar);
    offcanvas.show();
  }
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCart();
}

function updateCartUI() {
  console.log('Gọi updateCartUI');
  const cartCountElems = document.querySelectorAll('#cart-count, #cart-count-menu');
  const cartSidebarTotal = document.getElementById('cartSidebarTotal');
  const cartSidebarBody = document.getElementById('cartSidebarBody');

  if (!cartSidebarBody || !cartCountElems.length || !cartSidebarTotal) return;

  if (cart.length === 0) {
    cartSidebarBody.innerHTML = '<p class="text-center text-muted">Giỏ hàng trống.</p>';
    cartCountElems.forEach(elem => {
      elem.textContent = '0';
      console.log('Cập nhật số lượng menu:', elem, 0);
    });
    cartSidebarTotal.textContent = '0đ';
    return;
  }

  let total = 0;
  let count = 0;

  cartSidebarBody.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    count += item.quantity;
    return `
      <div class="cart-item d-flex align-items-center mb-2">
        <img src="${item.images?.[0] || item.image}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; margin-right:10px;">
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${item.price.toLocaleString('vi-VN')}đ x ${item.quantity}</div>
        </div>
        <button onclick="removeFromCart(${item.id})" class="btn btn-sm btn-outline-danger ms-auto">×</button>
      </div>
    `;
  }).join('');

  cartCountElems.forEach(elem => {
    elem.textContent = count;
    console.log('Cập nhật số lượng menu:', elem, count);
  });
  cartSidebarTotal.textContent = `${total.toLocaleString('vi-VN')}đ`;
}

// Wishlist
function toggleWishlist(product) {
  if (!auth.isLoggedIn()) {
    showLoginModal();
    return;
  }

  const user = auth.getCurrentUser();
  const index = user.wishlist.indexOf(product.id);

  if (index === -1) {
    user.wishlist.push(product.id);
    showToast('Đã thêm vào wishlist!');
  } else {
    user.wishlist.splice(index, 1);
    showToast('Đã xóa khỏi wishlist!');
  }

  localStorage.setItem('currentUser', JSON.stringify(user));
  updateWishlistUI();
}

function updateWishlistUI() {
  const wishlistButtons = document.querySelectorAll('.wishlist-btn');
  const user = auth.getCurrentUser();

  wishlistButtons.forEach(btn => {
    const productId = parseInt(btn.dataset.productId, 10);
    if (user && user.wishlist.includes(productId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function renderWishlistIcons() {
  // Nếu cần render icon wishlist (chưa có logic)
}

// UI Components
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast position-fixed bottom-0 end-0 m-3';
  toast.style.zIndex = 1080;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Bootstrap 5 toast show/hide logic
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function showLoginModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('show');
  }
}

// Modal Đăng nhập/Đăng ký
document.addEventListener('DOMContentLoaded', () => {
  const authModal = document.getElementById('auth-modal');
  if (!authModal) return;

  // Tab chuyển đổi
  const tabBtns = authModal.querySelectorAll('.tab-btn');
  const forms = authModal.querySelectorAll('.tab-content form');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      forms.forEach(f => f.classList.remove('active'));
      forms[btn.getAttribute('data-tab') === 'login' ? 0 : 1].classList.add('active');
    });
  });

  // Toggle mật khẩu
  authModal.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  });

  // Đóng modal
  authModal.querySelector('.close').addEventListener('click', () => {
    authModal.classList.remove('show');
  });
  authModal.addEventListener('click', e => {
    if (e.target === authModal) authModal.classList.remove('show');
  });

  // Login form
  const loginForm = authModal.querySelector('#login-form');
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const pass = loginForm.querySelector('input[type="password"]').value.trim();
    const msg = loginForm.querySelector('.form-message');
    if (!email || !pass) {
      msg.textContent = 'Vui lòng nhập đầy đủ thông tin!';
      return;
    }
    if (window.auth && window.auth.login(email, pass)) {
      msg.style.color = '#68904D';
      msg.textContent = 'Đăng nhập thành công!';
      setTimeout(() => {
        msg.textContent = '';
        authModal.classList.remove('show');
        updateCartUI();
        updateAuthUI();
      }, 900);
    } else {
      msg.style.color = '#e74c3c';
      msg.textContent = 'Email hoặc mật khẩu không đúng!';
    }
  });

  // Register form
  const registerForm = authModal.querySelector('#register-form');
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = registerForm.querySelector('input[type="text"]').value.trim();
    const email = registerForm.querySelector('input[type="email"]').value.trim();
    const pass = registerForm.querySelector('input[type="password"]').value.trim();
    const msg = registerForm.querySelector('.form-message');
    if (!name || !email || !pass) {
      msg.textContent = 'Vui lòng nhập đầy đủ thông tin!';
      return;
    }
    if (window.auth && window.auth.register(email, pass, name)) {
      msg.style.color = '#68904D';
      msg.textContent = 'Đăng ký thành công!';
      setTimeout(() => {
        msg.textContent = '';
        tabBtns[0].click();
        updateAuthUI();
      }, 900);
    } else {
      msg.style.color = '#e67e22';
      msg.textContent = 'Email đã tồn tại!';
    }
  });

  updateAuthUI();
});

// Cập nhật UI đăng nhập/đăng xuất trên toàn trang
function updateAuthUI() {
  const userBtn = document.getElementById('user-btn');
  const currentUser = window.auth?.getCurrentUser ? window.auth.getCurrentUser() : null;
  if (userBtn) {
    if (currentUser) {
      userBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
      userBtn.title = `Xin chào, ${currentUser.name || currentUser.email}`;
    } else {
      userBtn.innerHTML = '<i class="fas fa-user"></i>';
      userBtn.title = 'Đăng nhập';
    }
  }

  // Quản lý nút logout trong modal
  const authModal = document.getElementById('auth-modal');
  if (!authModal) return;
  let logoutBtn = authModal.querySelector('.logout-btn');
  if (currentUser && !logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.className = 'main-btn logout-btn btn btn-danger mt-3';
    logoutBtn.textContent = 'Đăng xuất';
    authModal.querySelector('.modal-content').appendChild(logoutBtn);
    logoutBtn.addEventListener('click', () => {
      window.auth.logout();
      updateAuthUI();
      authModal.classList.remove('show');
    });
  } else if (!currentUser && logoutBtn) {
    logoutBtn.remove();
  }
}

// Sản phẩm
async function loadProducts() {
  console.log('Loading products...');
  try {
    const response = await fetch('products.json');
    const products = await response.json();
    const productList = document.getElementById('product-list');

    if (!productList) {
      console.log('Product list container not found.');
      return;
    }

    productList.innerHTML = products.map((product, idx) => `
      <div class="col-md-4 col-lg-3 mb-3">
        <div class="card product" data-index="${idx}" style="cursor:pointer;">
          <img src="${product.images?.[0] || product.image}" class="card-img-top" alt="${product.name}">
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">${Array.isArray(product.desc) ? product.desc.join(', ') : product.desc}</p>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="text-warning fw-bold">${product.price.toLocaleString('vi-VN')}đ</span>
                ${product.oldPrice ? `<span class="text-decoration-line-through text-muted ms-2">${product.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
              </div>
              <button class="btn btn-warning btn-add-cart" onclick='event.stopPropagation();addToCartAndCheckout(${JSON.stringify(product)})'>
                <i class="fas fa-shopping-cart"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    setupProductPopup(products);
    console.log('Products rendered successfully');

  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Bật popup khi click card sản phẩm
function setupProductPopup(products) {
  document.querySelectorAll('.card.product').forEach(card => {
    card.addEventListener('click', () => {
      const idx = card.getAttribute('data-index');
      showProductModal(products[idx]);
    });
  });
}

// Hiển thị popup thêm giỏ hàng thành công
function showCartSuccessPopup(product) {
  console.log('Gọi showCartSuccessPopup', product);
  const popup = document.getElementById('cart-success-popup');
  document.getElementById('cart-success-img').src = product.images?.[0] || product.image;
  document.getElementById('cart-success-name').textContent = product.name;
  document.getElementById('cart-success-price').textContent = product.price ? product.price.toLocaleString('vi-VN') + 'đ' : '';
  document.getElementById('cart-success-size').textContent = product.size ? product.size : '';
  document.getElementById('cart-success-qty').textContent = `Số lượng: ${product.quantity || 1}`;
  const cartArr = JSON.parse(localStorage.getItem('cart')) || [];
  document.getElementById('cart-success-count').textContent = `Giỏ hàng của bạn hiện có ${cartArr.reduce((sum, item) => sum + (item.quantity || 1), 0)} sản phẩm`;
  popup.style.display = 'flex';
  // Đóng popup
  document.getElementById('close-cart-success-popup').onclick = () => popup.style.display = 'none';
  // Nút thanh toán
  document.getElementById('cart-success-checkout').onclick = () => {
    popup.style.display = 'none';
    window.location.href = 'checkout.html';
  };
  // Tự động ẩn sau 3.5s
  setTimeout(() => { popup.style.display = 'none'; }, 3500);
}

// Hiển thị modal sản phẩm dùng instance đã khởi tạo
function showProductModal(product) {
  if (!productModalInstance) return;

  const modal = document.getElementById('productDetailModal');
  // Gallery ảnh
  const mainImg = modal.querySelector('.main-product-img');
  const thumbnails = modal.querySelector('.product-thumbnails');
  const images = product.images && product.images.length ? product.images : [product.image];
  let currentImgIdx = 0;
  mainImg.src = images[0];
  mainImg.alt = product.name;
  thumbnails.innerHTML = images.map((img, idx) => `
    <img src="${img}" alt="thumb" class="img-thumbnail" style="width:54px;height:54px;object-fit:cover;cursor:pointer;border:${idx===0?'2px solid #f7b731':'1px solid #ddd'};border-radius:8px;">
  `).join('');
  thumbnails.querySelectorAll('img').forEach((img, idx) => {
    img.onclick = () => {
      mainImg.src = images[idx];
      thumbnails.querySelectorAll('img').forEach((t, i) => t.style.border = i===idx?'2px solid #f7b731':'1px solid #ddd');
    };
  });

  // Tiêu đề
  modal.querySelector('.product-title').textContent = product.name;
  // Giá
  modal.querySelector('.old-price').textContent = product.oldPrice ? product.oldPrice.toLocaleString('vi-VN') + 'đ' : '';
  modal.querySelector('.new-price').textContent = product.price ? product.price.toLocaleString('vi-VN') + 'đ' : '';
  modal.querySelector('.discount').textContent = product.discount ? `-${product.discount}` : '';

  // Mô tả bullet
  const descList = modal.querySelector('.desc-list');
  descList.innerHTML = '';
  if (Array.isArray(product.desc)) {
    descList.innerHTML = product.desc.map(d => `<li>${d}</li>`).join('');
  } else if (typeof product.desc === 'string') {
    descList.innerHTML = `<li>${product.desc}</li>`;
  }
  // Mô tả chi tiết (nếu có)
  modal.querySelector('.desc-detail').textContent = product.descDetail || '';

  // Size
  const sizes = product.sizes || [{label: 'Mặc định', value: 'default'}];
  const sizesDiv = modal.querySelector('.sizes');
  sizesDiv.innerHTML = sizes.map((s, idx) => `
    <button type="button" class="btn btn-outline-warning btn-sm${idx===0?' active':''}" data-size="${s.value||s}">${s.label||s}</button>
  `).join('');
  let selectedSize = sizes[0].value || sizes[0];
  sizesDiv.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      sizesDiv.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.getAttribute('data-size');
    };
  });

  // Số lượng
  const qtyInput = modal.querySelector('.qty-input');
  qtyInput.value = 1;
  modal.querySelector('.btn-qty-minus').onclick = () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value)-1);
  };
  modal.querySelector('.btn-qty-plus').onclick = () => {
    qtyInput.value = parseInt(qtyInput.value)+1;
  };

  // Trạng thái còn hàng
  const stockStatus = modal.querySelector('.stock-status');
  if (product.stock === 0 || product.inStock === false) {
    stockStatus.textContent = 'Hết hàng';
    stockStatus.classList.remove('text-success');
    stockStatus.classList.add('text-danger');
  } else {
    stockStatus.textContent = 'Còn hàng';
    stockStatus.classList.remove('text-danger');
    stockStatus.classList.add('text-success');
  }

  // Nút thêm giỏ hàng
  const btnAdd = modal.querySelector('.btn-add-cart-modal');
  if (!btnAdd) {
    console.warn('Không tìm thấy nút Thêm giỏ hàng trong modal!');
  } else {
    btnAdd.onclick = () => {
      const productToAdd = {
        ...product,
        size: selectedSize,
        quantity: parseInt(qtyInput.value)
      };
      console.log('Thêm vào giỏ hàng:', productToAdd);
      addToCart(productToAdd);
      showCartSuccessPopup(productToAdd);
      // KHÔNG đóng modal ở đây
    };
  }
  // Nút mua ngay
  const btnBuy = modal.querySelector('.btn-buy-now-modal');
  if (!btnBuy) {
    console.warn('Không tìm thấy nút Mua ngay trong modal!');
  } else {
    btnBuy.onclick = () => {
      const productToAdd = {
        ...product,
        size: selectedSize,
        quantity: parseInt(qtyInput.value)
      };
      console.log('Mua ngay:', productToAdd);
      addToCart(productToAdd);
      productModalInstance.hide();
      window.location.href = 'checkout.html';
    };
  }

  productModalInstance.show();
}

function addToCartAndCheckout(product) {
  addToCart(product);
  window.location.href = 'checkout.html';
}

// Khởi tạo ban đầu khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initProductPage();
  });
} else {
  initProductPage();
}

// Thêm class active cho menu item tương ứng với trang hiện tại
function updateActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = document.querySelectorAll('.navbar-nav .nav-link');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Gọi hàm khi trang load và khi Swup thay đổi nội dung
document.addEventListener('DOMContentLoaded', updateActiveMenu);
swup.hooks.on('content:replace', updateActiveMenu);
 
